import { Graphics } from 'pixi.js'
import { useCallback, type FC } from 'react'

export const BG_COLOR = "#478115"

type BackgroundProps = {
  width: number
  height: number
}

export const Background : FC<BackgroundProps> = ({ width, height }) => {
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