import { AppError } from "@/modules/shared/errors/app-error";

export function normalizeBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const withoutCountry = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;

  if (withoutCountry.length < 10 || withoutCountry.length > 11) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Invalid Brazilian phone number."
    });
  }

  return `55${withoutCountry}`;
}

export function formatWhatsApp(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, "");

  if (!digits.startsWith("55")) {
    return normalizedPhone;
  }

  const local = digits.slice(2);
  const ddd = local.slice(0, 2);
  const number = local.slice(2);

  if (number.length === 9) {
    return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
  }

  return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
}
