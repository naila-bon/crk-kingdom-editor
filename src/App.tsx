import { Box } from '@chakra-ui/react'
import { DecorBrowser } from './components/DecorBrowser'
import { PixiCanvas } from './components/Canvas/PixiCanvas'
import layoutImage from './assets/crk_layout/crk_layout.png'

function App() {

  return (
    <Box
      position="relative"
      minH="100vh"
      overflow="hidden"
      bgImage={`url(${layoutImage})`}
      bgSize="contain"
      bgRepeat="no-repeat"
    >
      <PixiCanvas />

      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        display="flex"
        alignItems="stretch"
      >
        <Box w={{ base: 'full', md: '420px' }} pointerEvents="auto" h="full">
          <DecorBrowser />
        </Box>
      </Box>
    </Box>
  )
}

export default App
