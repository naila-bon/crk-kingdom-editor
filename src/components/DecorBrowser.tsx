//decorBrowser.tsx
import { useState } from 'react'

import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Image,
  Stack,
  Text,
  VStack,
  SimpleGrid,
  IconButton,
} from '@chakra-ui/react'
import decorations from '../../scripts/crk_decors_avec_noms_843.json'
import { EyeClosed } from 'lucide-react'

type Decoration = {
  name: string
  theme: string
  size: string
  points: string
  note?: string
  color?: string
  imageUrl?: string
}

const items = decorations as unknown as Decoration[]

const categories = Array.from(new Set(items.map((item) => item.theme))).sort((left, right) =>
  left.localeCompare(right),
)

type DecorBrowserProps = {
  onClose?: () => void
  // Nom de la décoration actuellement sélectionnée (pour l'affichage en
  // surbrillance), contrôlé par le parent.
  selectedDecorationName?: string | null
  // Appelé quand l'utilisateur clique sur une décoration pour la sélectionner
  // (prête à être posée sur la grille).
  onSelectDecoration?: (decoration: Decoration) => void
}

export function DecorBrowser({ onClose, selectedDecorationName, onSelectDecoration }: DecorBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState('')

  const filteredDecorations = selectedCategory
    ? items.filter((item) => item.theme === selectedCategory)
    : []

  return (
    <Box
      w="full"
      h="full"
      position="relative"
      color="white"
      p={4}
      overflow="hidden"
    >
      {onClose ? (
        <IconButton aria-label="Close" position="absolute" top={6} right={6} size="sm" zIndex={5} onClick={onClose}><EyeClosed /></IconButton>
      ) : null}
      <Stack direction="column" gap={4} h="full" >
        { ! selectedCategory ? (
          <Box
            w="full"
            rounded="3xl"
            border="1px solid"
            borderColor="whiteAlpha.200"
            bg="rgba(11, 15, 23, 1)"
            p={5}
            shadow="xl"
          >
            <VStack align="stretch" gap={4}>
              <Box>
                <Heading size="lg">Collections</Heading>
                <Text color="whiteAlpha.700" mt={1}>
                  Click on a collection to display the associated decorations.
                </Text>
              </Box>

              <VStack align="stretch" gap={2} maxH="80vh" overflowY="auto" pr={1} minW={0}>
                {categories.map((category) => {
                  const isActive = category === selectedCategory

                  return (
                    <Button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                      }}
                      justifyContent="space-between"
                      variant={isActive ? 'solid' : 'subtle'}
                      colorPalette={isActive ? 'cyan' : 'gray'}
                      size="lg"
                      rounded="2xl"
                      fontWeight="semibold"
                      bg={isActive ? 'cyan.500' : 'whiteAlpha.100'}
                      _hover={{ bg: isActive ? 'cyan.400' : 'whiteAlpha.200' }}
                    >
                      {category}
                      <Badge ml={3} colorPalette={isActive ? 'cyan' : 'gray'}>
                        {items.filter((item) => item.theme === category).length}
                      </Badge>
                    </Button>
                  )
                })}
              </VStack>
            </VStack>
          </Box>
        ): null}  

        <Box flex="1" minW={0}             
            w="full"
            rounded="3xl"
            border="1px solid"
            borderColor="whiteAlpha.200"
            bg="rgba(11, 15, 23, 1)"
            p={5}
            shadow="xl">
          { selectedCategory ? (
            <>
              <HStack mb={4} gap={3} align="center" >
                <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory('') }}>
                  Collections
                </Button>
                <Text color="whiteAlpha.500">›</Text>
                <Heading size="md">{selectedCategory}</Heading>
              </HStack>

              <HStack justify="space-between" align="center" mb={5}>
                <Box>
                  <Heading size="2xl">{selectedCategory}</Heading>
                  <Text color="whiteAlpha.700" mt={1}>
                    {filteredDecorations.length} decoration{filteredDecorations.length > 1 ? 's' : ''} found
                  </Text>
                </Box>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} maxH="80vh" overflowY="auto" pr={1} >
                {filteredDecorations.map((decoration) => {
                  const isSelected = decoration.name === selectedDecorationName

                  return (
                    <Box
                      key={`${decoration.theme}-${decoration.name}`}
                      role="button"
                      tabIndex={0}
                      cursor="pointer"
                      onClick={() => onSelectDecoration?.(decoration)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onSelectDecoration?.(decoration)
                      }}
                      rounded="2xl"
                      border="2px solid"
                      borderColor={isSelected ? 'cyan.400' : 'whiteAlpha.200'}
                      bg={isSelected ? 'cyan.900' : 'whiteAlpha.100'}
                      overflow="hidden"
                      shadow={isSelected ? 'dark-lg' : 'lg'}
                      transition="border-color 0.15s, background 0.15s"
                      _hover={{ borderColor: isSelected ? 'cyan.400' : 'whiteAlpha.400' }}
                    >
                      <Box aspectRatio={1} bg="blackAlpha.300" position="relative">
                        {decoration.imageUrl ? (
                          <Image src={decoration.imageUrl} alt={decoration.name} objectFit="contain" w="full" h="full" />
                        ) : null}
                        {isSelected ? (
                          <Badge position="absolute" top={2} right={2} colorPalette="cyan">
                            Selected
                          </Badge>
                        ) : null}
                      </Box>

                      <VStack align="stretch" gap={3} p={4}>
                        <Box>
                          <Heading size="md">{decoration.name}</Heading>
                          <Text color="whiteAlpha.700" fontSize="sm">
                            {decoration.theme}
                          </Text>
                        </Box>

                        <HStack wrap="wrap" gap={2}>
                          <Badge colorPalette="cyan">{decoration.size}</Badge>
                          <Badge colorPalette="orange">{decoration.points} pts</Badge>
                          {decoration.color ? <Badge colorPalette="purple">{decoration.color}</Badge> : null}
                        </HStack>

                        {decoration.note ? (
                          <Text fontSize="sm" color="whiteAlpha.700">
                            {decoration.note}
                          </Text>
                        ) : null}
                      </VStack>
                    </Box>
                  )
                })}
              </SimpleGrid>
            </>
          ) : null}
        </Box>
      </Stack>
    </Box>
  )
}