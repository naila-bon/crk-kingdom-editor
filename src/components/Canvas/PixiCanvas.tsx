//pixiCanvas.tsx
import { Application, extend, useApplication } from '@pixi/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Assets,
  Container,
  Graphics,
  Sprite as PixiSprite,
  Point,
  Rectangle,
  Texture,
  type Application as PixiApplication,
  type FederatedPointerEvent,
} from 'pixi.js'
import layoutImg from '../../assets/crk_layout/crk_layout.png'
import { Grid, isFootprintInMask } from './Grid'
import { DecorationsLayer } from './DecorationsLayer'
import type { PlacedDecoration } from '../../types/decorations'
import { TILE_HEIGHT, TILE_WIDTH, getSmallTileGeometry, TINY_PER_SMALL } from '@/utils/gridUtils'
import { HoverHighlight } from './HoverHighlight'
import { useHistoryState } from '../../hooks/useHistoryState'
import { useKingdomStore } from '../../store/kingdomStore'
import { createLayoutSvg, downloadTextFile, getLayoutSvgFilename, parseLayoutSvg } from '../../utils/layoutSvg'
import { downloadCanvasAsPng, getLayoutExportFilename } from '../../utils/exportLayout'
import { downloadCanvasAsPng, getLayoutPngFilename } from '../../utils/exportLayout'
import { createLayoutSvg, downloadTextFile, getLayoutSvgFilename, parseLayoutSvg } from '../../utils/layoutSvg'

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

const CLICK_MOVE_THRESHOLD = 10
const ZOOM_BUTTON_STEP = 0.15
const EXPORT_RESOLUTION = 2

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

const getContentBounds = (viewport: Viewport, layout?: CoverLayout, tex?: Texture): Bounds => {
  if (layout && tex) {
    const contentWidth = tex.width * layout.scale
    const contentHeight = tex.height * layout.scale
    const contentMinX = layout.centerX - contentWidth / 2
    const contentMinY = layout.centerY - contentHeight / 2

    return {
      minX: contentMinX,
      maxX: contentMinX + contentWidth,
      minY: contentMinY,
      maxY: contentMinY + contentHeight,
    }
  }

  return {
    minX: 0,
    maxX: viewport.width,
    minY: 0,
    maxY: viewport.height,
  }
}

const getZoomLimits = (): { minZoom: number; maxZoom: number } => ({
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
})

const clampCameraToWorld = (
  x: number,
  y: number,
  zoom: number,
  viewport: Viewport,
  layout?: CoverLayout,
  tex?: Texture,
): { x: number; y: number } => {
  const bounds = getContentBounds(viewport, layout, tex)
  const scaledMinX = bounds.minX * zoom
  const scaledMaxX = bounds.maxX * zoom
  const scaledMinY = bounds.minY * zoom
  const scaledMaxY = bounds.maxY * zoom

  const minCameraX = viewport.width - scaledMaxX
  const maxCameraX = -scaledMinX
  const minCameraY = viewport.height - scaledMaxY
  const maxCameraY = -scaledMinY

  const boundedX = minCameraX > maxCameraX ? (minCameraX + maxCameraX) / 2 : clamp(x, minCameraX, maxCameraX)
  const boundedY = minCameraY > maxCameraY ? (minCameraY + maxCameraY) / 2 : clamp(y, minCameraY, maxCameraY)

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
  onExitPlacementMode?: () => void
  onHistoryChange?: (info: {
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
  }) => void
  onZoomControlsReady?: (controls: { zoomIn: () => void; zoomOut: () => void }) => void
  onExportSvgReady?: (exportLayout: () => void) => void
  onImportSvgReady?: (importLayout: (content: string) => void) => void
}

export const PixiCanvas = ({ selectedDecoration, onExitPlacementMode, onHistoryChange, onZoomControlsReady, onExportSvgReady, onImportSvgReady }: PixiCanvasProps) => {
  onExportReady?: (exportLayout: () => Promise<void>) => void
  onExportSvgReady?: (exportLayout: () => void) => void
  onImportSvgReady?: (importLayout: (content: string) => void) => void
}

