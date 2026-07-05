"use client";

// 전체 화면 공통 뼈대: Astryx AppShell 위에 좌측 메뉴/상단바/데모 모드 배지를 고정 배치한다
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell,
  SideNav,
  SideNavHeading,
  SideNavSection,
  SideNavItem,
  TopNav,
  TopNavHeading,
  Badge,
} from "@astryxdesign/core";
import {
  LayoutDashboard,
  FolderKanban,
  UploadCloud,
  BarChart3,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { isDemoMode } from "@/lib/data/store";
import { useThemeMode } from "@/components/AppTheme";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/upload", label: "새 프로젝트 업로드", icon: UploadCloud },
  { href: "/manual", label: "매뉴얼", icon: BookOpen },
];

const THEME_MODE_LABEL: Record<"light" | "dark" | "system", string> = {
  light: "테마: 라이트",
  dark: "테마: 다크",
  system: "테마: 시스템 설정",
};

const THEME_MODE_ICON = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function AppNavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode, cycleMode } = useThemeMode();
  const ThemeModeIcon = THEME_MODE_ICON[mode];

  return (
    <AppShell
      topNav={
        <TopNav
          label="정책 분석 엔진 내비게이션"
          heading={
            <TopNavHeading
              logo={<Sparkles size={20} />}
              heading="정책 분석 엔진"
              headingHref="/dashboard"
            />
          }
          endContent={isDemoMode ? <Badge variant="info" label="데모 모드" /> : undefined}
        />
      }
      sideNav={
        <SideNav
          header={
            <SideNavHeading
              icon={<FolderKanban size={20} />}
              heading="정책 분석 엔진"
              headingHref="/dashboard"
            />
          }
        >
          <SideNavSection title="메뉴">
            {NAV_ITEMS.map((item) => (
              <SideNavItem
                key={item.href}
                as={Link}
                href={item.href}
                label={item.label}
                icon={<item.icon size={18} />}
                isSelected={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              />
            ))}
          </SideNavSection>
          <SideNavSection title="엔진">
            <SideNavItem label="규칙 기반 분석 엔진" icon={<BarChart3 size={18} />} isDisabled />
          </SideNavSection>
          <SideNavSection title="설정">
            <SideNavItem
              label={THEME_MODE_LABEL[mode]}
              icon={<ThemeModeIcon size={18} />}
              onClick={cycleMode}
            />
          </SideNavSection>
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
