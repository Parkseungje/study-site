import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/ 는 join(process.cwd(), "content") 로 런타임에 경로를 만들어 읽는다.
  // Next 의 파일 추적은 그런 경로를 못 따라가므로 서버 번들에 직접 넣어준다.
  // 이게 없으면 배포본에서 개념 페이지가 ENOENT 로 죽는다.
  outputFileTracingIncludes: {
    "/c/[id]": ["./content/**/*"],
    "/missing/[id]": ["./content/**/*"],
    "/prompt": ["./content/**/*", "./docs/*_curriculum.md"],
    "/prompt/kit.md": ["./content/**/*", "./docs/*_curriculum.md"],
    "/prompt/curriculum/[slug]": ["./docs/*_curriculum.md"],
  },
};

export default nextConfig;
