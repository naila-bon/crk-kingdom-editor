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

const SMALL_GRID_LINE_WIDTH = 0.5
const SMALL_GRID_LINE_ALPHA = 0.18

// Nombre de losanges medium par côté d'un losange large (cellule de la matrice).
const MEDIUM_PER_LARGE = 4
const SMALL_PER_MEDIUM = 2

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

const SMALL_PER_LARGE = MEDIUM_PER_LARGE * SMALL_PER_MEDIUM

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
      offsetX,
      offsetY,
    ],
  )

  return <pixiGraphics draw={draw} />
}