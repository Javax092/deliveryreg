"use client";

import { useEffect } from "react";

type Props = {
  eventType:
    | "catalog_viewed"
    | "product_viewed"
    | "product_added"
    | "cart_viewed"
    | "checkout_started"
    | "lead_created"
    | "order_created"
    | "order_completed";
  sourceCode?: string;
  productId?: string;
};

export function AnalyticsPing({ eventType, sourceCode, productId }: Props) {
  useEffect(() => {
    const payload = JSON.stringify({
      eventType,
      sourceCode,
      productId
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
      return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: payload,
      keepalive: true
    });
  }, [eventType, productId, sourceCode]);

  return null;
}
