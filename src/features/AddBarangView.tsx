import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button, Card, Input, Select, Textarea } from '../components/ui'
import { addItem, getLocations, getOfficers, getServiceErrorMessage } from '../services/inventory.service'
import type { ItemFormData, Location, Officer } from '../types/inventory'

type Props = { navigateTo: (view: string) => void; showToast: (msg: string) => void }

const categoryOptions = ['Elektronik', 'Mebel', 'Kendaraan', 'Alat Tulis', 'Peralatan', 'Lainnya']
const conditionOptions = ['Baik', 'Rusak Ringan', 'Rusak Berat']
const emptyForm: ItemFormData = { name: '', category: '', brand: '', serialNumber: '', location: '', officer: '', condition: 'Baik', notes: '' }

export default function AddBarangView({ navigateTo, showToast }: Props) {
  const [form, setForm] = useState<ItemFormData>(emptyForm)
  const [locations, setLocations] = useState<Location[]>([])
  const [officers, setOfficers] = useState<Officer[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void Promise.all([getLocations(), getOfficers()]).then(([loc, off]) => { setLocations(loc); setOfficers(off) })
  }, [])

  const set = (key: keyof ItemFormData, val: string) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { showToast('Nama barang wajib diisi!'); return }
    if (!form.location.trim()) { showToast('Lokasi wajib dipilih!'); return }
    setSaving(true)
    try {
      const result = await addItem(form)
      showToast(`Barang ${result.id} berhasil ditambahkan!`)
      navigateTo('inventory')
    } catch (err) {
      showToast('Gagal: ' + getServiceErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center mb-2">
        <Button variant="ghost" className="px-2 mr-2 -ml-2" onClick={() => navigateTo('inventory')}><ChevronLeft /></Button>
        <h2 className="text-2xl font-bold text-zinc-900">Tambah Barang Baru</h2>
      </div>
      <Card className="overflow-hidden shadow-sm">
        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-zinc-900">Nama Barang <span className="text-red-500">*</span></label>
              <Input placeholder="cth: Laptop ASUS VivoBook" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900">Kategori</label>
              <Select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Pilih Kategori...</option>
                {categoryOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900">Merk / Tipe</label>
              <Input placeholder="cth: ASUS VivoBook 14" value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900">Nomor Seri</label>
              <Input placeholder="cth: SN-2024-001" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900">Lokasi <span className="text-red-500">*</span></label>
              <Select value={form.location} onChange={e => set('location', e.target.value)}>
                <option value="">Pilih Lokasi...</option>
                {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900">Penanggung Jawab</label>
              <Select value={form.officer} onChange={e => set('officer', e.target.value)}>
                <option value="">Pilih Petugas...</option>
                {officers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900">Kondisi Awal</label>
              <Select value={form.condition} onChange={e => set('condition', e.target.value)}>
                {conditionOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-zinc-900">Catatan</label>
              <Textarea placeholder="Catatan tambahan (opsional)..." value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button variant="ghost" type="button" onClick={() => navigateTo('inventory')}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Barang'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
