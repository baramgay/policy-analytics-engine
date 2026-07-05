// 리포트를 완전히 독립적인(self-contained) HTML 문자열로 변환한다.
// 외부 CDN, 폰트, 스크립트를 일절 참조하지 않으며 인라인 CSS만 사용한다.
// 오프라인 환경에서도 그대로 열람할 수 있어야 한다.
import type { AnalysisResult, ProjectMeta } from "@/types/analysis";

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBar(ratio: number): string {
  const percent = Math.max(0, Math.min(100, ratio * 100));
  return `<div class="bar-track"><div class="bar-fill" style="width:${percent.toFixed(1)}%"></div></div>`;
}

export function buildReportHtml(meta: ProjectMeta, analysis: AnalysisResult): string {
  const title = escapeHtml(meta.title);
  const generatedAt = new Date(analysis.generatedAt).toLocaleString("ko-KR");

  const numericRows = analysis.numericSummary
    .map(
      (stat) => `
      <tr>
        <td>${escapeHtml(stat.column)}</td>
        <td>${stat.mean.toFixed(2)}</td>
        <td>${stat.std.toFixed(2)}</td>
        <td>${escapeHtml(stat.min)}</td>
        <td>${escapeHtml(stat.max)}</td>
        <td>${escapeHtml(stat.median)}</td>
      </tr>`
    )
    .join("");

  const categoricalRows = analysis.categoricalSummary
    .map((stat) => {
      const topValues = stat.topValues
        .slice(0, 3)
        .map(
          (item) => `
          <div class="top-value-row">
            <span class="top-value-label">${escapeHtml(item.value)}</span>
            ${renderBar(item.ratio)}
            <span class="top-value-ratio">${(item.ratio * 100).toFixed(0)}%</span>
          </div>`
        )
        .join("");
      return `
      <tr>
        <td>${escapeHtml(stat.column)}</td>
        <td>${stat.uniqueCount.toLocaleString()}</td>
        <td>${topValues}</td>
      </tr>`;
    })
    .join("");

  const missingRows = analysis.missingSummary.columns
    .map(
      (col) => `
      <tr>
        <td>${escapeHtml(col.name)}</td>
        <td>${col.missingCount.toLocaleString()}</td>
        <td>${renderBar(col.missingRate)}<span class="ratio-text">${(col.missingRate * 100).toFixed(1)}%</span></td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} 리포트</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "맑은 고딕", "Malgun Gothic", sans-serif;
    background: #f5f6f8;
    color: #1a1d21;
    margin: 0;
    padding: 32px 16px;
    line-height: 1.6;
  }
  .container {
    max-width: 880px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e2e4e8;
    border-radius: 8px;
    padding: 32px 40px;
  }
  h1 { font-size: 24px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 32px 0 12px; border-top: 1px solid #e2e4e8; padding-top: 24px; }
  .meta { color: #5a5f66; font-size: 14px; margin-bottom: 24px; }
  .meta div { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eceef1; vertical-align: middle; }
  th { color: #5a5f66; font-weight: 600; background: #fafbfc; }
  .bar-track {
    display: inline-block;
    width: 120px;
    height: 8px;
    background: #eceef1;
    border-radius: 4px;
    overflow: hidden;
    vertical-align: middle;
    margin-right: 8px;
  }
  .bar-fill {
    height: 100%;
    background: #4a6cf7;
  }
  .ratio-text { color: #5a5f66; font-size: 12px; }
  .top-value-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .top-value-label { min-width: 80px; font-size: 13px; }
  .top-value-ratio { font-size: 12px; color: #5a5f66; min-width: 32px; }
  .insight { white-space: pre-wrap; background: #fafbfc; border: 1px solid #eceef1; border-radius: 6px; padding: 16px; }
  .footer { margin-top: 32px; color: #9aa0a8; font-size: 12px; text-align: right; }
</style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="meta">
      <div>데이터 유형: ${escapeHtml(meta.dataType)}</div>
      <div>분석 목적: ${escapeHtml(meta.analysisGoal)}</div>
      <div>데이터 품질 점수: ${escapeHtml(analysis.qualityScore)}점</div>
    </div>

    <h2>데이터 개요</h2>
    <p>
      전체 ${analysis.schemaSummary.rowCount.toLocaleString()}행, ${analysis.schemaSummary.columnCount}개 변수로 구성되어 있으며,
      전체 결측률은 ${(analysis.missingSummary.overallMissingRate * 100).toFixed(1)}%, 중복 행은 ${analysis.missingSummary.duplicateRowCount.toLocaleString()}건입니다.
    </p>

    ${
      missingRows
        ? `<h2>결측치 요약</h2>
    <table>
      <thead><tr><th>변수명</th><th>결측 건수</th><th>결측률</th></tr></thead>
      <tbody>${missingRows}</tbody>
    </table>`
        : ""
    }

    ${
      numericRows
        ? `<h2>수치형 변수 통계</h2>
    <table>
      <thead><tr><th>변수명</th><th>평균</th><th>표준편차</th><th>최소</th><th>최대</th><th>중앙값</th></tr></thead>
      <tbody>${numericRows}</tbody>
    </table>`
        : ""
    }

    ${
      categoricalRows
        ? `<h2>범주형 변수 통계</h2>
    <table>
      <thead><tr><th>변수명</th><th>고유값 수</th><th>상위 값 분포</th></tr></thead>
      <tbody>${categoricalRows}</tbody>
    </table>`
        : ""
    }

    <h2>규칙 기반 종합 인사이트</h2>
    <div class="insight">${escapeHtml(analysis.insightSummary)}</div>

    <div class="footer">생성 시각: ${escapeHtml(generatedAt)}</div>
  </div>
</body>
</html>
`;
}
