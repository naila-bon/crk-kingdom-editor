import { Graphics } from 'pixi.js'
import { useCallback, type FC } from 'react'
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  isoToScreen,
  GRID_BASE_SCALE,
  MEDIUM_PER_LARGE,
  SMALL_PER_MEDIUM,
  TINY_PER_SMALL,
  SMALL_PER_LARGE,
  getSmallTileGeometry,
} from '../../utils/gridUtils'

const GRID_COLOR = '#ffffff'
const GRID_LINE_ALPHA = 0.35

const SMALL_GRID_LINE_WIDTH = 0.5
const SMALL_GRID_LINE_ALPHA = 0.18

// Niveau le plus fin, encore plus discret que "small".
const TINY_GRID_LINE_WIDTH = 0.25
const TINY_GRID_LINE_ALPHA = 0.1

const DEFAULT_MAP_MASK: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]

const MATRIX_ROWS = DEFAULT_MAP_MASK.length
const MATRIX_COLS = DEFAULT_MAP_MASK[0].length
const MATRIX_COL_OFFSET = Math.floor(MATRIX_COLS / 2)
const MATRIX_ROW_OFFSET = Math.floor(MATRIX_ROWS / 2)

const centeredOffsets = (n: number) =>
  Array.from({ length: n }, (_, i) => i - (n - 1) / 2)

const MEDIUM_OFFSETS = centeredOffsets(MEDIUM_PER_LARGE)
const SMALL_OFFSETS = centeredOffsets(SMALL_PER_MEDIUM)
const TINY_OFFSETS = centeredOffsets(TINY_PER_SMALL)

export const isSmallCellInMask = (smallCol: number, smallRow: number): boolean => {
  const largeCol = Math.floor(smallCol / SMALL_PER_LARGE + 0.5)
  const largeRow = Math.floor(smallRow / SMALL_PER_LARGE + 0.5)

  const colIndex = largeCol + MATRIX_COL_OFFSET
  const rowIndex = largeRow + MATRIX_ROW_OFFSET

  if (rowIndex < 0 || rowIndex >= MATRIX_ROWS || colIndex < 0 || colIndex >= MATRIX_COLS) {
    return false
  }

  return DEFAULT_MAP_MASK[rowIndex][colIndex] === 1
}

export const isFootprintInMask = (
  smallCol: number,
  smallRow: number,
  sizeInSmallTiles: number,
): boolean => {
  const half = (sizeInSmallTiles - 1) / 2
  const offsets: number[] = []
  for (let i = 0; i < sizeInSmallTiles; i += 1) {
    offsets.push(i - half)
  }

  for (const rOff of offsets) {
    for (const cOff of offsets) {
      if (!isSmallCellInMask(smallCol + cOff, smallRow + rOff)) {
        return false
      }
    }
  }

  return true
}

export { getSmallTileGeometry }

type GridProps = {
  offsetX: number
  offsetY: number
  coverScale: number
}

