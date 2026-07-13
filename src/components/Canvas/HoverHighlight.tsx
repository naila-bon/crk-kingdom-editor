import { Graphics } from 'pixi.js'
import { useCallback, type FC } from 'react'
import { isoToScreen } from '../../utils/gridUtils'

const HIGHLIGHT_COLOR = '#a855f7'
const HIGHLIGHT_ALPHA = 0.35
const HIGHLIGHT_LINE_COLOR = '#c084fc'
const HIGHLIGHT_LINE_ALPHA = 0.7

type HoverHighlightProps = {
  hoverCell: { col: number; row: number } | null
  sizeInSmallTiles: number
  offsetX: number
  offsetY: number
  smallScale: number
  smallTileWidth: number
  smallTileHeight: number
}

const centeredOffsets = (n: number) =>
  Array.from({ length: n }, (_, i) => i - (n - 1) / 2)

export const HoverHighlight: FC<HoverHighlightProps> = ({
  hoverCell,
  sizeInSmallTiles,
  offsetX,
  offsetY,
  smallScale,
  smallTileWidth,
  smallTileHeight,
}) => {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()
      if (!hoverCell) return

      const offsets = centeredOffsets(sizeInSmallTiles)

      graphics.setStrokeStyle({ width: 1.5, color: HIGHLIGHT_LINE_COLOR, alpha: HIGHLIGHT_LINE_ALPHA })

      for (const rOff of offsets) {
        for (const cOff of offsets) {
          const subCol = hoverCell.col + cOff
          const subRow = hoverCell.row + rOff

          const { x, y } = isoToScreen(subCol, subRow, offsetX, offsetY, smallScale)

          graphics
            .moveTo(x, y - smallTileHeight / 2)
            .lineTo(x + smallTileWidth / 2, y)
            .lineTo(x, y + smallTileHeight / 2)
            .lineTo(x - smallTileWidth / 2, y)
            .lineTo(x, y - smallTileHeight / 2)
            .fill({ color: HIGHLIGHT_COLOR, alpha: HIGHLIGHT_ALPHA })
        }
      }

      graphics.stroke()
    },
    [hoverCell, sizeInSmallTiles, offsetX, offsetY, smallScale, smallTileWidth, smallTileHeight],
  )

  return <pixiGraphics draw={draw} />
}