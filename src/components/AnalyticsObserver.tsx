"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logAppEvent } from "@/lib/firebase/client";

export function AnalyticsObserver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      // Log page_view event when route changes
      const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
      logAppEvent("page_view", {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
