import { Box, Button, CloseButton, Dialog, HStack, Text, VStack } from '@chakra-ui/react'
import { Download, FileImage, FileType } from 'lucide-react'

type ExportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExportPng: () => Promise<void>
  onExportSvg: () => void
  pngAvailable: boolean
  svgAvailable: boolean
}

export const ExportDialog = ({
  open,
  onOpenChange,
  onExportPng,
  onExportSvg,
  pngAvailable,
  svgAvailable,
}: ExportDialogProps) => {
  const exportPng = async () => {
    await onExportPng()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg="#252a43"
          color="white"
          w={{ base: '100vw', md: 'auto' }}
          h="auto"
          maxH="100dvh"
          maxW={{ base: '100vw', md: 'lg' }}
          rounded={{ base: 'none', md: '2xl' }}
          overflow="hidden"
          boxShadow="0 24px 80px rgba(0, 0, 0, .45)"
        >
          <Dialog.Header>
            <HStack gap={3}>
              <Box p={2} rounded="lg" bg="cyan.400" color="gray.900">
                <Download size={20} />
              </Box>
              <VStack align="flex-start" gap={0}>
                <Dialog.Title fontSize="lg">Export your layout</Dialog.Title>
                <Text fontSize="xs" color="whiteAlpha.600">Choose how you want to save your kingdom</Text>
              </VStack>
            </HStack>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body>
            <Box display="grid" gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
              <Button
                h="auto"
                minH="128px"
                p={4}
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                gap={4}
                variant="outline"
                borderColor="whiteAlpha.200"
                bg="whiteAlpha.050"
                _hover={{ borderColor: 'cyan.300', bg: 'cyan.900' }}
                disabled={!pngAvailable}
                onClick={exportPng}
              >
                <HStack w="full" justify="space-between">
                  <Box p={2} rounded="md" bg="orange.300" color="gray.900"><FileImage size={22} /></Box>
                  <Text fontSize="xs" fontWeight="bold" color="orange.200" letterSpacing="0.08em">IMAGE</Text>
                </HStack>
                <VStack w="full" align="flex-start" gap={1} textAlign="left">
                  <Text fontWeight="bold">PNG image</Text>
                  <Text fontSize="xs" color="whiteAlpha.700" fontWeight="normal">Full scene in high resolution</Text>
                </VStack>
              </Button>
              <Button
                h="auto"
                minH="128px"
                p={4}
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                gap={4}
                variant="outline"
                borderColor="whiteAlpha.200"
                bg="whiteAlpha.050"
                _hover={{ borderColor: 'cyan.300', bg: 'cyan.900' }}
                disabled={!svgAvailable}
                onClick={() => {
                  onExportSvg()
                  onOpenChange(false)
                }}
              >
                <HStack w="full" justify="space-between">
                  <Box p={2} rounded="md" bg="cyan.300" color="gray.900"><FileType size={22} /></Box>
                  <Text fontSize="xs" fontWeight="bold" color="cyan.200" letterSpacing="0.08em">BACKUP</Text>
                </HStack>
                <VStack w="full" align="flex-start" gap={1} textAlign="left">
                  <Text fontWeight="bold">SVG layout</Text>
                  <Text fontSize="xs" color="whiteAlpha.700" fontWeight="normal">Editable file for later import</Text>
                </VStack>
              </Button>
            </Box>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}