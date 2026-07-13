//pixiCanvas.tsx
import { Application, extend } from '@pixi/react'
import { useCallback, useEffect, useRef, useState, type WheelEvent } from 'react'
import {
  Assets,
  Container,
  Graphics,
  Sprite as PixiSprite,
  Point,
  Rectangle,
  Texture,
  type FederatedPointerEvent,
} from 'pixi.js'
import layoutImg from '../../assets/crk_layout/crk_layout.png'
import { Grid, isFootprintInMask } from './Grid'
import { DecorationsLayer } from './DecorationsLayer'
import type { PlacedDecoration } from '../../types/decorations'
import { TILE_HEIGHT, TILE_WIDTH, getSmallTileGeometry, TINY_PER_SMALL } from '@/utils/gridUtils'
import { HoverHighlight } from './HoverHighlight'

extend({
  Container,
  Graphics,
  Sprite: PixiSprite,
})

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_SENSITIVITY = 0.0012
const ZOOM_SMOOTHING = 0.2
const ZOOM_EPSILON = 0.001

const CLICK_MOVE_THRESHOLD = 5

const IMG_ANCHOR_PX = { x: 2160, y: 695 }

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

type Viewport = {
  width: number
  height: number
}

type Bounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type CoverLayout = {
  scale: number
  centerX: number
  centerY: number
  anchorWorldX: number
  anchorWorldY: number
}

const getViewportSize = (): Viewport => ({
  width: typeof window !== 'undefined' ? window.innerWidth : 0,
  height: typeof window !== 'undefined' ? window.innerHeight : 0,
})

const getContentBounds = (viewport: Viewport): Bounds => ({
  minX: 0,
  maxX: viewport.width,
  minY: 0,
  maxY: viewport.height,
})

const getZoomLimits = (): { minZoom: number; maxZoom: number } => ({
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
})

const clampCameraToWorld = (
  x: number,
  y: number,
  zoom: number,
  viewport: Viewport,
): { x: number; y: number } => {
  const bounds = getContentBounds(viewport)
  const scaledContentMinX = bounds.minX * zoom
  const scaledContentMaxX = bounds.maxX * zoom
  const scaledContentMinY = bounds.minY * zoom
  const scaledContentMaxY = bounds.maxY * zoom
  const scaledContentWidth = scaledContentMaxX - scaledContentMinX
  const scaledContentHeight = scaledContentMaxY - scaledContentMinY

  let boundedX = x
  let boundedY = y

  if (scaledContentWidth <= viewport.width) {
    boundedX = (viewport.width - (scaledContentMinX + scaledContentMaxX)) / 2
  } else {
    const minX = viewport.width - scaledContentMaxX
    const maxX = -scaledContentMinX
    boundedX = clamp(x, minX, maxX)
  }

  if (scaledContentHeight <= viewport.height) {
    boundedY = (viewport.height - (scaledContentMinY + scaledContentMaxY)) / 2
  } else {
    const minY = viewport.height - scaledContentMaxY
    const maxY = -scaledContentMinY
    boundedY = clamp(y, minY, maxY)
  }

  return { x: boundedX, y: boundedY }
}

const getCoverLayout = (viewport: Viewport, tex: Texture): CoverLayout => {
  const scale = Math.max(viewport.width / tex.width, viewport.height / tex.height)
  const dispW = tex.width * scale
  const dispH = tex.height * scale
  const topLeftX = (viewport.width - dispW) / 2
  const topLeftY = (viewport.height - dispH) / 2

  return {
    scale,
    centerX: topLeftX + dispW / 2,
    centerY: topLeftY + dispH / 2,
    anchorWorldX: topLeftX + IMG_ANCHOR_PX.x * scale,
    anchorWorldY: topLeftY + IMG_ANCHOR_PX.y * scale,
  }
}

type PixiCanvasProps = {
  selectedDecoration: { name: string; size: string } | null
}

