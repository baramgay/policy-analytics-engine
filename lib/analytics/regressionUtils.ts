// 선형대수 공유 모듈 — VIF(분산팽창지수) 계산 전용 (Gaussian 소거법, 외부 라이브러리 미사용)
// 확률분포 계산(statUtils.ts)과 재사용 맥락이 달라 별도 모듈로 분리한다

export function solveLinearSystem(a: number[][], b: number[]): number[] | null {
  const n = a.length;
  const matrix = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(matrix[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(matrix[row][col]) > maxAbs) {
        maxAbs = Math.abs(matrix[row][col]);
        pivotRow = row;
      }
    }
    if (maxAbs < 1e-10) return null;

    if (pivotRow !== col) {
      [matrix[col], matrix[pivotRow]] = [matrix[pivotRow], matrix[col]];
    }

    for (let row = col + 1; row < n; row++) {
      const factor = matrix[row][col] / matrix[col][col];
      for (let k = col; k <= n; k++) {
        matrix[row][k] -= factor * matrix[col][k];
      }
    }
  }

  const solution = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = matrix[row][n];
    for (let col = row + 1; col < n; col++) {
      sum -= matrix[row][col] * solution[col];
    }
    solution[row] = sum / matrix[row][row];
  }

  return solution;
}

export function multipleRegressionRSquared(
  target: number[],
  predictors: number[][]
): number | null {
  const n = target.length;
  const predictorCount = predictors.length;
  if (n < predictorCount + 2) return null;

  // 설계행렬 X = [1, x1, x2, ...] (절편 포함)
  const designMatrix: number[][] = [];
  for (let row = 0; row < n; row++) {
    designMatrix.push([1, ...predictors.map((p) => p[row])]);
  }

  const paramCount = predictorCount + 1;
  const xtx: number[][] = Array.from({ length: paramCount }, () => new Array(paramCount).fill(0));
  const xty: number[] = new Array(paramCount).fill(0);

  for (let row = 0; row < n; row++) {
    for (let i = 0; i < paramCount; i++) {
      xty[i] += designMatrix[row][i] * target[row];
      for (let j = 0; j < paramCount; j++) {
        xtx[i][j] += designMatrix[row][i] * designMatrix[row][j];
      }
    }
  }

  const beta = solveLinearSystem(xtx, xty);
  if (!beta) return null;

  const targetMean = target.reduce((sum, v) => sum + v, 0) / n;
  let ssTotal = 0;
  let ssResidual = 0;
  for (let row = 0; row < n; row++) {
    const predicted = designMatrix[row].reduce((sum, v, i) => sum + v * beta[i], 0);
    ssResidual += (target[row] - predicted) ** 2;
    ssTotal += (target[row] - targetMean) ** 2;
  }

  if (ssTotal === 0) return null;
  return 1 - ssResidual / ssTotal;
}