const ApplicationBridge = ({ onReady }: { onReady: (app: PixiApplication) => void }) => {
  const { app } = useApplication()

  useEffect(() => {
    onReady(app)
  }, [app, onReady])

  return null
}

export const PixiCanvas = ({ selectedDecoration, onExitPlacementMode, onHistoryChange, onZoomControlsReady, onExportReady, onExportSvgReady, onImportSvgReady }: PixiCanvasProps) => {
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
  const [application, setApplication] = useState<PixiApplication | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

const persistedItems = useKingdomStore((state) => state.items)
const loadLayout = useKingdomStore((state) => state.loadLayout)
const hasHydratedLayoutRef = useRef(false)

const {
  state: placedDecorations,
  setLive: setPlacedDecorationsLive,
  commit: commitPlacedDecorations,
  beginInteraction: beginDecorInteraction,
  commitInteraction: commitDecorInteraction,
  cancelInteraction: cancelDecorInteraction,
  replace: replaceDecorations,
  undo: undoDecorations,
  redo: redoDecorations,
  canUndo,
  canRedo,
} = useHistoryState<PlacedDecoration[]>([])

useEffect(() => {
  if (hasHydratedLayoutRef.current) return

  if (persistedItems.length > 0) {
    setPlacedDecorationsLive(persistedItems)
  }

  hasHydratedLayoutRef.current = true
}, [persistedItems, setPlacedDecorationsLive])

useEffect(() => {
  if (!hasHydratedLayoutRef.current) return
  loadLayout(placedDecorations)
}, [placedDecorations, loadLayout])

useEffect(() => {
  onHistoryChange?.({ undo: undoDecorations, redo: redoDecorations, canUndo, canRedo })
}, [onHistoryChange, undoDecorations, redoDecorations, canUndo, canRedo])

  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null)
  const [selectedPlacedId, setSelectedPlacedId] = useState<string | null>(null)
  const draggingPlacedRef = useRef<{ id: string; moved: boolean } | null>(null)

  useEffect(() => {
    Assets.load(layoutImg).then((tex: Texture) => setBgTexture(tex))
  }, [])

  const screenToGridCoords = useCallback(
    (globalX: number, globalY: number, offsetX: number, offsetY: number, scale: number) => {
      if (!containerRef.current) return null
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

  const coverLayout = useMemo(
    () => (bgTexture ? getCoverLayout(viewportSize, bgTexture) : null),
    [bgTexture, viewportSize],
  )

  const { smallScale, smallTileWidth, smallTileHeight } = coverLayout
    ? getSmallTileGeometry(coverLayout.scale)
    : { smallScale: 0, smallTileWidth: 0, smallTileHeight: 0 }

  const applyCamera = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.position.set(cameraRef.current.x, cameraRef.current.y)
      containerRef.current.scale.set(zoomRef.current)
    }
  }, [])

  const clampZoom = useCallback((zoom: number) => {
    const zoomLimits = getZoomLimits()
    return clamp(zoom, zoomLimits.minZoom, zoomLimits.maxZoom)
  }, [])

  const setCamera = useCallback((x: number, y: number, zoom = zoomRef.current) => {
    cameraRef.current.x = x
    cameraRef.current.y = y
    zoomRef.current = clampZoom(zoom)
    zoomTargetRef.current = zoomRef.current
    applyCamera()
  }, [applyCamera, clampZoom])

  const getViewportCenterWorld = useCallback(() => {
    const centerX = viewportRef.current.width / 2
    const centerY = viewportRef.current.height / 2
    return {
      centerX,
      centerY,
      worldX: (centerX - cameraRef.current.x) / zoomRef.current,
      worldY: (centerY - cameraRef.current.y) / zoomRef.current,
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
      coverLayout ?? undefined,
      bgTexture ?? undefined,
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
        coverLayout ?? undefined,
        bgTexture ?? undefined,
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

  const zoomTo = useCallback((nextZoom: number) => {
    const targetZoom = clampZoom(nextZoom)
    if (targetZoom === zoomRef.current && targetZoom === zoomTargetRef.current) {
      return
    }

    const { centerX, centerY, worldX, worldY } = getViewportCenterWorld()
    zoomAnchorRef.current = {
      x: centerX,
      y: centerY,
      worldX,
      worldY,
      active: true,
    }
    zoomTargetRef.current = targetZoom
    scheduleZoomAnimation()
  }, [clampZoom, getViewportCenterWorld, scheduleZoomAnimation])

  const zoomIn = useCallback(() => zoomTo(zoomRef.current + ZOOM_BUTTON_STEP), [zoomTo])
  const zoomOut = useCallback(() => zoomTo(zoomRef.current - ZOOM_BUTTON_STEP), [zoomTo])

  const exportSvg = useCallback(() => {
    if (!bgTexture) return
    const svg = createLayoutSvg(placedDecorations, layoutImg)
    downloadTextFile(svg, getLayoutSvgFilename(), 'image/svg+xml')
  }, [bgTexture, placedDecorations])

  const importSvg = useCallback((content: string) => {
    const items = parseLayoutSvg(content)
    replaceDecorations(items)
    setSelectedPlacedId(null)
    onExitPlacementMode?.()
  }, [onExitPlacementMode, replaceDecorations])

  useEffect(() => {
    onExportSvgReady?.(exportSvg)
  }, [exportSvg, onExportSvgReady])

  useEffect(() => {
    onImportSvgReady?.(importSvg)
  }, [importSvg, onImportSvgReady])
  const exportLayout = useCallback(async () => {
    const container = containerRef.current
    if (!application || !container || !coverLayout || !bgTexture) {
      throw new Error('La scène Pixi n’est pas prête à être exportée.')
    }

    setIsExporting(true)
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

    const previousX = container.position.x
    const previousY = container.position.y
    const previousScaleX = container.scale.x
    const previousScaleY = container.scale.y
    const contentWidth = bgTexture.width * coverLayout.scale
    const contentHeight = bgTexture.height * coverLayout.scale
    const contentX = coverLayout.centerX - contentWidth / 2
    const contentY = coverLayout.centerY - contentHeight / 2

    try {
      container.position.set(0, 0)
      container.scale.set(1)

      const canvas = application.renderer.extract.canvas({
        target: container,
        frame: new Rectangle(contentX, contentY, contentWidth, contentHeight),
        resolution: EXPORT_RESOLUTION / coverLayout.scale,
        antialias: true,
      })

      await downloadCanvasAsPng(canvas, getLayoutPngFilename())
    } finally {
      container.position.set(previousX, previousY)
      container.scale.set(previousScaleX, previousScaleY)
      setIsExporting(false)
    }
  }, [application, bgTexture, coverLayout])

  useEffect(() => {
    onExportReady?.(exportLayout)
  }, [exportLayout, onExportReady])
  const exportSvg = useCallback(() => {
    if (!bgTexture) return
    const svg = createLayoutSvg(placedDecorations, layoutImg)
    downloadTextFile(svg, getLayoutSvgFilename(), 'image/svg+xml')
  }, [bgTexture, placedDecorations])

  const importSvg = useCallback((content: string) => {
    const items = parseLayoutSvg(content)
    replaceDecorations(items)
    setSelectedPlacedId(null)
    onExitPlacementMode?.()
  }, [onExitPlacementMode, replaceDecorations])

  useEffect(() => {
    onExportSvgReady?.(exportSvg)
  }, [exportSvg, onExportSvgReady])

  useEffect(() => {
    onImportSvgReady?.(importSvg)
  }, [importSvg, onImportSvgReady])

  useEffect(() => {
    onZoomControlsReady?.({ zoomIn, zoomOut })
  }, [onZoomControlsReady, zoomIn, zoomOut])

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

    const centeredX = coverLayout
      ? centerX - coverLayout.centerX * zoomRef.current
      : centerX - (viewportRef.current.width / 2) * zoomRef.current
    const centeredY = coverLayout
      ? centerY - coverLayout.centerY * zoomRef.current
      : centerY - (viewportRef.current.height / 2) * zoomRef.current

    const bounded = clampCameraToWorld(
      centeredX,
      centeredY,
      zoomRef.current,
      viewportRef.current,
      coverLayout ?? undefined,
      bgTexture ?? undefined,
    )

    cameraRef.current.x = bounded.x
    cameraRef.current.y = bounded.y

    applyCamera()
  }, [applyCamera, bgTexture, coverLayout])

  const setContainer = useCallback((node: Container | null) => {
    containerRef.current = node

    if (node) {
      node.hitArea = new Rectangle(0, 0, viewportRef.current.width, viewportRef.current.height)
      centerWorld()
    }
  }, [centerWorld])

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    stopZoomAnimation()

    const zoomLimits = getZoomLimits()
    const oldZoom = zoomRef.current
    const zoomFactor = Math.exp(-event.deltaY * ZOOM_SENSITIVITY)
    const nextZoom = clamp(zoomRef.current * zoomFactor, zoomLimits.minZoom, zoomLimits.maxZoom)

    if (nextZoom === zoomRef.current) return

    const cursorX = event.clientX
    const cursorY = event.clientY
    const worldX = (cursorX - cameraRef.current.x) / oldZoom
    const worldY = (cursorY - cameraRef.current.y) / oldZoom

    const candidateX = cursorX - worldX * nextZoom
    const candidateY = cursorY - worldY * nextZoom

    const bounded = clampCameraToWorld(
      candidateX,
      candidateY,
      nextZoom,
      viewportRef.current,
      coverLayout ?? undefined,
      bgTexture ?? undefined,
    )

    cameraRef.current.x = bounded.x
    cameraRef.current.y = bounded.y
    zoomRef.current = nextZoom
    zoomTargetRef.current = nextZoom
    zoomAnchorRef.current.active = false

    applyCamera()
  }, [applyCamera, stopZoomAnimation, coverLayout, bgTexture])

  const parseSizeToSmallTiles = useCallback((size: string): number => {
    const match = size.match(/(\d+(?:\.\d+)?)/)
    const parsed = match ? parseFloat(match[1]) : NaN
    const sizeInTiny = Number.isFinite(parsed) && parsed > 0 ? parsed : 4

    return sizeInTiny / TINY_PER_SMALL
  }, [])

  const handlePlaceClick = useCallback((globalX: number, globalY: number) => {
    setSelectedPlacedId(null)
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

    commitPlacedDecorations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: selectedDecoration.name,
        col: coords.col,
        row: coords.row,
        widthInSmallTiles: sizeInSmallTiles,
      },
    ])
  }, [coverLayout, screenToGridCoords, selectedDecoration, smallScale, parseSizeToSmallTiles, commitPlacedDecorations])

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
    if (draggingPlacedRef.current) {
      const { id, moved } = draggingPlacedRef.current
      draggingPlacedRef.current = null

      if (!moved) {
        cancelDecorInteraction()
        return
      }

      const deco = placedDecorations.find((d) => d.id === id)
      if (deco && !isFootprintInMask(deco.col, deco.row, deco.widthInSmallTiles)) {
        cancelDecorInteraction()
        setPlacedDecorationsLive((prev) => prev.filter((d) => d.id !== id))
        return
      }

      commitDecorInteraction()
      return
    }

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
  }, [handlePlaceClick, placedDecorations, cancelDecorInteraction, commitDecorInteraction, setPlacedDecorationsLive])

  const updatePan = useCallback((event: FederatedPointerEvent) => {
    updateHover(event.global.x, event.global.y)

    if (draggingPlacedRef.current && coverLayout) {
      draggingPlacedRef.current.moved = true

      const coords = screenToGridCoords(
        event.global.x,
        event.global.y,
        coverLayout.anchorWorldX,
        coverLayout.anchorWorldY,
        smallScale,
      )
      if (!coords) return

      setPlacedDecorationsLive((prev) =>
        prev.map((deco) =>
          deco.id === draggingPlacedRef.current?.id
            ? { ...deco, col: coords.col, row: coords.row }
            : deco,
        ),
      )
      return
    }

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
      coverLayout ?? undefined,
      bgTexture ?? undefined,
    )

    cameraRef.current.x = bounded.x
    cameraRef.current.y = bounded.y

    applyCamera()
  }, [applyCamera, updateHover, coverLayout, screenToGridCoords, smallScale, setPlacedDecorationsLive])

  const handlePointerLeave = useCallback((event: FederatedPointerEvent) => {
    stopPan(event)
    setHoverCell(null)
  }, [stopPan])

  const handleSelectPlaced = useCallback((id: string) => {
    setSelectedPlacedId(id)
  }, [])

  const handleDeletePlaced = useCallback((id: string) => {
    commitPlacedDecorations((prev) => prev.filter((d) => d.id !== id))
    setSelectedPlacedId(null)
  }, [commitPlacedDecorations])

  const handleDragStartPlaced = useCallback((id: string) => {
    dragRef.current.active = false
    draggingPlacedRef.current = { id, moved: false }
    beginDecorInteraction()
  }, [beginDecorInteraction])

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
        coverLayout ?? undefined,
        bgTexture ?? undefined,
      )

      cameraRef.current.x = bounded.x
      cameraRef.current.y = bounded.y

      applyCamera()
    }

    const wrapper = wrapperRef.current
    if (wrapper) {
      wrapper.addEventListener('wheel', handleWheel, { passive: false })
    }

    window.addEventListener('resize', onResize)
    return () => {
      stopZoomAnimation()
      window.removeEventListener('resize', onResize)
      if (wrapper) {
        wrapper.removeEventListener('wheel', handleWheel)
      }
    }
  }, [applyCamera, centerWorld, stopZoomAnimation, handleWheel, coverLayout, bgTexture])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.ctrlKey || event.metaKey

      if (isMeta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redoDecorations()
        } else {
          undoDecorations()
        }
        return
      }

      if (isMeta && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redoDecorations()
        return
      }

      const panStep = 40
      const zoomStep = 0.1
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const bounded = clampCameraToWorld(
      cameraRef.current.x,
      cameraRef.current.y + panStep,
      zoomRef.current,
      viewportRef.current,
      coverLayout ?? undefined,
      bgTexture ?? undefined,
    )
        setCamera(bounded.x, bounded.y)
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const bounded = clampCameraToWorld(
      cameraRef.current.x,
      cameraRef.current.y - panStep,
      zoomRef.current,
      viewportRef.current,
      coverLayout ?? undefined,
      bgTexture ?? undefined,
    )
        setCamera(bounded.x, bounded.y)
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const bounded = clampCameraToWorld(
      cameraRef.current.x + panStep,
      cameraRef.current.y,
      zoomRef.current,
      viewportRef.current,
      coverLayout ?? undefined,
      bgTexture ?? undefined,
    )
        setCamera(bounded.x, bounded.y)
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        const bounded = clampCameraToWorld(
      cameraRef.current.x - panStep,
      cameraRef.current.y,
      zoomRef.current,
      viewportRef.current,
      coverLayout ?? undefined,
      bgTexture ?? undefined,
    )
        setCamera(bounded.x, bounded.y)
        return
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        setCamera(cameraRef.current.x, cameraRef.current.y, clampZoom(zoomRef.current + zoomStep))
        return
      }
      if (event.key === '-') {
        event.preventDefault()
        setCamera(cameraRef.current.x, cameraRef.current.y, clampZoom(zoomRef.current - zoomStep))
        return
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedPlacedId) {
        commitPlacedDecorations((prev) => prev.filter((d) => d.id !== selectedPlacedId))
        setSelectedPlacedId(null)
      }
      if (event.key === 'Escape') {
        setSelectedPlacedId(null)
        onExitPlacementMode?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPlacedId, commitPlacedDecorations, undoDecorations, redoDecorations, onExitPlacementMode])

  return (
    <div
      ref={wrapperRef}
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
        <ApplicationBridge onReady={setApplication} />
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
                selectedPlacedId={isExporting ? null : selectedPlacedId}
                onSelectPlaced={handleSelectPlaced}
                onDragStart={handleDragStartPlaced}
                onDeletePlaced={handleDeletePlaced}
                interactive={!selectedDecoration && !isExporting}
              />
            </>
          )}
          {coverLayout && selectedDecoration && !isExporting && (
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
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
        </div>
      </div>
    </div>
  )
}