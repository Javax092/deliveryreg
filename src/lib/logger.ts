type LogMetadata = Record<string, unknown>;

function sanitize(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  const blocked = new Set(["password", "token", "secret", "authorization", "cookie"]);

  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !blocked.has(key.toLowerCase()))
  );
}

export const logger = {
  info(message: string, metadata?: LogMetadata) {
    console.info(message, sanitize(metadata));
  },
  warn(message: string, metadata?: LogMetadata) {
    console.warn(message, sanitize(metadata));
  },
  error(message: string, metadata?: LogMetadata) {
    console.error(message, sanitize(metadata));
  }
};
