// Prisma 7 부터 접속 URL 은 schema.prisma 가 아니라 여기에 둔다.
// .env 는 자동으로 읽히지 않으므로 dotenv 를 직접 불러온다.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
