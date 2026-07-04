// 랜딩 화면: 서비스 소개. "엔진이 계산하고 AI는 설명만 한다"는 아키텍처 원칙을 전면에 내세운다
import { Database, Gauge, LineChart, ShieldCheck } from "lucide-react";
import { Heading, Text, Card, Section, Grid } from "@astryxdesign/core";
import { LinkButton } from "@/components/nav/LinkButton";

const FEATURE_CARDS = [
  {
    icon: Database,
    title: "규칙 기반 분석 엔진",
    description: "스키마 프로파일링, 품질 검사, 통계 계산, 차트/지도 추천까지 결정론적 규칙으로 처리합니다",
  },
  {
    icon: Gauge,
    title: "즉시 확인하는 데이터 품질",
    description: "결측률·중복행·이상치를 자동 계산해 품질 점수로 보여줍니다",
  },
  {
    icon: LineChart,
    title: "자동 차트·지도 추천",
    description: "변수 유형을 분석해 적합한 차트와 지도 시각화를 자동으로 구성합니다",
  },
  {
    icon: ShieldCheck,
    title: "AI는 설명만 합니다",
    description: "AI는 오직 계산이 끝난 요약 통계만 전달받아 문장으로 다듬을 뿐, 원본 데이터를 본 적이 없습니다",
  },
];

export default function LandingPage() {
  return (
    <div>
      <Section padding={8}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <Heading level={1} type="display-1">정책 분석 엔진</Heading>
          <Text type="large" color="secondary">
            AI가 분석하는 서비스가 아니라, 분석 엔진이 계산하고 AI가 설명하는 공공데이터 분석 플랫폼
          </Text>
          <div style={{ display: "flex", gap: 12 }}>
            <LinkButton href="/dashboard" label="대시보드로 이동" variant="primary" size="lg" />
            <LinkButton href="/upload" label="데이터 업로드" size="lg" />
          </div>
        </div>
      </Section>

      <Section padding={6} variant="muted">
        <Grid columns={{ minWidth: 240, max: 4 }} gap={4}>
          {FEATURE_CARDS.map((feature) => (
            <Card key={feature.title}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <feature.icon size={22} />
                <Text type="label">{feature.title}</Text>
                <Text type="supporting" color="secondary">{feature.description}</Text>
              </div>
            </Card>
          ))}
        </Grid>
      </Section>
    </div>
  );
}
