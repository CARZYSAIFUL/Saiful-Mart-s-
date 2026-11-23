# Deploy Checklist — Saiful Mart x DropBazarBD

Tick kore kore egon. Sob tick na hole live order diben na.

## Code (agei kora ache — verify korun)
- [ ] `netlify.toml` ache (publish: `public`, functions: `netlify/functions`)
- [ ] `netlify/functions/`-e 9 ta file ache: `_lib.js`, `products.js`, `product.js`, `districts.js`, `order-preview.js`, `place-order.js`, `order-status.js`, `wallet.js`, `webhook.js`
- [ ] `public/`-e `index.html`, `styles.css`, `app.js` ache
- [ ] Code-er kothao real API token / password / phone / email nai (search korun: `DROPBAZAR_API_TOKEN` shudhu `process.env.` hisebe ache)
- [ ] `npm run check` pass kore (sob function `node --check` OK)

## GitHub (free)
- [ ] GitHub account khola ache
- [ ] Notun repo banano hoyeche (jemon `saiful-mart`)
- [ ] Project-er sob file repo-te upload/push kora hoyeche

## Netlify (free, card lage na)
- [ ] Netlify account khola ache (GitHub diye)
- [ ] Import from Git → repo select kora hoyeche
- [ ] Prothom deploy success hoyeche, free link khuleche (`https://....netlify.app`)
- [ ] Demo mode dekha jacche (SAMPLE product + "DEMO — no token" banner)

## Token (server-side only)
- [ ] DropBazar Dashboard → API ইন্টিগ্রেশন theke token copy kora hoyeche
- [ ] Token Netlify **Site settings → Environment variables**-e bosano hoyeche: key `DROPBAZAR_API_TOKEN`
- [ ] Token chat-e / code-e / frontend-e kothao deya hoy NAI
- [ ] Token bosanor pore **Trigger deploy → Deploy site** kora hoyeche

## Live test (choto order diye)
- [ ] Demo banner chole geche, asol product list asche
- [ ] Search + category filter kaj kore
- [ ] Cart add / total thik ache
- [ ] District/thana list asche
- [ ] Preview-te total thik (delivery Dhaka ৳60 / baire ৳120 / ৳2000+ free)
- [ ] Order confirm korle order number asche
- [ ] DropBazar Dashboard → Orders-e oi order-ta dekha jacche

## Webhook (optional)
- [ ] Webhook URL DropBazar-e bosano: `https://apnar-site.netlify.app/.netlify/functions/webhook`
- [ ] `DROPBAZAR_WEBHOOK_SECRET` Netlify env var-e bosano hoyeche
- [ ] Order status change hole webhook log-e event asche (Netlify → Functions → webhook → Logs)

## Go-live er pore
- [ ] Nijer WhatsApp number / support info site-e add kora hoyeche (footer-e)
- [ ] Ekta test customer order (porichito keu) diye full flow check kora hoyeche
- [ ] Domain kinte chaile Netlify → Domain settings-e add korun (optional, ~৳1000–1500/year)
