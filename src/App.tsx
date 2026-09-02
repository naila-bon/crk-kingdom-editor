import { Box, IconButton, Text } from '@chakra-ui/react'
import { useCallback, useRef, useState } from 'react'
import { Download, Eye, FileUp, Minus, Plus, Redo2, Undo2 } from 'lucide-react'
import { DecorBrowser } from './components/DecorBrowser'
import { ExportDialog } from './components/ExportDialog'
import { HelpDialog } from './components/HelpDialog'
import { ExportDialog } from './components/ExportDialog'
import { PixiCanvas } from './components/Canvas/PixiCanvas'
import layoutImage from 'src/assets/crk_layout/crk_layout.png'

type Decoration = { name: string; theme: string; size: string; points: string; note?: string; color?: string; imageUrl?: string }
type HistoryInfo = { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedDecoration, setSelectedDecoration] = useState<Decoration | null>(null)
  const [history, setHistory] = useState<HistoryInfo | null>(null)
  const [zoomControls, setZoomControls] = useState<{ zoomIn: () => void; zoomOut: () => void } | null>(null)
  const [exportPng, setExportPng] = useState<(() => Promise<void>) | null>(null)
  const [exportSvg, setExportSvg] = useState<(() => void) | null>(null)
  const [importSvg, setImportSvg] = useState<((content: string) => void) | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const handleHistoryChange = useCallback((info: HistoryInfo) => {
    setHistory((previous) => {
      if (previous && previous.undo === info.undo && previous.redo === info.redo && previous.canUndo === info.canUndo && previous.canRedo === info.canRedo) {
        return previous
      }
      return info
    })
  }, [])
  const handleZoomControlsReady = useCallback((controls: { zoomIn: () => void; zoomOut: () => void }) => {
    setZoomControls((previous) => {
      if (previous && previous.zoomIn === controls.zoomIn && previous.zoomOut === controls.zoomOut) {
        return previous
      }
      return controls
    })
  }, [])
  const handleExportReady = useCallback((exporter: () => Promise<void>) => setExportPng(() => exporter), [])
  const handleExportSvgReady = useCallback((exporter: () => void) => setExportSvg(() => exporter), [])
  const handleImportSvgReady = useCallback((importer: (content: string) => void) => setImportSvg(() => importer), [])

  return (
    <Box position="relative" minH="100vh" overflow="hidden" bgImage={`url(${layoutImage})`} bgSize="contain" bgRepeat="no-repeat">
      <Box data-map-area="true" position="absolute" inset={0} overflow="hidden" zIndex={0}>
        <PixiCanvas selectedDecoration={selectedDecoration} onExitPlacementMode={() => setSelectedDecoration(null)} onHistoryChange={handleHistoryChange} onZoomControlsReady={handleZoomControlsReady} onExportReady={handleExportReady} onExportSvgReady={handleExportSvgReady} onImportSvgReady={handleImportSvgReady} />
      </Box>
      <Box position="absolute" top={4} left={4} zIndex={3} display="flex" gap={2} pointerEvents="auto">
        <IconButton aria-label="Undo" size="sm" onClick={() => history?.undo()} disabled={!history?.canUndo}><Undo2 /></IconButton>
        <IconButton aria-label="Redo" size="sm" onClick={() => history?.redo()} disabled={!history?.canRedo}><Redo2 /></IconButton>
        <IconButton aria-label="Choose export format" size="sm" onClick={() => setExportDialogOpen(true)} disabled={!exportPng && !exportSvg}><Download /></IconButton>
        <IconButton aria-label="Import layout from SVG" size="sm" onClick={() => importInputRef.current?.click()} disabled={!importSvg}><FileUp /></IconButton>
        <input ref={importInputRef} type="file" accept=".svg,image/svg+xml" hidden onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file || !importSvg) return; try { setImportError(null); importSvg(await file.text()) } catch (error) { setImportError(error instanceof Error ? error.message : 'Impossible d’importer ce fichier SVG.') } }} />
      </Box>
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExportPng={async () => { await exportPng?.() }}
        onExportSvg={() => exportSvg?.()}
        pngAvailable={Boolean(exportPng)}
        svgAvailable={Boolean(exportSvg)}
      />
      {importError && <Text position="absolute" top={16} left={4} zIndex={3} color="red.200" fontSize="sm">{importError}</Text>}
      <Box position="absolute" top={4} right={sidebarOpen ? 'calc(24rem + 16px)' : 16} zIndex={3} pointerEvents="auto"><HelpDialog /></Box>
      {selectedDecoration && <Box position="absolute" top={4} left="50%" transform="translateX(-50%)" zIndex={3} pointerEvents="none" px={3} py={1.5} rounded="full" bg="blackAlpha.700"><Text color="white" fontSize="xs">Placing <Text as="span" color="cyan.300" fontWeight="bold">{selectedDecoration.name}</Text> - <Text as="span" color="yellow.300" fontWeight="bold">Esc</Text> to stop</Text></Box>}
      <Box position="absolute" left={4} bottom={16} zIndex={3} display="flex" flexDirection="column" gap={2} pointerEvents="auto"><IconButton aria-label="Zoom in" size="sm" onClick={() => zoomControls?.zoomIn()} disabled={!zoomControls}><Plus /></IconButton><IconButton aria-label="Zoom out" size="sm" onClick={() => zoomControls?.zoomOut()} disabled={!zoomControls}><Minus /></IconButton></Box>
      <Box position="relative" h="100dvh" pointerEvents="none">{sidebarOpen ? <Box position="absolute" top={0} right={0} bottom={0} left={{ base: 0, md: 'auto' }} pointerEvents="auto" zIndex={5}><DecorBrowser onClose={() => setSidebarOpen(false)} selectedDecorationName={selectedDecoration?.name ?? null} onSelectDecoration={setSelectedDecoration} /></Box> : <Box position="absolute" top={4} right={4} zIndex={4} pointerEvents="auto"><IconButton aria-label="Open" size="sm" onClick={() => setSidebarOpen(true)}><Eye /></IconButton></Box>}</Box>
    </Box>
  )
}

export default App
