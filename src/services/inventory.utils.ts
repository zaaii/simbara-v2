import type { ActivityLog, DashboardStats, ItemDetail } from '../types/inventory'

export type BadgeVariant = 'success' | 'warning' | 'danger'
export type InventoryFreshnessFilter = 'all' | 'unchecked' | 'never_scanned' | 'recent'

export type InventoryFilters = {
  query?: string
  location?: string
  condition?: string
  status?: string
  freshness?: InventoryFreshnessFilter
}

const CHECK_OVERDUE_DAYS = 30

export function filterItems(items: ItemDetail[], query: string): ItemDetail[] {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return items
  }

  return items.filter((item) =>
    [item.id, item.name, item.location].some((value) => value.toLowerCase().includes(normalized)),
  )
}

export function isItemUnchecked(item: ItemDetail, now = new Date(), thresholdDays = CHECK_OVERDUE_DAYS): boolean {
  if (!item.lastScan || item.lastScan === '-') {
    return true
  }

  const lastScan = new Date(item.lastScan)
  if (Number.isNaN(lastScan.getTime())) {
    return true
  }

  const threshold = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000)
  return lastScan < threshold
}

export function filterInventoryItems(items: ItemDetail[], filters: InventoryFilters, now = new Date()): ItemDetail[] {
  const query = filters.query?.trim().toLowerCase() ?? ''
  const location = filters.location?.trim() ?? ''
  const condition = filters.condition?.trim() ?? ''
  const status = filters.status?.trim() ?? ''
  const freshness = filters.freshness ?? 'all'

  return items.filter((item) => {
    const matchesQuery = !query || [item.id, item.name, item.location, item.category, item.brand, item.officer]
      .some((value) => value.toLowerCase().includes(query))
    const matchesLocation = !location || item.location === location
    const matchesCondition = !condition || item.condition === condition
    const matchesStatus = !status || item.status === status
    const matchesFreshness =
      freshness === 'all' ||
      (freshness === 'unchecked' && isItemUnchecked(item, now)) ||
      (freshness === 'never_scanned' && item.lastScan === '-') ||
      (freshness === 'recent' && !isItemUnchecked(item, now))

    return matchesQuery && matchesLocation && matchesCondition && matchesStatus && matchesFreshness
  })
}

export function paginate<T>(items: T[], page: number, pageSize: number): {
  items: T[]
  total: number
  page: number
  pageSize: number
} {
  const safePage = Math.max(1, page)
  const safePageSize = Math.max(1, pageSize)
  const start = (safePage - 1) * safePageSize

  return {
    items: items.slice(start, start + safePageSize),
    total: items.length,
    page: safePage,
    pageSize: safePageSize,
  }
}

export function buildDashboardStats(
  items: ItemDetail[],
  activities: ActivityLog[],
  now = new Date(),
): DashboardStats {
  return {
    total: items.length,
    damaged: items.filter((item) => item.condition.toLowerCase().includes('rusak')).length,
    unchecked: items.filter((item) => isItemUnchecked(item, now)).length,
    totalLocations: new Set(items.map((item) => item.location).filter(Boolean)).size,
    recentActivity: activities.slice(0, 5),
  }
}

export function buildNotificationsFromItems(items: ItemDetail[], now = new Date()): ActivityLog[] {
  const notifications = items.flatMap((item) => {
    const itemNotifications: ActivityLog[] = []
    const isHeavyDamage = item.condition.toLowerCase().includes('rusak berat')

    if (isHeavyDamage) {
      itemNotifications.push({
        id: itemNotifications.length,
        timestamp: item.updatedAt || item.createdAt,
        itemId: item.id,
        itemName: item.name,
        location: item.location,
        condition: item.condition,
        officer: item.officer,
        action: 'Kondisi Rusak Berat',
        notes: item.notes,
        type: 'report',
      })
    }

    if (isItemUnchecked(item, now)) {
      itemNotifications.push({
        id: itemNotifications.length,
        timestamp: item.lastScan === '-' ? item.createdAt : item.lastScan,
        itemId: item.id,
        itemName: item.name,
        location: item.location,
        condition: item.condition,
        officer: item.officer,
        action: item.lastScan === '-' ? 'Belum pernah dicek' : 'Belum dicek > 30 hari',
        notes: item.notes,
        type: 'verification',
      })
    }

    return itemNotifications
  })

  return notifications
    .map((notification, index) => ({ ...notification, id: index }))
    .slice(0, 20)
}

export function getConditionVariant(condition: string): BadgeVariant {
  if (condition === 'Baik') {
    return 'success'
  }

  if (condition.toLowerCase().includes('ringan')) {
    return 'warning'
  }

  return 'danger'
}

export function extractItemIdFromQr(decodedText: string): string {
  const trimmed = decodedText.trim()
  const match = trimmed.match(/[?&]id=([^&]+)/)

  return match ? decodeURIComponent(match[1]) : trimmed
}
