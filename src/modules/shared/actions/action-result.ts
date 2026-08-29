import { AppError, type AppErrorCode } from "@/modules/shared/errors/app-error";

export type ActionResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      code: AppErrorCode | "UNEXPECTED";
    };

export const idleActionResult: ActionResult = {
  ok: true,
  message: ""
};

export function actionOk(message: string): ActionResult {
  return {
    ok: true,
    message
  };
}

export function actionError(error: unknown, fallbackMessage: string, messages?: Partial<Record<AppErrorCode, string>>): ActionResult {
  if (error instanceof AppError) {
    return {
      ok: false,
      code: error.code,
      message: messages?.[error.code] ?? error.safeMessage
    };
  }

  console.error("Unexpected admin action failure", error);

  return {
    ok: false,
    code: "UNEXPECTED",
    message: fallbackMessage
  };
}
