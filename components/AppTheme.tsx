// components/AppTheme.tsx
"use client";
// Astryx 테마 프로바이더 클라이언트 경계. neutralTheme이 client-only 모듈(defineSyntaxTheme)을
// 모듈 스코프에서 직접 호출하므로, 서버 컴포넌트(layout.tsx)에서 바로 임포트하면 RSC 경계 오류가 난다.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";
import {
  THEME_MODE_STORAGE_KEY,
  cycleThemeMode,
  readStoredThemeMode,
  type ThemeModeSetting,
} from "@/lib/theme/themeMode";

interface ThemeModeContextValue {
  mode: ThemeModeSetting;
  cycleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "system",
  cycleMode: () => {},
});

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}

export function AppTheme({ children }: { children: ReactNode }) {
  // 서버 렌더링과 항상 일치하는 "system"으로 초기화 — 실제 저장된 값은
  // 마운트 후 useEffect에서만 반영해 하이드레이션 불일치를 방지한다.
  const [mode, setMode] = useState<ThemeModeSetting>("system");

  useEffect(() => {
    try {
      setMode(readStoredThemeMode(window.localStorage));
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) — system 기본값 유지
    }
  }, []);

  function cycleMode() {
    setMode((current) => {
      const next = cycleThemeMode(current);
      try {
        window.localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
      } catch {
        // localStorage 접근 불가(프라이빗 모드 등) — 상태는 갱신하되 영속화만 건너뜀
      }
      return next;
    });
  }

  return (
    <ThemeModeContext.Provider value={{ mode, cycleMode }}>
      <Theme theme={neutralTheme} mode={mode}>
        {children}
      </Theme>
    </ThemeModeContext.Provider>
  );
}
