import { useEffect, useRef, useState } from 'react'
import { Camera, ChevronLeft, ImagePlus, X } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button, Input } from '../components/ui'
import { getItemDetail, getServiceErrorMessage } from '../services/inventory.service'
import { extractItemIdFromQr } from '../services/inventory.utils'

type Props = {
  navigateTo: (view: string) => void
  onSelectItem: (id: string) => void
}

export default function ScanView({ navigateTo, onSelectItem }: Props) {
  const [searchId, setSearchId] = useState('')
  const [searching, setSearching] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => undefined)
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setScannerActive(false)
  }

  const handleQrResult = (decodedText: string) => {
    void stopScanner()
    const itemId = extractItemIdFromQr(decodedText)
    if (!itemId) return
    setSearching(true)
    setErrMsg('')
    getItemDetail(itemId)
      .then((r) => { onSelectItem(r.id); navigateTo('detail') })
      .catch((e) => { setErrMsg(getServiceErrorMessage(e)); setSearching(false) })
  }

  const startScanner = () => {
    setScannerError('')
    setScannerActive(true)
    setTimeout(() => {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleQrResult,
        () => undefined
      ).catch((err) => {
        setScannerError('Tidak bisa akses kamera: ' + String(err))
        setScannerActive(false)
      })
    }, 200)
  }

  useEffect(() => {
    return () => { void stopScanner() }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchId.trim()) return
    setSearching(true)
    setErrMsg('')
    getItemDetail(searchId.trim())
      .then((r) => { onSelectItem(r.id); navigateTo('detail') })
      .catch((e) => { setErrMsg(getServiceErrorMessage(e)); setSearching(false) })
  }

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="px-2 md:hidden mr-2" onClick={() => navigateTo('home')}><ChevronLeft /></Button>
        <h2 className="text-2xl font-bold text-zinc-900">Scan QR Code</h2>
      </div>
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="relative w-full max-w-sm aspect-square bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl mb-6">
          {!scannerActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 z-10">
              <Camera className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm font-medium text-zinc-400 mb-4">Arahkan kamera ke QR Code barang</p>
              <Button onClick={startScanner} className="h-11 px-6 shadow-lg">
                <Camera className="w-4 h-4 mr-2" />Buka Kamera
              </Button>
            </div>
          )}
          <div id="qr-reader" className={`w-full h-full ${scannerActive ? '' : 'hidden'}`} />
          {scannerActive && (
            <button onClick={() => void stopScanner()} className="absolute top-3 right-3 z-20 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {scannerError && (
          <div className="w-full max-w-sm mb-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-3 text-sm">
            {scannerError}
            <p className="text-xs mt-1 text-orange-600">Gunakan upload gambar QR atau pencarian manual di bawah.</p>
          </div>
        )}

        {/* Upload QR image fallback */}
        <div className="w-full max-w-sm mb-4">
          <label className="flex items-center justify-center gap-2 h-12 w-full rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-600 text-sm font-medium cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <ImagePlus className="w-5 h-5" />
            Upload Foto QR dari Galeri
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setErrMsg('')
              const scanner = new Html5Qrcode('qr-file-reader')
              scanner.scanFile(file, true)
                .then((text) => { scanner.clear(); handleQrResult(text) })
                .catch(() => { scanner.clear(); setErrMsg('QR Code tidak terdeteksi di gambar. Coba foto yang lebih jelas.') })
              e.target.value = ''
            }} />
          </label>
          <div id="qr-file-reader" className="hidden" />
        </div>

        <div className="w-full max-w-sm text-center relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
          <div className="relative flex justify-center"><span className="bg-zinc-50 px-4 text-xs text-zinc-500 uppercase font-bold tracking-wider">Atau cari manual</span></div>
        </div>

        {errMsg && <div className="w-full max-w-sm mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{errMsg}</div>}
        <form onSubmit={handleSearch} className="w-full max-w-sm flex gap-2">
          <Input placeholder="Ketik ID Barang (cth: LPT-BRG-0001)" value={searchId} onChange={e => setSearchId(e.target.value)} className="flex-1 bg-white shadow-sm h-12 text-base" />
          <Button type="submit" className="h-12 px-6" disabled={searching}>{searching ? '...' : 'Cari'}</Button>
        </form>
      </div>
    </div>
  )
}
