//app.tsx

import { Box, IconButton } from '@chakra-ui/react'
import { useState } from 'react'
import { DecorBrowser } from './components/DecorBrowser'
import { PixiCanvas } from './components/Canvas/PixiCanvas'
import layoutImage from 'src/assets/crk_layout/crk_layout.png'
import { Eye } from 'lucide-react'


type Decoration = {
  name: string
  theme: string
  size: string
  points: string
  note?: string
  color?: string
  imageUrl?: string
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedDecoration, setSelectedDecoration] = useState<Decoration | null>(null)
  const [browserOpen, setBrowserOpen] = useState(true)


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
        <PixiCanvas selectedDecoration={selectedDecoration} />
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
