// ─────────────────────────────────────────────────────────
// localStorage store — all roles, all data
// ─────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'agent' | 'user'
  avatar?: string
  phone?: string
  bio?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  dateOfBirth?: string
  nationality?: string
  language?: string
  lineId?: string          // popular in Japan
  wechatId?: string
  website?: string
  specialties?: string     // for agents
  yearsExperience?: string // for agents
  prefLang?: 'en' | 'ja'
  notifications?: boolean
  resetToken?: string
  createdAt: string
}

export interface Property {
  id: string
  userId: string
  agentId?: string
  title: string
  titleJa: string
  price: number
  priceUnit: 'jpy' | 'usd'
  type: 'sale' | 'rent'
  area: string
  city: string
  rooms: string
  size: number
  floor?: number
  yearBuilt?: number
  station?: string
  description: string
  descriptionJa: string
  imageUrl: string          // primary image (backward compatible)
  images?: string[]         // up to 3 images (includes imageUrl at [0])
  isFeatured: boolean
  isActive: boolean
  views: number
  createdAt: string
}

// Message types:
// 'contact'  — from public Contact page  → goes to Admin
// 'inquiry'  — user contacts agent via property detail page → goes to Agent
// 'direct'   — admin/agent sends direct message to agent/user → goes to recipient
// 'reply'    — agent replies to user inquiry → goes to User inbox
export type MessageRole = 'admin' | 'agent' | 'user'

export type Message = {
  id: string
  threadId: string
  type: 'direct' | 'inquiry' | 'contact' | 'reply'

  fromId: string
  fromRole: MessageRole
  fromName: string
  fromEmail: string

  toId: string
  toRole: MessageRole
  toName: string
  toEmail: string

  propertyId?: string
  subject?: string
  message: string

  createdAt: string
  status: 'new' | 'read' | 'replied'
}
export interface SavedProperty {
  userId: string
  propertyId: string
  savedAt: string
}

// ── Helpers ──────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function save(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(val))
}

function normalizeId(id?: string) {
  if (!id) return ''
  return String(id).replace(/^db_/, '')
}

function idsMatch(a?: string, b?: string) {
  if (!a || !b) return false
  return a === b || normalizeId(a) === normalizeId(b)
}

function userMatches(user: User | undefined, targetId?: string, targetEmail?: string) {
  if (!user) return false
  if (targetEmail && user.email.toLowerCase() === String(targetEmail).toLowerCase()) return true
  if (targetId && idsMatch(user.id, targetId)) return true
  return false
}

// ── Seed ────────────────────────────────────────────────
const SEED_USERS: User[] = [
  { id:'u1', name:'Admin User', email:'admin@japanproperty.jp', passwordHash:'admin123', role:'admin', phone:'03-0000-0001', bio:'Site administrator.', createdAt:'2024-01-01T00:00:00Z' },
  { id:'u2', name:'田中 健一 / Kenichi Tanaka', email:'agent@japanproperty.jp', passwordHash:'agent123', role:'agent', phone:'03-1234-5678', bio:'Senior property specialist with 10+ years experience in Tokyo and Kyoto luxury properties. Bilingual EN/JA.', createdAt:'2024-01-02T00:00:00Z' },
  { id:'u3', name:'山田 花子 / Hanako Yamada', email:'user@japanproperty.jp', passwordHash:'user123', role:'user', createdAt:'2024-01-03T00:00:00Z' },
]

