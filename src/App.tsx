import { lazy, Suspense, useEffect, useState } from 'react'
import { AlertTriangle, Bell, Box, CheckCircle2, Database, Filter, History, Home, LogOut, Menu, QrCode, Search, Settings, X } from 'lucide-react'
import { Button, Input } from './components/ui'
import { getNotifications, getItemDetail, getInventoryList } from './services/inventory.service'
import type { ActivityLog, ItemDetail } from './types/inventory'
import DashboardView from './features/DashboardView'
import InventoryListView from './features/InventoryListView'
import ItemDetailView, { ActionModal } from './features/ItemDetailView'
import AddBarangView from './features/AddBarangView'
import ActivityLogView from './features/ActivityLogView'
import SettingsView from './features/SettingsView'
import PinLockScreen from './features/PinLockScreen'
import { clearSession, isSessionValid } from './lib/session'

const ScanView = lazy(() => import('./features/ScanView'))
const ExportView = lazy(() => import('./features/ExportView'))
const BulkPrintView = lazy(() => import('./features/BulkPrintView'))

type View = 'home' | 'inventory' | 'scan' | 'detail' | 'activity' | 'addbarang' | 'export' | 'settings' | 'bulkprint'
type ModalType = 'Verifikasi' | 'Mutasi' | 'Lapor' | 'Riwayat' | 'CetakQR'

const navItems = [
  { id: 'home' as const, label: 'Dashboard', icon: Home },
  { id: 'inventory' as const, label: 'Data Barang', icon: Database },
  { id: 'scan' as const, label: 'Scan QR', icon: QrCode, isPrimary: true },
  { id: 'export' as const, label: 'Export', icon: Filter },
  { id: 'settings' as const, label: 'Pengaturan', icon: Settings },
]

type SidebarContentProps = {
  currentView: View
  navigateTo: (view: string) => void
  onLogout: () => void
}

function SidebarContent({ currentView, navigateTo, onLogout }: SidebarContentProps) {
  return (
    <>
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-zinc-950 sticky top-0 cursor-pointer" onClick={() => navigateTo('home')}>
        <div className="bg-white text-zinc-950 p-1.5 rounded-md mr-3"><Box className="w-5 h-5" /></div>
        <div>
          <h1 className="font-bold text-sm tracking-widest text-white leading-none">SIMBARA</h1>
          <span className="text-[10px] text-zinc-400 font-medium">Lapas Kelas IIB Tanjung</span>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.id} onClick={() => navigateTo(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === item.id ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-zinc-900 hover:text-white'}`}>
            <item.icon className="w-5 h-5" />{item.label}
          </button>
        ))}
        <div className="pt-6 mt-6 border-t border-zinc-800/50">
          <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-2">Lainnya</p>
          <button onClick={() => navigateTo('activity')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'activity' ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-zinc-900 hover:text-white text-zinc-400'}`}>
            <History className="w-4 h-4" /> Riwayat Sistem
          </button>
        </div>
      </nav>
      <div className="p-4 border-t border-zinc-800/50">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-red-400 transition-colors" onClick={onLogout}>
          <LogOut className="w-5 h-5" /> Keluar
        </button>
      </div>
    </>
  )
}

