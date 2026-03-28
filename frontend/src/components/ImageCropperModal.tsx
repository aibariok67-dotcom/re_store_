import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Modal } from './Modal'
import { Loader2 } from 'lucide-react'

interface ImageCropperModalProps {
  open: boolean
  file: File | null
  onClose: () => void
  onDone: (blob: Blob) => Promise<void>
  aspect?: number
}

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
    width,
    height
  )
}

async function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = crop.width * scaleX
  canvas.height = crop.height * scaleY
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/jpeg',
      0.92
    )
  })
}

export function ImageCropperModal({ open, file, onClose, onDone, aspect }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [loading, setLoading] = useState(false)

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      if (aspect) {
        setCrop(centerAspectCrop(width, height, aspect))
      } else {
        setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 })
      }
    },
    [aspect]
  )

  // Regenerate URL when file changes
  if (file && !srcUrl) {
    const url = URL.createObjectURL(file)
    setSrcUrl(url)
  }

  const handleClose = () => {
    if (srcUrl) {
      URL.revokeObjectURL(srcUrl)
      setSrcUrl(null)
    }
    setCrop(undefined)
    setCompletedCrop(undefined)
    onClose()
  }

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return
    setLoading(true)
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop)
      await onDone(blob)
      handleClose()
    } catch {
      // handled by parent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Обрезать изображение" size="lg">
      <div className="flex flex-col gap-4">
        {srcUrl && (
          <div className="flex justify-center max-h-[60vh] overflow-auto rounded-lg bg-black/30">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={50}
              minHeight={50}
            >
              <img
                ref={imgRef}
                src={srcUrl}
                alt="crop"
                className="max-w-full max-h-[55vh] object-contain"
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>
            Отмена
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading || !completedCrop}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Загружаю...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
