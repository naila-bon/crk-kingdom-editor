// utils/textureBounds.ts
import { Texture } from 'pixi.js'

/**
 * Calcule la fraction verticale (0-1) où se trouve le bas réel du contenu
 * visible (dernier pixel non-transparent en partant du bas), pour corriger
 * l'anchor.y d'un sprite dont le PNG source a une marge transparente.
 * Retourne 1 (comportement par défaut) si le calcul échoue (CORS, source
 * indisponible, image entièrement transparente...).
 */
export const getVisibleBottomFraction = (texture: Texture): number => {
  try {
    const source = texture.source.resource as HTMLImageElement | HTMLCanvasElement | undefined
    if (!source) return 1

    const width = texture.width
    const height = texture.height
    if (!width || !height) return 1

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return 1

    ctx.drawImage(source, 0, 0, width, height)
    const { data } = ctx.getImageData(0, 0, width, height)

    for (let y = height - 1; y >= 0; y -= 1) {
      const rowOffset = y * width * 4
      for (let x = 0; x < width; x += 1) {
        const alpha = data[rowOffset + x * 4 + 3]
        if (alpha > 10) {
          return (y + 1) / height
        }
      }
    }

    return 1
  } catch (err) {
    console.warn('getVisibleBottomFraction: lecture pixels impossible, fallback à 1', err)
    return 1
  }
}