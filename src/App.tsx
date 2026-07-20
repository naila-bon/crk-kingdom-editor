import { Box, IconButton, Text } from '@chakra-ui/react'
import { useCallback, useState } from 'react'
import { DecorBrowser } from './components/DecorBrowser'
import { PixiCanvas } from './components/Canvas/PixiCanvas'
import layoutImage from 'src/assets/crk_layout/crk_layout.png'
import { Eye, Plus, Minus, Undo2, Redo2 } from 'lucide-react'

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

  const handleHistoryChange = useCallback((info: HistoryInfo) => {
    setHistory(info)
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
      </Box>
      {/* Status banner, top center — reflects current mode. */}
      <Box
        position="absolute"
        top={4}
        left="50%"
        transform="translateX(-50%)"
        zIndex={3}
        pointerEvents="none"
        textAlign="center"
        px={4}
        py={2}
        rounded="full"
        bg="blackAlpha.700"
        border="1px solid"
        borderColor="whiteAlpha.300"
      >
        {selectedDecoration ? (
          <Text color="white" fontSize="sm" fontWeight="medium">
            Placing <Text as="span" color="cyan.300" fontWeight="bold">{selectedDecoration.name}</Text> — click the grid to place it, press{' '}
            <Text as="span" color="yellow.300" fontWeight="bold">Esc</Text> to stop
          </Text>
        ) : (
          <Text color="white" fontSize="sm" fontWeight="medium">
            Click a decor in the panel to select it, or click a placed decor on the grid to move or delete it
          </Text>
        )}
      </Box>

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
            w="420px"
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
          <Box position="absolute" top={3} right={3} zIndex={3} pointerEvents="auto">
            <IconButton aria-label="Open" size="sm" onClick={() => setSidebarOpen(true)}>
              <Eye />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default App