export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "INVENTORY_CONFLICT"
  | "INTERNAL_ERROR";

const safeMessages: Record<AppErrorCode, string> = {
  VALIDATION_ERROR: "Verifique os dados informados.",
  AUTHENTICATION_ERROR: "Entre na sua conta para continuar.",
  AUTHORIZATION_ERROR: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "Registro não encontrado.",
  CONFLICT: "Não foi possível concluir porque os dados foram alterados.",
  INVALID_STATE_TRANSITION: "A mudança de status solicitada não é permitida.",
  INVENTORY_CONFLICT: "Não há estoque suficiente para concluir a operação.",
  INTERNAL_ERROR: "Não foi possível concluir a operação agora."
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly safeMessage: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, options?: { message?: string; details?: unknown }) {
    super(options?.message ?? code);
    this.name = "AppError";
    this.code = code;
    this.safeMessage = safeMessages[code];
    this.details = options?.details;
    this.status = statusForCode(code);
  }
}

function statusForCode(code: AppErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "AUTHENTICATION_ERROR":
      return 401;
    case "AUTHORIZATION_ERROR":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
    case "INVALID_STATE_TRANSITION":
    case "INVENTORY_CONFLICT":
      return 409;
    case "INTERNAL_ERROR":
      return 500;
  }
}
