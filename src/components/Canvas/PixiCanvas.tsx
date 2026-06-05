import { Application, extend } from '@pixi/react'
import { Container, Graphics } from 'pixi.js'
import { Grid } from './Grid'
import { TILE_WIDTH, TILE_HEIGHT } from '../../utils/gridUtils'

extend({
  Container,
  Graphics,
})

export const PixiCanvas = () => {
  const availWidth = typeof window !== 'undefined' ? window.innerWidth : 0
  const availHeight = typeof window !== 'undefined' ? window.innerHeight : 0

  const MATRIX_COLS = 15
  const MATRIX_ROWS = 16
  const mapWidth = (MATRIX_COLS + MATRIX_ROWS) * (TILE_WIDTH / 2)
  const mapHeight = (MATRIX_COLS + MATRIX_ROWS) * (TILE_HEIGHT / 2)

  const computed = Math.min(1, availWidth / mapWidth || 1, availHeight / mapHeight || 1)
  // apply small padding factor so the full map fits comfortably
  const paddingFactor = 2.15
  const scale = computed > 0 ? Math.max(0.2, computed * paddingFactor) : 1

  const offsetX = Math.floor(availWidth / 2)+ 160
  const offsetY = Math.floor(availHeight / 2 )- 40

  return (
    <Application
      resizeTo={typeof window !== 'undefined' ? window : undefined}
      backgroundAlpha={0}
      resolution={window.devicePixelRatio || 1}
      autoDensity
      antialias={false}
      preference="webgl"
      powerPreference="high-performance"
    >
      <pixiContainer eventMode="static" x={0} y={0} scale={scale}>
        <Grid offsetX={offsetX / scale} offsetY={offsetY / scale} />
      </pixiContainer>
    </Application>
  )
}