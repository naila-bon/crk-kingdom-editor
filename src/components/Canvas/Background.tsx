import { Graphics } from 'pixi.js'
import { useCallback, type FC } from 'react'
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  isoToScreen,
} from '../../utils/gridUtils'

export const BG_COLOR = '#478115'

type BackgroundProps = {
  width: number
  height: number
}

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

const MATRIX = DEFAULT_MAP_MASK
const MATRIX_ROWS = MATRIX.length
const MATRIX_COLS = MATRIX[0].length
const MATRIX_COL_OFFSET = Math.floor(MATRIX_COLS / 2)
const MATRIX_ROW_OFFSET = Math.floor(MATRIX_ROWS / 2)

export const Background: FC<BackgroundProps> = ({ width, height }) => {
  const offsetX = Math.floor(
    (typeof window !== 'undefined' ? window.innerWidth : 0) / 2,
  )
  const offsetY = Math.floor(
    (typeof window !== 'undefined' ? window.innerHeight : 0) / 2,
  )

  const draw = useCallback(
    (g: Graphics) => {
      g.clear()

      // fill only the tiles that are present in the map mask
      const color = parseInt(BG_COLOR.slice(1), 16)
      const TILE_W = TILE_WIDTH
      const TILE_H = TILE_HEIGHT

      for (let r = 0; r < MATRIX_ROWS; r++) {
        for (let c = 0; c < MATRIX_COLS; c++) {
          if (!MATRIX[r][c]) continue

          const col = c - MATRIX_COL_OFFSET
          const row = r - MATRIX_ROW_OFFSET

          const { x, y } = isoToScreen(col, row, offsetX, offsetY)

          g.beginFill(color)
            .moveTo(x, y - TILE_H / 2)
            .lineTo(x + TILE_W / 2, y)
            .lineTo(x, y + TILE_H / 2)
            .lineTo(x - TILE_W / 2, y)
            .lineTo(x, y - TILE_H / 2)
            .endFill()
        }
      }
    },
    [width, height, offsetX, offsetY],
  )

  return <pixiGraphics draw={draw} />
}