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

export function latestZaloPrivateChatId(payload: unknown): string | null {
  const chats = collectZaloChats(payload)
  for (let i = chats.length - 1; i >= 0; i--) {
    if (chats[i].kind === 'private') return chats[i].id
  }
  return null
}
