import { Hono } from 'hono'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number
    }
    text?: string
  }
}

const app = new Hono()

const openai = createOpenAI({
  baseURL: process.env.KODECLOUD_BASE_URL ?? 'https://api.ai.kodekloud.com/v1',
  apiKey: process.env.KODEKLOUD_API_KEY,
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/marco', (c) => {
  return c.text('polo')
})

app.post('/telegram/webhook', async (c) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET

  if (!token || !secret) {
    console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET must be set')
    return c.text('Telegram is not configured', 500)
  }

  if (c.req.header('X-Telegram-Bot-Api-Secret-Token') !== secret) {
    return c.text('Unauthorized', 401)
  }

  let update: TelegramUpdate | null
  try {
    update = await c.req.json<TelegramUpdate | null>()
  } catch {
    return c.text('Bad Request', 400)
  }

  const text = update?.message?.text
  const chatId = update?.message?.chat?.id

  if (typeof text !== 'string' || text.length === 0 || typeof chatId !== 'number') {
    return c.text('OK')
  }

  let aiText: string
  try {
    const result = await generateText({
      model: openai(process.env.KODECLOUD_MODEL ?? 'tencent/hy4-flash'),
      prompt: text,
    })
    aiText = result.text
  } catch (error) {
    console.error(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`)
    return c.text('Failed to generate AI response', 502)
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiText,
      }),
    })

    if (!response.ok) {
      console.error(`sendMessage failed with status ${response.status}`)
      return c.text('Failed to send AI response', 502)
    }
  } catch (error) {
    console.error(`sendMessage request failed: ${error instanceof Error ? error.message : String(error)}`)
    return c.text('Failed to send AI response', 502)
  }

  return c.text('OK')
})

export default app