function App() {
  const initialItemId = new URLSearchParams(window.location.search).get('id')
  const [authenticated, setAuthenticated] = useState(() => isSessionValid())
  const [currentView, setCurrentView] = useState<View>(() => initialItemId ? 'detail' : 'home')
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: ModalType | null }>({ isOpen: false, type: null })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialItemId)
  const [currentItem, setCurrentItem] = useState<ItemDetail | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<ActivityLog[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')
  const [quickSearchLoading, setQuickSearchLoading] = useState(false)

  useEffect(() => { getNotifications().then(setNotifications).catch(() => undefined) }, [currentView])

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3500) }
  const navigateTo = (view: string) => { setCurrentView(view as View); setIsMobileMenuOpen(false) }
  const handleSelectItem = (id: string) => { setSelectedItemId(id); setCurrentItem(null) }
  const refreshItem = () => { if (selectedItemId) void getItemDetail(selectedItemId).then(setCurrentItem) }
  const notificationStyles = (type: ActivityLog['type']) => {
    if (type === 'report') return { icon: AlertTriangle, box: 'bg-red-50 text-red-700', action: 'text-red-700' }
    if (type === 'mutation') return { icon: History, box: 'bg-blue-50 text-blue-700', action: 'text-blue-700' }
    return { icon: CheckCircle2, box: 'bg-emerald-50 text-emerald-700', action: 'text-emerald-700' }
  }
  const handleQuickSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    const query = quickSearch.trim()
    if (!query) return

    setQuickSearchLoading(true)
    try {
      const result = await getInventoryList(query, 1, 1)
      const item = result.items[0]
      if (!item) {
        showToast(`Barang "${query}" tidak ditemukan.`)
        return
      }
      handleSelectItem(item.id)
      navigateTo('detail')
      setQuickSearch('')
    } catch (error) {
      showToast('Pencarian gagal: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setQuickSearchLoading(false)
    }
  }

  if (!authenticated) {
    return <PinLockScreen onSuccess={() => setAuthenticated(true)} />
  }

  const handleLogout = () => {
    clearSession()
    setAuthenticated(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 font-sans selection:bg-zinc-200 flex flex-col md:flex-row overflow-hidden relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[100]">
          <div className="bg-zinc-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-zinc-950 text-zinc-300 flex-col flex h-full shadow-2xl">
            <Button variant="ghost" className="absolute top-4 right-4 z-50 px-2 h-8 w-8 rounded-full bg-zinc-800 text-white hover:bg-zinc-700" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
            <SidebarContent currentView={currentView} navigateTo={navigateTo} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-zinc-950 text-zinc-300 flex-col shrink-0 z-20">
        <SidebarContent currentView={currentView} navigateTo={navigateTo} onLogout={handleLogout} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative bg-zinc-50/50">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 rounded-md hover:bg-zinc-100" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="md:hidden flex items-center gap-2" onClick={() => navigateTo('home')}>
              <div className="bg-zinc-900 text-white p-1.5 rounded-md"><Box className="w-4 h-4" /></div>
              <h1 className="font-bold text-sm tracking-wide leading-none">SIMBARA</h1>
            </div>
            <h2 className="hidden md:block font-semibold text-lg text-zinc-800 capitalize">
              {currentView === 'home' && 'Dashboard Overview'}
              {currentView === 'inventory' && 'Database Inventaris'}
              {currentView === 'scan' && 'Pindai QR Code'}
              {currentView === 'detail' && 'Detail Inventaris'}
              {currentView === 'activity' && 'Riwayat Sistem'}
              {currentView === 'addbarang' && 'Tambah Barang'}
              {currentView === 'export' && 'Export Laporan'}
              {currentView === 'settings' && 'Pengaturan Sistem'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={(event) => void handleQuickSearch(event)} className="hidden lg:flex relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder={quickSearchLoading ? 'Mencari...' : 'Cari cepat...'}
                className="pl-9 h-9 w-64 bg-zinc-100/50 border-transparent focus:border-zinc-300 focus:bg-white rounded-full text-xs"
                value={quickSearch}
                onChange={(event) => setQuickSearch(event.target.value)}
                disabled={quickSearchLoading}
              />
            </form>
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 ml-2">
              <div className="relative">
                <button className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors" onClick={() => setNotifOpen(!notifOpen)}>
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full ring-2 ring-white text-[10px] text-white font-bold flex items-center justify-center px-1">{notifications.length > 99 ? '99+' : notifications.length}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-zinc-200 z-50 overflow-hidden">
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                      <h4 className="font-bold text-sm text-zinc-900">Notifikasi ({notifications.length})</h4>
                      <button className="text-xs text-zinc-400 hover:text-zinc-700" onClick={() => setNotifOpen(false)}>Tutup</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                      {notifications.length === 0 && <div className="p-6 text-center text-zinc-400 text-sm">Tidak ada notifikasi.</div>}
                      {notifications.slice(0, 20).map((n, i) => {
                        const styles = notificationStyles(n.type)
                        const Icon = styles.icon
                        return (
                        <div key={i} className="px-4 py-3 hover:bg-zinc-50 cursor-pointer transition-colors flex gap-3" onClick={() => { handleSelectItem(n.itemId); navigateTo('detail'); setNotifOpen(false) }}>
                          <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${styles.box}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs font-bold ${styles.action}`}>{n.action}</div>
                            <div className="text-xs text-zinc-700 font-medium truncate">{n.itemName}</div>
                            <div className="text-xs text-zinc-500 truncate">{n.location} &bull; {n.itemId}</div>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm cursor-pointer ring-2 ring-white">A</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
          <Suspense fallback={<div className="p-8 flex items-center gap-3 text-zinc-400"><div className="w-5 h-5 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />Memuat tampilan...</div>}>
            {currentView === 'home' && <DashboardView navigateTo={navigateTo} onSelectItem={handleSelectItem} />}
            {currentView === 'inventory' && <InventoryListView navigateTo={navigateTo} onSelectItem={handleSelectItem} />}
            {currentView === 'scan' && <ScanView navigateTo={navigateTo} onSelectItem={handleSelectItem} />}
            {currentView === 'detail' && <ItemDetailView itemId={selectedItemId} navigateTo={navigateTo} onItemLoaded={setCurrentItem} openModal={(type) => setModalState({ isOpen: true, type })} showToast={showToast} />}
            {currentView === 'addbarang' && <AddBarangView navigateTo={navigateTo} showToast={showToast} />}
            {currentView === 'activity' && <ActivityLogView navigateTo={navigateTo} onSelectItem={handleSelectItem} />}
            {currentView === 'settings' && <SettingsView showToast={showToast} />}
            {currentView === 'export' && <ExportView showToast={showToast} />}
            {currentView === 'bulkprint' && <BulkPrintView navigateTo={navigateTo} showToast={showToast} />}
          </Suspense>
        </main>

        {/* Bottom Nav Mobile */}
        {currentView !== 'detail' && (
          <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-zinc-200 px-6 py-2 flex justify-between items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => navigateTo(item.id)}
                className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${item.isPrimary ? '-mt-8' : ''}`}>
                {item.isPrimary ? (
                  <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 border-[4px] border-zinc-50 active:scale-95 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                ) : (
                  <>
                    <div className={`p-1.5 rounded-full ${currentView === item.id ? 'bg-blue-50 text-blue-600' : 'text-zinc-400'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold ${currentView === item.id ? 'text-blue-600' : 'text-zinc-500'}`}>{item.label}</span>
                  </>
                )}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Modal */}
      {modalState.isOpen && (
        <ActionModal
          type={modalState.type}
          item={currentItem}
          onClose={() => setModalState({ isOpen: false, type: null })}
          showToast={showToast}
          refreshItem={refreshItem}
        />
      )}
    </div>
  )
}

export default App
