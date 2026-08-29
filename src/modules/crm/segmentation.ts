export type CustomerSegment = "NEW" | "ACTIVE" | "RECURRING" | "AT_RISK" | "INACTIVE";

export type SegmentInput = {
  completedOrderCount: number;
  lastPurchaseAt: Date | null;
  now: Date;
};

export const segmentLabels: Record<CustomerSegment, string> = {
  NEW: "Novo",
  ACTIVE: "Ativo",
  RECURRING: "Recorrente",
  AT_RISK: "Em risco",
  INACTIVE: "Inativo"
};

export function segmentCustomer(input: SegmentInput): CustomerSegment {
  if (input.completedOrderCount === 0 || !input.lastPurchaseAt) {
    return "NEW";
  }

  const daysSinceLastPurchase = daysBetween(input.lastPurchaseAt, input.now);

  if (input.completedOrderCount >= 2 && daysSinceLastPurchase <= 45) {
    return "RECURRING";
  }

  if (daysSinceLastPurchase <= 30) {
    return "ACTIVE";
  }

  if (daysSinceLastPurchase <= 90) {
    return "AT_RISK";
  }

  return "INACTIVE";
}

export function daysBetween(from: Date, to: Date): number {
  const diff = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function averagePurchaseFrequencyDays(dates: Date[]): number | null {
  if (dates.length < 3) {
    return null;
  }

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const intervals = sorted.slice(1).map((date, index) => daysBetween(sorted[index], date));
  const total = intervals.reduce((sum, value) => sum + value, 0);

  return Math.round(total / intervals.length);
}
