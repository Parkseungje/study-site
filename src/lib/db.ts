// Prisma 7 은 드라이버 어댑터를 요구한다. MySQL 은 mariadb 어댑터를 쓴다.
// 개발 중 핫리로드마다 커넥션이 쌓이지 않도록 전역에 하나만 둔다.
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL 이 없습니다. .env 를 확인하세요.");
  }
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
