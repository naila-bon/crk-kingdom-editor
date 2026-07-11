export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32

export const isoToScreen = (
  col: number,
  row: number,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
): { x: number; y: number } => {
  const x = (col - row) * ((TILE_WIDTH * scale) / 2) + offsetX
  const y = (col + row) * ((TILE_HEIGHT * scale) / 2) + offsetY

  return { x, y }
}