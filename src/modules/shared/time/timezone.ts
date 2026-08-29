import { env } from "@/config/env";

export const BUSINESS_TIMEZONE = env.BUSINESS_TIMEZONE;

export function nowUtc(): Date {
  return new Date();
}

export function formatBusinessDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: BUSINESS_TIMEZONE
  }).format(date);
}

export function businessDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: BUSINESS_TIMEZONE
  }).format(date);
}
