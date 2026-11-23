# Saiful Mart — DropBazarBD Dropshipping Store (Netlify)

Bangla/English A2Z online shop. Product DropBazarBD Partner API theke asbe, order DropBazar-e jabe — tumi shudhu lav rakhba, delivery/stock ora korbe.

**⚠️ Token kokhono chat-e, code-e, ba frontend-e diben na.**
Token thake shudhu Netlify-er Environment Variables-e (server-side).

---

## Ki ache ei project-e

| File | Ki kore |
|---|---|
| `public/index.html` + `styles.css` + `app.js` | Mobile-first storefront: search, category filter, cart, checkout (naam/mobile/address/district/thana), COD |
| `netlify/functions/products.js` | Product list/search/category — `GET /products` |
| `netlify/functions/product.js` | Ekta product-er detail — `GET /products/{id}` |
| `netlify/functions/districts.js` | District + thana list — `GET /districts`, `GET /districts/{id}/thanas` |
| `netlify/functions/order-preview.js` | Order-er total age dekha — `POST /orders/preview` (order create hoy na) |
| `netlify/functions/place-order.js` | Asol order — `POST /orders`, order number dey (201) |
| `netlify/functions/order-status.js` | Order status/track — `GET /orders/{id}` |
| `netlify/functions/wallet.js` | Wallet balance — `GET /wallet` (admin only, frontend call kore na) |
| `netlify/functions/webhook.js` | DropBazar webhook receiver, HMAC signature check kore |
| `netlify/functions/_lib.js` | Shared code: token check, DropBazar call, selling-price markup, SAMPLE products |
| `netlify.toml` | Netlify config: publish folder, functions folder, `/api/*` alias |

**Selling price:** default `suggested_price` (DropBazar-er suggest kora dam). Lav barate chaile `netlify/functions/_lib.js`-er `MARKUP_TAKA = 0` change korun — jemon `50` dile prottek product-e ৳50 lav add hobe. Selling price kokhono cost price (`price`)-er niche hote parbe na — DropBazar 422 error dibe.

**Delivery (Saiful Mart rate):** Dhaka ৳60, Dhaka-r baire ৳120, ৳2000+ order-e FREE.

**Demo mode:** Token na bosale function-gula 6 ta SAMPLE product dey, upore "DEMO — no token" lekha thake. Ete store preview kora jay, kintu asol order jabe na.

---

## Deploy — step by step (phone diyeo kora jay)

### 1) Free GitHub account khulun
- https://github.com — email diye free account khulun.
- Notun repository banan (naam jemon `saiful-mart`), Public rakhun.
- Ei project-er sob file oi repository-te upload korun (web-e "uploading an existing file" diye, ba phone-e GitHub app diye).

### 2) Free Netlify account khulun
- https://app.netlify.com/signup — GitHub diye sign up korun (card lagbe na).
- **Add new site → Import an existing project → GitHub** beche nin.
- Apnar `saiful-mart` repository select korun. Build settings default-i thakbe (publish: `public`, functions: `netlify/functions`).
- **Deploy site** chap din. Kichukkhon pore free link paben — jemon `https://saiful-mart-xyz.netlify.app`

### 3) API token bosan (sobcheye important step)
- DropBazar-e login korun → **Dashboard → API ইন্টিগ্রেশন** → API key copy korun.
  (Key-ta shudhu ekbar dekhay — sathe sathe copy korun. Key-ta kothao share korben na.)
- Netlify-te: apnar site → **Site settings → Environment variables → Add a variable**
  - Key: `DROPBAZAR_API_TOKEN`
  - Value: apnar DropBazar API token (paste korun)
  - Scope: All scopes / Production — Save korun.
- Tarpor **Deploys → Trigger deploy → Deploy site** — abar deploy korun, naile token kaj korbe na.

### 4) Test korun — age choto order diye
- Site khule ekta product cart-e add korun, checkout korun (nijer naam/number/address diye).
- Age "Total dekhun" chap din (preview), tarpor "Order Confirm korun".
- Success hole ekta **order number** dekhabe. DropBazar Dashboard → Orders-e giye oi order-ta ache kina check korun.
- Thik thakle bujhben API connect hoyeche. ✅

### 5) Webhook (optional, status live update-er jonno)
- DropBazar Dashboard → **API ইন্টিগ্রেশন → Webhook**-e apnar webhook URL bosan:
  `https://apnar-site.netlify.app/.netlify/functions/webhook`
- Signing secret generate kore Netlify-te arekta env var hisebe bosan:
  - Key: `DROPBAZAR_WEBHOOK_SECRET`, Value: secret-ta.
- Eta na korleo order cholbe — shudhu status auto-update hobe na, dashboard-e giye dekhte hobe.

---

## Rate limit ar error (DropBazar docs onujayi)

- Read (product/district): 60/minute • Order preview: 30/minute • Order place: 20/minute • Cancel: 10/minute
- `401` = token vul/meyad sesh → notun token bosan
- `403` = account approve hoy nai → DropBazar support
- `422` = selling price cost-er niche, ba variant (size) dite hobe
- `429` = onek beshi request → 1 minute wait kore abar try korun

## Pore ki ki taka lagte pare

- **Domain:** `.com` domain kinte chaile bochore ~৳1000–1500 (na kinleo `.netlify.app` free link-e cholbe).
- **Netlify Pro:** Free plan-er credit sesh hole / onek traffic hole — tokhon Pro lagte pare. Shurute free-i enough.
- **DropBazar:** API use korte alada taka lage na — order dile sudhu cost price + delivery charge dite hoy, lav-ta apnar.

## Help lagle

- DropBazar API docs: https://dropbazarbd.com/api-docs
- DropBazar support: 09644553003, dropbazarbd@gmail.com
- Ei project-e kono real token/password/phone/email nai — sob placeholder.
