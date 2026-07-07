import { describe, expect, it } from "vitest";
import { solveLinearSystem, multipleRegressionRSquared } from "@/lib/analytics/regressionUtils";

describe("solveLinearSystem", () => {
  it("solves a simple 2x2 linear system", () => {
    const solution = solveLinearSystem(
      [
        [2, 1],
        [1, 3],
      ],
      [5, 10]
    );
    expect(solution?.[0]).toBeCloseTo(1, 5);
    expect(solution?.[1]).toBeCloseTo(3, 5);
  });

  it("returns null for a singular matrix", () => {
    const solution = solveLinearSystem(
      [
        [1, 2],
        [2, 4],
      ],
      [1, 2]
    );
    expect(solution).toBeNull();
  });

  it("solves a 3x3 system that requires a pivot row swap", () => {
    // col0의 최대 절대값이 row1(4)에 있어 부분 피벗팅 시 row0<->row1 스왑이 실제로 발생한다
    const solution = solveLinearSystem(
      [
        [1, 2, 1],
        [4, 4, 5],
        [2, 1, 3],
      ],
      [8, 27, 13]
    );
    expect(solution?.[0]).toBeCloseTo(1, 5);
    expect(solution?.[1]).toBeCloseTo(2, 5);
    expect(solution?.[2]).toBeCloseTo(3, 5);
  });

  it("returns null for a non-square coefficient matrix or mismatched b length", () => {
    expect(
      solveLinearSystem(
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        [1, 2]
      )
    ).toBeNull();
    expect(
      solveLinearSystem(
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2, 3]
      )
    ).toBeNull();
  });
});

describe("multipleRegressionRSquared", () => {
  it("returns a value near 1 for a near-perfectly linearly dependent predictor", () => {
    const target = [1, 2, 3, 4, 5, 6, 7, 8];
    const predictorA = [1, 2, 3, 4, 5, 6, 7, 8];
    // predictorA의 정확한 배수가 아니라 미세한 편차(±0.01~0.03)를 섞어
    // "완전 다중공선성"이 아닌 "근사적" 선형종속을 재현한다 (완전 다중공선성은
    // solveLinearSystem이 null을 반환하는 것이 수학적으로 옳은 별개 사례)
    const predictorB = [2.02, 3.97, 6.01, 7.98, 10.03, 11.99, 14.02, 15.97];

    const rSquared = multipleRegressionRSquared(target, [predictorA, predictorB]);

    expect(rSquared).not.toBeNull();
    expect(rSquared as number).toBeGreaterThan(0.99);
  });

  it("returns a low value for an unrelated predictor", () => {
    const target = [1, 2, 3, 4, 5, 6, 7, 8];
    const predictorA = [4, 1, 7, 2, 8, 3, 6, 5];

    const rSquared = multipleRegressionRSquared(target, [predictorA]);

    expect(rSquared).not.toBeNull();
    expect(rSquared as number).toBeLessThan(0.5);
  });

  it("returns null when there are too few rows for the predictor count", () => {
    const target = [1, 2, 3];
    const predictorA = [1, 2, 3];
    const predictorB = [2, 3, 4];

    const rSquared = multipleRegressionRSquared(target, [predictorA, predictorB]);

    expect(rSquared).toBeNull();
  });

  it("returns a non-null value at the exact minimum sample boundary (n === predictorCount + 2)", () => {
    const target = [1, 2, 4];
    const predictorA = [1, 2, 3];

    const rSquared = multipleRegressionRSquared(target, [predictorA]);

    expect(rSquared).not.toBeNull();
    expect(rSquared as number).toBeCloseTo(0.9642857142857143, 10);
  });

  it("returns null when the target is constant (ssTotal === 0)", () => {
    const target = [5, 5, 5, 5];
    const predictorA = [1, 2, 3, 4];

    const rSquared = multipleRegressionRSquared(target, [predictorA]);

    expect(rSquared).toBeNull();
  });

  it("returns null when a predictor array's length does not match the target length", () => {
    const target = [1, 2, 3, 4, 5];
    const predictorA = [1, 2, 3, 4];

    const rSquared = multipleRegressionRSquared(target, [predictorA]);

    expect(rSquared).toBeNull();
  });
});