const SEED_PROPERTIES: Property[] = [
  { id:'p1',userId:'u2',agentId:'u2',title:'Luxury Penthouse Shibuya',titleJa:'渋谷区ラグジュアリーペントハウス',price:380000000,priceUnit:'jpy',type:'sale',area:'Shibuya',city:'Tokyo',rooms:'3LDK',size:142,floor:28,yearBuilt:2019,station:'渋谷駅 徒歩3分',description:'Exceptional penthouse on the 28th floor with panoramic Tokyo views.',descriptionJa:'東京を一望するペントハウス。',imageUrl:'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',isFeatured:true,isActive:true,views:0,createdAt:'2024-01-10T00:00:00Z'},
  { id:'p2',userId:'u2',agentId:'u2',title:'Traditional Machiya Kyoto',titleJa:'京都・町家リノベーション',price:85000000,priceUnit:'jpy',type:'sale',area:'Higashiyama',city:'Kyoto',rooms:'4K',size:112,floor:2,yearBuilt:1968,station:'東山駅 徒歩5分',description:'Masterfully restored 1968 machiya townhouse.',descriptionJa:'1968年築の京町家。',imageUrl:'https://images.unsplash.com/photo-1493997181344-712f2f19d87a?w=600&q=80',isFeatured:true,isActive:true,views:0,createdAt:'2024-01-11T00:00:00Z'},
  { id:'p3',userId:'u2',agentId:'u2',title:'Modern Apartment Shinjuku',titleJa:'新宿区モダンアパートメント',price:280000,priceUnit:'jpy',type:'rent',area:'Shinjuku',city:'Tokyo',rooms:'1LDK',size:52,floor:14,yearBuilt:2019,station:'新宿駅 徒歩5分',description:'Contemporary 1LDK in Shinjuku.',descriptionJa:'新宿のモダンな1LDK。',imageUrl:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',isFeatured:true,isActive:true,views:0,createdAt:'2024-01-12T00:00:00Z'},
  { id:'p4',userId:'u2',agentId:'u2',title:'Seaside Villa Kamakura',titleJa:'鎌倉・海辺の一戸建て',price:155000000,priceUnit:'jpy',type:'sale',area:'Kamakura',city:'Kanagawa',rooms:'4LDK',size:210,floor:2,yearBuilt:2015,station:'鎌倉駅 徒歩12分',description:'Stunning seaside house.',descriptionJa:'鎌倉の海辺の邸宅。',imageUrl:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',isFeatured:false,isActive:true,views:0,createdAt:'2024-01-13T00:00:00Z'},
  { id:'p5',userId:'u2',agentId:'u2',title:'Studio Namba Osaka',titleJa:'大阪・なんばスタジオ',price:128000,priceUnit:'jpy',type:'rent',area:'Namba',city:'Osaka',rooms:'1K',size:32,floor:8,yearBuilt:2021,station:'なんば駅 徒歩2分',description:'Compact modern studio.',descriptionJa:'なんばのスタジオ。',imageUrl:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',isFeatured:false,isActive:true,views:0,createdAt:'2024-01-14T00:00:00Z'},
  { id:'p6',userId:'u2',agentId:'u2',title:'Heritage Villa Hakone',titleJa:'箱根・歴史的別荘',price:220000000,priceUnit:'jpy',type:'sale',area:'Hakone',city:'Kanagawa',rooms:'6LDK',size:380,floor:2,yearBuilt:1990,station:'箱根湯本駅',description:'Historic villa with Mt. Fuji views.',descriptionJa:'富士山を望む別荘。',imageUrl:'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',isFeatured:false,isActive:true,views:0,createdAt:'2024-01-15T00:00:00Z'},
  { id:'p7',userId:'u2',agentId:'u2',title:'Central Apartment Fukuoka',titleJa:'福岡市中央区マンション',price:165000,priceUnit:'jpy',type:'rent',area:'Chuo',city:'Fukuoka',rooms:'2LDK',size:68,floor:5,yearBuilt:2018,station:'天神駅 徒歩3分',description:'Spacious 2LDK near Tenjin.',descriptionJa:'天神駅近くの2LDK。',imageUrl:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',isFeatured:false,isActive:true,views:0,createdAt:'2024-01-16T00:00:00Z'},
  { id:'p8',userId:'u2',agentId:'u2',title:'Snow Country Lodge Niseko',titleJa:'ニセコ・スノーカントリーロッジ',price:95000000,priceUnit:'jpy',type:'sale',area:'Niseko',city:'Hokkaido',rooms:'5LDK',size:280,floor:2,yearBuilt:2010,station:'ニセコ駅',description:'Ski-in ski-out lodge.',descriptionJa:'ニセコのスキーロッジ。',imageUrl:'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80',isFeatured:false,isActive:true,views:0,createdAt:'2024-01-17T00:00:00Z'},
]

// ── Init ─────────────────────────────────────────────────
export function initStore() {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem('jp_seeded')) {
    localStorage.setItem('jp_users',      JSON.stringify(SEED_USERS))
    localStorage.setItem('jp_properties', JSON.stringify(SEED_PROPERTIES))
    localStorage.setItem('jp_messages',   JSON.stringify([]))
    localStorage.setItem('jp_saved',      JSON.stringify([]))
    localStorage.setItem('jp_seeded',     '1')
  }
}

// ── Users ─────────────────────────────────────────────────
export const getUsers         = (): User[]  => load('jp_users', SEED_USERS)
export const getUserById      = (id: string) => getUsers().find(u => u.id === id)
export const getUserByEmail   = (email: string) => getUsers().find(u => u.email.toLowerCase() === email.toLowerCase())
export const getAgents        = () => getUsers().filter(u => u.role === 'agent')
export const getAdminId       = () => getUsers().find(u => u.role === 'admin')?.id || 'u1'

export function createUser(u: Omit<User,'id'|'createdAt'>): User {
  const users = getUsers()
  const newUser: User = { ...u, id: 'u'+Date.now(), createdAt: new Date().toISOString() }
  save('jp_users', [...users, newUser])
  return newUser
}
export function updateUser(id: string, updates: Partial<User>) {
  save('jp_users', getUsers().map(u => u.id === id ? { ...u, ...updates } : u))
}

export function deleteUser(id: string) {
  save('jp_users', getUsers().filter(u => u.id !== id))
  save('jp_saved', getSaved().filter(s => s.userId !== id))
  save(
    'jp_messages',
    getMessages().filter(
      m =>
        m.fromId !== id &&
        m.toId !== id
    )
  )
  save('jp_properties', getProperties().filter(p => p.userId !== id && p.agentId !== id))

  try {
    const current = localStorage.getItem('jp_current_user')
    if (current) {
      const parsed = JSON.parse(current)
      if (String(parsed.id) === String(id)) {
        localStorage.removeItem('jp_current_user')
        localStorage.removeItem('jp_token')
        localStorage.removeItem('jp_role')
        sessionStorage.removeItem('jp_current_user')
        sessionStorage.removeItem('jp_token')
        sessionStorage.removeItem('jp_role')
      }
    }
  } catch {
    localStorage.removeItem('jp_current_user')
    localStorage.removeItem('jp_token')
    localStorage.removeItem('jp_role')
    sessionStorage.removeItem('jp_current_user')
    sessionStorage.removeItem('jp_token')
    sessionStorage.removeItem('jp_role')
  }
}

// ── Properties ────────────────────────────────────────────
export const getProperties    = (): Property[]  => load('jp_properties', SEED_PROPERTIES)
export const getPropertyById  = (id: string) => getProperties().find(p => p.id === id)

export function createProperty(p: Omit<Property,'id'|'createdAt'|'views'>): Property {
  const props = getProperties()
  const newP: Property = { ...p, id: 'prop'+Date.now(), views: 0, createdAt: new Date().toISOString() }
  save('jp_properties', [...props, newP])
  return newP
}
export function updateProperty(id: string, updates: Partial<Property>) {
  save('jp_properties', getProperties().map(p => p.id === id ? { ...p, ...updates } : p))
}
export function deleteProperty(id: string) {
  save('jp_properties', getProperties().filter(p => p.id !== id))
}

// ── Messages ─────────────────────────────────────────────
export const getMessages = (): Message[] => load('jp_messages', [])

// Admin sees: contact form messages + direct messages sent to admin
export const getAdminMessages = (adminId: string): Message[] => {
  const admin = getUserById(adminId)
  return getMessages().filter(m =>
    m.type === 'contact' ||
    (
      m.fromId !== adminId &&
      userMatches(admin, m.toId, m.toEmail)
    )
  )
}

export const getAgentMessages = (agentId: string): Message[] => {
  const agent = getUserById(agentId)
  return getMessages().filter(m =>
    (m.type === 'inquiry' || m.type === 'direct' || m.type === 'reply') &&
    userMatches(agent, m.toId, m.toEmail)
  )
}

export const getAllAgentMessages = (agentId: string): Message[] => {
  const agent = getUserById(agentId)
  return getMessages().filter(m =>
    userMatches(agent, m.toId, m.toEmail)
  )
}

export const getUserMessages = (userId: string): Message[] => {
  const user = getUserById(userId)
  return getMessages().filter(m =>
    (m.type === 'reply' || m.type === 'direct' || m.type === 'inquiry') &&
    userMatches(user, m.toId, m.toEmail)
  )
}

// Unread counts
export const getAgentUnreadCount = (agentId: string) =>
  getAgentMessages(agentId).filter(m => m.status === 'new').length

export const getAdminUnreadCount = (adminId: string) =>
  getAdminMessages(adminId).filter(m => m.status === 'new').length

export const getUserUnreadCount = (userId: string) =>
  getUserMessages(userId).filter(m => m.status === 'new').length

export function createMessage(input: Omit<Message, 'id' | 'createdAt' | 'status'>) {
  const newMessage: Message = {
    ...input,
    id: makeUniqueId('msg'),
    createdAt: new Date().toISOString(),
    status: 'new',
  }

  // 1. Save to localStorage immediately (works offline too)
  save('jp_messages', [newMessage, ...getMessages()])

  // 2. Fire-and-forget sync to DB (non-blocking)
  if (typeof window !== 'undefined') {
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMessage),
    }).catch(() => { /* DB not available — localStorage already saved */ })
  }

  return newMessage
}

