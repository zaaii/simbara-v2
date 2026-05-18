import { useEffect, useState } from 'react'
import { AlertTriangle, Database, History, MapPin } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button, Card, Select } from '../components/ui'
import { getAllItems, getActivityLog, getLocations, getServiceErrorMessage } from '../services/inventory.service'
import type { Location } from '../types/inventory'

type Props = { showToast: (msg: string) => void }

function fmtDate(value: string): string {
  if (!value || value === '-') return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function ExportView({ showToast }: Props) {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLokasi, setSelectedLokasi] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    void getLocations().then(setLocations)
  }, [])

  const downloadExcel = (data: Record<string, unknown>[], filename: string, title: string) => {
    const ws = XLSX.utils.json_to_sheet(data)

    // Auto-fit column widths
    const colWidths = Object.keys(data[0] ?? {}).map(key => {
      const maxLen = Math.max(key.length, ...data.map(row => String(row[key] ?? '').length))
      return { wch: Math.min(maxLen + 2, 40) }
    })
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31))
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  const handleExport = async (type: 'inventaris' | 'per_lokasi' | 'rusak' | 'log_bulan_ini') => {
    setExporting(true)
    try {
      if (type === 'inventaris') {
        const items = await getAllItems()
        const data = items.map(i => ({
          'ID Barang': i.id, 'Nama Barang': i.name, 'Kategori': i.category, 'Merk/Tipe': i.brand,
          'Nomor Seri': i.serialNumber, 'Lokasi': i.location, 'Penanggung Jawab': i.officer,
          'Kondisi': i.condition, 'Status': i.status, 'Tanggal Input': fmtDate(i.createdAt), 'Cek Terakhir': fmtDate(i.lastScan),
        }))
        downloadExcel(data, 'Inventaris_Lengkap', 'Inventaris')
        showToast(`Export berhasil! ${data.length} barang.`)
      } else if (type === 'per_lokasi') {
        if (!selectedLokasi) { showToast('Pilih lokasi terlebih dahulu!'); setExporting(false); return }
        const items = await getAllItems()
        const filtered = items.filter(i => i.location === selectedLokasi)
        const data = filtered.map(i => ({
          'ID Barang': i.id, 'Nama Barang': i.name, 'Kategori': i.category, 'Merk/Tipe': i.brand,
          'Lokasi': i.location, 'Kondisi': i.condition, 'Status': i.status, 'Cek Terakhir': fmtDate(i.lastScan),
        }))
        downloadExcel(data, `Inventaris_${selectedLokasi}`, selectedLokasi)
        showToast(`Export berhasil! ${data.length} barang di ${selectedLokasi}.`)
      } else if (type === 'rusak') {
        const items = await getAllItems()
        const filtered = items.filter(i => i.condition.toLowerCase().includes('rusak'))
        const data = filtered.map(i => ({
          'ID Barang': i.id, 'Nama Barang': i.name, 'Lokasi': i.location,
          'Kondisi': i.condition, 'Status': i.status, 'Penanggung Jawab': i.officer,
        }))
        downloadExcel(data, 'Barang_Rusak', 'Barang Rusak')
        showToast(`Export berhasil! ${data.length} barang rusak.`)
      } else if (type === 'log_bulan_ini') {
        const result = await getActivityLog(1, 1000, 'semua')
        const now = new Date()
        const filtered = result.activities.filter(a => {
          const d = new Date(a.timestamp)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        const data = filtered.map(a => ({
          'Timestamp': fmtDate(a.timestamp), 'ID Barang': a.itemId, 'Nama Barang': a.itemName,
          'Lokasi': a.location, 'Aksi': a.action, 'Petugas': a.officer, 'Catatan': a.notes,
        }))
        downloadExcel(data, 'Log_Bulan_Ini', 'Log Aktivitas')
        showToast(`Export berhasil! ${data.length} aktivitas bulan ini.`)
      }
    } catch (err) {
      showToast('Gagal: ' + getServiceErrorMessage(err))
    }
    setExporting(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">Export Laporan</h2>
      <p className="text-sm text-zinc-600">Export data inventaris ke file Excel (.xlsx).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Database className="w-5 h-5 text-blue-600" /></div>
            <div><h4 className="font-bold text-sm text-zinc-900">Inventaris Lengkap</h4><p className="text-xs text-zinc-500">Semua barang</p></div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => void handleExport('inventaris')} disabled={exporting}>Export</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><MapPin className="w-5 h-5 text-green-600" /></div>
            <div><h4 className="font-bold text-sm text-zinc-900">Per Lokasi</h4><p className="text-xs text-zinc-500">Filter berdasarkan ruangan</p></div>
          </div>
          <Select value={selectedLokasi} onChange={e => setSelectedLokasi(e.target.value)}>
            <option value="">Pilih Lokasi...</option>
            {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </Select>
          <Button variant="outline" className="w-full" onClick={() => void handleExport('per_lokasi')} disabled={exporting}>Export</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <div><h4 className="font-bold text-sm text-zinc-900">Barang Rusak</h4><p className="text-xs text-zinc-500">Semua kondisi rusak</p></div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => void handleExport('rusak')} disabled={exporting}>Export</Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><History className="w-5 h-5 text-orange-600" /></div>
            <div><h4 className="font-bold text-sm text-zinc-900">Log Bulan Ini</h4><p className="text-xs text-zinc-500">Aktivitas scan bulan berjalan</p></div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => void handleExport('log_bulan_ini')} disabled={exporting}>Export</Button>
        </Card>
      </div>

      {exporting && (
        <Card className="p-5 flex items-center gap-3 text-zinc-500">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">Sedang mengexport data...</span>
        </Card>
      )}
    </div>
  )
}
