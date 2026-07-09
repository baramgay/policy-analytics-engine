// Worker가 없는 환경(Node/Vitest)에서의 동기 폴백 경로만 검증한다. Worker 실행 경로는 브라우저 수동 검증 대상.
import { describe, expect, it } from "vitest";
import { runAnalysisAsync } from "@/lib/analytics/runAnalysisAsync";
import { runAnalysis } from "@/lib/analytics/index";
import type { ParsedDataset } from "@/types/analysis";

const dataset: ParsedDataset = {
  columns: ["지역", "인구수"],
  rows: [
    { 지역: "창원시", 인구수: 1000 },
    { 지역: "진주시", 인구수: 500 },
    { 지역: "김해시", 인구수: 800 },
  ],
};

describe("runAnalysisAsync (동기 폴백 경로)", () => {
  it("Worker가 없는 환경에서는 Promise로 감싼 동기 결과를 반환한다", async () => {
    expect(typeof Worker).toBe("undefined");

    const result = await runAnalysisAsync(dataset);
    const expected = runAnalysis(dataset);

    expect({ ...result, generatedAt: null }).toEqual({ ...expected, generatedAt: null });
  });

  it("반환값이 AnalysisResult의 핵심 필드를 포함한다", async () => {
    const result = await runAnalysisAsync(dataset);

    expect(result.schemaSummary.rowCount).toBe(3);
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.generatedAt).toEqual(expect.any(String));
  });

  it("동기 폴백 경로에서 runAnalysis가 동기적으로 throw해도 Promise reject로 전달된다", async () => {
    // columns가 없으면 profileSchema의 dataset.columns.map(...)에서 TypeError가 동기적으로 발생한다
    const badDataset = { rows: [] } as unknown as ParsedDataset;

    await expect(runAnalysisAsync(badDataset)).rejects.toThrow();
  });
});