// Merge messages from DB into localStorage (called on page load when DB is connected)
export function mergeDBMessages(dbMessages: Message[]) {
  if (!dbMessages?.length) return
  const existing = getMessages()
  const existingIds = new Set(existing.map(m => m.id))
  const toAdd = dbMessages.filter(m => !existingIds.has(m.id))
  if (toAdd.length > 0) {
    save('jp_messages', [...existing, ...toAdd].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  }
}

// Get all messages belonging to a thread (by threadId)
export function getThreadMessages(threadId: string): Message[] {
  return getMessages().filter(m => m.threadId === threadId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}
// Add a reply to a message thread — creates a new reply Message in the same thread
export function addReplyToMessage(
  messageId: string,
  fromId: string,
  fromName: string,
  text: string
) {
  const original = getMessages().find(m => m.id === messageId)
  if (!original) return

  // Mark original as replied
  updateMessageStatus(messageId, 'replied')

  // Create a new reply message in the same thread
  const replyMsg: Message = {
    id: makeUniqueId('msg'),
    threadId: original.threadId,
    type: 'reply',
    fromId,
    fromRole: (getUserById(fromId)?.role ?? 'user') as import('./store').MessageRole,
    fromName,
    fromEmail: getUserById(fromId)?.email ?? '',
    toId: original.fromId,
    toRole: original.fromRole,
    toName: original.fromName,
    toEmail: original.fromEmail,
    propertyId: original.propertyId,
    subject: original.subject,
    message: text,
    createdAt: new Date().toISOString(),
    status: 'new',
  }

  save('jp_messages', [replyMsg, ...getMessages()])

  // Sync reply to DB non-blocking
  if (typeof window !== 'undefined') {
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(replyMsg),
    }).catch(() => {})
  }

  return replyMsg
}

