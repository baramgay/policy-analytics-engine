"use client";

// Astryx 테마 프로바이더 클라이언트 경계. neutralTheme이 client-only 모듈(defineSyntaxTheme)을
// 모듈 스코프에서 직접 호출하므로, 서버 컴포넌트(layout.tsx)에서 바로 임포트하면 RSC 경계 오류가 난다.
import type { ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

export function AppTheme({ children }: { children: ReactNode }) {
  return <Theme theme={neutralTheme}>{children}</Theme>;
}
