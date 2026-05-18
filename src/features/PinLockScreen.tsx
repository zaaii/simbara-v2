import { useState } from 'react'
import { Box, Lock } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { verifyPin, getServiceErrorMessage } from '../services/inventory.service'

type Props = {
  onSuccess: () => void
}

export default function PinLockScreen({ onSuccess }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) { setError('Masukkan PIN.'); return }
    setLoading(true)
    setError('')
    try {
      const valid = await verifyPin(pin.trim())
      if (valid) {
        // Save session with 6-day expiry
        const expiry = Date.now() + 6 * 24 * 60 * 60 * 1000
        localStorage.setItem('simbara_session', JSON.stringify({ expiry }))
        onSuccess()
      } else {
        setError('PIN salah. Coba lagi.')
        setPin('')
      }
    } catch (err) {
      setError(getServiceErrorMessage(err))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 text-white rounded-2xl mb-4 shadow-lg">
            <Box className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-zinc-900">SIMBARA</h1>
          <p className="text-sm text-zinc-500 mt-1">Lapas Kelas IIB Tanjung</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 text-zinc-700">
            <Lock className="w-5 h-5 text-zinc-400" />
            <h2 className="font-bold text-lg">Masukkan PIN</h2>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="Masukkan PIN..."
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-14 text-center text-2xl tracking-[0.5em] font-bold"
              autoFocus
            />
            {error && <p className="text-sm text-red-600 text-center font-medium">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
