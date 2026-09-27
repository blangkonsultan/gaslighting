import { createWorker } from "tesseract.js"

export interface OcrProgress {
  status: string
  progress: number
}

/**
 * Preprocesses receipt image on a canvas:
 * 1. Resizes large images to max 1800px for speed and memory efficiency.
 * 2. Applies grayscale filter.
 * 3. Boosts contrast to make faint thermal paper text legible.
 */
export async function preprocessImage(fileOrBlob: Blob): Promise<string> {
  if (typeof window === "undefined" || !window.createImageBitmap) {
    return URL.createObjectURL(fileOrBlob)
  }

  try {
    const bitmap = await createImageBitmap(fileOrBlob)
    const MAX_DIM = 1800
    let width = bitmap.width
    let height = bitmap.height

    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width)
        width = MAX_DIM
      } else {
        width = Math.round((width * MAX_DIM) / height)
        height = MAX_DIM
      }
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return URL.createObjectURL(fileOrBlob)

    ctx.drawImage(bitmap, 0, 0, width, height)

    // Grayscale + contrast enhancement
    const imgData = ctx.getImageData(0, 0, width, height)
    const d = imgData.data
    const contrast = 1.25 // +25% contrast
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))

    for (let i = 0; i < d.length; i += 4) {
      // Grayscale luminance
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      // Apply contrast
      const adj = Math.min(255, Math.max(0, factor * (gray - 128) + 128))
      d[i] = adj
      d[i + 1] = adj
      d[i + 2] = adj
    }

    ctx.putImageData(imgData, 0, 0)
    return canvas.toDataURL("image/jpeg", 0.9)
  } catch (err) {
    console.warn("Canvas preprocessing skipped:", err)
    return URL.createObjectURL(fileOrBlob)
  }
}

/**
 * Runs Tesseract OCR on a receipt image with progress callbacks.
 */
export async function recognizeReceiptText(
  imageSrc: string | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  let targetSrc: string
  if (typeof imageSrc !== "string") {
    targetSrc = await preprocessImage(imageSrc)
  } else {
    targetSrc = imageSrc
  }

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100), "Membaca teks struk…")
      } else if (onProgress) {
        onProgress(20, "Mempersiapkan OCR engine…")
      }
    },
  })

  try {
    const res = await worker.recognize(targetSrc)
    return res.data.text
  } finally {
    await worker.terminate()
  }
}
