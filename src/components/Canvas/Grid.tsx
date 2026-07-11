import { Graphics } from 'pixi.js'
import { useCallback, type FC } from 'react'
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  isoToScreen,
} from '../../utils/gridUtils'

const GRID_COLOR = '#ffffff'
const GRID_LINE_ALPHA = 0.35
const GRID_BASE_SCALE = 4.4

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

type GridProps = {
  offsetX: number
  offsetY: number
  coverScale: number
}

export const Grid: FC<GridProps> = ({ offsetX, offsetY, coverScale }) => {
  const effectiveScale = GRID_BASE_SCALE * coverScale
  const tileWidth = TILE_WIDTH * effectiveScale
  const tileHeight = TILE_HEIGHT * effectiveScale

  const drawTile = useCallback(
    (graphics: Graphics, x: number, y: number) => {
      graphics
        .moveTo(x, y - tileHeight / 2)
        .lineTo(x + tileWidth / 2, y)
        .lineTo(x, y + tileHeight / 2)
        .lineTo(x - tileWidth / 2, y)
        .lineTo(x, y - tileHeight / 2)
    },
    [tileHeight, tileWidth],
  )

  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()
      graphics.setStrokeStyle({ width: 1, color: GRID_COLOR, alpha: GRID_LINE_ALPHA })

      for (let rowIndex = 0; rowIndex < MATRIX_ROWS; rowIndex += 1) {
        for (let colIndex = 0; colIndex < MATRIX_COLS; colIndex += 1) {
          if (!DEFAULT_MAP_MASK[rowIndex][colIndex]) continue

          const col = colIndex - MATRIX_COL_OFFSET
          const row = rowIndex - MATRIX_ROW_OFFSET
          const { x, y } = isoToScreen(col, row, offsetX, offsetY, effectiveScale)

          drawTile(graphics, x, y)
        }
      }

      graphics.stroke()
    },
    [drawTile, effectiveScale, offsetX, offsetY],
  )

  return <pixiGraphics draw={draw} />
}