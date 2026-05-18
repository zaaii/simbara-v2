import { useEffect, useState } from 'react'
import { Search, Printer } from 'lucide-react'
import { Badge, Button, Card, Input, Select } from '../components/ui'
import { formatDate } from '../lib/format'
import { getInventoryList, getLocations } from '../services/inventory.service'
import { getConditionVariant, type InventoryFreshnessFilter } from '../services/inventory.utils'
import type { InventoryListResult, Location } from '../types/inventory'

type Props = {
  navigateTo: (view: string) => void
  onSelectItem: (id: string) => void
}

export default function InventoryListView({ navigateTo, onSelectItem }: Props) {
  const [result, setResult] = useState<InventoryListResult>({ items: [], total: 0, page: 1, pageSize: 20 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [condition, setCondition] = useState('')
  const [status, setStatus] = useState('')
  const [freshness, setFreshness] = useState<InventoryFreshnessFilter>('all')
  const [locations, setLocations] = useState<Location[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const PAGE_SIZE = 20

  useEffect(() => {
    void getLocations().then(setLocations)
  }, [])

  useEffect(() => {
    setLoading(true)
    getInventoryList({ query: search, location, condition, status, freshness }, page, PAGE_SIZE)
      .then(setResult)
      .finally(() => setLoading(false))
  }, [search, location, condition, status, freshness, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setLocation('')
    setCondition('')
    setStatus('')
    setFreshness('all')
    setPage(1)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">List Barang</h2>
          <Button onClick={() => navigateTo('addbarang')} className="h-8 px-2.5 text-xs">+ Tambah</Button>
          <Button variant="outline" onClick={() => navigateTo('bulkprint')} className="h-8 px-2.5 text-xs"><Printer className="w-3.5 h-3.5 mr-1" />Cetak QR</Button>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input placeholder="Cari ID, Nama, Lokasi..." className="pl-9 bg-white" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          </div>
          <Button type="submit" variant="outline" className="px-3 shrink-0">
            <Search className="w-4 h-4 mr-2" />Cari
          </Button>
        </form>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select value={location} onChange={e => { setLocation(e.target.value); setPage(1) }}>
            <option value="">Semua Lokasi</option>
            {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </Select>
          <Select value={condition} onChange={e => { setCondition(e.target.value); setPage(1) }}>
            <option value="">Semua Kondisi</option>
            <option value="Baik">Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Berat">Rusak Berat</option>
          </Select>
          <Select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Perbaikan">Perbaikan</option>
            <option value="Afkir">Afkir</option>
            <option value="Hilang">Hilang</option>
          </Select>
          <Select value={freshness} onChange={e => { setFreshness(e.target.value as InventoryFreshnessFilter); setPage(1) }}>
            <option value="all">Semua Jadwal Cek</option>
            <option value="unchecked">Belum Dicek / Lewat 30 Hari</option>
            <option value="never_scanned">Belum Pernah Dicek</option>
            <option value="recent">Sudah Dicek</option>
          </Select>
          <Button variant="ghost" onClick={resetFilters}>Reset Filter</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-semibold">ID / Nama Barang</th>
                <th className="px-6 py-4 font-semibold">Lokasi</th>
                <th className="px-6 py-4 font-semibold">Kondisi</th>
                <th className="px-6 py-4 font-semibold">Cek Terakhir</th>
                <th className="px-6 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && [1, 2, 3, 4, 5].map(i => (
                <tr key={i}><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded animate-pulse" /></td></tr>
              ))}
              {!loading && result.items.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-400">Tidak ada barang ditemukan.</td></tr>
              )}
              {!loading && result.items.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900">{item.name}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">{item.id}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-700">{item.location}</td>
                  <td className="px-6 py-4"><Badge variant={getConditionVariant(item.condition)}>{item.condition}</Badge></td>
                  <td className="px-6 py-4 text-zinc-500 text-xs">{formatDate(item.lastScan)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" onClick={() => { onSelectItem(item.id); navigateTo('detail') }} className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50">Detail</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, result.total)}-{Math.min(page * PAGE_SIZE, result.total)} dari {result.total} barang</span>
          <div className="flex gap-1">
            <Button variant="outline" className="h-7 px-2" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" className="h-7 px-2" disabled={page * PAGE_SIZE >= result.total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
