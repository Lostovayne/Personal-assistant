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

The bot generates an AI reply for any text message through the KODEKLOUD OpenAI-compatible endpoint (AI SDK v7, `@ai-sdk/openai`). Configure:

- `KODEKLOUD_API_KEY`: KODEKLOUD API key.
- `KODEKLOUD_BASE_URL`: default `https://api.ai.kodekloud.com/v1`.
- `KODEKLOUD_MODEL`: default `tencent/hy4-flash`.

Requests without the matching `X-Telegram-Bot-Api-Secret-Token` header are rejected. If AI generation fails, the handler responds `502`.
