"""
sentiment.py — Daily financial news sentiment scoring.

Pipelines
─────────
• English: FinBERT (ProsusAI/finbert) via HuggingFace Transformers
  - Sources: Reuters RSS (business), Google News RSS (SET Thailand)
• Thai:     WangchanBERTa (airesearch/wangchanberta-base-att-spm-uncased)
  - Sources: Bangkok Post Business RSS, Thairath Business RSS,
             Krungthep Turakij RSS, Manager Online Business RSS

What it outputs
───────────────
• daily aggregate sentiment score per source per language (-1 to +1)
• stored in Supabase `sentiment_daily` table
• summary JSON fallback for API

Run daily: python3 ingestion/sentiment.py
GPU note: uses Apple MPS if torch + MPS available (fast on M5 Max)
         falls back to CPU (slower but functional, ~3s/headline)

Dependency note
───────────────
FinBERT is ~500MB download on first run (cached in ~/.cache/huggingface).
WangchanBERTa is another ~500MB.
Total cold-start download: ~1GB. Subsequent runs load from cache.
"""

import os
import json
import warnings
from datetime import date, datetime
from typing import Iterator

import requests
import feedparser   # pip install feedparser

warnings.filterwarnings("ignore")

try:
    import torch
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    print("[sentiment] transformers/torch not installed")
    print("           pip install transformers torch feedparser")

try:
    import pythainlp
    HAS_PYTHAINLP = True
except ImportError:
    HAS_PYTHAINLP = False

try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")

# ─── RSS Feed configs ─────────────────────────────────────────────────

ENGLISH_FEEDS = {
    "reuters_business":   "https://feeds.reuters.com/reuters/businessNews",
    "google_news_set":    "https://news.google.com/rss/search?q=SET+index+Thailand+stock&hl=en&gl=TH&ceid=TH:en",
    "google_news_bot":    "https://news.google.com/rss/search?q=Bank+of+Thailand+interest+rate&hl=en&gl=TH&ceid=TH:en",
    "google_news_thb":    "https://news.google.com/rss/search?q=Thai+baht+THB+currency&hl=en&gl=TH&ceid=TH:en",
}

THAI_FEEDS = {
    "bangkokpost_biz":    "https://www.bangkokpost.com/rss/data/business.xml",
    "google_news_th_set": "https://news.google.com/rss/search?q=ตลาดหุ้น+SET+หุ้นไทย&hl=th&gl=TH&ceid=TH:th",
    "google_news_th_bot": "https://news.google.com/rss/search?q=ธนาคารแห่งประเทศไทย+ดอกเบี้ย&hl=th&gl=TH&ceid=TH:th",
}

MAX_HEADLINES = 30   # per source per run


# ─── Device selection ─────────────────────────────────────────────────

def get_device() -> str:
    """Use Apple MPS on M-series Mac, CUDA if available, else CPU."""
    if not HAS_TRANSFORMERS:
        return "cpu"
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


# ─── RSS fetch ────────────────────────────────────────────────────────

def fetch_headlines(feed_url: str, max_items: int = MAX_HEADLINES) -> list[str]:
    """Parse RSS feed and return list of headline strings."""
    try:
        feed = feedparser.parse(feed_url)
        titles = [e.get("title", "").strip() for e in feed.entries[:max_items]]
        return [t for t in titles if t]
    except Exception as e:
        print(f"  [sentiment] RSS error {feed_url[:60]}: {e}")
        return []


# ─── FinBERT pipeline ─────────────────────────────────────────────────

_finbert_pipe = None

def get_finbert():
    global _finbert_pipe
    if _finbert_pipe is None:
        device = get_device()
        print(f"  [sentiment] Loading FinBERT on {device}...")
        _finbert_pipe = pipeline(
            "text-classification",
            model="ProsusAI/finbert",
            device=device,
            top_k=None,  # return all labels
        )
        print("  [sentiment] FinBERT loaded")
    return _finbert_pipe


def score_finbert(headlines: list[str], batch_size: int = 16) -> list[dict]:
    """
    Score headlines with FinBERT.
    Returns list of {headline, positive, negative, neutral, score}.
    score = positive - negative, range -1 to +1.
    """
    if not HAS_TRANSFORMERS or not headlines:
        return []

    pipe = get_finbert()
    results = []
    for i in range(0, len(headlines), batch_size):
        batch = headlines[i:i+batch_size]
        try:
            outputs = pipe(batch, truncation=True, max_length=512)
            for headline, output in zip(batch, outputs):
                label_map = {o["label"].lower(): o["score"] for o in output}
                pos = label_map.get("positive", 0.0)
                neg = label_map.get("negative", 0.0)
                neu = label_map.get("neutral",  0.0)
                results.append({
                    "headline": headline,
                    "positive": round(pos, 4),
                    "negative": round(neg, 4),
                    "neutral":  round(neu, 4),
                    "score":    round(pos - neg, 4),
                })
        except Exception as e:
            print(f"  [sentiment] FinBERT batch error: {e}")

    return results


