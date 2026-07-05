// 전역 404 화면 — Next.js 기본 영문 not-found 대신 한글로 표시(공유 링크·프로젝트 상세 등 notFound() 호출 시 공통 사용)
import { Card, Heading, Text, Section } from "@astryxdesign/core";
import { LinkButton } from "@/components/nav/LinkButton";

export default function NotFound() {
  return (
    <Section padding={6}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420, textAlign: "center" }}>
            <Heading level={1}>페이지를 찾을 수 없습니다</Heading>
            <Text type="supporting" color="secondary">
              요청하신 페이지가 존재하지 않거나 삭제되었습니다. 주소를 다시 확인해 주세요.
            </Text>
            <LinkButton href="/dashboard" label="대시보드로 이동" variant="primary" />
          </div>
        </Card>
      </div>
    </Section>
  );
}
