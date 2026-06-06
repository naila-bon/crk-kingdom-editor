import { Graphics } from 'pixi.js'
import { useCallback, type FC } from 'react'
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  isoToScreen,
} from '../../utils/gridUtils'

const GRID_COLOR = '#ffffff'

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

const TILE_W = TILE_WIDTH
const TILE_H = TILE_HEIGHT
const MATRIX = DEFAULT_MAP_MASK
const MATRIX_ROWS = MATRIX.length
const MATRIX_COLS = MATRIX[0].length
const MATRIX_COL_OFFSET = Math.floor(MATRIX_COLS / 2)
const MATRIX_ROW_OFFSET = Math.floor(MATRIX_ROWS / 2)

type Bounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const computeGridBoundsAtOrigin = (): Bounds => {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (let r = 0; r < MATRIX_ROWS; r++) {
    for (let c = 0; c < MATRIX_COLS; c++) {
      if (!MATRIX[r][c]) continue

      const col = c - MATRIX_COL_OFFSET
      const row = r - MATRIX_ROW_OFFSET
      const { x, y } = isoToScreen(col, row)

      minX = Math.min(minX, x - TILE_W / 2)
      maxX = Math.max(maxX, x + TILE_W / 2)
      minY = Math.min(minY, y - TILE_H / 2)
      maxY = Math.max(maxY, y + TILE_H / 2)
    }
  }

  return { minX, maxX, minY, maxY }
}

// Used by camera logic to clamp pan/zoom against the real tile envelope.
export const GRID_BOUNDS_AT_ORIGIN = computeGridBoundsAtOrigin()

type GridProps = {
  offsetX: number
  offsetY: number
}

export const Grid: FC<GridProps> = ({ offsetX, offsetY }) => {

  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      g.setStrokeStyle({ width: 1, color: GRID_COLOR, alpha: 0.35 })

      for (let r = 0; r < MATRIX_ROWS; r++) {
        for (let c = 0; c < MATRIX_COLS; c++) {
          if (!MATRIX[r][c]) continue

          const col = c - MATRIX_COL_OFFSET
          const row = r - MATRIX_ROW_OFFSET

          const { x, y } = isoToScreen(col, row, offsetX, offsetY)

          g.moveTo(x, y - TILE_H / 2)
            .lineTo(x + TILE_W / 2, y)
            .lineTo(x, y + TILE_H / 2)
            .lineTo(x - TILE_W / 2, y)
            .lineTo(x, y - TILE_H / 2)
        }
      }

      g.stroke()
    },
    [offsetX, offsetY],
  )

  return <pixiGraphics draw={draw} />
}