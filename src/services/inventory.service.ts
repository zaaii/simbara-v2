import { supabase } from '../lib/supabase'
import type {
  ActivityLog,
  DashboardStats,
  InventoryListResult,
  ItemDetail,
  ItemFormData,
  Location,
  Officer,
} from '../types/inventory'
import { buildDashboardStats, buildNotificationsFromItems, filterInventoryItems, paginate, type InventoryFilters } from './inventory.utils'

type ItemRow = {
  id: string
  name: string
  category: string | null
  brand: string | null
  serial_number: string | null
  location: string
  officer: string | null
  condition: string
  status: string
  qr_link: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type ActivityRow = {
  id: number
  item_id: string
  item_name: string
  location: string
  condition: string | null
  officer: string | null
  action: string
  notes: string | null
  type: string
  created_at: string
}

type LocationRow = {
  id: number
  code: string
  name: string
  created_at: string
}

type OfficerRow = {
  id: number
  name: string
  position: string | null
  unit: string | null
  created_at: string
}

type ProfileRow = {
  id: number
  institution_name: string
  address: string | null
  active_officer: string
  created_at: string
  updated_at: string
}

export type SystemProfile = {
  institutionName: string
  address: string
  activeOfficer: string
  pin: string
}

function mapItem(row: ItemRow, history: ActivityLog[] = []): ItemDetail {
  const lastScan = history[0]?.timestamp ?? '-'

  return {
    id: row.id,
    name: row.name,
    category: row.category ?? '',
    brand: row.brand ?? '',
    serialNumber: row.serial_number ?? '',
    location: row.location,
    officer: row.officer ?? '',
    condition: row.condition,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    qrLink: row.qr_link ?? '',
    notes: row.notes ?? '',
    lastScan,
    history: history.map((activity) => ({
      timestamp: activity.timestamp,
      action: activity.action,
      notes: activity.notes,
      officer: activity.officer,
      type: activity.type,
    })),
  }
}

function mapActivity(row: ActivityRow): ActivityLog {
  return {
    id: row.id,
    timestamp: row.created_at,
    itemId: row.item_id,
    itemName: row.item_name,
    location: row.location,
    condition: row.condition ?? '',
    officer: row.officer ?? 'Petugas',
    action: row.action,
    notes: row.notes ?? '',
    type: row.type as ActivityLog['type'],
  }
}

function mapLocation(row: LocationRow): Location {
  return { id: row.id, code: row.code, name: row.name }
}

function mapOfficer(row: OfficerRow): Officer {
  return { id: row.id, name: row.name, position: row.position ?? '', unit: row.unit ?? '' }
}

function getPublicItemUrl(itemId: string): string {
  return `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(itemId)}`
}

function makeLocationCode(name: string): string {
  const normalized = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)
  return normalized || `LOC${Date.now()}`
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

async function getItemRows(): Promise<ItemRow[]> {
  const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

async function getActivitiesForItem(itemId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapActivity)
}

async function insertActivity(payload: {
  item_id: string
  item_name: string
  location: string
  condition?: string | null
  officer?: string | null
  action: string
  notes?: string | null
  type: string
}): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert(payload)
  if (error) throw error
}

export async function getInventoryList(searchOrFilters: string | InventoryFilters = '', page = 1, pageSize = 20): Promise<InventoryListResult> {
  const rows = await getItemRows()

  // Fetch last scan timestamps from activity_logs
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('item_id, created_at')
    .order('created_at', { ascending: false })

  const lastScanMap: Record<string, string> = {}
  if (logs) {
    for (const log of logs) {
      if (!lastScanMap[log.item_id]) {
        lastScanMap[log.item_id] = log.created_at
      }
    }
  }

  const details = rows.map((row) => {
    const item = mapItem(row)
    item.lastScan = lastScanMap[row.id] ?? '-'
    return item
  })

  const filters = typeof searchOrFilters === 'string' ? { query: searchOrFilters } : searchOrFilters
  return paginate(filterInventoryItems(details, filters), page, pageSize)
}

export async function getAllItems(): Promise<ItemDetail[]> {
  const rows = await getItemRows()

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('item_id, created_at')
    .order('created_at', { ascending: false })

  const lastScanMap: Record<string, string> = {}
  if (logs) {
    for (const log of logs) {
      if (!lastScanMap[log.item_id]) {
        lastScanMap[log.item_id] = log.created_at
      }
    }
  }

  return rows.map((row) => {
    const item = mapItem(row)
    item.lastScan = lastScanMap[row.id] ?? '-'
    return item
  })
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [items, activities] = await Promise.all([getAllItems(), getActivityLog(1, 5, 'semua')])
  return buildDashboardStats(items, activities.activities)
}

export async function getItemDetail(itemId: string): Promise<ItemDetail> {
  const normalized = itemId.trim().toUpperCase()
  const { data, error } = await supabase.from('items').select('*').eq('id', normalized).maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`Barang dengan ID "${normalized}" tidak ditemukan.`)

  const history = await getActivitiesForItem(normalized)
  return mapItem(data, history)
}

