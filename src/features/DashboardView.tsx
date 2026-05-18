import { useEffect, useState } from 'react'
import { Box, CheckCircle2, Database, QrCode } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { formatDate } from '../lib/format'
import { getDashboardStats, getServiceErrorMessage } from '../services/inventory.service'
import type { DashboardStats } from '../types/inventory'

type Props = {
  navigateTo: (view: string) => void
  onSelectItem: (id: string) => void
}

const emptyStats: DashboardStats = { total: 0, damaged: 0, unchecked: 0, totalLocations: 0, recentActivity: [] }

function StatSkeleton() {
  return <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse" />
}

export default function DashboardView({ navigateTo, onSelectItem }: Props) {
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(getServiceErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">{error}</div>}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard SIMBARA</h2>
          <p className="text-sm text-zinc-500 mt-1">Lapas Kelas IIB Tanjung</p>
        </div>
        <Button onClick={() => navigateTo('scan')} className="w-full md:w-auto shadow-md">
          <QrCode className="w-4 h-4 mr-2" />Mulai Scan Barang
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-zinc-900 text-white border-transparent relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-zinc-400 text-sm font-medium mb-2">Total Barang</div>
            {loading ? <StatSkeleton /> : <div className="text-4xl font-bold text-white">{stats.total.toLocaleString()}</div>}
          </div>
          <Box className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-800 opacity-50 pointer-events-none" />
        </Card>
        <Card className="p-5">
          <div className="text-zinc-500 text-sm font-medium mb-2">Belum Dicek (&gt;30 hr)</div>
          {loading ? <StatSkeleton /> : <div className="text-4xl font-bold text-orange-600">{stats.unchecked}</div>}
          <div className="text-xs text-zinc-400 mt-2">Harus segera diverifikasi</div>
        </Card>
        <Card className="p-5">
          <div className="text-zinc-500 text-sm font-medium mb-2">Kondisi Rusak</div>
          {loading ? <StatSkeleton /> : <div className="text-4xl font-bold text-red-600">{stats.damaged}</div>}
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />perlu perbaikan</div>
        </Card>
        <Card className="p-5">
          <div className="text-zinc-500 text-sm font-medium mb-2">Total Ruangan</div>
          {loading ? <StatSkeleton /> : <div className="text-4xl font-bold text-blue-600">{stats.totalLocations}</div>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-zinc-900">Aktivitas Terakhir</h3>
            <Button variant="ghost" className="text-sm text-blue-600 font-medium h-8" onClick={() => navigateTo('activity')}>Lihat Semua</Button>
          </div>
          <Card className="divide-y divide-zinc-100">
            {loading && [1, 2, 3].map(i => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-zinc-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-3 bg-zinc-200 rounded animate-pulse w-24" /><div className="h-2 bg-zinc-100 rounded animate-pulse w-40" /></div>
              </div>
            ))}
            {!loading && stats.recentActivity.length === 0 && (
              <div className="p-8 text-center text-zinc-400 text-sm">Belum ada aktivitas. Mulai scan barang pertama!</div>
            )}
            {!loading && stats.recentActivity.map((act) => (
              <div key={act.id} className="p-4 flex items-center gap-4 hover:bg-zinc-50 cursor-pointer transition-colors" onClick={() => { onSelectItem(act.itemId); navigateTo('detail') }}>
                <div className="bg-green-100 p-2 rounded-full text-green-700 shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-900 truncate">{act.itemId}</div>
                  <div className="text-xs text-zinc-500 truncate">{act.itemName} • {act.location}</div>
                  <div className="text-xs text-blue-600 font-medium mt-0.5">{act.action}</div>
                </div>
                <div className="text-xs font-medium text-zinc-400 whitespace-nowrap hidden sm:block">{formatDate(act.timestamp)}</div>
              </div>
            ))}
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-lg text-zinc-900">Aksi Cepat</h3>
          <Card className="p-4 space-y-3">
            <Button variant="outline" className="w-full justify-start h-12" onClick={() => navigateTo('inventory')}>
              <Database className="w-5 h-5 mr-3 text-zinc-500" />Lihat Database
            </Button>
            <Button variant="outline" className="w-full justify-start h-12" onClick={() => navigateTo('addbarang')}>
              <Box className="w-5 h-5 mr-3 text-blue-500" />Tambah Barang Baru
            </Button>
            <Button variant="outline" className="w-full justify-start h-12" onClick={() => navigateTo('scan')}>
              <QrCode className="w-5 h-5 mr-3 text-green-500" />Scan / Cari Barang
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
