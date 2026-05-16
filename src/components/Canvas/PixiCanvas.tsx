import { Application, extend } from '@pixi/react'
import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { Background, BG_COLOR } from './Background'
import { Grid } from './Grid'

extend({
  Container,
  Graphics,
  Sprite,
  Text,
})

const WORLD_WIDTH = 4000
const WORLD_HEIGHT = 4000

export const PixiCanvas = () => {

  return (
    <Application
      resizeTo={window}
      backgroundColor={BG_COLOR}
      resolution={window.devicePixelRatio || 1}
      autoDensity
      antialias={false}
      preference="webgl"
      powerPreference="high-performance"
    >
      <pixiContainer
        sortableChildren
        eventMode="static"
      >
        <pixiContainer zIndex={0}>
          <Background
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
          />
        </pixiContainer>

        <pixiContainer zIndex={1}>
          <Grid
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
          />
        </pixiContainer>

        <pixiContainer zIndex={10}>
        </pixiContainer>
      </pixiContainer>
    </Application>
  )
}