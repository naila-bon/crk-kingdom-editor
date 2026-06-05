import { Application, extend } from '@pixi/react'
import { Container, Graphics } from 'pixi.js'
import { Grid } from './Grid'

extend({
  Container,
  Graphics,
})

export const PixiCanvas = () => {
  return (
    <Application
      resizeTo={window}
      backgroundAlpha={0}
      resolution={window.devicePixelRatio || 1}
      autoDensity
      antialias={false}
      preference="webgl"
      powerPreference="high-performance"
    >
      <pixiContainer eventMode="static">
        <Grid />
      </pixiContainer>
    </Application>
  )
}