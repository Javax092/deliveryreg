"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OperationAutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        document.querySelector('[aria-busy="true"]') === null
      ) {
        router.refresh();
      }
    }, intervalMs);

    function refreshOnVisible() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    document.addEventListener("visibilitychange", refreshOnVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, [intervalMs, router]);

  return null;
}
