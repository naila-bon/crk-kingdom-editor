// components/HelpDialog.tsx
import {
    Box,
    Button,
    CloseButton,
    Dialog,
    Kbd,
    Stack,
    Text,
    VStack,
} from '@chakra-ui/react'
import { HelpCircle } from 'lucide-react'
import { useState } from 'react'

type HelpSection = {
    title: string
    items: { label: string; description: string }[]
}

const sections: HelpSection[] = [
    {
        title: 'Decorations',
        items: [
            {
                label: 'Browse',
                description: 'Open collections and search decorations.',
            },
            {
                label: 'Select',
                description: 'Click a decoration to place it.',
            },
            {
                label: 'Place',
                description: 'Click a valid grid position.',
            },
        ],
    },
    {
        title: 'Editing',
        items: [
            {
                label: 'Move',
                description: 'Drag placed decorations to move them.',
            },
            {
                label: 'Delete',
                description: 'Select a decoration and press Delete.',
            },
        ],
    },
    {
        title: 'Map',
        items: [
            {
                label: 'Pan',
                description: 'Drag empty space or use arrow keys.',
            },
            {
                label: 'Zoom',
                description: 'Use mouse wheel or +/- buttons.',
            },
        ],
    },
  
]

export const HelpDialog = () => {
    const [hovered, setHovered] = useState(false)
    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Box
                    position="relative"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <Button
                        aria-label="Help"
                        size="sm"
                        variant="outline"
                        borderColor="whiteAlpha.400"
                        bg="blackAlpha.700"
                        color="white"
                        rounded="full"
                        overflow="hidden"
                        transition="all .25s ease"
                        w={hovered ? "130px" : "36px"}
                        minW={hovered ? "130px" : "36px"}
                        p={0}
                        justifyContent="center"
                        _hover={{ bg: 'blackAlpha.800' }}
                    >
                        <Box display="flex" alignItems="center">
                            <HelpCircle
                                size={16}
                                strokeWidth={2}
                            />

                            <Text
                                ml={hovered ? 2 : 0}
                                whiteSpace="nowrap"
                                opacity={hovered ? 1 : 0}
                                maxW={hovered ? "100px" : "0px"}
                                overflow="hidden"
                                transition="all .2s ease"
                            >
                                How it works
                            </Text>
                        </Box>
                    </Button>
                </Box>
            </Dialog.Trigger>

            <Dialog.Backdrop bg="blackAlpha.600" />
            <Dialog.Positioner>
                <Dialog.Content bg="#2e334e" color="white" rounded="2xl" maxW="lg">
                    <Dialog.Header>
                        <Dialog.Title fontSize="md"
                            fontWeight="bold">
                            How the editor works
                        </Dialog.Title>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton />
                        </Dialog.CloseTrigger>
                    </Dialog.Header>

                    <Dialog.Body>
                        <VStack align="stretch" gap={5}>
                            {sections.map((section) => (
                                <Box key={section.title}>
                                    <Text fontSize="sm" fontWeight="bold" color="cyan.300" mb={2}>
                                        {section.title}
                                    </Text>
                                    <Stack gap={1.5}>
                                        {section.items.map((item) => (
                                            <Text key={item.label} fontSize="sm" color="whiteAlpha.800">
                                                <Text as="span" fontWeight="semibold" color="white">
                                                    {item.label}:
                                                </Text>{' '}
                                                {item.description}
                                            </Text>
                                        ))}
                                    </Stack>
                                </Box>
                            ))}
                            <Box>
                                <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color="cyan.300"
                                    mb={2}
                                >
                                    Keyboard shortcuts
                                </Text>

                                <Stack gap={1.5} fontSize="sm" color="whiteAlpha.800">

                                    <Text>
                                        <Kbd>Esc</Kbd> - cancel / deselect
                                    </Text>

                                    <Text>
                                        <Kbd>Delete</Kbd> or <Kbd>Backspace</Kbd> - remove decoration
                                    </Text>

                                    <Text>
                                        <Kbd>Ctrl</Kbd> + <Kbd>Z</Kbd> - undo
                                    </Text>

                                    <Text>
                                        <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>Z</Kbd> - redo
                                    </Text>

                                    <Text>
                                        <Kbd>Ctrl</Kbd> + <Kbd>Y</Kbd> - redo
                                    </Text>

                                    <Text>
                                        <Kbd>↑</Kbd>
                                        <Kbd>↓</Kbd>
                                        <Kbd>←</Kbd>
                                        <Kbd>→</Kbd>
                                        - move map
                                    </Text>

                                    <Text>
                                        <Kbd>+</Kbd> / <Kbd>-</Kbd> - zoom in / out
                                    </Text>

                                    <Text>
                                        Mouse wheel - zoom at cursor position
                                    </Text>

                                    <Text>
                                        Mouse drag - pan the map
                                    </Text>

                                </Stack>
                            </Box>
                        </VStack>
                    </Dialog.Body>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    )
}