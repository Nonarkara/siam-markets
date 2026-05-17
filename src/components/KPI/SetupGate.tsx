"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { loadProfile } from "@/lib/profile";

// Client component — checks localStorage on mount and redirects to /setup if no profile
export function SetupGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/setup") return; // already on setup
    const profile = loadProfile();
    if (!profile || !profile.setupComplete) {
      router.replace("/setup");
    }
  }, [pathname, router]);

  return null;
}
