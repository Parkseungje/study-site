import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "학습 커리큘럼",
    template: "%s · 학습 커리큘럼",
  },
  description: "기술 개념을 책처럼 읽고, 모르는 용어에서 그 개념으로 바로 이동한다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* flex 컨테이너 안에서는 mx-auto 가 폭을 늘리지 않고 내용에 맞춰 줄인다.
          페이지가 제 폭을 쓰도록 평범한 블록 레이아웃으로 둔다. */}
      <body className="min-h-full">{children}</body>
    </html>
  );
}
