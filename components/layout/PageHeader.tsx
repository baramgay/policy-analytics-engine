// 화면 상단 공통 헤더: 제목/설명/우측 액션 슬롯을 일관된 레이아웃으로 배치한다
import type { ReactNode } from "react";
import { HStack, VStack, Heading, Text } from "@astryxdesign/core";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <HStack justify="between" align="start" gap={4} style={{ marginBottom: 24 }}>
      <VStack gap={1}>
        <Heading level={1}>{title}</Heading>
        {description ? (
          <Text type="body" color="secondary">
            {description}
          </Text>
        ) : null}
      </VStack>
      {actions ? <HStack gap={2}>{actions}</HStack> : null}
    </HStack>
  );
}
