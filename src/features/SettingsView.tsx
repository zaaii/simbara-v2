import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Card, Input } from '../components/ui'
import {
  addLocation, addOfficer, deleteLocation, deleteOfficer,
  getLocations, getOfficers, getServiceErrorMessage,
  getSystemProfile, saveSystemProfile, changePin, type SystemProfile,
} from '../services/inventory.service'
import type { Location, Officer } from '../types/inventory'

type Props = { showToast: (msg: string) => void }

export default function SettingsView({ showToast }: Props) {
  const [tab, setTab] = useState<'profil' | 'lokasi' | 'petugas' | 'pin'>('profil')
  const [profile, setProfile] = useState<SystemProfile>({ institutionName: '', address: '', activeOfficer: '', pin: '' })
  const [locations, setLocations] = useState<Location[]>([])
  const [officers, setOfficers] = useState<Officer[]>([])
  const [newLokasi, setNewLokasi] = useState('')
  const [newPetugas, setNewPetugas] = useState({ name: '', position: '', unit: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pinForm, setPinForm] = useState({ current: '', newPin: '', confirm: '' })

  const loadData = () => {
    setLoading(true)
    void Promise.all([getSystemProfile(), getLocations(), getOfficers()])
      .then(([prof, loc, off]) => { setProfile(prof); setLocations(loc); setOfficers(off); setLoading(false) })
  }

  useEffect(() => { loadData() }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await saveSystemProfile(profile)
      showToast('Profil sistem berhasil disimpan.')
    } catch (e) { showToast('Gagal: ' + getServiceErrorMessage(e)) }
    setSaving(false)
  }

  const handleAddLokasi = async () => {
    if (!newLokasi.trim()) return
    try { await addLocation(newLokasi.trim()); showToast('Lokasi ditambahkan.'); setNewLokasi(''); loadData() }
    catch (e) { showToast('Gagal: ' + getServiceErrorMessage(e)) }
  }

  const handleDeleteLokasi = async (id: number) => {
    try { await deleteLocation(id); showToast('Lokasi dihapus.'); loadData() }
    catch (e) { showToast('Gagal: ' + getServiceErrorMessage(e)) }
  }

  const handleAddPetugas = async () => {
    if (!newPetugas.name.trim()) return
    try { await addOfficer(newPetugas); showToast('Petugas ditambahkan.'); setNewPetugas({ name: '', position: '', unit: '' }); loadData() }
    catch (e) { showToast('Gagal: ' + getServiceErrorMessage(e)) }
  }

  const handleDeletePetugas = async (id: number) => {
    try { await deleteOfficer(id); showToast('Petugas dihapus.'); loadData() }
    catch (e) { showToast('Gagal: ' + getServiceErrorMessage(e)) }
  }

  const handleChangePin = async () => {
    if (pinForm.current !== profile.pin) { showToast('PIN lama salah!'); return }
    if (!pinForm.newPin.trim()) { showToast('PIN baru wajib diisi!'); return }
    if (pinForm.newPin !== pinForm.confirm) { showToast('Konfirmasi PIN tidak cocok!'); return }
    try {
      await changePin(pinForm.newPin)
      showToast('PIN berhasil diubah.')
      setPinForm({ current: '', newPin: '', confirm: '' })
      loadData()
    } catch (e) { showToast('Gagal: ' + getServiceErrorMessage(e)) }
  }

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'profil', label: 'Profil Sistem' },
    { id: 'lokasi', label: 'Master Lokasi' },
    { id: 'petugas', label: 'Master Petugas' },
    { id: 'pin', label: 'Ubah PIN' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">Pengaturan</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-100'}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {loading && <Card className="p-8 text-center text-zinc-400"><div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />Memuat data...</Card>}

      {!loading && tab === 'profil' && (
        <Card className="p-6 md:p-8 space-y-5">
          <div className="space-y-2"><label className="text-sm font-bold text-zinc-900">Nama Instansi</label><Input value={profile.institutionName} onChange={e => setProfile(p => ({ ...p, institutionName: e.target.value }))} /></div>
          <div className="space-y-2"><label className="text-sm font-bold text-zinc-900">Alamat</label><Input value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="Alamat lengkap instansi" /></div>
          <div className="space-y-2"><label className="text-sm font-bold text-zinc-900">Petugas Aktif</label><Input value={profile.activeOfficer} onChange={e => setProfile(p => ({ ...p, activeOfficer: e.target.value }))} /></div>
          <div className="flex justify-end pt-4 border-t border-zinc-100">
            <Button onClick={() => void handleSaveProfile()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Profil'}</Button>
          </div>
        </Card>
      )}

      {!loading && tab === 'lokasi' && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row gap-3">
            <Input placeholder="Nama lokasi baru..." value={newLokasi} onChange={e => setNewLokasi(e.target.value)} className="flex-1" />
            <Button onClick={() => void handleAddLokasi()} className="shrink-0">+ Tambah Lokasi</Button>
          </div>
          <div className="divide-y divide-zinc-100">
            {locations.length === 0 && <div className="p-6 text-center text-zinc-400 text-sm">Belum ada data lokasi.</div>}
            {locations.map(l => (
              <div key={l.id} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50">
                <div><span className="font-mono text-xs text-zinc-400 mr-2">{l.code}</span><span className="text-sm font-medium text-zinc-900">{l.name}</span></div>
                <Button variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => void handleDeleteLokasi(l.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && tab === 'petugas' && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-zinc-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input placeholder="Nama" value={newPetugas.name} onChange={e => setNewPetugas(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Jabatan" value={newPetugas.position} onChange={e => setNewPetugas(p => ({ ...p, position: e.target.value }))} />
            <Input placeholder="Unit" value={newPetugas.unit} onChange={e => setNewPetugas(p => ({ ...p, unit: e.target.value }))} />
            <Button onClick={() => void handleAddPetugas()} className="shrink-0">+ Tambah</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                <tr><th className="px-5 py-3 text-left">Nama</th><th className="px-5 py-3 text-left">Jabatan</th><th className="px-5 py-3 text-left">Unit</th><th className="px-5 py-3 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {officers.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-zinc-400">Belum ada data petugas.</td></tr>}
                {officers.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{p.name}</td>
                    <td className="px-5 py-3 text-zinc-600">{p.position}</td>
                    <td className="px-5 py-3 text-zinc-600">{p.unit}</td>
                    <td className="px-5 py-3 text-right"><Button variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => void handleDeletePetugas(p.id)}><Trash2 className="w-4 h-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && tab === 'pin' && (
        <Card className="p-6 md:p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900">PIN Lama</label>
            <Input type="password" inputMode="numeric" maxLength={8} placeholder="Masukkan PIN lama" value={pinForm.current} onChange={e => setPinForm(f => ({ ...f, current: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900">PIN Baru</label>
            <Input type="password" inputMode="numeric" maxLength={8} placeholder="Masukkan PIN baru" value={pinForm.newPin} onChange={e => setPinForm(f => ({ ...f, newPin: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900">Konfirmasi PIN Baru</label>
            <Input type="password" inputMode="numeric" maxLength={8} placeholder="Ulangi PIN baru" value={pinForm.confirm} onChange={e => setPinForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>
          <div className="flex justify-end pt-4 border-t border-zinc-100">
            <Button onClick={() => void handleChangePin()}>Simpan PIN Baru</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