export const PixiCanvas = ({ selectedDecoration }: PixiCanvasProps) => {
  const cameraRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const zoomTargetRef = useRef(1)
  const zoomAnchorRef = useRef({ x: 0, y: 0, worldX: 0, worldY: 0, active: false })
  const zoomAnimationFrameRef = useRef<number | null>(null)
  const viewportRef = useRef<Viewport>(getViewportSize())
  const dragRef = useRef({ active: false, x: 0, y: 0 })
  const pointerDownRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef<Container | null>(null)
  const didInitCameraRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [viewportSize, setViewportSize] = useState<Viewport>(viewportRef.current)
  const [bgTexture, setBgTexture] = useState<Texture | null>(null)
  const [placedDecorations, setPlacedDecorations] = useState<PlacedDecoration[]>([])
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null)

  useEffect(() => {
    Assets.load(layoutImg).then((tex: Texture) => setBgTexture(tex))
  }, [])

  const screenToGridCoords = useCallback(
    (globalX: number, globalY: number, offsetX: number, offsetY: number, scale: number) => {
      if (!containerRef.current) return null

      // toLocal inverse la transform du container (position + scale de la caméra)
      const local = containerRef.current.toLocal(new Point(globalX, globalY))

      const dx = local.x - offsetX
      const dy = local.y - offsetY
      const a = (TILE_WIDTH * scale) / 2
      const b = (TILE_HEIGHT * scale) / 2

      const col = (dx / a + dy / b) / 2
      const row = (dy / b - dx / a) / 2

      return { col: Math.round(col), row: Math.round(row) }
    },
    [],
  )

  const applyCamera = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.position.set(cameraRef.current.x, cameraRef.current.y)
      containerRef.current.scale.set(zoomRef.current)
    }
  }, [])

  const stopZoomAnimation = useCallback(() => {
    if (zoomAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(zoomAnimationFrameRef.current)
      zoomAnimationFrameRef.current = null
    }
  }, [])

  const animateZoom = useCallback(() => {
    zoomAnimationFrameRef.current = null

    const currentZoom = zoomRef.current
    const targetZoom = zoomTargetRef.current
    const delta = targetZoom - currentZoom

    if (Math.abs(delta) <= ZOOM_EPSILON) {
      zoomRef.current = targetZoom
    } else {
      zoomRef.current = currentZoom + delta * ZOOM_SMOOTHING
    }

    const activeAnchor = zoomAnchorRef.current.active
    const candidateX = activeAnchor
      ? zoomAnchorRef.current.x - zoomAnchorRef.current.worldX * zoomRef.current
      : cameraRef.current.x
    const candidateY = activeAnchor
      ? zoomAnchorRef.current.y - zoomAnchorRef.current.worldY * zoomRef.current
      : cameraRef.current.y

    const bounded = clampCameraToWorld(
      candidateX,
      candidateY,
      zoomRef.current,
      viewportRef.current,
    )

    cameraRef.current.x = bounded.x
    cameraRef.current.y = bounded.y

    applyCamera()

    if (Math.abs(zoomTargetRef.current - zoomRef.current) <= ZOOM_EPSILON) {
      zoomRef.current = zoomTargetRef.current
      const finalBounded = clampCameraToWorld(
        zoomAnchorRef.current.active
          ? zoomAnchorRef.current.x - zoomAnchorRef.current.worldX * zoomRef.current
          : cameraRef.current.x,
        zoomAnchorRef.current.active
          ? zoomAnchorRef.current.y - zoomAnchorRef.current.worldY * zoomRef.current
          : cameraRef.current.y,
        zoomRef.current,
        viewportRef.current,
      )
      cameraRef.current.x = finalBounded.x
      cameraRef.current.y = finalBounded.y
      zoomAnchorRef.current.active = false
      applyCamera()
      return
    }

    zoomAnimationFrameRef.current = window.requestAnimationFrame(animateZoom)
  }, [applyCamera])

  const scheduleZoomAnimation = useCallback(() => {
    if (zoomAnimationFrameRef.current !== null) return
    zoomAnimationFrameRef.current = window.requestAnimationFrame(animateZoom)
  }, [animateZoom])

  const centerWorld = useCallback(() => {
    const centerX = viewportRef.current.width / 2
    const centerY = viewportRef.current.height / 2

    if (!didInitCameraRef.current) {
      zoomRef.current = 1
      zoomTargetRef.current = 1
      didInitCameraRef.current = true
    }

    const zoomLimits = getZoomLimits()
    zoomRef.current = clamp(zoomRef.current, zoomLimits.minZoom, zoomLimits.maxZoom)
    zoomTargetRef.current = zoomRef.current

    const centeredX = centerX - (viewportRef.current.width / 2) * zoomRef.current
    const centeredY = centerY - (viewportRef.current.height / 2) * zoomRef.current

    const bounded = clampCameraToWorld(
      centeredX,
      centeredY,
      zoomRef.current,
      viewportRef.current,
    )

    cameraRef.current.x = bounded.x
    cameraRef.current.y = bounded.y

    applyCamera()
  }, [applyCamera])

  const setContainer = useCallback((node: Container | null) => {
    containerRef.current = node

    if (node) {
      node.hitArea = new Rectangle(0, 0, viewportRef.current.width, viewportRef.current.height)
      centerWorld()
    }
  }, [centerWorld])

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const zoomLimits = getZoomLimits()
    const oldZoom = zoomRef.current
    const zoomFactor = Math.exp(-event.deltaY * ZOOM_SENSITIVITY)
    const nextZoom = clamp(zoomTargetRef.current * zoomFactor, zoomLimits.minZoom, zoomLimits.maxZoom)

    if (nextZoom === zoomTargetRef.current) return

    const cursorX = event.clientX
    const cursorY = event.clientY
    const worldX = (cursorX - cameraRef.current.x) / oldZoom
    const worldY = (cursorY - cameraRef.current.y) / oldZoom

    zoomAnchorRef.current = {
      x: cursorX,
      y: cursorY,
      worldX,
      worldY,
      active: true,
    }
    zoomTargetRef.current = nextZoom

    scheduleZoomAnimation()
  }, [scheduleZoomAnimation])

  const coverLayout = bgTexture ? getCoverLayout(viewportSize, bgTexture) : null

  const { smallScale, smallTileWidth, smallTileHeight } = coverLayout
    ? getSmallTileGeometry(coverLayout.scale)
    : { smallScale: 0, smallTileWidth: 0, smallTileHeight: 0 }

