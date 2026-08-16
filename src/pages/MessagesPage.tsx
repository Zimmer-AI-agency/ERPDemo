import { useState } from 'react'
import { Send } from 'lucide-react'
import { MANAGER_CONTACTS } from '../data/garment'
import { DEPT_LABELS } from '../data/rbac'
import { useAuth } from '../store/useAuth'
import { useDemo } from '../store/useDemo'
import { Button, Card, EmptyState, PageHeader, inputClass } from '../components/ui'

/** Acting on an alert should not mean leaving the product for WhatsApp. The
 *  alert panel opens straight into this page with the message already sent. */
export function MessagesPage() {
  const me = useAuth((s) => s.userName)
  const { conversations, sendMessage } = useDemo()
  const contacts = MANAGER_CONTACTS.filter((c) => c.name !== me)
  const [activeId, setActiveId] = useState(contacts[0]?.id ?? '')
  const [draft, setDraft] = useState('')

  const contact = contacts.find((c) => c.id === activeId)
  const thread = conversations.find((c) => c.contactId === activeId)

  function send() {
    if (!draft.trim() || !contact) return
    sendMessage(contact.id, draft.trim())
    setDraft('')
  }

  return (
    <>
      <PageHeader title="گفتگوی داخلی" subtitle="ارتباط مستقیم مدیران دپارتمان‌ها داخل زیمر" />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card as="div" className="overflow-hidden">
          <ul className="divide-y divide-line">
            {contacts.map((c) => {
              const last = conversations.find((cv) => cv.contactId === c.id)?.messages.at(-1)
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveId(c.id)}
                    className={`w-full px-4 py-3 text-start transition-colors ${
                      c.id === activeId ? 'bg-brand-tint' : 'hover:bg-canvas'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`size-2 shrink-0 rounded-full ${c.online ? 'bg-ok' : 'bg-line'}`}
                        aria-hidden
                      />
                      <span className="text-[13px] font-medium">{c.name}</span>
                    </span>
                    <span className="mt-1 block text-xs text-ink-soft">
                      {c.title} · {DEPT_LABELS[c.dept]}
                    </span>
                    <span className="mt-1 block truncate text-xs text-ink-soft">
                      {last ? last.text : c.online ? 'آنلاین' : `آخرین فعالیت ${c.lastActive}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card as="div" className="flex min-h-[26rem] flex-col">
          <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold">{contact?.name}</h2>
              <p className="mt-0.5 text-xs text-ink-soft">
                {contact?.online ? 'آنلاین' : `آخرین فعالیت ${contact?.lastActive}`}
              </p>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {thread?.messages.length ? (
              thread.messages.map((m) => {
                const mine = m.from === 'me'
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] rounded-[12px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        mine ? 'bg-brand text-white' : 'bg-canvas'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      <p className={`mt-1.5 text-xs ${mine ? 'text-white/70' : 'text-ink-soft'}`}>
                        {mine ? me : contact?.name} · {m.at}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <EmptyState
                title="هنوز پیامی رد و بدل نشده است."
                hint="می‌توانید از پنل هشدارها مستقیماً برای این همکار پیام بفرستید."
              />
            )}
          </div>

          <footer className="flex gap-2 border-t border-line px-5 py-3.5">
            <input
              className={inputClass}
              placeholder="پیام خود را بنویسید..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <Button variant="primary" onClick={send} disabled={!draft.trim()}>
              <Send size={16} strokeWidth={1.5} />
              ارسال
            </Button>
          </footer>
        </Card>
      </div>
    </>
  )
}
