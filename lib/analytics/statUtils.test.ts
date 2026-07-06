import { describe, expect, it } from "vitest";
import { chiSquarePValue, fTestPValue, tTestPValue } from "@/lib/analytics/statUtils";

describe("tTestPValue", () => {
  it("returns a small p-value for a large t statistic with reasonable degrees of freedom", () => {
    const pValue = tTestPValue(4, 10);
    expect(pValue).toBeLessThan(0.01);
  });

  it("returns a p-value close to 1 for a t statistic near zero", () => {
    const pValue = tTestPValue(0, 10);
    expect(pValue).toBeCloseTo(1, 5);
  });

  it("returns 1 when degrees of freedom is not positive", () => {
    expect(tTestPValue(2, 0)).toBe(1);
    expect(tTestPValue(2, -3)).toBe(1);
  });
});

describe("fTestPValue", () => {
  it("returns a small p-value for a large F statistic", () => {
    const pValue = fTestPValue(10, 2, 20);
    expect(pValue).toBeLessThan(0.01);
  });

  it("returns a p-value close to 1 for an F statistic near zero", () => {
    const pValue = fTestPValue(0.01, 2, 20);
    expect(pValue).toBeGreaterThan(0.9);
  });

  it("returns 1 when the statistic or degrees of freedom are invalid", () => {
    expect(fTestPValue(-1, 2, 20)).toBe(1);
    expect(fTestPValue(3, 0, 20)).toBe(1);
    expect(fTestPValue(3, 2, 0)).toBe(1);
  });
});

describe("chiSquarePValue", () => {
  it("matches the df=1 critical value at alpha=0.05 (3.84)", () => {
    expect(chiSquarePValue(3.84, 1)).toBeCloseTo(0.05, 2);
  });

  it("matches the df=2 critical value at alpha=0.05 (5.99)", () => {
    expect(chiSquarePValue(5.99, 2)).toBeCloseTo(0.05, 2);
  });

  it("matches the df=3 critical value at alpha=0.05 (7.81)", () => {
    expect(chiSquarePValue(7.81, 3)).toBeCloseTo(0.05, 2);
  });

  it("returns 1 when the chi-square statistic is zero (no deviation from expectation)", () => {
    expect(chiSquarePValue(0, 1)).toBe(1);
    expect(chiSquarePValue(0, 5)).toBe(1);
  });

  it("returns 1 when chi-square is negative or df is not positive", () => {
    expect(chiSquarePValue(-1, 3)).toBe(1);
    expect(chiSquarePValue(3, 0)).toBe(1);
    expect(chiSquarePValue(3, -2)).toBe(1);
  });

  it("exercises the gammaSeries branch (x < s+1) for a statistic far below df", () => {
    // s = df/2 = 5, x = chiSquare/2 = 0.5, 0.5 < 6 → series branch
    const pValue = chiSquarePValue(1, 10);
    expect(pValue).toBeCloseTo(0.9999, 3);
  });

  it("exercises the gammaSeries branch (x < s+1) near the distribution mean", () => {
    // s = df/2 = 5, x = chiSquare/2 = 4.5, 4.5 < 6 → series branch
    const pValue = chiSquarePValue(9, 10);
    expect(pValue).toBeGreaterThan(0.4);
    expect(pValue).toBeLessThan(0.6);
    expect(pValue).toBeCloseTo(0.53, 2);
  });
});
