// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadCanvasAsPng } from './exportLayout'

describe('exportLayout', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('downloads a PNG blob and releases its object URL', async () => {
    const blob = new Blob(['png'], { type: 'image/png' })
    const canvas = {
      toBlob: (callback: (value: Blob | null) => void) => callback(blob),
    }
    const objectUrl = 'blob:test'
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl)
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    await downloadCanvasAsPng(canvas, 'layout.png')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl)
  })

  it('rejects when the canvas cannot produce a blob', async () => {
    const canvas = { toBlob: (callback: (value: Blob | null) => void) => callback(null) }

    await expect(downloadCanvasAsPng(canvas, 'layout.png')).rejects.toThrow('Impossible de générer le PNG.')
  })
})
