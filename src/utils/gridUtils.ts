export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32

export const GRID_BASE_SCALE = 4.4
export const MEDIUM_PER_LARGE = 4
export const SMALL_PER_MEDIUM = 2
export const TINY_PER_SMALL = 2

export const SMALL_PER_LARGE = MEDIUM_PER_LARGE * SMALL_PER_MEDIUM
export const TINY_PER_LARGE = SMALL_PER_LARGE * TINY_PER_SMALL

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

export const getSmallTileGeometry = (coverScale: number) => {
  const effectiveScale = GRID_BASE_SCALE * coverScale
  const smallScale = effectiveScale / SMALL_PER_LARGE
  return {
    smallScale,
    smallTileWidth: TILE_WIDTH * smallScale,
    smallTileHeight: TILE_HEIGHT * smallScale,
  }
}

export const getTinyTileGeometry = (coverScale: number) => {
  const effectiveScale = GRID_BASE_SCALE * coverScale
  const tinyScale = effectiveScale / TINY_PER_LARGE
  return {
    tinyScale,
    tinyTileWidth: TILE_WIDTH * tinyScale,
    tinyTileHeight: TILE_HEIGHT * tinyScale,
  }
}