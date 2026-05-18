import { describe, expect, it } from 'vitest'
import type { ActivityLog, ItemDetail } from '../types/inventory'
import {
  buildDashboardStats,
  buildNotificationsFromItems,
  extractItemIdFromQr,
  filterItems,
  filterInventoryItems,
  getConditionVariant,
  isItemUnchecked,
  paginate,
} from './inventory.utils'

const items: ItemDetail[] = [
  {
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
  },
  {
    id: 'LPT-BRG-0002',
    name: 'Kursi Besi',
    category: 'Mebel',
    brand: '',
    serialNumber: '',
    location: 'Gudang',
    officer: 'Budi',
    condition: 'Rusak Berat',
    status: 'Afkir',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    qrLink: '',
    notes: '',
    lastScan: '-',
    history: [],
  },
]

const activities: ActivityLog[] = [
  {
    id: 1,
    timestamp: '2026-05-10T00:00:00Z',
    itemId: 'LPT-BRG-0001',
    itemName: 'Laptop ASUS',
    location: 'Ruang TU',
    condition: 'Baik',
    officer: 'Admin',
    action: 'Verifikasi Rutin',
    notes: '',
    type: 'verification',
  },
]

describe('inventory utilities', () => {
  it('filters items by id, name, or location case-insensitively', () => {
    expect(filterItems(items, 'asus')).toHaveLength(1)
    expect(filterItems(items, 'gudang')).toHaveLength(1)
    expect(filterItems(items, '0002')[0]?.name).toBe('Kursi Besi')
  })

  it('paginates items with total metadata', () => {
    expect(paginate(items, 2, 1)).toEqual({ items: [items[1]], total: 2, page: 2, pageSize: 1 })
  })

  it('builds dashboard counts and treats missing scans as unchecked', () => {
    const stats = buildDashboardStats(items, activities, new Date('2026-05-17T00:00:00Z'))

    expect(stats).toEqual({
      total: 2,
      damaged: 1,
      unchecked: 1,
      totalLocations: 2,
      recentActivity: activities,
    })
  })

  it('maps condition text to badge variants', () => {
    expect(getConditionVariant('Baik')).toBe('success')
    expect(getConditionVariant('Rusak Ringan')).toBe('warning')
    expect(getConditionVariant('Rusak Berat')).toBe('danger')
  })

  it('extracts item id from QR URL or raw text', () => {
    expect(extractItemIdFromQr('https://app.example/detail?id=LPT-BRG-0001')).toBe('LPT-BRG-0001')
    expect(extractItemIdFromQr(' LPT-BRG-0002 ')).toBe('LPT-BRG-0002')
  })

  it('detects items that were never scanned or are older than the overdue threshold', () => {
    const now = new Date('2026-05-17T00:00:00Z')

    expect(isItemUnchecked({ ...items[0], lastScan: '-' }, now)).toBe(true)
    expect(isItemUnchecked({ ...items[0], lastScan: '2026-04-01T00:00:00Z' }, now)).toBe(true)
    expect(isItemUnchecked({ ...items[0], lastScan: '2026-05-01T00:00:00Z' }, now)).toBe(false)
  })

  it('filters inventory by search, location, condition, status, and freshness', () => {
    const now = new Date('2026-05-17T00:00:00Z')
    const filtered = filterInventoryItems(items, {
      query: 'kursi',
      location: 'Gudang',
      condition: 'Rusak Berat',
      status: 'Afkir',
      freshness: 'unchecked',
    }, now)

    expect(filtered).toEqual([items[1]])
  })

  it('builds actionable notifications for heavy damage and overdue checks', () => {
    const notifications = buildNotificationsFromItems([
      ...items,
      { ...items[0], id: 'LPT-BRG-0003', name: 'Meja Kayu', lastScan: '2026-04-01T00:00:00Z' },
    ], new Date('2026-05-17T00:00:00Z'))

    expect(notifications.map((n) => n.action)).toEqual(['Kondisi Rusak Berat', 'Belum pernah dicek', 'Belum dicek > 30 hari'])
    expect(notifications[0]).toMatchObject({ itemId: 'LPT-BRG-0002', type: 'report' })
    expect(notifications[1]).toMatchObject({ itemId: 'LPT-BRG-0002', type: 'verification' })
    expect(notifications[2]).toMatchObject({ itemId: 'LPT-BRG-0003', type: 'verification' })
  })
})