export const Grid: FC<GridProps> = ({ offsetX, offsetY, coverScale }) => {
  const effectiveScale = GRID_BASE_SCALE * coverScale

  const mediumScale = effectiveScale / MEDIUM_PER_LARGE
  const mediumTileWidth = TILE_WIDTH * mediumScale
  const mediumTileHeight = TILE_HEIGHT * mediumScale

  const smallScale = effectiveScale / SMALL_PER_LARGE
  const smallTileWidth = TILE_WIDTH * smallScale
  const smallTileHeight = TILE_HEIGHT * smallScale

  const tinyScale = smallScale / TINY_PER_SMALL
  const tinyTileWidth = TILE_WIDTH * tinyScale
  const tinyTileHeight = TILE_HEIGHT * tinyScale

  const drawTile = useCallback(
    (graphics: Graphics, x: number, y: number, w: number, h: number) => {
      graphics
        .moveTo(x, y - h / 2)
        .lineTo(x + w / 2, y)
        .lineTo(x, y + h / 2)
        .lineTo(x - w / 2, y)
        .lineTo(x, y - h / 2)
    },
    [],
  )

  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()

      // ── Niveau 1 (le plus fin) : tiny ──
      graphics.setStrokeStyle({
        width: TINY_GRID_LINE_WIDTH,
        color: GRID_COLOR,
        alpha: TINY_GRID_LINE_ALPHA,
      })

      for (let rowIndex = 0; rowIndex < MATRIX_ROWS; rowIndex += 1) {
        for (let colIndex = 0; colIndex < MATRIX_COLS; colIndex += 1) {
          if (!DEFAULT_MAP_MASK[rowIndex][colIndex]) continue

          const col = colIndex - MATRIX_COL_OFFSET
          const row = rowIndex - MATRIX_ROW_OFFSET

          for (const rowMed of MEDIUM_OFFSETS) {
            for (const colMed of MEDIUM_OFFSETS) {
              const medCol = col * MEDIUM_PER_LARGE + colMed
              const medRow = row * MEDIUM_PER_LARGE + rowMed

              for (const rowSmall of SMALL_OFFSETS) {
                for (const colSmall of SMALL_OFFSETS) {
                  const subCol = medCol * SMALL_PER_MEDIUM + colSmall
                  const subRow = medRow * SMALL_PER_MEDIUM + rowSmall

                  for (const rowTiny of TINY_OFFSETS) {
                    for (const colTiny of TINY_OFFSETS) {
                      const tinyCol = subCol * TINY_PER_SMALL + colTiny
                      const tinyRow = subRow * TINY_PER_SMALL + rowTiny

                      const { x, y } = isoToScreen(tinyCol, tinyRow, offsetX, offsetY, tinyScale)

                      drawTile(graphics, x, y, tinyTileWidth, tinyTileHeight)
                    }
                  }
                }
              }
            }
          }
        }
      }

      graphics.stroke()

      // ── Niveau 2 : small ──
      graphics.setStrokeStyle({
        width: SMALL_GRID_LINE_WIDTH,
        color: GRID_COLOR,
        alpha: SMALL_GRID_LINE_ALPHA,
      })

      for (let rowIndex = 0; rowIndex < MATRIX_ROWS; rowIndex += 1) {
        for (let colIndex = 0; colIndex < MATRIX_COLS; colIndex += 1) {
          if (!DEFAULT_MAP_MASK[rowIndex][colIndex]) continue

          const col = colIndex - MATRIX_COL_OFFSET
          const row = rowIndex - MATRIX_ROW_OFFSET

          for (const rowMed of MEDIUM_OFFSETS) {
            for (const colMed of MEDIUM_OFFSETS) {
              const medCol = col * MEDIUM_PER_LARGE + colMed
              const medRow = row * MEDIUM_PER_LARGE + rowMed

              for (const rowSmall of SMALL_OFFSETS) {
                for (const colSmall of SMALL_OFFSETS) {
                  const subCol = medCol * SMALL_PER_MEDIUM + colSmall
                  const subRow = medRow * SMALL_PER_MEDIUM + rowSmall

                  const { x, y } = isoToScreen(subCol, subRow, offsetX, offsetY, smallScale)

                  drawTile(graphics, x, y, smallTileWidth, smallTileHeight)
                }
              }
            }
          }
        }
      }

      graphics.stroke()

      // ── Niveau 3 : medium ──
      graphics.setStrokeStyle({ width: 1, color: GRID_COLOR, alpha: GRID_LINE_ALPHA })

      for (let rowIndex = 0; rowIndex < MATRIX_ROWS; rowIndex += 1) {
        for (let colIndex = 0; colIndex < MATRIX_COLS; colIndex += 1) {
          if (!DEFAULT_MAP_MASK[rowIndex][colIndex]) continue

          const col = colIndex - MATRIX_COL_OFFSET
          const row = rowIndex - MATRIX_ROW_OFFSET

          for (const rowMed of MEDIUM_OFFSETS) {
            for (const colMed of MEDIUM_OFFSETS) {
              const subCol = col * MEDIUM_PER_LARGE + colMed
              const subRow = row * MEDIUM_PER_LARGE + rowMed

              const { x, y } = isoToScreen(subCol, subRow, offsetX, offsetY, mediumScale)

              drawTile(graphics, x, y, mediumTileWidth, mediumTileHeight)
            }
          }
        }
      }

      graphics.stroke()
    },
    [
      drawTile,
      mediumScale,
      mediumTileWidth,
      mediumTileHeight,
      smallScale,
      smallTileWidth,
      smallTileHeight,
      tinyScale,
      tinyTileWidth,
      tinyTileHeight,
      offsetX,
      offsetY,
    ],
  )

  return <pixiGraphics draw={draw} />
}