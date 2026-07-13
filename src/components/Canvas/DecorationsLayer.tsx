//decorationsLayer.tsx
//decorationsLayer.tsx
import { Assets, Texture } from 'pixi.js'
import { useEffect, useMemo, useState, type FC } from 'react'
import { isoToScreen } from '../../utils/gridUtils'
import { getVisibleBottomFraction } from '../../utils/textureBounds'
import decorations from '../../../scripts/crk_decors_avec_noms_843.json'
import type { PlacedDecoration } from '../../types/decorations'

const decorationByName = new Map(
  (decorations as { name: string; imageUrl?: string }[]).map((d) => [d.name, d]),
)

// Petite correction résiduelle pour l'ombre au sol dans le PNG lui-même
// (indépendante de la taille du footprint, garde une petite valeur).
const ANCHOR_Y_ADJUSTMENT_PX = 12

type DecorationsLayerProps = {
  placed: PlacedDecoration[]
  offsetX: number
  offsetY: number
  smallScale: number
  smallTileWidth: number
  smallTileHeight: number
  debug?: boolean
}

export const DecorationsLayer: FC<DecorationsLayerProps> = ({
  placed,
  offsetX,
  offsetY,
  smallScale,
  smallTileWidth,
  smallTileHeight,
  debug = false,
}) => {
  const [textures, setTextures] = useState<Map<string, Texture>>(new Map())
  const [bottomFractions, setBottomFractions] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    const urls = Array.from(
      new Set(
        placed
          .map((deco) => decorationByName.get(deco.name)?.imageUrl)
          .filter((url): url is string => Boolean(url)),
      ),
    )

    const missing = urls.filter((url) => !textures.has(url))
    if (missing.length === 0) return

    let cancelled = false

    Promise.all(
      missing.map((url) =>
        Assets.load(url)
          .then((tex: Texture) => [url, tex] as const)
          .catch((err) => {
            console.error('Échec chargement texture décoration:', url, err)
            return null
          }),
      ),
    ).then((entries) => {
      if (cancelled) return

      setTextures((prev) => {
        const next = new Map(prev)
        for (const entry of entries) {
          if (entry) next.set(entry[0], entry[1])
        }
        return next
      })

      setBottomFractions((prev) => {
        const next = new Map(prev)
        for (const entry of entries) {
          if (entry) {
            const [url, tex] = entry
            next.set(url, getVisibleBottomFraction(tex))
          }
        }
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [placed, textures])

  const sorted = useMemo(() => {
    return [...placed].sort((a, b) => (a.col + a.row) - (b.col + b.row))
  }, [placed])

  return (
    <>
      {sorted.map((deco) => {
        const info = decorationByName.get(deco.name)
        if (!info?.imageUrl) return null

        const texture = textures.get(info.imageUrl)
        if (!texture) return null

        const targetWidth = deco.widthInSmallTiles * smallTileWidth
        const spriteScale = targetWidth / texture.width

        const { x, y: centerY } = isoToScreen(deco.col, deco.row, offsetX, offsetY, smallScale)

        const footprintFrontOffset = (deco.widthInSmallTiles * smallTileHeight) / 2
        const y = centerY + footprintFrontOffset

        const rawBottomPx = (bottomFractions.get(info.imageUrl) ?? 1) * texture.height
        const adjustedBottomPx = Math.max(0, rawBottomPx - ANCHOR_Y_ADJUSTMENT_PX)
        const anchorY = adjustedBottomPx / texture.height

        const displayWidth = texture.width * spriteScale
        const displayHeight = texture.height * spriteScale
        const spriteLeft = x - displayWidth / 2
        const spriteTop = y - anchorY * displayHeight

        return (
          <>
            <pixiSprite
              key={deco.id}
              texture={texture}
              x={x}
              y={y}
              anchor={{ x: 0.5, y: anchorY }}
              scale={spriteScale}
            />

            {debug && (
              <pixiGraphics
                key={`debug-${deco.id}`}
                draw={(g) => {
                  g.clear()
                  g.rect(spriteLeft, spriteTop, displayWidth, displayHeight)
                  g.stroke({ width: 1.5, color: 0xffff00, alpha: 0.9 })

                  const anchorScreenY = spriteTop + anchorY * displayHeight
                  g.moveTo(spriteLeft, anchorScreenY)
                    .lineTo(spriteLeft + displayWidth, anchorScreenY)
                    .stroke({ width: 1.5, color: 0x00ff00, alpha: 0.9 })

                  g.circle(x, y, 4)
                  g.fill({ color: 0xff0000, alpha: 1 })
                }}
              />
            )}
          </>
        )
      })}
    </>
  )
}