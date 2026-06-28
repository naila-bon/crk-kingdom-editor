import { Graphics } from 'pixi.js'
import { useCallback, type FC } from 'react'
import { TILE_WIDTH, TILE_HEIGHT, isoToScreen } from '../../utils/gridUtils'

export const GRID_NUDGE_X = 50
export const GRID_NUDGE_Y = -5 
export const GRID_SCALE = 1.3
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

const MEDIUM_PER_LARGE = 8
const SMALL_PER_MEDIUM = 2
const SMALL_PER_LARGE = MEDIUM_PER_LARGE * SMALL_PER_MEDIUM // 16

const MATRIX = DEFAULT_MAP_MASK
const MATRIX_ROWS = MATRIX.length           // 16
const MATRIX_COLS = MATRIX[0].length        // 15

// Taille d'une petite tuile en pixels — dérivée de TILE_WIDTH/HEIGHT
// pour que 1 cellule matrice == 1 "grande tuile" aux dimensions d'origine.
// Grande tuile iso = TILE_WIDTH × TILE_HEIGHT → petite tuile = /SMALL_PER_LARGE
const SMALL_TILE_W = (TILE_WIDTH  / SMALL_PER_LARGE) * GRID_SCALE
const SMALL_TILE_H = (TILE_HEIGHT / SMALL_PER_LARGE) * GRID_SCALE

// Offset en tuiles pour centrer à l'origine (en unités de grandes tuiles)
const MATRIX_COL_OFFSET = Math.floor(MATRIX_COLS / 2)
const MATRIX_ROW_OFFSET = Math.floor(MATRIX_ROWS / 2)

// isoToScreen travaille en grandes tuiles — on scale manuellement pour les niveaux inférieurs
const smallIsoToScreen = (
  col: number,
  row: number,
  offsetX = 0,
  offsetY = 0,
) => ({
  x: (col - row) * (SMALL_TILE_W / 2) + offsetX,
  y: (col + row) * (SMALL_TILE_H / 2) + offsetY,
})

type Bounds = { minX: number; maxX: number; minY: number; maxY: number }

const computeGridBoundsAtOrigin = (): Bounds => {
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (let mr = 0; mr < MATRIX_ROWS; mr++) {
    for (let mc = 0; mc < MATRIX_COLS; mc++) {
      if (!MATRIX[mr][mc]) continue

      const col = mc - MATRIX_COL_OFFSET
      const row = mr - MATRIX_ROW_OFFSET
      const { x, y } = isoToScreen(col, row) // unités grandes tuiles

      minX = Math.min(minX, x - TILE_WIDTH  / 2)
      maxX = Math.max(maxX, x + TILE_WIDTH  / 2)
      minY = Math.min(minY, y - TILE_HEIGHT / 2)
      maxY = Math.max(maxY, y + TILE_HEIGHT / 2)
    }
  }

  return { minX, maxX, minY, maxY }
}

// Bounds identiques à avant → PixiCanvas ne change pas
export const GRID_BOUNDS_AT_ORIGIN = computeGridBoundsAtOrigin()

const drawDiamond = (
  g: Graphics,
  x: number,
  y: number,
  hw: number,
  hh: number,
) => {
  g.moveTo(x,      y - hh)
   .lineTo(x + hw, y)
   .lineTo(x,      y + hh)
   .lineTo(x - hw, y)
   .lineTo(x,      y - hh)
}

type GridProps = { offsetX: number; offsetY: number }

export const Grid: FC<GridProps> = ({ offsetX, offsetY }) => {

  const draw = useCallback(
    (g: Graphics) => {
      g.clear()

      // ── Petites tuiles (SMALL_TILE_W × SMALL_TILE_H) ─────────────────
      g.setStrokeStyle({ width: 0.15, color: GRID_COLOR, alpha: 0.15 })

      for (let mr = 0; mr < MATRIX_ROWS; mr++) {
        for (let mc = 0; mc < MATRIX_COLS; mc++) {
          if (!MATRIX[mr][mc]) continue

          const baseCol = (mc - MATRIX_COL_OFFSET) * SMALL_PER_LARGE
          const baseRow = (mr - MATRIX_ROW_OFFSET) * SMALL_PER_LARGE

          for (let medR = 0; medR < MEDIUM_PER_LARGE; medR++) {
            for (let medC = 0; medC < MEDIUM_PER_LARGE; medC++) {
              for (let smR = 0; smR < SMALL_PER_MEDIUM; smR++) {
                for (let smC = 0; smC < SMALL_PER_MEDIUM; smC++) {
                  const col = baseCol + medC * SMALL_PER_MEDIUM + smC
                  const row = baseRow + medR * SMALL_PER_MEDIUM + smR
                  const { x, y } = smallIsoToScreen(col, row, offsetX, offsetY)
                  drawDiamond(g, x, y, SMALL_TILE_W / 2, SMALL_TILE_H / 2)
                }
              }
            }
          }
        }
      }
      g.stroke()

      // ── Moyens carrés (SMALL_PER_MEDIUM petites tuiles de côté) ───────
      g.setStrokeStyle({ width: 0.3, color: GRID_COLOR, alpha: 0.28 })

      for (let mr = 0; mr < MATRIX_ROWS; mr++) {
        for (let mc = 0; mc < MATRIX_COLS; mc++) {
          if (!MATRIX[mr][mc]) continue

          const baseCol = (mc - MATRIX_COL_OFFSET) * SMALL_PER_LARGE
          const baseRow = (mr - MATRIX_ROW_OFFSET) * SMALL_PER_LARGE

          for (let medR = 0; medR < MEDIUM_PER_LARGE; medR++) {
            for (let medC = 0; medC < MEDIUM_PER_LARGE; medC++) {
              // Centre du bloc moyen en coordonnées petites tuiles
              const col = baseCol + medC * SMALL_PER_MEDIUM + (SMALL_PER_MEDIUM - 1) / 2
              const row = baseRow + medR * SMALL_PER_MEDIUM + (SMALL_PER_MEDIUM - 1) / 2
              const { x, y } = smallIsoToScreen(col, row, offsetX, offsetY)
              const hw = (SMALL_TILE_W / 2) * SMALL_PER_MEDIUM
              const hh = (SMALL_TILE_H / 2) * SMALL_PER_MEDIUM
              drawDiamond(g, x, y, hw, hh)
            }
          }
        }
      }
      g.stroke()

      // ── Grands carrés (cellules matrice, TILE_WIDTH × TILE_HEIGHT) ────
      // Grands carrés supprimés : on garde uniquement les petits et moyens
      // pour éviter un rendu en double et préserver la lisibilité.
    },
    [offsetX, offsetY],
  )

  return <pixiGraphics draw={draw} />
}