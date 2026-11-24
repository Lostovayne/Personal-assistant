```
npm install
npm run dev
```

```
open http://localhost:3000
```

## Telegram AI bot

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`, then point Telegram at the webhook (HTTPS is required for webhooks):

```
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://your-domain.example/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

The bot generates an AI reply for any text message through the Vercel AI Gateway (AI SDK v7). Configure:

- `AI_GATEWAY_API_KEY`: Vercel AI Gateway key.
- `AI_MODEL`: model string (e.g. `anthropic/claude-sonnet-5.5`). Defaults to `anthropic/claude-sonnet-5.5`.

Requests without the matching `X-Telegram-Bot-Api-Secret-Token` header are rejected. If AI generation fails, the handler responds `502`.
