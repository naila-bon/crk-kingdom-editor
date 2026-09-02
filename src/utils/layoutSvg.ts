import type { PlacedDecoration } from '../types/decorations'

const FORMAT_NAME = 'crk-kingdom-layout'
const FORMAT_VERSION = 1
const METADATA_ID = 'crk-layout-data'

const escapeXmlAttribute = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    }
    return entities[character]
  })

type LayoutDocument = {
  format: typeof FORMAT_NAME
  version: typeof FORMAT_VERSION
  items: PlacedDecoration[]
}

const isPlacedDecoration = (value: unknown): value is PlacedDecoration => {
  if (!value || typeof value !== 'object') return false

  const item = value as Partial<PlacedDecoration>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    Number.isInteger(item.col) &&
    Number.isInteger(item.row) &&
    typeof item.widthInSmallTiles === 'number' &&
    Number.isFinite(item.widthInSmallTiles) &&
    item.widthInSmallTiles > 0
  )
}

export const createLayoutSvg = (items: PlacedDecoration[], backgroundUrl: string): string => {
  const data: LayoutDocument = {
    format: FORMAT_NAME,
    version: FORMAT_VERSION,
    items,
  }
  const metadata = JSON.stringify(data)

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"',
    ' width="3911" height="1251" viewBox="0 0 3911 1251">',
    `  <metadata id="${METADATA_ID}"><![CDATA[${metadata}]]></metadata>`,
    `  <image href="${escapeXmlAttribute(backgroundUrl)}" x="0" y="0" width="3911" height="1251" preserveAspectRatio="none" />`,
    '</svg>',
  ].join('\n')
}

export const downloadTextFile = (content: string, filename: string, type: string): void => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const parseLayoutSvg = (content: string): PlacedDecoration[] => {
  const document = new DOMParser().parseFromString(content, 'image/svg+xml')
  if (document.querySelector('parsererror')) {
    throw new Error('Le fichier SVG est invalide.')
  }

  const metadata = document.querySelector(`#${METADATA_ID}`)
  if (!metadata?.textContent) {
    throw new Error('Ce fichier ne contient pas de layout CRK valide.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(metadata.textContent)
  } catch {
    throw new Error('Les données du layout sont invalides.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Les données du layout sont invalides.')
  }

  const layout = parsed as Partial<LayoutDocument>
  if (layout.format !== FORMAT_NAME || layout.version !== FORMAT_VERSION || !Array.isArray(layout.items)) {
    throw new Error('La version du layout SVG n’est pas compatible.')
  }

  if (!layout.items.every(isPlacedDecoration)) {
    throw new Error('Le layout contient une décoration invalide.')
  }

  return layout.items
}

export const getLayoutSvgFilename = (): string => {
  const date = new Date().toISOString().slice(0, 10)
  return `crk-kingdom-layout-${date}.svg`
}