process.env.DATABASE_URL ??=
  "postgresql://deliveryreg:deliveryreg@localhost:5432/deliveryreg?schema=public";
process.env.AUTH_SECRET ??= "teste-local-com-mais-de-trinta-e-dois-caracteres";
process.env.BUSINESS_TIMEZONE ??= "America/Manaus";
