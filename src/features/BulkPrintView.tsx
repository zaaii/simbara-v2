import { useEffect, useState } from 'react'
import { ChevronLeft, Printer, Search } from 'lucide-react'
import { Button, Card, Input, Select } from '../components/ui'
import QrLabel, { type QrLabelData } from '../components/QrLabel'
import { getAllItems, getLocations } from '../services/inventory.service'
import type { ItemDetail, Location } from '../types/inventory'
import { formatDate } from '../lib/format'

type Props = {
  navigateTo: (view: string) => void
  showToast: (msg: string) => void
}

export default function BulkPrintView({ navigateTo, showToast }: Props) {
  const [items, setItems] = useState<ItemDetail[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getAllItems(), getLocations()])
      .then(([allItems, allLocations]) => { setItems(allItems); setLocations(allLocations); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = items.filter(i => {
    const normalizedSearch = search.trim().toLowerCase()
    const matchesSearch = !normalizedSearch || i.id.toLowerCase().includes(normalizedSearch) || i.name.toLowerCase().includes(normalizedSearch)
    const matchesLocation = !location || i.location === location
    return matchesSearch && matchesLocation
  })

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (filtered.length > 0 && filtered.every(item => selected.has(item.id))) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(item => next.delete(item.id))
        return next
      })
    }
    else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(item => next.add(item.id))
        return next
      })
    }
  }

  const selectedItems: QrLabelData[] = items
    .filter(i => selected.has(i.id))
    .map(i => ({ id: i.id, name: i.name, location: i.location, createdAt: formatDate(i.createdAt), qrLink: i.qrLink }))

  const handlePrint = () => {
    if (selectedItems.length === 0) { showToast('Pilih minimal 1 barang untuk dicetak.'); return }
    window.print()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header - hidden on print */}
      <div className="flex items-center gap-3 print:hidden">
        <Button variant="ghost" className="px-2 -ml-2" onClick={() => navigateTo('inventory')}><ChevronLeft /></Button>
        <h2 className="text-2xl font-bold text-zinc-900">Cetak QR Massal</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Item selector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_240px_auto] gap-3 items-center">
            <div className="relative min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <Input
                placeholder="Cari ID atau nama barang..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-11 pl-9 bg-white"
              />
            </div>
            <Select value={location} onChange={e => setLocation(e.target.value)} className="h-11 bg-white">
              <option value="">Semua Lokasi</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </Select>
            <Button variant="outline" onClick={selectAll} className="h-11 px-4 whitespace-nowrap sm:col-span-2 xl:col-span-1">
              {filtered.length > 0 && filtered.every(item => selected.has(item.id)) ? 'Batal Semua' : 'Pilih Semua'}
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{filtered.length} barang tampil</span>
            <span>{selected.size} label dipilih</span>
          </div>
          <Card className="max-h-[400px] overflow-y-auto divide-y divide-zinc-100">
            {loading && <div className="p-6 text-center text-zinc-400">Memuat...</div>}
            {!loading && filtered.length === 0 && <div className="p-6 text-center text-zinc-400">Tidak ada barang.</div>}
            {filtered.map(item => (
              <label key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 cursor-pointer">
                <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleItem(item.id)} className="w-4 h-4 rounded border-zinc-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-zinc-900 truncate">{item.name}</div>
                  <div className="text-xs text-zinc-500 font-mono">{item.id}</div>
                </div>
              </label>
            ))}
          </Card>
        </div>

        {/* Print info */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-zinc-900">Info Cetak</h3>
            <div className="text-sm text-zinc-600">
              <p><strong>{selected.size}</strong> label dipilih</p>
              <p className="text-xs text-zinc-400 mt-1">±8 label per halaman A4</p>
            </div>
            <Button onClick={handlePrint} className="w-full h-12">
              <Printer className="w-4 h-4 mr-2" /> Cetak {selected.size} Label
            </Button>
          </Card>
          {selectedItems.length > 0 && (
            <div>
              <p className="text-xs font-bold text-zinc-500 mb-2">Preview:</p>
              <QrLabel item={selectedItems[0]} size="small" />
            </div>
          )}
        </div>
      </div>

      {/* Print area - only visible on print */}
      <div className="hidden print:block">
        <div className="grid grid-cols-2 gap-4 p-4">
          {selectedItems.map(item => (
            <QrLabel key={item.id} item={item} size="small" />
          ))}
        </div>
      </div>
    </div>
  )
}