const parseSizeToSmallTiles = useCallback((size: string): number => {
  const match = size.match(/(\d+(?:\.\d+)?)/)
  const parsed = match ? parseFloat(match[1]) : NaN
  const sizeInTiny = Number.isFinite(parsed) && parsed > 0 ? parsed : 4

  return sizeInTiny / TINY_PER_SMALL
}, [])

const handlePlaceClick = useCallback((globalX: number, globalY: number) => {
  if (!coverLayout || !selectedDecoration) return

  const coords = screenToGridCoords(
    globalX,
    globalY,
    coverLayout.anchorWorldX,
    coverLayout.anchorWorldY,
    smallScale,
  )
  if (!coords) return

  const sizeInSmallTiles = parseSizeToSmallTiles(selectedDecoration.size)

  if (!isFootprintInMask(coords.col, coords.row, sizeInSmallTiles)) {
    return
  }

  setPlacedDecorations((prev) => [
    ...prev,
    {
      id: crypto.randomUUID(),
      name: selectedDecoration.name,
      col: coords.col,
      row: coords.row,
      widthInSmallTiles: sizeInSmallTiles,
    },
  ])
}, [coverLayout, screenToGridCoords, selectedDecoration, smallScale, parseSizeToSmallTiles])
const updateHover = useCallback((globalX: number, globalY: number) => {
  if (!coverLayout || !selectedDecoration) {
    setHoverCell(null)
    return
  }

  const coords = screenToGridCoords(
    globalX,
    globalY,
    coverLayout.anchorWorldX,
    coverLayout.anchorWorldY,
    smallScale,
  )

  const sizeInSmallTiles = parseSizeToSmallTiles(selectedDecoration.size)

  if (!coords || !isFootprintInMask(coords.col, coords.row, sizeInSmallTiles)) {
    setHoverCell(null)
    return
  }

  setHoverCell(coords)
}, [coverLayout, screenToGridCoords, selectedDecoration, smallScale, parseSizeToSmallTiles])
  const startPan = useCallback((event: FederatedPointerEvent) => {
    zoomAnchorRef.current.active = false
    stopZoomAnimation()
    zoomTargetRef.current = zoomRef.current

    dragRef.current.active = true
    dragRef.current.x = event.global.x
    dragRef.current.y = event.global.y
    pointerDownRef.current.x = event.global.x
    pointerDownRef.current.y = event.global.y
    setIsDragging(true)
  }, [stopZoomAnimation])

  const stopPan = useCallback((event: FederatedPointerEvent) => {
    const wasDragging = dragRef.current.active
    dragRef.current.active = false
    setIsDragging(false)

    if (!wasDragging) return

    const dx = event.global.x - pointerDownRef.current.x
    const dy = event.global.y - pointerDownRef.current.y
    const movedDistance = Math.hypot(dx, dy)

    if (movedDistance <= CLICK_MOVE_THRESHOLD) {
      handlePlaceClick(event.global.x, event.global.y)
    }
  }, [handlePlaceClick])

  const updatePan = useCallback((event: FederatedPointerEvent) => {
    updateHover(event.global.x, event.global.y)

    if (!dragRef.current.active) return

    const deltaX = event.global.x - dragRef.current.x
    const deltaY = event.global.y - dragRef.current.y

    dragRef.current.x = event.global.x
    dragRef.current.y = event.global.y

    const candidateX = cameraRef.current.x + deltaX
    const candidateY = cameraRef.current.y + deltaY
    const bounded = clampCameraToWorld(
      candidateX,
      candidateY,
      zoomRef.current,
      viewportRef.current,
    )

    cameraRef.current.x = bounded.x
    cameraRef.current.y = bounded.y

    applyCamera()
  }, [applyCamera, updateHover])

  const handlePointerLeave = useCallback((event: FederatedPointerEvent) => {
    stopPan(event)
    setHoverCell(null)
  }, [stopPan])

  useEffect(() => {
    centerWorld()

    const onResize = () => {
      const prevCenterX = viewportRef.current.width / 2
      const prevCenterY = viewportRef.current.height / 2
      const worldAtCenterX = (prevCenterX - cameraRef.current.x) / zoomRef.current
      const worldAtCenterY = (prevCenterY - cameraRef.current.y) / zoomRef.current

      viewportRef.current.width = window.innerWidth
      viewportRef.current.height = window.innerHeight
      setViewportSize({ width: window.innerWidth, height: window.innerHeight })

      if (containerRef.current) {
        containerRef.current.hitArea = new Rectangle(0, 0, window.innerWidth, window.innerHeight)
      }
      const zoomLimits = getZoomLimits()
      zoomRef.current = clamp(zoomRef.current, zoomLimits.minZoom, zoomLimits.maxZoom)
      zoomTargetRef.current = zoomRef.current
      zoomAnchorRef.current.active = false
      stopZoomAnimation()

      const nextCenterX = viewportRef.current.width / 2
      const nextCenterY = viewportRef.current.height / 2

      const candidateX = nextCenterX - worldAtCenterX * zoomRef.current
      const candidateY = nextCenterY - worldAtCenterY * zoomRef.current
      const bounded = clampCameraToWorld(
        candidateX,
        candidateY,
        zoomRef.current,
        viewportRef.current,
      )

      cameraRef.current.x = bounded.x
      cameraRef.current.y = bounded.y

      applyCamera()
    }

    window.addEventListener('resize', onResize)
    return () => {
      stopZoomAnimation()
      window.removeEventListener('resize', onResize)
    }
  }, [applyCamera, centerWorld, stopZoomAnimation])

  return (
    <div
      onWheel={handleWheel}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', touchAction: 'none', position: 'relative' }}
    >
      <Application
        resizeTo={window}    
        backgroundAlpha={0}
        resolution={window.devicePixelRatio || 1}
        autoDensity
        antialias={false}
        preference="webgl"
        powerPreference="high-performance"
      >
        <pixiContainer
          ref={setContainer}
          eventMode="static"
          cursor={isDragging ? 'grabbing' : 'grab'}
          onPointerDown={startPan}
          onPointerMove={updatePan}
          onPointerUp={stopPan}
          onPointerUpOutside={stopPan}
          onPointerCancel={stopPan}
          onPointerLeave={handlePointerLeave}
        >
          {bgTexture && coverLayout && (
            <pixiSprite
              texture={bgTexture}
              anchor={0.5}
              x={coverLayout.centerX}
              y={coverLayout.centerY}
              scale={coverLayout.scale}
            />
          )}
          {coverLayout && (
            <>
              <Grid offsetX={coverLayout.anchorWorldX} offsetY={coverLayout.anchorWorldY} coverScale={coverLayout.scale} />
              <DecorationsLayer
                placed={placedDecorations}
                offsetX={coverLayout.anchorWorldX}
                offsetY={coverLayout.anchorWorldY}
                smallScale={smallScale}
                smallTileWidth={smallTileWidth}
                smallTileHeight={smallTileHeight} 
              />
            </>
          )}
          {coverLayout && selectedDecoration && (
            <HoverHighlight
              hoverCell={hoverCell}
              sizeInSmallTiles={parseSizeToSmallTiles(selectedDecoration.size)}
              offsetX={coverLayout.anchorWorldX}
              offsetY={coverLayout.anchorWorldY}
              smallScale={smallScale}
              smallTileWidth={smallTileWidth}
              smallTileHeight={smallTileHeight}
            />
          )}
        </pixiContainer>
      </Application>
    </div>
  )
}