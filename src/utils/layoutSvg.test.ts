// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { PlacedDecoration } from '../types/decorations'
import { createLayoutSvg, parseLayoutSvg } from './layoutSvg'

const items: PlacedDecoration[] = [
  { id: 'one', name: 'Candy Planet', col: -3, row: 4, widthInSmallTiles: 2 },
  { id: 'two', name: 'Tiny Tree', col: 6, row: -2, widthInSmallTiles: 1 },
]

describe('layoutSvg', () => {
  it('serializes and restores a layout without losing positions', () => {
    const svg = createLayoutSvg(items, '/assets/map.png')

    expect(svg).toContain('id="crk-layout-data"')
    expect(parseLayoutSvg(svg)).toEqual(items)
  })

  it('escapes the background URL in SVG attributes', () => {
    const svg = createLayoutSvg([], '/map?theme="night"&v=1')

    expect(svg).toContain('/map?theme=&quot;night&quot;&amp;v=1')
  })

  it('rejects SVG documents without CRK metadata', () => {
    expect(() => parseLayoutSvg('<svg xmlns="http://www.w3.org/2000/svg" />')).toThrow(
      'Ce fichier ne contient pas de layout CRK valide.',
    )
  })

  it('rejects invalid decoration data', () => {
    const svg = createLayoutSvg(items, '/assets/map.png').replace('"col":-3', '"col":"invalid"')

    expect(() => parseLayoutSvg(svg)).toThrow('Le layout contient une décoration invalide.')
  })
})
