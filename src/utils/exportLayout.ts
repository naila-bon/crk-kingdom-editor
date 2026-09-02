type ExportCanvas = {
  toBlob?: (callback: (blob: Blob | null) => void, type?: string) => void
}

const canvasToPngBlob = (canvas: ExportCanvas): Promise<Blob> =>
  new Promise((resolve, reject) => {
    if (!canvas.toBlob) {
      reject(new Error('Le navigateur ne supporte pas la génération de PNG.'))
      return
    }

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('Impossible de générer le PNG.'))
    }, 'image/png')
  })

export const downloadCanvasAsPng = async (canvas: ExportCanvas, filename: string): Promise<void> => {
  const blob = await canvasToPngBlob(canvas)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const getLayoutExportFilename = (): string => {
  const date = new Date().toISOString().slice(0, 10)
  return `crk-kingdom-layout-${date}.png`
}