'use client'

import { useMemo, useState } from 'react'
import {
  createMessage,
  deleteMessage,
  getThreadMessages,
  updateMessageStatus,
  type Message,
  type User,
} from '@/lib/store'

type Props = {
  msg: Message
  currentUser: User
  onRefresh?: () => void
}

const roleMeta: Record<string, { bg: string; color: string; label: string }> = {
  admin: { bg: 'rgba(139,34,34,0.10)', color: 'var(--accent-red)',    label: '🛡 Admin' },
  agent: { bg: 'rgba(43,74,107,0.10)',  color: 'var(--accent-indigo)', label: '🏠 Agent' },
  user:  { bg: 'rgba(74,103,65,0.10)',  color: 'var(--accent-sage)',   label: '👤 User'  },
}

function Avatar({ name, role, size = 36 }: { name: string; role: string; size?: number }) {
  const meta = roleMeta[role] ?? roleMeta.user
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: meta.color, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.38, fontWeight: 600,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// Calls the API to delete from DB, then removes from localStorage
async function deleteMessageEverywhere(id: string, threadId: string) {
  try {
    await fetch(`/api/messages/${encodeURIComponent(id)}?threadId=${encodeURIComponent(threadId)}`, {
      method: 'DELETE',
    })
  } catch {
    // If network fails, still delete locally
  }
  // Always remove from localStorage store
  deleteMessage(id)
  // Also remove all thread replies
  const { getMessages } = await import('@/lib/store')
  const all = getMessages().filter((m: Message) => m.threadId === threadId)
  all.forEach((m: Message) => deleteMessage(m.id))
}

export default function MessageThread({ msg, currentUser, onRefresh }: Props) {
  const [replyText, setReplyText]   = useState('')
  const [replying, setReplying]     = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  // Get ALL messages in this thread sorted by time, deduplicated by id
  const allThreadMessages = useMemo(() => {
    const msgs = getThreadMessages(msg.threadId)
    // Deduplicate by id in case of any duplicates
    const seen = new Set<string>()
    return msgs.filter((m: Message) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
  }, [msg.threadId])

  const replyCount = allThreadMessages.length - 1  // exclude root

  const openReply = () => {
    if (msg.status === 'new') updateMessageStatus(msg.id, 'read')
    setReplying(true)
  }

  const handleReply = () => {
    if (!replyText.trim()) return
    createMessage({
      threadId:  msg.threadId,
      type:      'reply',
      fromId:    currentUser.id,
      fromRole:  currentUser.role as 'admin' | 'agent' | 'user',
      fromName:  currentUser.name,
      fromEmail: currentUser.email,
      toId:    msg.fromId === currentUser.id ? msg.toId    : msg.fromId,
      toRole:  msg.fromId === currentUser.id ? msg.toRole  : msg.fromRole,
      toName:  msg.fromId === currentUser.id ? msg.toName  : msg.fromName,
      toEmail: msg.fromId === currentUser.id ? msg.toEmail : msg.fromEmail,
      propertyId: msg.propertyId,
      subject:    msg.subject,
      message:    replyText,
    })
    updateMessageStatus(msg.id, 'replied')
    setReplyText('')
    setReplying(false)
    onRefresh?.()
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteMessageEverywhere(msg.id, msg.threadId)
    onRefresh?.()
  }

  const isNew = msg.status === 'new'

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: `1px solid ${isNew ? 'var(--accent-red)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: 16,
    }}>

      {/* ── Header bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px',
        background: isNew ? 'rgba(139,34,34,0.04)' : 'var(--paper-warm)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '3px 10px', borderRadius: 20, fontWeight: 600,
            background: msg.type === 'contact'
              ? 'rgba(184,150,46,0.12)' : msg.type === 'inquiry'
              ? 'rgba(43,74,107,0.10)' : 'rgba(74,103,65,0.10)',
            color: msg.type === 'contact'
              ? 'var(--accent-gold)' : msg.type === 'inquiry'
              ? 'var(--accent-indigo)' : 'var(--accent-sage)',
          }}>
            {msg.type === 'contact' ? '✉ Contact' : msg.type === 'inquiry' ? '🔍 Inquiry' : '💬 Direct'}
          </span>
          {msg.subject && (
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{msg.subject}</span>
          )}
          {replyCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              💬 {replyCount} repl{replyCount === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isNew && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              padding: '3px 8px', background: 'var(--accent-red)', color: 'white', borderRadius: 20,
            }}>New</span>
          )}
          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
            {new Date(msg.createdAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* ── Chat bubbles (all messages in thread, deduped) ── */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {allThreadMessages.map((item: Message, index: number) => {
          const isMe      = item.fromId === currentUser.id
          const meta      = roleMeta[item.fromRole] ?? roleMeta.user
          const shortName = item.fromName.includes('/')
            ? item.fromName.split('/')[0].trim()
            : item.fromName

          return (
            <div key={`${item.id}-${index}`} style={{
              display: 'flex',
              flexDirection: isMe ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 10,
            }}>
              <Avatar name={item.fromName} role={item.fromRole} size={34} />

              <div style={{
                maxWidth: '72%', display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  flexDirection: isMe ? 'row-reverse' : 'row',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{shortName}</span>
                  <span style={{
                    fontSize: 10, padding: '1px 7px', borderRadius: 20,
                    background: meta.bg, color: meta.color, fontWeight: 500,
                  }}>{meta.label}</span>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: isMe ? 'var(--accent-indigo)' : 'var(--paper-warm)',
                  color: isMe ? 'white' : 'var(--ink-soft)',
                  borderTop: isMe ? 'none' : '1px solid var(--border)',
                  borderRight: isMe ? 'none' : '1px solid var(--border)',
                  borderBottom: isMe ? 'none' : '1px solid var(--border)',
                  borderLeft: isMe ? 'none' : '1px solid var(--border)',
                  fontSize: 14, lineHeight: 1.7,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {item.message}
                </div>

                <span style={{ fontSize: 10, color: 'var(--ink-muted)', paddingInline: 2 }}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Reply composer ── */}
      {replying ? (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 18px',
          background: 'var(--paper)',
        }}>
          <textarea
            autoFocus
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }}
            rows={3}
            placeholder="Write your reply… (Enter to send · Shift+Enter for new line)"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px', resize: 'vertical',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--ink)', background: 'var(--card-bg)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setReplying(false); setReplyText('') }}
              style={{
                padding: '8px 18px', fontSize: 13, cursor: 'pointer',
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--ink-muted)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleReply}
              disabled={!replyText.trim()}
              style={{ padding: '8px 22px', fontSize: 13 }}
            >
              Send Reply ↑
            </button>
          </div>
        </div>
      ) : (
        /* ── Action bar ── */
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--paper-warm)',
        }}>
          <button
            className="btn-primary"
            onClick={openReply}
            style={{ padding: '8px 22px', fontSize: 13 }}
          >
            ↩ Reply
          </button>

          {delConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Delete this whole thread?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                  background: 'var(--accent-red)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setDelConfirm(false)}
                style={{
                  padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', color: 'var(--ink-muted)', fontFamily: 'var(--font-body)',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDelConfirm(true)}
              style={{
                padding: '7px 16px', fontSize: 12, cursor: 'pointer',
                background: 'none',
                border: '1px solid rgba(139,34,34,0.25)',
                borderRadius: 'var(--radius)', color: 'var(--accent-red)',
                fontFamily: 'var(--font-body)',
              }}
            >
              🗑 Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
