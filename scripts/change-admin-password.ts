import { PrismaClient } from "@prisma/client";
import { stdin as input, stdout as output } from "node:process";

import { hashPassword } from "../src/modules/identity/password";

const ADMIN_EMAIL = "admin@deliveryreg.local";
const MIN_PASSWORD_LENGTH = 8;

const prisma = new PrismaClient();

async function readPasswordFromPrompt(): Promise<string> {
  if (!input.isTTY) {
    throw new Error("ADMIN_NEW_PASSWORD is required when stdin is not interactive.");
  }

  output.write("Nova senha admin: ");
  input.setRawMode(true);
  input.resume();
  input.setEncoding("utf8");

  return new Promise((resolve, reject) => {
    let password = "";

    function cleanup() {
      input.setRawMode(false);
      input.pause();
      input.off("data", onData);
      output.write("\n");
    }

    function onData(chunk: string) {
      if (chunk === "\u0003") {
        cleanup();
        reject(new Error("Password update cancelled."));
        return;
      }

      if (chunk === "\r" || chunk === "\n") {
        cleanup();
        resolve(password);
        return;
      }

      if (chunk === "\u007f") {
        password = password.slice(0, -1);
        return;
      }

      password += chunk;
    }

    input.on("data", onData);
  });
}

async function getPassword(): Promise<string> {
  const envPassword = process.env.ADMIN_NEW_PASSWORD;

  if (envPassword !== undefined) {
    return envPassword;
  }

  return readPasswordFromPrompt();
}

async function main() {
  const password = await getPassword();

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must have at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const users = await prisma.user.findMany({
    where: {
      email: ADMIN_EMAIL,
    },
    select: {
      id: true,
    },
  });

  if (users.length !== 1) {
    throw new Error(`Expected exactly one admin user for ${ADMIN_EMAIL}; found ${users.length}.`);
  }

  await prisma.user.update({
    where: {
      id: users[0].id,
    },
    data: {
      passwordHash: await hashPassword(password),
    },
    select: {
      id: true,
    },
  });

  console.log("Admin password updated successfully.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Failed to update admin password.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
