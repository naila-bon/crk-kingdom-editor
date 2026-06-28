import { Application, extend } from '@pixi/react'
import { useCallback, useEffect, useRef, useState, type WheelEvent } from 'react'
import { Container, Graphics, type FederatedPointerEvent, Sprite as PixiSprite } from 'pixi.js'
import layoutImg from '../../assets/crk_layout/crk_layout.png'
import { Background } from './Background'
import { Grid, GRID_BOUNDS_AT_ORIGIN, GRID_NUDGE_X, GRID_NUDGE_Y } from './Grid'

extend({
  Container,
  Graphics,
  Sprite: PixiSprite,
})

// bgTexture removed: we now use the DOM image behind the canvas

const WORLD_WIDTH = 4000
const WORLD_HEIGHT = 4000
const MIN_ZOOM = 0.35
const MAX_ZOOM = 3
const ZOOM_SENSITIVITY = 0.0012
const ZOOM_SMOOTHING = 0.2
const ZOOM_EPSILON = 0.001
const GRID_OFFSET_X = WORLD_WIDTH / 2
const GRID_OFFSET_Y = WORLD_HEIGHT / 2

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

const CAMERA_CONTENT_BOUNDS: Bounds = {
  minX: GRID_BOUNDS_AT_ORIGIN.minX + GRID_OFFSET_X,
  maxX: GRID_BOUNDS_AT_ORIGIN.maxX + GRID_OFFSET_X,
  minY: GRID_BOUNDS_AT_ORIGIN.minY + GRID_OFFSET_Y,
  maxY: GRID_BOUNDS_AT_ORIGIN.maxY + GRID_OFFSET_Y,
}

const CONTENT_WIDTH = CAMERA_CONTENT_BOUNDS.maxX - CAMERA_CONTENT_BOUNDS.minX
const CONTENT_HEIGHT = CAMERA_CONTENT_BOUNDS.maxY - CAMERA_CONTENT_BOUNDS.minY

const getFitZoom = (viewport: Viewport): number => {
  // Smallest zoom that keeps the full grid visible.
  return Math.min(viewport.width / CONTENT_WIDTH, viewport.height / CONTENT_HEIGHT)
}

const getZoomLimits = (viewport: Viewport): { minZoom: number; maxZoom: number } => {
  const fitZoom = getFitZoom(viewport)
  // Prevent dezooming farther than the full-grid fit.
  const minZoom = Math.max(MIN_ZOOM, fitZoom)
  const maxZoom = Math.max(MAX_ZOOM, fitZoom)

  return { minZoom, maxZoom }
}

const clampCameraToWorld = (
  x: number,
  y: number,
  zoom: number,
  viewport: Viewport,
): { x: number; y: number } => {
  // Convert content bounds into screen-space for the current zoom,
  // then keep camera translation inside these limits.
  const scaledContentMinX = CAMERA_CONTENT_BOUNDS.minX * zoom
  const scaledContentMaxX = CAMERA_CONTENT_BOUNDS.maxX * zoom
  const scaledContentMinY = CAMERA_CONTENT_BOUNDS.minY * zoom
  const scaledContentMaxY = CAMERA_CONTENT_BOUNDS.maxY * zoom
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

export const PixiCanvas = () => {
  const cameraRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const zoomTargetRef = useRef(1)
  const zoomAnchorRef = useRef({ x: 0, y: 0, worldX: 0, worldY: 0, active: false })
  const zoomAnimationFrameRef = useRef<number | null>(null)
  const viewportRef = useRef({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })
  // no local viewportSize state needed; use viewportRef.current
  const dragRef = useRef({ active: false, x: 0, y: 0 })
  const containerRef = useRef<Container | null>(null)
  const didInitCameraRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const applyCamera = useCallback(() => {
    if (!containerRef.current) return

    containerRef.current.position.set(cameraRef.current.x, cameraRef.current.y)
    containerRef.current.scale.set(zoomRef.current)
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
    const fitZoom = getFitZoom(viewportRef.current)

    if (!didInitCameraRef.current) {
      // First mount: start on a full-grid framing.
      zoomRef.current = fitZoom
      zoomTargetRef.current = fitZoom
      didInitCameraRef.current = true
    }

    const zoomLimits = getZoomLimits(viewportRef.current)
    zoomRef.current = clamp(zoomRef.current, zoomLimits.minZoom, zoomLimits.maxZoom)
    zoomTargetRef.current = zoomRef.current

    const centeredX = centerX - (WORLD_WIDTH / 2) * zoomRef.current
    const centeredY = centerY - (WORLD_HEIGHT / 2) * zoomRef.current

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
      centerWorld()
    }
  }, [centerWorld])

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const zoomLimits = getZoomLimits(viewportRef.current)
    const oldZoom = zoomRef.current
    const zoomFactor = Math.exp(-event.deltaY * ZOOM_SENSITIVITY)
    const nextZoom = clamp(zoomTargetRef.current * zoomFactor, zoomLimits.minZoom, zoomLimits.maxZoom)

    if (nextZoom === zoomTargetRef.current) return

    const cursorX = event.clientX
    const cursorY = event.clientY
    // Keep the world point under the cursor fixed while zoom changes.
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

  const startPan = useCallback((event: FederatedPointerEvent) => {
    zoomAnchorRef.current.active = false
    stopZoomAnimation()
    zoomTargetRef.current = zoomRef.current

    dragRef.current.active = true
    dragRef.current.x = event.global.x
    dragRef.current.y = event.global.y
    setIsDragging(true)
  }, [stopZoomAnimation])

  const stopPan = useCallback(() => {
    dragRef.current.active = false
    setIsDragging(false)
  }, [])

  const updatePan = useCallback((event: FederatedPointerEvent) => {
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
  }, [applyCamera])

  useEffect(() => {
    centerWorld()

    const onResize = () => {
      // Preserve the world point currently at viewport center across resizes.
      const prevCenterX = viewportRef.current.width / 2
      const prevCenterY = viewportRef.current.height / 2
      const worldAtCenterX = (prevCenterX - cameraRef.current.x) / zoomRef.current
      const worldAtCenterY = (prevCenterY - cameraRef.current.y) / zoomRef.current

      viewportRef.current.width = window.innerWidth
      viewportRef.current.height = window.innerHeight

      const zoomLimits = getZoomLimits(viewportRef.current)
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
      <img src={layoutImg} alt="layout" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Application
          resizeTo={window}
          backgroundAlpha={0}
          resolution={window.devicePixelRatio || 1}
          autoDensity
          antialias={false}
          preference="webgl"
          powerPreference="high-performance"
        >
          {/* Removed internal pixiSprite so DOM image shows through the transparent canvas */}
          <pixiContainer
            ref={setContainer}
            eventMode="static"
            cursor={isDragging ? 'grabbing' : 'grab'}
            onPointerDown={startPan}
            onPointerMove={updatePan}
            onPointerUp={stopPan}
            onPointerUpOutside={stopPan}
            onPointerCancel={stopPan}
            onPointerLeave={stopPan}
          >
            <Background width={WORLD_WIDTH} height={WORLD_HEIGHT} />
            <Grid offsetX={GRID_OFFSET_X + GRID_NUDGE_X}
              offsetY={GRID_OFFSET_Y + GRID_NUDGE_Y}
            />
          </pixiContainer>
        </Application>
      </div>
    </div>
  )
}