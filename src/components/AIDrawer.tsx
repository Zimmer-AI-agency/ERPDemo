import { useState } from 'react'
import { SendHorizonal } from 'lucide-react'
import { SUGGESTED_QUESTIONS, answer, type AiAnswer } from '../lib/ai'
import { useDemo } from '../store/useDemo'
import { Button, Drawer, inputClass } from './ui'

interface Message {
  id: number
  from: 'user' | 'system'
  text: string
  meta?: AiAnswer
}

let messageId = 0

export function AIDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const { products, customers, orders, workOrders, shipments, skuStock, salesDelta } = useDemo()

  function ask(question: string) {
    const q = question.trim()
    if (!q) return
    const reply = answer(q, { products, customers, orders, workOrders, shipments, skuStock, salesDelta })
    setMessages((m) => [
      ...m,
      { id: ++messageId, from: 'user', text: q },
      { id: ++messageId, from: 'system', text: reply.text, meta: reply },
    ])
    setDraft('')
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="دستیار مدیریتی"
      subtitle="از اطلاعات فروش، انبار، خرید و مشتریان سؤال بپرسید"
      width={480}
    >
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {!messages.length && (
            <div>
              <p className="mb-3 text-[13px] text-ink-soft">نمونه پرسش‌ها:</p>
              <ul className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <li key={q}>
                    <button
                      onClick={() => setDraft(q)}
                      className="w-full rounded-[8px] border border-line px-3 py-2.5 text-start text-[13px] transition-colors hover:border-brand hover:bg-brand-tint/40"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-[8px] bg-canvas px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
                پاسخ‌ها از داده‌های همین دمو ساخته می‌شوند. هیچ عددی خارج از داده‌های موجود تولید
                نمی‌شود.
              </p>
            </div>
          )}

          {messages.map((m) =>
            m.from === 'user' ? (
              <p
                key={m.id}
                className="ms-auto w-fit max-w-[85%] rounded-[12px] bg-brand px-3.5 py-2.5 text-[13px] text-white"
              >
                {m.text}
              </p>
            ) : (
              <div
                key={m.id}
                className="w-fit max-w-[92%] rounded-[12px] border border-line bg-canvas px-3.5 py-3"
              >
                <p className="whitespace-pre-line text-[13px] leading-relaxed">{m.text}</p>
                {m.meta?.source && (
                  <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2.5 text-[11px] text-ink-soft">
                    <div className="flex gap-1">
                      <dt>منبع:</dt>
                      <dd>{m.meta.source}</dd>
                    </div>
                    {m.meta.period && (
                      <div className="flex gap-1">
                        <dt>بازه:</dt>
                        <dd>{m.meta.period}</dd>
                      </div>
                    )}
                    {m.meta.updatedAt && (
                      <div className="flex gap-1">
                        <dt>به‌روزرسانی:</dt>
                        <dd>{m.meta.updatedAt}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            ),
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(draft)
          }}
          className="mt-4 flex gap-2 border-t border-line pt-4"
        >
          <input
            className={inputClass}
            placeholder="سؤال خود را بنویسید"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="پرسش از دستیار"
          />
          <Button variant="primary" type="submit" aria-label="ارسال">
            <SendHorizonal size={16} strokeWidth={1.5} />
          </Button>
        </form>
      </div>
    </Drawer>
  )
}
