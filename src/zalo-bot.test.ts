import { describe, expect, it } from 'vitest'
import { collectZaloChats, latestZaloGroupChatId, latestZaloPrivateChatId, zaloUpdatesBlocked } from './zalo-bot'

describe('zalo bot chat id', () => {
  it('does not treat a private bot chat as the group', () => {
    const payload = {
      message: {
        text: 'Hi',
        from: { id: 'user-1', type: 'private' },
        chat: { id: '3d682723576abe34e77b', chat_type: 'PRIVATE' },
      },
    }
    expect(latestZaloGroupChatId(payload)).toBeNull()
    expect(latestZaloPrivateChatId(payload)).toBe('3d682723576abe34e77b')
    expect(collectZaloChats(payload).map((c) => c.id)).not.toContain('user-1')
  })

  it('keeps the latest group chat when updates also contain a private chat', () => {
    const payload = {
      ok: true,
      result: [
        { message: { chat: { id: 'priv', type: 'private' }, text: 'test' } },
        { message: { chat: { id: 'group-a', chat_type: 'GROUP' }, text: 'trong nhóm' } },
        { message: { chat: { id: 'group-b', type: 'group' }, text: 'tin sau' } },
      ],
    }
    expect(latestZaloGroupChatId(payload)).toBe('group-b')
  })

  it('treats getUpdates as blocked while a webhook URL is set', () => {
    expect(zaloUpdatesBlocked({ ok: false, description: 'Conflict: webhook is active' }, 'https://ddcn.bimonecadvn.com/api/zalo/webhook')).toBe(true)
    expect(zaloUpdatesBlocked({ ok: false, description: 'unauthorized' }, '')).toBe(false)
    expect(zaloUpdatesBlocked({ ok: true, result: [] }, 'https://example.com/hook')).toBe(false)
  })

  it('reads a webhook event that is the update itself', () => {
    const payload = {
      event_name: 'message.text.received',
      message: { chat: { id: 'nhom-1', chat_type: 'Group' }, text: 'xin chào nhóm' },
    }
    expect(latestZaloGroupChatId(payload)).toBe('nhom-1')
  })
})
