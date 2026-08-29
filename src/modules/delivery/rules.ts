import { AppError } from "@/modules/shared/errors/app-error";

export function normalizeDeliveryZoneName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function assertDeliveryMinimum(input: {
  subtotalCents: number;
  minimumOrderCents: number;
}) {
  if (input.subtotalCents < input.minimumOrderCents) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Order subtotal is below delivery minimum."
    });
  }
}

export function buildMapsDestination(input: {
  street: string;
  number: string;
  neighborhood: string;
}) {
  const destination = encodeURIComponent(
    `${input.street}, ${input.number}, ${input.neighborhood}, Manaus, AM`
  );

  return `https://www.google.com/maps/search/?api=1&query=${destination}`;
}
