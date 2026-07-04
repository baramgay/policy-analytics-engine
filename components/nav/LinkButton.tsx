"use client";

// 서버 컴포넌트에서 Link를 Button의 as prop으로 직접 넘기면 RSC 경계에서
// 함수 참조 직렬화 오류가 나므로, 클라이언트 경계 안에서 Link를 감싼다
import Link from "next/link";
import { Button } from "@astryxdesign/core";
import type { ButtonVariant, ButtonSize } from "@astryxdesign/core";

export function LinkButton({
  href,
  label,
  variant,
  size,
}: {
  href: string;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <Button as={Link} href={href} label={label} variant={variant} size={size} />;
}
