import QRCode from 'qrcode'
import { useEffect, useRef } from 'react'

export type QrLabelData = {
  id: string
  name: string
  location: string
  createdAt: string
  qrLink: string
}

type Props = {
  item: QrLabelData
  size?: 'normal' | 'small'
}

export default function QrLabel({ item, size = 'normal' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      void QRCode.toCanvas(canvasRef.current, item.qrLink || item.id, {
        width: size === 'small' ? 80 : 110,
        margin: 1,
      })
    }
  }, [item, size])

  const isSmall = size === 'small'

  return (
    <div className={`border-2 border-zinc-800 rounded-2xl flex overflow-hidden bg-white ${isSmall ? 'h-[120px]' : 'h-[150px]'}`}>
      {/* QR Section */}
      <div className={`flex items-center justify-center bg-zinc-50 border-r-2 border-zinc-800 shrink-0 ${isSmall ? 'w-[100px]' : 'w-[130px]'}`}>
        <canvas ref={canvasRef} />
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with logos */}
        <div className={`flex items-center gap-2 border-b-2 border-zinc-800 bg-white ${isSmall ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
          <img src="/keminimipas.png" alt="Kemenkumham" className={isSmall ? 'h-5' : 'h-6'} />
          <img src="/pemasyarakatan.png" alt="Pemasyarakatan" className={isSmall ? 'h-5' : 'h-6'} />
          <span className={`font-bold text-zinc-900 ${isSmall ? 'text-[9px]' : 'text-xs'}`}>Lapas Kelas IIB Tanjung</span>
        </div>

        {/* Item info + maskot */}
        <div className="flex-1 flex items-center">
          <div className={`flex-1 min-w-0 ${isSmall ? 'px-2 py-1' : 'px-3 py-2'}`}>
            <div className={`font-mono font-bold text-zinc-900 ${isSmall ? 'text-xs' : 'text-base'}`}>{item.id}</div>
            <div className={`text-zinc-700 truncate ${isSmall ? 'text-[11px]' : 'text-sm'}`}>{item.name}</div>
            <div className={`text-zinc-500 ${isSmall ? 'text-[10px]' : 'text-xs'}`}>{item.location}</div>
            <div className={`text-zinc-400 ${isSmall ? 'text-[9px]' : 'text-[11px]'}`}>{item.createdAt}</div>
          </div>
          <img src="/Untitled.png" alt="Maskot" className={`object-contain shrink-0 ${isSmall ? 'h-16 mr-1' : 'h-20 mr-2'}`} />
        </div>
      </div>
    </div>
  )
}
