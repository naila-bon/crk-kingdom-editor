//decorationsLayer.tsx
import { Sprite as PixiSprite, Assets, Texture } from 'pixi.js'
import { useEffect, useMemo, useState, type FC } from 'react'
import { isoToScreen } from '../../utils/gridUtils'
import decorations from '../../../scripts/crk_decors_avec_noms_843.json'
import type { PlacedDecoration } from '../../types/decorations'

const decorationByName = new Map(
  (decorations as { name: string; imageUrl?: string }[]).map((d) => [d.name, d]),
)

type DecorationsLayerProps = {
  placed: PlacedDecoration[]
  offsetX: number
  offsetY: number
  // Échelle "small" à passer à isoToScreen pour le positionnement
  // (= effectiveScale / SMALL_PER_LARGE, même valeur que dans Grid.tsx).
  smallScale: number
  // Taille réelle en pixels world d'un petit losange, pour calibrer le
  // scale du sprite à partir de sa largeur cible en "nombre de petits losanges".
  smallTileWidth: number
}

export const DecorationsLayer: FC<DecorationsLayerProps> = ({
  placed,
  offsetX,
  offsetY,
  smallScale,
  smallTileWidth,
}) => {
  const [textures, setTextures] = useState<Map<string, Texture>>(new Map())

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
    })

    return () => {
      cancelled = true
    }
  }, [placed, textures])

  // Profondeur iso classique : col+row croissant = dessiné par-dessus.
  const sorted = useMemo(() => {
    return [...placed].sort((a, b) => (a.col + a.row) - (b.col + b.row))
  }, [placed])

  return (
    <>
      {sorted.map((deco) => {
        const info = decorationByName.get(deco.name)
        if (!info?.imageUrl) return null

        const texture = textures.get(info.imageUrl)
        if (!texture) return null // pas encore chargée

        // Largeur cible en pixels world = nombre de petits losanges * largeur d'un petit losange.
        const targetWidth = deco.widthInSmallTiles * smallTileWidth
        // Scale uniforme calculé depuis la largeur réelle de la texture,
        // pour que l'image entière (peu importe sa résolution native)
        // occupe exactement targetWidth en largeur, en gardant ses proportions.
        const spriteScale = targetWidth / texture.width

        const { x, y } = isoToScreen(deco.col, deco.row, offsetX, offsetY, smallScale)

        return (
          <pixiSprite
            key={deco.id}
            texture={texture}
            x={x}
            y={y}
            // Ancrage par la base du sprite : la décoration "pose" sur la case.
            anchor={{ x: 0.5, y: 1 }}
            scale={spriteScale}
          />
        )
      })}
    </>
  )
}