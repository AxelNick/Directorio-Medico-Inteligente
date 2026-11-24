import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { service } from '../../data/service'
import { fieldClass, primaryClass } from '../AppShell'
import { ChatMessage, type ChatMsg } from './ChatMessage'

const MAX_LENGTH = 1000
const GREETING: ChatMsg = {
  id: 0, role: 'assistant',
  text: 'Cuéntame qué molestias tienes y te oriento hacia una especialidad. No doy diagnósticos ni indico tratamientos. Si es una emergencia, acude a urgencias.',
}

/**
 * Chat de triage operativo. Los mensajes viven solo en memoria: no se guardan ni se escriben en la consola,
 * porque pueden contener síntomas. Cada envío usa POST /api/v1/triages vía el cliente API compartido.
 */
export function AsistenteChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const sendingRef = useRef(false)
  const nextId = useRef(1)
  const endRef = useRef<HTMLLIElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }) }, [messages, sending])

  async function send() {
    const text = input.trim()
    // La referencia bloquea envíos duplicados (doble clic o Enter repetido) antes de que React actualice `sending`.
    if (!text || text.length > MAX_LENGTH || sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    setInput('')
    setMessages((items) => [...items, { id: nextId.current++, role: 'user', text }])
    try {
      const triage = await service.triage(text)
      setMessages((items) => [...items, { id: nextId.current++, role: 'assistant', triage }])
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : 'No se pudo contactar al asistente.'
      setMessages((items) => [...items, { id: nextId.current++, role: 'assistant', error }])
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void send() }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envía; Shift+Enter inserta salto de línea. No interferir con la composición de texto (IME).
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send() }
  }

  return <section className="flex flex-col rounded-[22px] border border-[#dce9e9] bg-[#f7fbfb] shadow-sm" aria-label="Chat del asistente">
    <ul role="log" aria-live="polite" aria-relevant="additions" className="flex max-h-[55vh] min-h-[280px] flex-col gap-3 overflow-y-auto p-4 sm:p-6">
      {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
      {sending && <li className="flex justify-start" role="status"><p className="rounded-2xl border border-[#dce9e9] bg-white px-4 py-3 text-sm text-[#607785]">El asistente está escribiendo…</p></li>}
      <li ref={endRef} aria-hidden="true" />
    </ul>
    <form onSubmit={onSubmit} className="border-t border-[#dce9e9] bg-white p-4 sm:p-5">
      <label htmlFor="chat-input" className="mb-2 block text-sm font-bold text-[#173454]">Describe cómo te sientes</label>
      {/* readOnly (no disabled) mientras se espera: conserva el foco y evita editar el mensaje en vuelo. */}
      <textarea id="chat-input" className={`${fieldClass} min-h-24`} value={input} maxLength={MAX_LENGTH} readOnly={sending}
        onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} aria-describedby="chat-help" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id="chat-help" className="text-xs text-[#78909a]">Enter para enviar · Shift+Enter para nueva línea · {input.length}/{MAX_LENGTH}</p>
        <button type="submit" className={primaryClass} disabled={sending || input.trim() === ''}>{sending ? 'Enviando…' : 'Enviar'}</button>
      </div>
    </form>
  </section>
}
