import { useEffect, useState } from 'react'
import { CheckCircle2, MapPin, AlertTriangle } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { formatDate } from '../lib/format'
import { getActivityLog } from '../services/inventory.service'
import type { ActivityLog } from '../types/inventory'

type Props = { navigateTo: (view: string) => void; onSelectItem: (id: string) => void }

export default function ActivityLogView({ navigateTo, onSelectItem }: Props) {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'semua' | 'verification' | 'mutation' | 'report'>('semua')
  const [loading, setLoading] = useState(true)
  const PAGE_SIZE = 30

  useEffect(() => {
    setLoading(true)
    getActivityLog(page, PAGE_SIZE, filter)
      .then(r => { setActivities(r.activities); setTotal(r.total); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, filter])

  const filters: { id: typeof filter; label: string }[] = [
    { id: 'semua', label: 'Semua' },
    { id: 'verification', label: 'Verifikasi' },
    { id: 'mutation', label: 'Mutasi' },
    { id: 'report', label: 'Laporan' },
  ]

  const tipeIcon = (tipe: string) => {
    if (tipe === 'mutation') return <MapPin className="w-4 h-4 text-blue-600" />
    if (tipe === 'report') return <AlertTriangle className="w-4 h-4 text-red-600" />
    return <CheckCircle2 className="w-4 h-4 text-green-600" />
  }

  const tipeBg = (tipe: string) => {
    if (tipe === 'mutation') return 'bg-blue-100'
    if (tipe === 'report') return 'bg-red-100'
    return 'bg-green-100'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">Riwayat Sistem</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map(f => (
          <button key={f.id} onClick={() => { setPage(1); setFilter(f.id) }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f.id ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading && <div className="p-8 text-center text-zinc-400"><div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />Memuat...</div>}
        {!loading && activities.length === 0 && <div className="p-8 text-center text-zinc-400 text-sm">Belum ada aktivitas.</div>}
        {!loading && activities.length > 0 && (
          <div className="divide-y divide-zinc-100">
            {activities.map((act) => (
              <div key={act.id} className="p-4 flex items-start gap-4 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => { onSelectItem(act.itemId); navigateTo('detail') }}>
                <div className={`p-2 rounded-full shrink-0 ${tipeBg(act.type)}`}>{tipeIcon(act.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-zinc-900 truncate">{act.action}</span>
                    <span className="text-[11px] text-zinc-400 whitespace-nowrap">{formatDate(act.timestamp)}</span>
                  </div>
                  <div className="text-sm text-zinc-600 truncate">{act.itemName} <span className="text-zinc-400">({act.itemId})</span></div>
                  <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{act.location}</span>
                    <span>Oleh: {act.officer}</span>
                  </div>
                  {act.notes && <div className="text-xs text-zinc-400 mt-1 italic truncate">{act.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && total > PAGE_SIZE && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
            <span>Halaman {page} dari {Math.ceil(total / PAGE_SIZE)} ({total} aktivitas)</span>
            <div className="flex gap-1">
              <Button variant="outline" className="h-7 px-2" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="outline" className="h-7 px-2" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
