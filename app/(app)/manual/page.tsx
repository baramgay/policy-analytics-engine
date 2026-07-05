// 사용 설명서: 업로드 흐름·전처리·분석 결과 해석·샘플데이터·FAQ를 아코디언 형태로 안내한다 (정적 콘텐츠, 서버 컴포넌트)
import { BookOpen } from "lucide-react";
import { Card, Section, Heading, Text, Collapsible, CollapsibleGroup, Markdown } from "@astryxdesign/core";

export default function ManualPage() {
  return (
    <Section padding={6}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BookOpen size={24} />
          <div>
            <Heading level={1}>매뉴얼</Heading>
            <Text type="supporting" color="secondary">
              정책 분석 엔진의 사용 흐름과 분석 결과 해석 방법을 안내합니다
            </Text>
          </div>
        </div>

        <CollapsibleGroup type="single" defaultValue="getting-started">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
              <Collapsible trigger="1. 시작하기" value="getting-started">
                <Markdown>
                  {`업로드 화면(\`새 프로젝트 업로드\`)에서 CSV/XLSX 파일을 올리거나, 아래 안내된 샘플 데이터 카드를 눌러 즉시 체험할 수 있습니다.

1. 프로젝트 제목·설명·데이터 유형·분석 목적을 입력합니다.
2. 파일을 업로드하거나 샘플 데이터를 선택합니다.
3. 결측치·중복행·이상치가 발견되면 전처리 검토 화면으로 이동합니다.
4. 전처리 전략을 확인·조정한 뒤 분석을 실행하면 대시보드에 결과가 저장됩니다.`}
                </Markdown>
              </Collapsible>
            </Card>

            <Card>
              <Collapsible trigger="2. 전처리 가이드" value="preprocessing">
                <Markdown>
                  {`업로드한 데이터에 품질 문제가 있으면 전처리 검토 단계에서 자동으로 진단·권장 전략을 제시합니다.

- **결측치**: 컬럼별 결측률을 진단하고, 평균/중앙값 채우기 또는 해당 행 제거 중 선택할 수 있습니다.
- **중복행**: 완전히 동일한 행을 감지해 제거 여부를 선택할 수 있습니다.
- **이상치**: IQR(사분위범위) 기준으로 극단값을 감지하고, 캡핑(경계값으로 대체) 여부를 선택할 수 있습니다.

전처리 적용 후에는 전후 품질 점수와 처리 건수(제거 행수·채운 셀 수·캡핑 건수)를 리포트로 확인할 수 있습니다.`}
                </Markdown>
              </Collapsible>
            </Card>

            <Card>
              <Collapsible trigger="3. 분석 결과 읽는 법" value="reading-results">
                <Markdown>
                  {`분석이 끝나면 다음 항목이 자동으로 계산되어 리포트에 표시됩니다.

- **스키마 요약**: 전체 행/열 개수와 컬럼별 데이터 타입(수치/범주/날짜)
- **품질 점수**: 결측률과 중복행 수를 반영한 100점 만점 점수
- **통계 요약**: 수치형 컬럼의 평균·중앙값·최소/최대값, 범주형 컬럼의 상위 값 비중
- **추천 차트**: 데이터 구조에 따라 막대·파이·라인 차트를 규칙 기반으로 자동 추천
- **지도 시각화**: 위도·경도 컬럼이 있으면 좌표 지도로, 지역명 컬럼만 있으면 지역 단위로 표시
- **핵심 인사이트**: 위 통계를 근거로 한 문장 요약 (AI 미사용, 규칙 기반 생성)`}
                </Markdown>
              </Collapsible>
            </Card>

            <Card>
              <Collapsible trigger="4. 샘플데이터로 체험하기" value="sample-data">
                <Markdown>
                  {`업로드 화면 하단의 샘플 카드를 누르면 파일 업로드 없이 바로 분석을 체험할 수 있습니다.

- **월별 인구 추이**: 기본적인 시계열 라인 차트 데모
- **사업예산 집행현황**: 결측치가 포함된 데이터의 전처리 데모
- **공공시설 위치**: 위경도 좌표 기반 지도 시각화 데모
- **설문 응답**: 결측·중복이 섞인 원자료의 정제 데모
- **지역 시설 이용 현황**: 지역명과 위경도가 함께 있을 때의 지도 감지 우선순위 데모
- **연령대·성별 지출 현황**: 범주형 컬럼 2개 이상의 교차분석 차트 데모
- **극소 표본 데이터**: 행이 매우 적고 전체 결측 컬럼이 있어도 안정적으로 동작하는지 보여주는 데모`}
                </Markdown>
              </Collapsible>
            </Card>

            <Card>
              <Collapsible trigger="5. FAQ" value="faq">
                <Markdown>
                  {`**Q. 데이터를 업로드하면 외부 서버로 전송되나요?**
A. 아니요. CSV/XLSX 파싱과 분석 계산은 모두 브라우저 내에서 처리되며, AI 호출 없이 규칙 기반으로 동작합니다.

**Q. 지원하는 파일 형식은 무엇인가요?**
A. CSV와 XLSX(엑셀) 파일을 지원합니다.

**Q. 전처리를 건너뛸 수 있나요?**
A. 네. 전처리 검토 화면에서 아무 전략도 선택하지 않으면 원본 그대로 분석이 진행됩니다.

**Q. 저장된 프로젝트는 어디서 확인하나요?**
A. 대시보드 화면의 프로젝트 목록에서 확인할 수 있습니다.`}
                </Markdown>
              </Collapsible>
            </Card>
          </div>
        </CollapsibleGroup>
      </div>
    </Section>
  );
}
