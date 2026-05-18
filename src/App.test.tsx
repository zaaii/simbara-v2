import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getInventoryList } from './services/inventory.service'

vi.mock('./features/PinLockScreen', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => <button onClick={onSuccess}>mock-pin</button>,
}))

vi.mock('./lib/session', () => ({
  isSessionValid: () => true,
  clearSession: () => undefined,
}))

vi.mock('./services/inventory.service', () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    total: 0,
    damaged: 0,
    unchecked: 0,
    totalLocations: 0,
    recentActivity: [],
  }),
  getNotifications: vi.fn().mockResolvedValue([]),
  getInventoryList: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
  getLocations: vi.fn().mockResolvedValue([]),
  getOfficers: vi.fn().mockResolvedValue([]),
  getSystemProfile: vi.fn().mockResolvedValue({
    institutionName: 'Lapas Kelas IIB Tanjung',
    address: '',
    activeOfficer: 'Admin',
    pin: '1234',
  }),
  verifyPin: vi.fn().mockResolvedValue(true),
  getItemDetail: vi.fn().mockResolvedValue(null),
  getServiceErrorMessage: vi.fn().mockReturnValue('error'),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('App', () => {
  it('renders the migrated SIMBARA dashboard shell', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: /dashboard simbara/i })).toBeInTheDocument()
    expect(screen.getAllByText(/lapas kelas iib tanjung/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /mulai scan barang/i })).toBeInTheDocument()
  })

  it('opens item detail from the global quick search', async () => {
    vi.mocked(getInventoryList).mockResolvedValueOnce({
      items: [{
        id: 'LPT-BRG-0001',
        name: 'Laptop ASUS',
        category: 'Elektronik',
        brand: 'ASUS',
        serialNumber: 'SN-1',
        location: 'Ruang TU',
        officer: 'Admin',
        condition: 'Baik',
        status: 'Aktif',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        qrLink: '',
        notes: '',
        lastScan: '2026-05-01T00:00:00Z',
        history: [],
      }],
      total: 1,
      page: 1,
      pageSize: 1,
    })

    render(<App />)
    await screen.findByRole('heading', { name: /dashboard simbara/i })

    await userEvent.type(screen.getByPlaceholderText(/cari cepat/i), 'laptop{enter}')

    expect(getInventoryList).toHaveBeenCalledWith('laptop', 1, 1)
    expect(await screen.findByText(/detail inventaris/i)).toBeInTheDocument()
  })
})
