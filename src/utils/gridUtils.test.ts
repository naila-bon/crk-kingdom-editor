import { describe, expect, it } from 'vitest'
import {
  getSmallTileGeometry,
  getTinyTileGeometry,
  isoToScreen,
  GRID_BASE_SCALE,
  SMALL_PER_LARGE,
  TINY_PER_LARGE,
  TILE_HEIGHT,
  TILE_WIDTH,
} from './gridUtils'

describe('gridUtils', () => {
  it('converts isometric coordinates with an offset and scale', () => {
    expect(isoToScreen(2, -1, 100, 50, 2)).toEqual({ x: 292, y: 82 })
  })

  it('uses the configured scale hierarchy for small tiles', () => {
    const geometry = getSmallTileGeometry(2)
    const expectedScale = (GRID_BASE_SCALE * 2) / SMALL_PER_LARGE

    expect(geometry).toEqual({
      smallScale: expectedScale,
      smallTileWidth: TILE_WIDTH * expectedScale,
      smallTileHeight: TILE_HEIGHT * expectedScale,
    })
  })

  it('uses the configured scale hierarchy for tiny tiles', () => {
    const geometry = getTinyTileGeometry(1)
    const expectedScale = GRID_BASE_SCALE / TINY_PER_LARGE

    expect(geometry).toEqual({
      tinyScale: expectedScale,
      tinyTileWidth: TILE_WIDTH * expectedScale,
      tinyTileHeight: TILE_HEIGHT * expectedScale,
    })
  })
})
