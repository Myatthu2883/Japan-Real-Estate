'use client'
import { useEffect } from 'react'
import { mergeDBMessages, type Message } from './store'

/**
 * On mount, fetches messages for this user from the DB and merges
 * them into localStorage so the app always has the latest data.
 */
export function useDBMessages(userId: string, role: string, onLoaded?: () => void) {
  useEffect(() => {
    if (!userId || !role) return

    fetch(`/api/messages?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`)
      .then(r => r.json())
      .then(data => {
        if (data?.messages?.length) {
          // Map DB column names to our Message shape
          const mapped: Message[] = data.messages.map((m: any) => ({
            id:        String(m.id),
            threadId:  m.thread_id   ?? m.threadId   ?? String(m.id),
            type:      m.type,
            fromId:    String(m.from_id   ?? m.fromId   ?? ''),
            fromRole:  m.from_role   ?? m.fromRole   ?? 'user',
            fromName:  m.from_name   ?? m.fromName   ?? '',
            fromEmail: m.from_email  ?? m.fromEmail  ?? '',
            toId:      String(m.to_id     ?? m.toId     ?? ''),
            toRole:    m.to_role     ?? m.toRole     ?? 'user',
            toName:    m.to_name     ?? m.toName     ?? '',
            toEmail:   m.to_email    ?? m.toEmail    ?? '',
            propertyId: m.property_id ?? m.propertyId ?? undefined,
            subject:   m.subject     ?? undefined,
            message:   m.message,
            createdAt: m.created_at  ? new Date(m.created_at).toISOString() : m.createdAt,
            status:    m.status      ?? 'new',
          }))
          mergeDBMessages(mapped)
          onLoaded?.()
        }
      })
      .catch(() => { /* DB not available, localStorage only */ })
  }, [userId, role])
}