# ─── WangchanBERTa pipeline (Thai) ───────────────────────────────────

_wangchan_pipe = None

def get_wangchan():
    global _wangchan_pipe
    if _wangchan_pipe is None:
        if not HAS_TRANSFORMERS:
            return None
        if not HAS_PYTHAINLP:
            print("  [sentiment] pythainlp not installed — Thai tokenisation degraded")

        device = get_device()
        # Note: wangchanberta-base-att-spm-uncased is the base model.
        # For sentiment: use a fine-tuned version on Wisesight1000 if available.
        # Fallback to zero-shot with a multilingual MNLI model.
        try:
            print(f"  [sentiment] Loading WangchanBERTa on {device}...")
            _wangchan_pipe = pipeline(
                "text-classification",
                model="airesearch/wangchanberta-base-att-spm-uncased-finetuned-wscci",  # Wisesight sentiment
                device=device,
                top_k=None,
            )
            print("  [sentiment] WangchanBERTa loaded (Wisesight fine-tuned)")
        except Exception:
            # Fallback: multilingual zero-shot
            try:
                _wangchan_pipe = pipeline(
                    "zero-shot-classification",
                    model="joeddav/xlm-roberta-large-xnli",
                    device=device,
                )
                print("  [sentiment] Using xlm-roberta fallback (zero-shot)")
            except Exception as e:
                print(f"  [sentiment] Cannot load Thai model: {e}")
                return None
    return _wangchan_pipe


def score_thai(headlines: list[str], batch_size: int = 8) -> list[dict]:
    """
    Score Thai headlines. Tries WangchanBERTa Wisesight fine-tune;
    falls back to multilingual zero-shot with Neg/Pos/Neu labels.
    """
    if not headlines:
        return []

    pipe = get_wangchan()
    if pipe is None:
        # Further fallback: keyword-based naive scoring
        return score_keyword_thai(headlines)

    results = []
    candidate_labels = ["บวก", "ลบ", "เป็นกลาง"]  # positive/negative/neutral in Thai

    for i in range(0, len(headlines), batch_size):
        batch = headlines[i:i+batch_size]
        try:
            if pipe.task == "zero-shot-classification":
                for h in batch:
                    out = pipe(h, candidate_labels=candidate_labels)
                    label_map = dict(zip(out["labels"], out["scores"]))
                    pos = label_map.get("บวก",      0.0)
                    neg = label_map.get("ลบ",       0.0)
                    neu = label_map.get("เป็นกลาง",  0.0)
                    results.append({
                        "headline": h,
                        "positive": round(pos, 4),
                        "negative": round(neg, 4),
                        "neutral":  round(neu, 4),
                        "score":    round(pos - neg, 4),
                    })
            else:
                outputs = pipe(batch, truncation=True, max_length=416)
                for headline, output in zip(batch, outputs):
                    # Wisesight labels: pos/neg/neu or q/neu/neg/pos
                    label_map = {o["label"]: o["score"] for o in output}
                    pos = label_map.get("pos", label_map.get("positive", 0.0))
                    neg = label_map.get("neg", label_map.get("negative", 0.0))
                    neu = label_map.get("neu", label_map.get("neutral",  0.0))
                    results.append({
                        "headline": headline,
                        "positive": round(pos, 4),
                        "negative": round(neg, 4),
                        "neutral":  round(neu, 4),
                        "score":    round(pos - neg, 4),
                    })
        except Exception as e:
            print(f"  [sentiment] Thai batch error: {e}")

    return results


# ─── Thai keyword fallback ────────────────────────────────────────────

BULL_KEYWORDS_TH = ["ขึ้น", "บวก", "สูงขึ้น", "กำไร", "เพิ่ม", "ฟื้น", "แข็งแกร่ง", "เติบโต", "ปรับตัวขึ้น"]
BEAR_KEYWORDS_TH = ["ลง", "ลบ", "ต่ำลง", "ขาดทุน", "ลด", "ตก", "อ่อนแอ", "วิกฤต", "ปรับตัวลง", "ดิ่ง"]

