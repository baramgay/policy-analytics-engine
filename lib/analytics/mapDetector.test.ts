import { describe, expect, it } from "vitest";
import { detectMap } from "@/lib/analytics/mapDetector";
import { profileSchema } from "@/lib/analytics/schemaProfiler";
import type { ParsedDataset } from "@/types/analysis";

describe("detectMap", () => {
  it("detects point mode when 위도/경도 columns are present", () => {
    const dataset: ParsedDataset = {
      columns: ["위도", "경도"],
      rows: [
        { 위도: 35.2285, 경도: 128.6811 },
        { 위도: 35.16, 경도: 128.1 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectMap(dataset, schema);

    expect(result.detected).toBe(true);
    expect(result.mode).toBe("point");
    expect(result.points).toHaveLength(2);
  });

  it("detects region mode when a 시군구 column is present with no lat/lon columns", () => {
    const dataset: ParsedDataset = {
      columns: ["시군구", "금액"],
      rows: [
        { 시군구: "창원시", 금액: 1000 },
        { 시군구: "진주시", 금액: 2000 },
        { 시군구: "창원시", 금액: 1500 },
        { 시군구: "진주시", 금액: 2500 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectMap(dataset, schema);

    expect(result.detected).toBe(true);
    expect(result.mode).toBe("region");
  });

  it("prioritizes point mode over region mode when both 위도/경도 and 시군구 columns are present", () => {
    const dataset: ParsedDataset = {
      columns: ["시군구", "위도", "경도"],
      rows: [
        { 시군구: "창원시", 위도: 35.228, 경도: 128.6811 },
        { 시군구: "진주시", 위도: 35.18, 경도: 128.1076 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectMap(dataset, schema);

    expect(result.detected).toBe(true);
    expect(result.mode).toBe("point");
    expect(result.regionColumn).toBeUndefined();
  });

  it("returns no detection when there is no geo-related column", () => {
    const dataset: ParsedDataset = {
      columns: ["금액", "의견"],
      rows: [
        { 금액: 1000, 의견: "만족스럽습니다" },
        { 금액: 2000, 의견: "괜찮습니다" },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectMap(dataset, schema);

    expect(result.detected).toBe(false);
    expect(result.mode).toBe("none");
  });
});
