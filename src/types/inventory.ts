export type ItemCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | string

export type ItemStatus = 'Aktif' | 'Perbaikan' | 'Afkir' | 'Hilang' | string

export type Item = {
  id: string
  name: string
  category: string
  brand: string
  serialNumber: string
  location: string
  officer: string
  condition: ItemCondition
  status: ItemStatus
  createdAt: string
  updatedAt: string
  qrLink: string
  notes: string
}

export type ItemHistory = {
  timestamp: string
  action: string
  notes: string
  officer: string
  type: 'verification' | 'mutation' | 'report'
}

export type ItemDetail = Item & {
  lastScan: string
  history: ItemHistory[]
}

export type Location = {
  id: number
  code: string
  name: string
}

export type Officer = {
  id: number
  name: string
  position: string
  unit: string
}

export type ActivityLog = {
  id: number
  timestamp: string
  itemId: string
  itemName: string
  location: string
  condition: string
  officer: string
  action: string
  notes: string
  type: 'verification' | 'mutation' | 'report'
}

export type DashboardStats = {
  total: number
  damaged: number
  unchecked: number
  totalLocations: number
  recentActivity: ActivityLog[]
}

export type InventoryListResult = {
  items: ItemDetail[]
  total: number
  page: number
  pageSize: number
}

export type ItemFormData = {
  name: string
  category: string
  brand: string
  serialNumber: string
  location: string
  officer: string
  condition: string
  notes: string
}
