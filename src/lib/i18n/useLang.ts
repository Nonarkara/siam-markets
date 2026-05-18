"use client";

import { useState, useEffect, createContext, useContext, createElement } from "react";
import type { Lang } from "./translations";

// ─── Context ─────────────────────────────────────────────────────

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

export const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  toggle: () => {},
});

export function useLang() {
  return useContext(LangContext);
}

// ─── Provider ────────────────────────────────────────────────────

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("siam_lang") as Lang | null;
    if (saved === "th" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("siam_lang", l);
  }

  function toggle() {
    setLang(lang === "en" ? "th" : "en");
  }

  return createElement(LangContext.Provider, { value: { lang, setLang, toggle } }, children);
}
