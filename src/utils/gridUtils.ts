export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32

export function isoToScreen(
  col: number,
  row: number,
  offsetX = 0,
  offsetY = 0
) {
  const x = (col - row) * (TILE_WIDTH / 2) + offsetX
  const y = (col + row) * (TILE_HEIGHT / 2) + offsetY
  return { x, y }
}