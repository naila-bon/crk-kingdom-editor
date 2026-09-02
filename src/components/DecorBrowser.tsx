import { useMemo, useState } from 'react'

import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'

import { EyeClosed, ArrowLeft } from 'lucide-react'

import decorations from '../../scripts/decorations.json'

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

const categories = Array.from(
  new Set(items.map((item) => item.theme)),
).sort((a, b) => a.localeCompare(b))

const panelBg = '#2e334e'
const surfaceBg = '#3d466a'
const surfaceHoverBg = '#364075'
const overlayBg = 'rgba(22, 28, 55, 0.50)'
const cardSelectedBg = 'rgba(61, 70, 106, 0.96)'
const controlBg = 'rgba(20, 28, 55, 0.88)'


type DecorBrowserProps = {
  onClose?: () => void

  selectedDecorationName?: string | null

  onSelectDecoration?: (decoration: Decoration | null) => void
}


export function DecorBrowser({
  onClose,
  selectedDecorationName,
  onSelectDecoration,
}: DecorBrowserProps) {

  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')

  const categoryItems = useMemo(() => {
    return categories.map((category) => {
      const decorations = items.filter(
        (item) => item.theme === category,
      )

      return {
        name: category,
        count: decorations.length,
        preview: decorations.find(
          (d) => d.imageUrl,
        )?.imageUrl,
      }
    })
  }, [])

  const filteredCategoryItems = useMemo(() => {
    if (!search) {
      return categoryItems
    }

    const lowerSearch = search.toLowerCase()

    return categoryItems.filter((category) => {
      const themeMatch = category.name.toLowerCase().includes(lowerSearch)
      const decorationMatch = items.some((item) =>
        item.theme === category.name &&
        item.name.toLowerCase().includes(lowerSearch),
      )

      return themeMatch || decorationMatch
    })
  }, [categoryItems, search])


  const filteredDecorations = useMemo(() => {

    if (!selectedCategory) {
      return []
    }

    return items.filter((item) => {

      const matchCategory =
        item.theme === selectedCategory

      const matchSearch =
        item.name
          .toLowerCase()
          .includes(search.toLowerCase())

      return matchCategory && matchSearch
    })

  }, [
    selectedCategory,
    search,
  ])

  return (
    <Box
      w={{ base: '100vw', md: 'sm' }}
      h="100dvh"
      position="relative"
      color="white"
      p={4}
      overflow="hidden"
      bg={panelBg}
      display="flex"
      flexDirection="column"
    >
      <Stack h="full" gap={1}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack flex="1" minW={{ base: '100%' }} gap={2} align="center" mb={3}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                selectedCategory
                  ? 'Search within collection…'
                  : 'Search for a theme or decoration by name…'
              }
              bg={surfaceBg}
              border="1px solid"
              borderColor="whiteAlpha.200"
              rounded="3xl"
              color="white"
              _placeholder={{ color: 'whiteAlpha.500' }}
              flex={1}
            />
            {onClose && (
              <Box top={3} right={3} zIndex={3} pointerEvents="auto">
                <IconButton rounded={100} aria-label="Close" size="sm" onClick={onClose}>
                  <EyeClosed size={18} />
                </IconButton>
              </Box>
            )}
          </HStack>
        </HStack>
        {
          !selectedCategory ? (

            <Box flex="1" minH={0} overflow="hidden">
              <Box
                h="full"
                overflowY="auto"
                p={2}
                css={{
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                }}
              >
                <SimpleGrid
                  columns={{ base: 2 }}
                  gap={4}
                >
                  {filteredCategoryItems.map((category) => (
                    <Box
                      key={category.name}
                      cursor="pointer"
                      rounded="2xl"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      bg={surfaceBg}
                      transition="all .2s"
                      display="flex"
                      flexDirection="column"
                      aspectRatio={1}
                      minH={0}
                      boxShadow="0 12px 30px rgba(0, 0, 0, 0.12)"
                      _hover={{
                        transform: 'translateY(-2px)',
                        borderColor: 'cyan.300',
                        boxShadow: '0 16px 40px rgba(56, 189, 248, 0.12)',
                        bg: surfaceHoverBg,
                      }}
                      onClick={() => {
                        const isExactCategorySearch =
                          search.trim().toLowerCase() ===
                          category.name.toLowerCase()

                        setSelectedCategory(category.name)

                        if (isExactCategorySearch) {
                          setSearch('')
                        }
                      }}
                    >
                      <Box
                        flex="1"
                        position="relative"
                        bg={panelBg}
                        overflow="hidden"
                      >
                        {category.preview ? (
                          <Image
                            src={category.preview}
                            w="full"
                            h="full"
                            objectFit="cover"
                            objectPosition="top"
                          />
                        ) : null}
                        <Box position="absolute" inset={0} bg={overlayBg} />
                      </Box>

                      <VStack align="stretch" p={4} gap={1}>
                        <Heading size="sm">{category.name}</Heading>
                        <Text
                          fontSize="sm"
                          color="whiteAlpha.600"
                        >{category.count} decorations</Text>
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Box>

          ) : null
        }
        {
          selectedCategory && (
            <>
              <Stack gap={2}>
                <HStack
                  gap={3}
                  align="center"
                  flexWrap="wrap"
                >
                  <Button
                    size="xs"
                    variant="outline"
                    rounded="full"
                    borderColor="whiteAlpha.300"
                    bg={surfaceBg}
                    px={3}
                    minW="auto"
                    h={8}
                    lineHeight="1"
                    _hover={{ bg: surfaceHoverBg }}
                    onClick={() => {
                      setSelectedCategory('')
                      setSearch('')
                    }}
                  >
                    <ArrowLeft size={14} />
                    Collections
                  </Button>

                  <Text color="whiteAlpha.500">/</Text>

                  <Box>
                    <Heading size="sm" fontWeight="semibold">
                      {selectedCategory}
                    </Heading>

                  </Box>

                </HStack>
                <Text
                  ml={2}
                  fontSize="xs"
                  color="whiteAlpha.500"
                  letterSpacing="wide"
                >
                  {filteredDecorations.length} decoration
                  {filteredDecorations.length > 1 ? 's' : ''} available
                </Text>
              </Stack>
              <Box flex="1" minH={0} overflow="hidden" >

                <Box
                  h={'full'}
                  overflowY="auto"
                  p={2}
                  css={{
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                  }}
                >

                  <SimpleGrid
                    columns={{
                      base: 2,
                    }}
                    gap={5}
                  >

                    {
                      filteredDecorations.map((decoration) => {

                        const isSelected =
                          decoration.name === selectedDecorationName


                        return (

                          <Box
                            key={`${decoration.theme}-${decoration.name}`}
                            cursor="pointer"
                            rounded="3xl"
                            overflow="hidden"
                            position="relative"
                            border="1px solid"
                            borderColor={
                              isSelected ? 'cyan.300' : 'whiteAlpha.200'
                            }
                            bg={isSelected ? cardSelectedBg : surfaceBg}
                            transition="all .2s"
                            _hover={{
                              transform: 'translateY(-5px) scale(1.01)',
                              boxShadow: '0 24px 60px rgba(56, 189, 248, 0.12)',
                              borderColor: 'cyan.300',
                            }}
                            onClick={() =>
                              onSelectDecoration?.(
                                isSelected ? null : decoration
                              )
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" ||
                                e.key === " "
                              ) {
                                onSelectDecoration?.(
                                  isSelected ? null : decoration
                                )

                              }
                            }}
                            tabIndex={0}
                            role="button"
                          >
                            {
                              isSelected && (
                                <Badge
                                  position="absolute"
                                  top={3}
                                  right={3}
                                  zIndex={2}
                                  colorPalette="cyan"
                                  rounded="full"
                                  px={3}
                                  bg={controlBg}
                                >
                                  Selected
                                </Badge>
                              )
                            }

                            <Box
                              aspectRatio={1.15}
                              bg={controlBg}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {
                                decoration.imageUrl && (
                                  <Image
                                    src={
                                      decoration.imageUrl
                                    }
                                    alt={
                                      decoration.name
                                    }
                                    w="full"
                                    h="full"
                                    objectFit="contain"
                                    transition="transform .25s"
                                    _groupHover={{
                                      transform: "scale(1.08)"
                                    }}
                                  />
                                )
                              }
                            </Box>
                            <VStack
                              align="stretch"
                              gap={3}
                              p={3}
                            >
                              <Box>
                                <Heading
                                  size="md"
                                >
                                  {
                                    decoration.name
                                  }
                                </Heading>
                                <Text
                                  fontSize="sm"
                                  color="whiteAlpha.600"
                                >
                                  {
                                    decoration.theme
                                  }
                                </Text>
                              </Box>
                              <HStack
                                wrap="wrap"
                                gap={2}
                              >

                                <Badge
                                  rounded="full"
                                  colorPalette="gray"
                                >

                                  📐 {decoration.size}

                                </Badge>


                                <Badge
                                  rounded="full"
                                  colorPalette="orange"
                                  bg={controlBg}
                                  color="white"
                                >

                                  ⭐ {decoration.points}

                                  {" "}
                                  pts

                                </Badge>



                                {
                                  decoration.color && (

                                    <Badge
                                      rounded="full"
                                      colorPalette="gray"
                                      bg="whiteAlpha.100"
                                      color="white"
                                    >
                                      🎨 {decoration.color}
                                    </Badge>

                                  )
                                }


                              </HStack>
                            </VStack>
                          </Box>

                        )

                      })
                    }


                  </SimpleGrid>


                </Box>


              </Box></>

          )
        }

      </Stack>

    </Box>

  )

}