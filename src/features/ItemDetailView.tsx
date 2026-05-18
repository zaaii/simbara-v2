import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronLeft, History, MapPin, QrCode, Trash2 } from 'lucide-react'
import { Badge, Button, Card, Input, Select, Textarea } from '../components/ui'
import { formatDate } from '../lib/format'
import { getItemDetail, getServiceErrorMessage, saveVerification, saveMutation, saveReport, deleteItem } from '../services/inventory.service'
import { getConditionVariant } from '../services/inventory.utils'
import type { ItemDetail } from '../types/inventory'
import QrLabel from '../components/QrLabel'

type ModalType = 'Verifikasi' | 'Mutasi' | 'Lapor' | 'Riwayat' | 'CetakQR'

type DetailProps = {
  itemId: string | null
  navigateTo: (view: string) => void
  onItemLoaded: (item: ItemDetail) => void
  openModal: (type: ModalType) => void
  showToast: (msg: string) => void
}

export default function ItemDetailView({ itemId, navigateTo, onItemLoaded, openModal, showToast }: DetailProps) {
  const [item, setItem] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!itemId) { setErr('Tidak ada ID barang.'); setLoading(false); return }
    setLoading(true)
    getItemDetail(itemId)
      .then((r) => { setItem(r); onItemLoaded(r); setLoading(false) })
      .catch((e) => { setErr(getServiceErrorMessage(e)); setLoading(false) })
  }, [itemId, onItemLoaded])

  if (loading) return <div className="max-w-5xl mx-auto p-8 flex items-center gap-3 text-zinc-400"><div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />Memuat data barang...</div>
  if (err) return <div className="max-w-5xl mx-auto p-8"><div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6">{err}</div></div>
  if (!item) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteItem(item.id)
      showToast('Barang berhasil dihapus.')
      navigateTo('inventory')
    } catch (e) {
      showToast('Gagal: ' + getServiceErrorMessage(e))
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="px-2 mr-2 -ml-2" onClick={() => navigateTo('inventory')}><ChevronLeft /></Button>
        <h2 className="text-2xl font-bold text-zinc-900">Detail Barang</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden shadow-sm">
            <div className="bg-zinc-950 p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><QrCode className="w-40 h-40" /></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <Badge variant={getConditionVariant(item.condition)} className="px-3 py-1 text-sm">{item.status}</Badge>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2 relative z-10">{item.name}</h3>
              <p className="text-zinc-400 font-mono text-base relative z-10">{item.id}</p>
            </div>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div><p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Kategori</p><p className="text-sm font-semibold text-zinc-900">{item.category || '-'}</p></div>
                <div><p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Merk/Tipe</p><p className="text-sm font-semibold text-zinc-900">{item.brand || '-'}</p></div>
                <div><p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Lokasi</p><div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-600" /><p className="text-sm font-semibold text-zinc-900">{item.location}</p></div></div>
                <div><p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">P. Jawab</p><p className="text-sm font-semibold text-zinc-900">{item.officer || '-'}</p></div>
              </div>
              <div className="p-5 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div><p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Kondisi</p><Badge variant={getConditionVariant(item.condition)} className="rounded-md px-3 py-1 text-sm">{item.condition}</Badge></div>
                <div className="sm:text-right"><p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Cek Terakhir</p><p className="text-sm font-semibold text-zinc-900">{formatDate(item.lastScan)}</p></div>
              </div>
              {item.notes && <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-900"><strong>Catatan:</strong> {item.notes}</div>}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="p-5 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-4 text-zinc-900">Tindakan Cepat</h3>
            <div className="flex flex-col gap-3">
              <Button onClick={() => openModal('Verifikasi')} className="w-full justify-start h-12 text-base px-4 bg-zinc-900 hover:bg-zinc-800 text-white"><CheckCircle2 className="w-5 h-5 mr-3 text-green-400" />Verifikasi Rutin</Button>
              <Button variant="outline" onClick={() => openModal('Mutasi')} className="w-full justify-start h-12 text-base px-4 border-zinc-200"><MapPin className="w-5 h-5 mr-3 text-blue-600" />Pindah Lokasi</Button>
              <Button variant="outline" onClick={() => openModal('Lapor')} className="w-full justify-start h-12 text-base px-4 border-red-100 text-red-700 hover:bg-red-50"><AlertTriangle className="w-5 h-5 mr-3 text-red-500" />Lapor Masalah</Button>
              <hr className="my-3 border-zinc-100" />
              <Button variant="ghost" onClick={() => openModal('Riwayat')} className="w-full justify-start h-12 text-base px-4 text-zinc-600 bg-zinc-50"><History className="w-5 h-5 mr-3" />Lihat Riwayat</Button>
              <Button variant="ghost" onClick={() => openModal('CetakQR')} className="w-full justify-start h-12 text-base px-4 text-zinc-600 bg-zinc-50"><QrCode className="w-5 h-5 mr-3" />Cetak QR Code</Button>
              <hr className="my-3 border-zinc-100" />
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(true)} className="w-full justify-start h-12 text-base px-4 text-red-600 hover:bg-red-50"><Trash2 className="w-5 h-5 mr-3" />Hapus Barang</Button>
            </div>
          </Card>
        </div>
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="h-11 w-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Hapus barang?</h3>
                <p className="text-sm text-zinc-600 mt-1">Data <strong>{item.name}</strong> ({item.id}) dan seluruh riwayatnya akan dihapus permanen.</p>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-100 bg-zinc-50/80 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Batal</Button>
              <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>{deleting ? 'Menghapus...' : 'Hapus Permanen'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type ModalProps = {
  type: ModalType | null
  item: ItemDetail | null
  onClose: () => void
  showToast: (msg: string) => void
  refreshItem: () => void
}

const COND_OPTIONS = ['Baik', 'Rusak Ringan', 'Rusak Berat']
const REPORT_OPTIONS = ['Rusak Ringan', 'Rusak Berat', 'Barang Hilang']

export function ActionModal({ type, item, onClose, showToast, refreshItem }: ModalProps) {
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [inputMode, setInputMode] = useState(false)

  useEffect(() => { setValue(''); setNotes(''); setInputMode(false); setSaving(false) }, [type])

  if (!type || !item) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      if (type === 'Verifikasi') {
        const cond = inputMode ? value : (value || item.condition)
        await saveVerification(item, cond, notes)
      } else if (type === 'Mutasi') {
        if (!value.trim()) { showToast('Pilih lokasi tujuan!'); setSaving(false); return }
        await saveMutation(item, value, notes)
      } else if (type === 'Lapor') {
        if (!value.trim()) { showToast('Pilih jenis masalah!'); setSaving(false); return }
        await saveReport(item, value, notes)
      }
      showToast(`Data ${type} berhasil disimpan.`)
      refreshItem()
      onClose()
    } catch (e) {
      showToast('Gagal: ' + getServiceErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-zinc-900">
            {type === 'Verifikasi' && 'Verifikasi Barang'}
            {type === 'Mutasi' && 'Pindah Lokasi'}
            {type === 'Lapor' && 'Lapor Masalah'}
            {type === 'Riwayat' && 'Riwayat Barang'}
            {type === 'CetakQR' && 'Cetak QR Code'}
          </h3>
          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={onClose}><span className="text-lg">✕</span></Button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {type === 'Verifikasi' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-900 border border-blue-100 flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /><p>Konfirmasi <strong>{item.name}</strong> ({item.id}) di <strong>{item.location}</strong>.</p></div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900">Kondisi Saat Ini</label>
                {!inputMode ? (
                  <Select value={value} onChange={e => { if (e.target.value === 'NEW') { setInputMode(true); setValue('') } else setValue(e.target.value) }} className="h-12">
                    <option value="" disabled>Pilih Kondisi...</option>
                    {COND_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="NEW">+ Tambah Kondisi Baru...</option>
                  </Select>
                ) : (
                  <div className="flex gap-2"><Input placeholder="Kondisi baru..." value={value} onChange={e => setValue(e.target.value)} className="h-12 flex-1" autoFocus /><Button variant="outline" onClick={() => { setInputMode(false); setValue('') }} className="h-12 px-3">Batal</Button></div>
                )}
              </div>
              <div className="space-y-2"><label className="text-sm font-bold text-zinc-900">Catatan</label><Textarea placeholder="Catatan opsional..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
          )}
          {type === 'Mutasi' && (
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-sm font-bold text-zinc-900">Lokasi Asal</label><Input value={item.location} disabled className="bg-zinc-100 text-zinc-500 h-12" /></div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900">Lokasi Baru</label>
                {!inputMode ? (
                  <Input placeholder="Ketik nama lokasi tujuan..." value={value} onChange={e => setValue(e.target.value)} className="h-12" />
                ) : (
                  <Input placeholder="Ketik nama lokasi tujuan..." value={value} onChange={e => setValue(e.target.value)} className="h-12" />
                )}
              </div>
              <div className="space-y-2"><label className="text-sm font-bold text-zinc-900">Alasan (Opsional)</label><Textarea placeholder="Alasan mutasi..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
          )}
          {type === 'Lapor' && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-xl text-sm text-red-900 border border-red-100 flex gap-3"><AlertTriangle className="w-5 h-5 text-red-600 shrink-0" /><p>Laporan akan menandai status barang menjadi <strong>Perbaikan/Afkir</strong>.</p></div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900">Jenis Masalah</label>
                {!inputMode ? (
                  <Select value={value} onChange={e => { if (e.target.value === 'NEW') { setInputMode(true); setValue('') } else setValue(e.target.value) }} className="h-12">
                    <option value="" disabled>Pilih Jenis Masalah...</option>
                    {REPORT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="NEW">+ Tambah Jenis Baru...</option>
                  </Select>
                ) : (
                  <div className="flex gap-2"><Input placeholder="Jenis masalah baru..." value={value} onChange={e => setValue(e.target.value)} className="h-12 flex-1" autoFocus /><Button variant="outline" onClick={() => { setInputMode(false); setValue('') }} className="h-12 px-3">Batal</Button></div>
                )}
              </div>
              <div className="space-y-2"><label className="text-sm font-bold text-zinc-900">Detail Laporan</label><Textarea placeholder="Jelaskan kronologi atau kerusakannya..." value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[100px]" /></div>
            </div>
          )}
          {type === 'Riwayat' && (
            <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-200 pt-2">
              {item.history.length === 0 && <p className="text-center text-zinc-400 py-8 text-sm">Belum ada riwayat.</p>}
              {item.history.map((h, idx) => (
                <div key={idx} className="relative flex items-center mb-8 last:mb-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-zinc-100 shadow-sm shrink-0 z-10">
                    {idx === 0 ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <History className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div className="ml-4 p-4 rounded-xl border border-zinc-200 bg-white shadow-sm w-full">
                    <div className="flex items-center justify-between mb-1"><div className="font-bold text-sm text-zinc-900">{h.action}</div><div className="text-[10px] font-semibold text-zinc-500">{formatDate(h.timestamp)}</div></div>
                    <div className="text-sm text-zinc-600 mb-2">{h.notes}</div>
                    <div className="text-xs text-zinc-400 border-t border-zinc-50 pt-2">Oleh: {h.officer}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {type === 'CetakQR' && (
            <div className="space-y-4">
              <QrLabel item={{ id: item.id, name: item.name, location: item.location, createdAt: formatDate(item.createdAt), qrLink: item.qrLink || item.id }} />
              <div className="flex justify-center">
                <Button onClick={() => window.print()} className="mt-2">Cetak Label QR</Button>
              </div>
              <p className="text-xs text-zinc-500 text-center">Label akan dicetak sesuai format stiker inventaris.</p>
            </div>
          )}
        </div>
        {type !== 'Riwayat' && type !== 'CetakQR' && (
          <div className="p-5 border-t border-zinc-100 bg-zinc-50/80 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="h-10 px-4">Batal</Button>
            <Button onClick={() => void handleSave()} className="h-10 px-6" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Data'}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
