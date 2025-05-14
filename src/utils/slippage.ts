const DEFAULT_SLIPPAGE_TOLERANCE = 0.005;

export const getSlippageTolerance = (slippage?: string | null): number => {
  const tolerance = slippage ? Number.parseFloat(slippage) : null;
  if (
    tolerance === null ||
    Number.isNaN(tolerance) ||
    tolerance <= 0 ||
    tolerance >= 100
  ) {
    return DEFAULT_SLIPPAGE_TOLERANCE;
  }
  return Number(slippage) / 100;
};
