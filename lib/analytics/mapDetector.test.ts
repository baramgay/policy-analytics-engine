import { describe, expect, it } from "vitest";
import { clusterPoints, detectMap } from "@/lib/analytics/mapDetector";
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

  it("attaches grid-based clusters when point mode is detected", () => {
    const dataset: ParsedDataset = {
      columns: ["위도", "경도"],
      rows: [
        { 위도: 35.2285, 경도: 128.6811 },
        { 위도: 35.2286, 경도: 128.6812 },
        { 위도: 36.5, 경도: 127.5 },
      ],
    };
    const schema = profileSchema(dataset);

    const result = detectMap(dataset, schema);

    expect(result.clusters).toBeDefined();
    expect(result.clusters?.length).toBeLessThanOrEqual(2);
    const totalClustered = result.clusters?.reduce((sum, c) => sum + c.count, 0);
    expect(totalClustered).toBe(3);
  });
});

describe("clusterPoints", () => {
  it("groups nearby points into a single cluster centroid", () => {
    const result = clusterPoints([
      { lat: 35.2285, lng: 128.6811, label: "a" },
      { lat: 35.2286, lng: 128.6812, label: "b" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it("keeps distant points in separate clusters", () => {
    const result = clusterPoints([
      { lat: 35.2285, lng: 128.6811, label: "a" },
      { lat: 37.5665, lng: 126.978, label: "b" },
    ]);

    expect(result).toHaveLength(2);
    expect(result.every((c) => c.count === 1)).toBe(true);
  });

  it("returns an empty array for no points", () => {
    expect(clusterPoints([])).toEqual([]);
  });
});
