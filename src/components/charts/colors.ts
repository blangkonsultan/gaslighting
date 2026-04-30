const CHART_COLORS_HEX = ["#9AB17A", "#C3CC9B", "#E4DFB5", "#D4CFA6", "#6B6B6B"]

export function getColorForIndex(index: number): string {
  return CHART_COLORS_HEX[index % CHART_COLORS_HEX.length]
}
