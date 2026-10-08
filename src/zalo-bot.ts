/** Chat Zalo Bot: chỉ nhóm mới là đích gửi nhắc quá hạn. Chat riêng với bot thì bỏ. */

export type ZaloChatKind = 'group' | 'private'

export type ZaloChatRef = { id: string; kind: ZaloChatKind }

export function zaloChatKind(chat: { chat_type?: unknown; type?: unknown }): ZaloChatKind | null {
  const raw = String(chat?.chat_type ?? chat?.type ?? '').trim().toLowerCase()
  if (raw === 'group' || raw === 'supergroup') return 'group'
  if (raw === 'private' || raw === 'user' || raw === 'personal') return 'private'
  return null
}

/** Lấy mọi chat có loại rõ ràng. Bỏ qua object không phải chat (tránh nhận nhầm id người dùng). */
export function collectZaloChats(node: unknown, parentKey = ''): ZaloChatRef[] {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap((item) => collectZaloChats(item, parentKey))
  const obj = node as Record<string, unknown>
  const found: ZaloChatRef[] = []
  const looksLikeChat = parentKey === 'chat' || obj.chat_type != null
  if (looksLikeChat && obj.id != null && obj.id !== '') {
    const kind = zaloChatKind(obj)
    if (kind) found.push({ id: String(obj.id).trim(), kind })
  }
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') found.push(...collectZaloChats(value, key))
  }
  return found
}

/** Nhóm xuất hiện cuối cùng trong payload (getUpdates xếp cũ trước). */
export function latestZaloGroupChatId(payload: unknown): string | null {
  const chats = collectZaloChats(payload)
  for (let i = chats.length - 1; i >= 0; i--) {
    if (chats[i].kind === 'group') return chats[i].id
  }
  return null
}

/** getUpdates không chạy khi webhook còn URL. Tài liệu Zalo: gọi deleteWebhook trước. */
export function zaloUpdatesBlocked(json: { ok?: boolean; description?: unknown; message?: unknown } | null, webhookUrl: string) {
  if (!json || json.ok !== false) return false
  const desc = String(json.description || json.message || '').toLowerCase()
  return !!String(webhookUrl || '').trim() || desc.includes('webhook')
}

export type ZaloOverdueGroup = { url: string; chatId: string }

/** Chỉ nhận link mời nhóm zalo.me/g/... Admin dán link, không gắn sẵn một nhóm. */
export function canonicalZaloGroupUrl(input: string): string | null {
  const raw = String(input || '').trim()
  if (!raw) return null
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try { url = new URL(withScheme) } catch { return null }
  if (!/^(www\.)?zalo\.me$/i.test(url.hostname)) return null
  const match = url.pathname.match(/^\/g\/([A-Za-z0-9_-]+)/)
  if (!match) return null
  return `https://zalo.me/g/${match[1]}`
}

export function parseZaloOverdueGroups(raw: string): ZaloOverdueGroup[] {
  try {
    const data = JSON.parse(raw || '[]')
    if (!Array.isArray(data)) return []
    const out: ZaloOverdueGroup[] = []
    for (const row of data) {
      const url = canonicalZaloGroupUrl(String(row?.url || '')) || ''
      const chatId = String(row?.chatId || row?.chat_id || '').trim()
      if (!url && !chatId) continue
      if (url && out.some((g) => g.url === url)) continue
      out.push({ url, chatId })
    }
    return out
  } catch {
    return []
  }
}

export function addZaloGroupLink(groups: ZaloOverdueGroup[], input: string): ZaloOverdueGroup[] | null {
  const url = canonicalZaloGroupUrl(input)
  if (!url) return null
  if (groups.some((g) => g.url === url)) return groups
  if (groups.length === 1 && groups[0].chatId && !groups[0].url) return [{ url, chatId: groups[0].chatId }]
  return [...groups, { url, chatId: '' }]
}

export function assignZaloGroupChat(groups: ZaloOverdueGroup[], targetUrl: string, chatId: string): ZaloOverdueGroup[] {
  const url = canonicalZaloGroupUrl(targetUrl) || ''
  const id = String(chatId || '').trim()
  if (!url || !id) return groups
  const base = groups.some((g) => g.url === url) ? groups : [...groups, { url, chatId: '' }]
  return base.map((g) => {
    if (g.url === url) return { ...g, chatId: id }
    if (g.chatId === id) return { ...g, chatId: '' }
    return g
  })
}

/** testWebhook thất bại thì Zalo không giao sự kiện, dù getWebhookInfo vẫn hiện URL. */
export function zaloDeliveryError(test: { ok?: boolean; description?: unknown; result?: { ok?: boolean; outcome?: unknown; hint?: unknown } } | null): string | null {
  const result = test?.result
  if (result?.ok === true) return null
  const outcome = String(result?.outcome || '')
  if (outcome.includes('403')) {
    return 'Cloudflare đang chặn máy chủ Zalo (HTTP 403, User-Agent Java). Trên Cloudflare của domain ddcn.bimonecadvn.com, thêm WAF Skip cho đường dẫn /api/zalo/webhook, rồi bấm Lấy Chat ID và tag bot một tin mới.'
  }
  if (!result && test?.ok === false) {
    return String(test.description || 'Zalo không kiểm tra được webhook').slice(0, 180)
  }
  if (!outcome) return null
  const hint = String(result?.hint || '').replace(/https?:\/\/\S*token\S*/gi, '').slice(0, 160)
  return `Zalo không gọi được webhook (${outcome}). ${hint}`.trim().slice(0, 240)
}

export function latestZaloPrivateChatId(payload: unknown): string | null {
  const chats = collectZaloChats(payload)
  for (let i = chats.length - 1; i >= 0; i--) {
    if (chats[i].kind === 'private') return chats[i].id
  }
  return null
}
