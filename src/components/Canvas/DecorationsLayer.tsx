import { Assets, Texture, type FederatedPointerEvent } from 'pixi.js'
import { Fragment, useEffect, useMemo, useState, type FC } from 'react'
import { isoToScreen } from '../../utils/gridUtils'
import { getVisibleBottomFraction } from '../../utils/textureBounds'
import decorations from '../../../scripts/crk_decors_avec_noms_843.json'
import type { PlacedDecoration } from '../../types/decorations'

const decorationByName = new Map(
  (decorations as { name: string; imageUrl?: string }[]).map((d) => [d.name, d]),
)

const ANCHOR_Y_ADJUSTMENT_PX = 12
const DELETE_BUTTON_RADIUS = 12
const DELETE_BUTTON_MARGIN = 8

type DecorationsLayerProps = {
  placed: PlacedDecoration[]
  offsetX: number
  offsetY: number
  smallScale: number
  smallTileWidth: number
  smallTileHeight: number
  selectedPlacedId: string | null
  onSelectPlaced: (id: string) => void
  onDragStart: (id: string) => void
  onDeletePlaced: (id: string) => void
  interactive: boolean
  debug?: boolean
}

export const DecorationsLayer: FC<DecorationsLayerProps> = ({
  placed,
  offsetX,
  offsetY,
  smallScale,
  smallTileWidth,
  smallTileHeight,
  selectedPlacedId,
  onSelectPlaced,
  onDragStart,
  onDeletePlaced,
  interactive,
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

        const isSelected = deco.id === selectedPlacedId

        // Position du bouton de suppression : coin haut-droit de la
        // bounding box du sprite, légèrement décalé vers l'extérieur.
        const deleteButtonX = spriteLeft + displayWidth + DELETE_BUTTON_MARGIN
        const deleteButtonY = spriteTop - DELETE_BUTTON_MARGIN

        return (
          <Fragment key={deco.id}>
            <pixiSprite
              texture={texture}
              x={x}
              y={y}
              anchor={{ x: 0.5, y: anchorY }}
              scale={spriteScale}
              eventMode={interactive ? 'static' : 'none'}
              cursor={interactive ? 'pointer' : 'default'}
              onPointerDown={
                interactive
                  ? (event: FederatedPointerEvent) => {
                      event.stopPropagation()
                      onSelectPlaced(deco.id)
                      onDragStart(deco.id)
                    }
                  : undefined
              }
            />

            {isSelected && interactive && (
              <>
                <pixiGraphics
                  key={`selection-${deco.id}`}
                  draw={(g) => {
                    g.clear()
                    g.rect(spriteLeft, spriteTop, displayWidth, displayHeight)
                    g.stroke({ width: 2, color: 0x3b82f6, alpha: 0.9 })
                  }}
                />

                <pixiGraphics
                  key={`delete-${deco.id}`}
                  x={deleteButtonX}
                  y={deleteButtonY}
                  eventMode="static"
                  cursor="pointer"
                  onPointerDown={(event: FederatedPointerEvent) => {
                    // Empêche le clic de démarrer un pan ou de retomber sur
                    // le sprite en dessous.
                    event.stopPropagation()
                    onDeletePlaced(deco.id)
                  }}
                  draw={(g) => {
                    g.clear()
                    // Cercle rouge de fond.
                    g.circle(0, 0, DELETE_BUTTON_RADIUS)
                    g.fill({ color: 0xef4444, alpha: 1 })
                    g.stroke({ width: 1.5, color: 0xffffff, alpha: 1 })

                    // Croix blanche dessinée à l'intérieur du cercle.
                    const crossSize = DELETE_BUTTON_RADIUS * 0.5
                    g.moveTo(-crossSize, -crossSize)
                      .lineTo(crossSize, crossSize)
                      .moveTo(crossSize, -crossSize)
                      .lineTo(-crossSize, crossSize)
                      .stroke({ width: 2, color: 0xffffff, alpha: 1 })
                  }}
                />
              </>
            )}

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
          </Fragment>
        )
      })}
    </>
  )
} 