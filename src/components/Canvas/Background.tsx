import { Graphics } from 'pixi.js'
import { useCallback } from 'react'

export const BG_COLOR = "#478115"

interface BackgroundProps {
  width: number
  height: number
}

export const Background = ({ width, height }: BackgroundProps) => {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()

      g.rect(0, 0, width, height)
      g.fill(BG_COLOR)
    },
    [width, height],
  )

  return <pixiGraphics draw={draw} />
}