function makeUniqueId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function updateMessageStatus(id: string, status: Message['status']) {
  save('jp_messages', getMessages().map(m => m.id === id ? { ...m, status } : m))
  // Sync to DB non-blocking
  if (typeof window !== 'undefined') {
    fetch(`/api/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }
}
export function deleteMessage(id: string) {
  save('jp_messages', getMessages().filter(m => m.id !== id))
}

// ── Saved ─────────────────────────────────────────────────
export const getSaved         = (): SavedProperty[]  => load('jp_saved', [])
export const getSavedByUser   = (userId: string) => getSaved().filter(s => s.userId === userId)
export const isSaved          = (userId: string, propertyId: string) => getSaved().some(s => s.userId === userId && s.propertyId === propertyId)

// Merge a list of users from DB into localStorage (used when admin logs in via MySQL)
export function syncUsersFromDB(dbUsers: Array<{id: number|string; name: string; email: string; role: string; phone?: string; created_at?: string}>) {
  const existing = getUsers()
  const existingEmails = new Set(existing.map(u => u.email.toLowerCase()))
  const toAdd: User[] = dbUsers
    .filter(d => !existingEmails.has(String(d.email).toLowerCase()))
    .map(d => ({
      id: 'db_' + String(d.id),
      name: d.name,
      email: d.email,
      passwordHash: '(from database)',
      role: (d.role as 'admin'|'agent'|'user') || 'user',
      phone: d.phone,
      createdAt: d.created_at || new Date().toISOString(),
    }))
  if (toAdd.length > 0) {
    save('jp_users', [...existing, ...toAdd])
  }
}

export function toggleSave(userId: string, propertyId: string): boolean {
  const saved = getSaved()
  const exists = saved.some(s => s.userId === userId && s.propertyId === propertyId)
  if (exists) {
    save('jp_saved', saved.filter(s => !(s.userId === userId && s.propertyId === propertyId)))
    return false
  }
  save('jp_saved', [...saved, { userId, propertyId, savedAt: new Date().toISOString() }])
  return true
}

export function logoutUser() {
  localStorage.removeItem('jp_current_user')
  localStorage.removeItem('jp_token')
  localStorage.removeItem('jp_role')
  sessionStorage.removeItem('jp_current_user')
  sessionStorage.removeItem('jp_token')
  sessionStorage.removeItem('jp_role')
}
