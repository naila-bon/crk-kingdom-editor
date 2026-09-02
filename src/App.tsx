import { Box, IconButton, Text } from '@chakra-ui/react'
import { Box, Button, IconButton, Text } from '@chakra-ui/react'
import { useCallback, useRef, useState } from 'react'
import { DecorBrowser } from './components/DecorBrowser'
import { PixiCanvas } from './components/Canvas/PixiCanvas'
import layoutImage from 'src/assets/crk_layout/crk_layout.png'
import { Download, Eye, FileUp, Plus, Minus, Undo2, Redo2 } from 'lucide-react'
import { HelpDialog } from './components/HelpDialog'

type Decoration = {
  name: string
  theme: string
  size: string
  points: string
  note?: string
  color?: string
  imageUrl?: string
}

type HistoryInfo = {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedDecoration, setSelectedDecoration] = useState<Decoration | null>(null)
  const [history, setHistory] = useState<HistoryInfo | null>(null)
  const [zoomControls, setZoomControls] = useState<{ zoomIn: () => void; zoomOut: () => void } | null>(null)
  const [exportPng, setExportPng] = useState<(() => Promise<void>) | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportSvg, setExportSvg] = useState<(() => void) | null>(null)
  const [importSvg, setImportSvg] = useState<((content: string) => void) | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [exportLayout, setExportLayout] = useState<(() => Promise<void>) | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleHistoryChange = useCallback((info: HistoryInfo) => {
    setHistory(info)
  }, [])

  const handleExportSvgReady = useCallback((exporter: () => void) => {
    setExportSvg(() => exporter)
  }, [])

  const handleImportSvgReady = useCallback((importer: (content: string) => void) => {
    setImportSvg(() => importer)
  const handleExportReady = useCallback((exporter: () => Promise<void>) => {
    setExportPng((previous) => (previous === exporter ? previous : () => exporter()))
  }, [])

  const handleExportSvgReady = useCallback((exporter: () => void) => {
    setExportSvg((previous) => (previous === exporter ? previous : () => exporter()))
  }, [])

  const handleImportSvgReady = useCallback((importer: (content: string) => void) => {
    setImportSvg(() => importer)
  }, [])
  return (
    <Box
      position="relative"
      minH="100vh"
      overflow="hidden"
      bgImage={`url(${layoutImage})`}
      bgSize="contain"
      bgRepeat="no-repeat"
    >
      <Box
        data-map-area="true"
        position="absolute"
        minH="100vh"
        w="full"
        inset={0}
        overflow="hidden"
        zIndex={0}
      >
        <PixiCanvas
          selectedDecoration={selectedDecoration}
          onExitPlacementMode={() => setSelectedDecoration(null)}
          onHistoryChange={handleHistoryChange}
          onZoomControlsReady={setZoomControls}
          onExportSvgReady={handleExportSvgReady}
          onImportSvgReady={handleImportSvgReady}
          onExportReady={handleExportReady}
          onExportSvgReady={handleExportSvgReady}
          onImportSvgReady={handleImportSvgReady}
        />
      </Box>
  {/* Undo / Redo controls, top-left */}
      <Box position="absolute" top={4} left={4} zIndex={3} pointerEvents="auto">
        <IconButton
          aria-label="Undo"
          size="sm"
          mr={2}
          onClick={() => history?.undo()}
          disabled={!history?.canUndo}
        >
          <Undo2 />
        </IconButton>
        <IconButton
          aria-label="Redo"
          size="sm"
          onClick={() => history?.redo()}
          disabled={!history?.canRedo}
        >
          <Redo2 />
        </IconButton>
        <IconButton aria-label="Export layout as SVG" size="sm" onClick={() => exportSvg?.()} disabled={!exportSvg}>
          <Download />
        </IconButton>
        <IconButton
          aria-label="Import layout from SVG"
          size="sm"
          onClick={() => importInputRef.current?.click()}
          disabled={!importSvg}
        >
          <FileUp />
        </IconButton>
        <input
          ref={importInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file || !importSvg) return

            try {
              setImportError(null)
              importSvg(await file.text())
            } catch (error) {
              setImportError(error instanceof Error ? error.message : 'Impossible d’importer ce fichier SVG.')
            }
          }}
        />
        <IconButton
          aria-label="Export layout as PNG"
          size="sm"
          onClick={async () => {
            if (!exportLayout) return
            setIsExporting(true)
            try {
              await exportLayout()
            } finally {
              setIsExporting(false)
            }
          }}
          disabled={!exportLayout || isExporting}
        >
        <IconButton aria-label="Choose export format" size="sm" onClick={() => setExportDialogOpen(true)} disabled={!exportPng && !exportSvg}>
          <Download />
        </IconButton>
        <IconButton
          aria-label="Import layout from SVG"
          size="sm"
          onClick={() => importInputRef.current?.click()}
          disabled={!importSvg}
        >
          <FileUp />
        </IconButton>
        <input
          ref={importInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file || !importSvg) return

            try {
              setImportError(null)
              importSvg(await file.text())
            } catch (error) {
              setImportError(error instanceof Error ? error.message : 'Impossible d’importer ce fichier SVG.')
            }
          }}
        />
      </Box>
      {exportDialogOpen && (
        <Box
          position="fixed"
          inset={0}
          zIndex={20}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="blackAlpha.700"
          onClick={() => setExportDialogOpen(false)}
        >
          <Box
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-dialog-title"
            bg="gray.800"
            color="white"
            p={6}
            rounded="lg"
            minW={{ base: 'calc(100% - 32px)', sm: '360px' }}
            boxShadow="2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Text id="export-dialog-title" fontSize="lg" fontWeight="bold" mb={4}>
              Export layout
            </Text>
            <Box display="flex" gap={3} justifyContent="flex-end">
              <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  setExportDialogOpen(false)
                  await exportPng?.()
                }}
                disabled={!exportPng}
              >
                PNG
              </Button>
              <Button
                onClick={() => {
                  setExportDialogOpen(false)
                  exportSvg?.()
                }}
                disabled={!exportSvg}
              >
                SVG
              </Button>
            </Box>
          </Box>
        </Box>
      )}
      {importError && (
        <Text position="absolute" top={16} left={4} zIndex={3} color="red.200" fontSize="sm">
          {importError}
        </Text>
      )}
      {/* Help button, top-right (avant la sidebar, ou ajuste selon ton layout) */}
      <Box position="absolute" top={4} right={sidebarOpen ? 'calc(24rem + 16px)' : 16} zIndex={3} pointerEvents="auto">
        <HelpDialog />
      </Box>

      {/* Petit indicateur, seulement en mode placement */}
      {selectedDecoration && (
        <Box
          position="absolute"
          top={4}
          left="50%"
          transform="translateX(-50%)"
          zIndex={3}
          pointerEvents="none"
          px={3}
          py={1.5}
          rounded="full"
          bg="blackAlpha.700"
          border="1px solid"
          borderColor="whiteAlpha.300"
        >
          <Text color="white" fontSize="xs" fontWeight="medium">
            Placing <Text as="span" color="cyan.300" fontWeight="bold">{selectedDecoration.name}</Text> — <Text as="span" color="yellow.300" fontWeight="bold">Esc</Text> to stop
          </Text>
        </Box>
      )}

      <Box position="absolute" left={4} bottom={16} zIndex={3} pointerEvents="auto" display="flex" flexDirection="column" gap={2}>
        <IconButton
          aria-label="Zoom in"
          size="sm"
          onClick={() => zoomControls?.zoomIn()}
          disabled={!zoomControls}
        >
          <Plus />
        </IconButton>
        <IconButton
          aria-label="Zoom out"
          size="sm"
          onClick={() => zoomControls?.zoomOut()}
          disabled={!zoomControls}
        >
          <Minus />
        </IconButton>
      </Box>
      <Box position="relative" h="100vh" pointerEvents="none">
        {sidebarOpen ? (
          <Box
            data-sidebar="decor-browser"
            position="absolute"
            top={0}
            right={0}
            bottom={0}
            pointerEvents="auto"
            zIndex={2}
          >
            <DecorBrowser
              onClose={() => setSidebarOpen(false)}
              selectedDecorationName={selectedDecoration?.name ?? null}
              onSelectDecoration={setSelectedDecoration}
            />
          </Box>
        ) : (
          <Box position="absolute" top={4} right={4} zIndex={4} pointerEvents="auto">
            <IconButton  rounded={100} aria-label="Open" size="sm" onClick={() => setSidebarOpen(true)}>
              <Eye />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default App