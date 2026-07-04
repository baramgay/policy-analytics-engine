// 루트 레이아웃: Astryx 테마 프로바이더를 최상단에서 1회만 적용한다
import type { Metadata } from "next";
import { AppTheme } from "@/components/AppTheme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Policy Analytics Engine",
  description: "AI가 분석하는 서비스가 아니라, 분석 엔진이 계산하고 AI가 설명하는 공공데이터 분석 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="light">
      <body>
        <AppTheme>{children}</AppTheme>
      </body>
    </html>
  );
}
