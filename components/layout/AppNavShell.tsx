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
} from "lucide-react";
import { isDemoMode } from "@/lib/data/store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/upload", label: "새 프로젝트 업로드", icon: UploadCloud },
  { href: "/manual", label: "매뉴얼", icon: BookOpen },
];

export function AppNavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
