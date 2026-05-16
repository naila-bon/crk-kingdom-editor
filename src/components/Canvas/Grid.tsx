import { Graphics } from 'pixi.js'
import { useCallback } from 'react'

export const TILE_SIZE = 32
export const GRID_COLOR = "#ffffff"

interface GridProps {
  width: number
  height: number
}

export const Grid = ({ width, height }: GridProps) => {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      g.setStrokeStyle({
        width: 1,
        color: GRID_COLOR,
        alpha: 0.35,
      })

      for (let x = 0; x <= width; x += TILE_SIZE) {
        g.moveTo(x, 0).lineTo(x, height)
      }

      for (let y = 0; y <= height; y += TILE_SIZE) {
        g.moveTo(0, y).lineTo(width, y)
      }

      g.stroke()
      g.cacheAsTexture(true)
    },
    [width, height],
  )

  return <pixiGraphics draw={draw} />
}