export const formatCompactCount = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0";

  if (Math.abs(numberValue) < 1000) {
    return String(Math.trunc(numberValue));
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(numberValue);
};