def score_keyword_thai(headlines: list[str]) -> list[dict]:
    """Fast keyword-based Thai sentiment (no GPU needed)."""
    results = []
    for h in headlines:
        bulls = sum(1 for w in BULL_KEYWORDS_TH if w in h)
        bears = sum(1 for w in BEAR_KEYWORDS_TH if w in h)
        total = bulls + bears or 1
        pos = bulls / total
        neg = bears / total
        results.append({
            "headline": h,
            "positive": round(pos, 4),
            "negative": round(neg, 4),
            "neutral":  round(1 - pos - neg, 4),
            "score":    round(pos - neg, 4),
        })
    return results


# ─── Aggregate ────────────────────────────────────────────────────────

def aggregate(scored: list[dict]) -> dict:
    if not scored:
        return {"pos_count": 0, "neg_count": 0, "neu_count": 0,
                "avg_score": 0.0, "total_articles": 0}
    pos = sum(1 for s in scored if s["score"] > 0.1)
    neg = sum(1 for s in scored if s["score"] < -0.1)
    neu = len(scored) - pos - neg
    avg = float(sum(s["score"] for s in scored) / len(scored))
    return {
        "pos_count":      pos,
        "neg_count":      neg,
        "neu_count":      neu,
        "avg_score":      round(avg, 4),
        "total_articles": len(scored),
    }


# ─── Main pipeline ────────────────────────────────────────────────────

def run_sentiment_pipeline() -> list[dict]:
    today_str = date.today().isoformat()
    all_rows  = []

    # ── English feeds ──────────────────────────────────────────────
    if HAS_TRANSFORMERS:
        print("\n[sentiment] Scoring English feeds (FinBERT)...")
        for source, url in ENGLISH_FEEDS.items():
            headlines = fetch_headlines(url)
            if not headlines:
                continue
            print(f"  {source}: {len(headlines)} headlines", end="", flush=True)
            scored = score_finbert(headlines)
            agg    = aggregate(scored)
            print(f" → avg score {agg['avg_score']:+.3f}")
            all_rows.append({
                "date":             today_str,
                "lang":             "en",
                "source":           source,
                "model_used":       "finbert",
                "sample_headlines": [s["headline"] for s in scored[:5]],
                **agg,
            })

    # ── Thai feeds ─────────────────────────────────────────────────
    print("\n[sentiment] Scoring Thai feeds...")
    for source, url in THAI_FEEDS.items():
        headlines = fetch_headlines(url)
        if not headlines:
            continue
        print(f"  {source}: {len(headlines)} headlines", end="", flush=True)
        scored = score_thai(headlines) if HAS_TRANSFORMERS else score_keyword_thai(headlines)
        model  = "wangchanberta" if HAS_TRANSFORMERS else "keyword"
        agg    = aggregate(scored)
        print(f" → avg score {agg['avg_score']:+.3f}")
        all_rows.append({
            "date":             today_str,
            "lang":             "th",
            "source":           source,
            "model_used":       model,
            "sample_headlines": [s["headline"] for s in scored[:5]],
            **agg,
        })

    return all_rows


# ─── Supabase store ───────────────────────────────────────────────────

def store_results(rows: list[dict]) -> bool:
    if not rows:
        return True
    if not HAS_SUPABASE or not SUPABASE_URL:
        print(f"\n[sentiment] {len(rows)} rows computed (no Supabase):")
        for r in rows:
            print(f"  {r['lang']}/{r['source']:<30} avg={r['avg_score']:+.3f} "
                  f"pos={r['pos_count']} neg={r['neg_count']}")
        return False
    try:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        today = date.today().isoformat()
        sb.table("sentiment_daily").delete().eq("date", today).execute()
        sb.table("sentiment_daily").insert(rows).execute()
        print(f"\n[sentiment] ✓ Stored {len(rows)} rows to Supabase")
        return True
    except Exception as e:
        print(f"[sentiment] Supabase error: {e}")
        return False


# ─── Entry point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("FINANCIAL NEWS SENTIMENT")
    print(f"Run: {datetime.now().isoformat()}")
    print(f"Device: {get_device() if HAS_TRANSFORMERS else 'N/A'}")
    print("=" * 60)

    rows = run_sentiment_pipeline()
    store_results(rows)

    summary = {
        "run_date": date.today().isoformat(),
        "rows":     rows,
        "note":     "FinBERT (EN) + WangchanBERTa/keyword (TH). avg_score: +1=bullish, -1=bearish.",
    }
    out_path = os.path.join(os.path.dirname(__file__), "sentiment_latest.json")
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\n[sentiment] Summary → {out_path}")
