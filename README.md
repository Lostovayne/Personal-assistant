```
npm install
npm run dev
```

```
open http://localhost:3000
```

## Telegram echo bot

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`, then point Telegram at the webhook (HTTPS is required for webhooks):

```
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://your-domain.example/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

The bot echoes any text message back to the chat. Requests without the matching `X-Telegram-Bot-Api-Secret-Token` header are rejected.
