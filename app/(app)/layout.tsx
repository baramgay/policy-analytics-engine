// 로그인 이후 화면 그룹 공통 레이아웃: AppNavShell(사이드바+상단바)로 감싼다
import { AppNavShell } from "@/components/layout/AppNavShell";

export default function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppNavShell>{children}</AppNavShell>;
}
