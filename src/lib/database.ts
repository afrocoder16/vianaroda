import { Prisma } from "@prisma/client";

const prismaConnectionErrorCodes = new Set(["P1001", "P1002"]);

export function isDatabaseConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return prismaConnectionErrorCodes.has(error.code);
  }

  return (
    error instanceof Error &&
    error.message.includes("Can't reach database server")
  );
}