export async function addItem(form: ItemFormData): Promise<ItemDetail> {
  const { count, error: countError } = await supabase.from('items').select('id', { count: 'exact', head: true })
  if (countError) throw countError

  const id = `LPT-BRG-${String((count ?? 0) + 1).padStart(4, '0')}`
  const payload = {
    id,
    name: form.name.trim(),
    category: form.category.trim() || null,
    brand: form.brand.trim() || null,
    serial_number: form.serialNumber.trim() || null,
    location: form.location.trim(),
    officer: form.officer.trim() || null,
    condition: form.condition || 'Baik',
    status: 'Aktif',
    qr_link: getPublicItemUrl(id),
    notes: form.notes.trim() || null,
  }

  const { data, error } = await supabase.from('items').insert(payload).select().single()
  if (error) throw error

  await insertActivity({
    item_id: id,
    item_name: payload.name,
    location: payload.location,
    condition: payload.condition,
    officer: payload.officer,
    action: 'Barang Ditambahkan',
    notes: payload.notes,
    type: 'verification',
  })

  return mapItem(data)
}

export async function saveVerification(item: ItemDetail, condition: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ condition, updated_at: new Date().toISOString() })
    .eq('id', item.id)

  if (error) throw error

  await insertActivity({
    item_id: item.id,
    item_name: item.name,
    location: item.location,
    condition,
    officer: item.officer || 'Petugas',
    action: 'Verifikasi Rutin',
    notes: notes.trim() || null,
    type: 'verification',
  })
}

export async function saveMutation(item: ItemDetail, newLocation: string, notes: string): Promise<void> {
  const location = newLocation.trim()
  const { error } = await supabase
    .from('items')
    .update({ location, updated_at: new Date().toISOString() })
    .eq('id', item.id)

  if (error) throw error

  await ensureLocation(location)
  await insertActivity({
    item_id: item.id,
    item_name: item.name,
    location: `${item.location} → ${location}`,
    condition: item.condition,
    officer: item.officer || 'Petugas',
    action: 'Mutasi',
    notes: notes.trim() || null,
    type: 'mutation',
  })
}

export async function saveReport(item: ItemDetail, issueType: string, detail: string): Promise<void> {
  const status = issueType.toLowerCase().includes('hilang')
    ? 'Hilang'
    : issueType.toLowerCase().includes('berat')
      ? 'Afkir'
      : 'Perbaikan'

  const { error } = await supabase
    .from('items')
    .update({ condition: issueType, status, updated_at: new Date().toISOString() })
    .eq('id', item.id)

  if (error) throw error

  await insertActivity({
    item_id: item.id,
    item_name: item.name,
    location: item.location,
    condition: issueType,
    officer: item.officer || 'Petugas',
    action: `Lapor Masalah: ${issueType}`,
    notes: detail.trim() || null,
    type: 'report',
  })
}

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase.from('locations').select('*').order('name')
  if (error) throw error
  return (data ?? []).map(mapLocation)
}

export async function ensureLocation(name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return

  const { data, error } = await supabase.from('locations').select('id').ilike('name', trimmed).maybeSingle()
  if (error) throw error
  if (data) return

  const { error: insertError } = await supabase.from('locations').insert({ code: makeLocationCode(trimmed), name: trimmed })
  if (insertError) throw insertError
}

export async function addLocation(name: string): Promise<void> {
  await ensureLocation(name)
}

export async function deleteLocation(id: number): Promise<void> {
  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) throw error
}

export async function getOfficers(): Promise<Officer[]> {
  const { data, error } = await supabase.from('officers').select('*').order('name')
  if (error) throw error
  return (data ?? []).map(mapOfficer)
}

export async function addOfficer(payload: Omit<Officer, 'id'>): Promise<void> {
  const { error } = await supabase.from('officers').insert({
    name: payload.name.trim(),
    position: payload.position.trim() || null,
    unit: payload.unit.trim() || null,
  })

  if (error) throw error
}

export async function deleteOfficer(id: number): Promise<void> {
  const { error } = await supabase.from('officers').delete().eq('id', id)
  if (error) throw error
}

export async function getActivityLog(
  page = 1,
  pageSize = 30,
  filter: 'semua' | 'verification' | 'mutation' | 'report' = 'semua',
): Promise<{ activities: ActivityLog[]; total: number; page: number; pageSize: number }> {
  let query = supabase.from('activity_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (filter !== 'semua') {
    query = query.eq('type', filter)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await query.range(from, to)

  if (error) throw error
  return { activities: (data ?? []).map(mapActivity), total: count ?? 0, page, pageSize }
}

export async function getNotifications(): Promise<ActivityLog[]> {
  const items = await getAllItems()
  return buildNotificationsFromItems(items)
}

export async function getSystemProfile(): Promise<SystemProfile> {
  const { data, error } = await supabase.from('system_profiles').select('*').eq('id', 1).maybeSingle()
  if (error) throw error

  const profile = data as (ProfileRow & { pin?: string }) | null
  return {
    institutionName: profile?.institution_name ?? 'Lapas Kelas IIB Tanjung',
    address: profile?.address ?? '',
    activeOfficer: profile?.active_officer ?? 'Admin',
    pin: profile?.pin ?? '1234',
  }
}

export async function saveSystemProfile(profile: SystemProfile): Promise<void> {
  const { error } = await supabase.from('system_profiles').upsert({
    id: 1,
    institution_name: profile.institutionName,
    address: profile.address,
    active_officer: profile.activeOfficer,
    pin: profile.pin,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

export async function verifyPin(pin: string): Promise<boolean> {
  const profile = await getSystemProfile()
  return profile.pin === pin
}

export async function changePin(newPin: string): Promise<void> {
  const { error } = await supabase.from('system_profiles').update({ pin: newPin, updated_at: new Date().toISOString() }).eq('id', 1)
  if (error) throw error
}

export function getServiceErrorMessage(error: unknown): string {
  return toError(error).message
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', itemId)
  if (error) throw error
}
