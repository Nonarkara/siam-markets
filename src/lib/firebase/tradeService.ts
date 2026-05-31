import { db } from "./client";
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import type { Trade } from "@/lib/types";

const TRADES_COLLECTION = "simulator_trades";

/**
 * Saves a completed trade to Firestore for analytics and persistence.
 */
export async function saveTrade(userId: string, trade: Trade): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, TRADES_COLLECTION), {
      ...trade,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving trade to Firestore:", error);
    return null;
  }
}

/**
 * Fetches all completed trades for a given user.
 */
export async function getUserTrades(userId: string): Promise<Trade[]> {
  try {
    const q = query(
      collection(db, TRADES_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ticker: data.ticker,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice,
        shares: data.shares,
        type: data.type,
        status: data.status,
        entryTime: data.entryTime,
        exitTime: data.exitTime,
        pnl: data.pnl,
        pnlPct: data.pnlPct,
        reason: data.reason,
      } as Trade;
    });
  } catch (error) {
    console.error("Error fetching trades from Firestore:", error);
    return [];
  }
}
