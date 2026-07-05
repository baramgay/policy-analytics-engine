// 루트 레이아웃: Astryx 테마 프로바이더를 최상단에서 1회만 적용한다
import type { Metadata } from "next";
import { AppTheme } from "@/components/AppTheme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Policy Analytics Engine",
  description: "AI가 분석하는 서비스가 아니라, 분석 엔진이 계산하고 AI가 설명하는 공공데이터 분석 플랫폼",
};

// 하이드레이션 이전에 동기 실행되어 저장된 테마 선호를 <html>에 즉시 반영 — FOUC(첫 페인트 깜빡임) 방지.
// 'pae-theme-mode' 문자열은 lib/theme/themeMode.ts의 THEME_MODE_STORAGE_KEY와 반드시 일치해야 한다
// (사전 하이드레이션 스크립트는 모듈을 import할 수 없어 리터럴로 중복 기재).
const THEME_INIT_SCRIPT = `(function(){
  try {
    var m = localStorage.getItem('pae-theme-mode');
    var dark = m === 'dark' || (m !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AppTheme>{children}</AppTheme>
      </body>
    </html>
  );
}
