

## Plan: Central Order Hub Integration

Since you don't have the Hub URL and API Key yet, I'll build the full integration structure using configurable secrets. When you're ready, you'll just provide the two values and everything will work.

---

### 1. Store Hub Credentials as Secrets

Two secrets will be needed (requested via the secrets tool when implementing):
- `ORDER_HUB_URL` — your hub's base URL
- `ORDER_HUB_API_KEY` — your cafe API key from the hub admin

### 2. Edge Function: `forward-order-to-hub`

**New file:** `supabase/functions/forward-order-to-hub/index.ts`

- Receives the local order data (order ID, customer info, items, total, notes)
- POSTs to `{ORDER_HUB_URL}/api/orders` with header `x-api-key: {ORDER_HUB_API_KEY}`
- Body includes: `source: "cafe"`, order ID, customer name/phone/address, items array, total, special notes
- Returns the `hub_order_id` from the hub's response

### 3. Edge Function: `check-hub-order-status`

**New file:** `supabase/functions/check-hub-order-status/index.ts`

- GET endpoint that proxies `{ORDER_HUB_URL}/api/orders/{hub_order_id}` with the API key header
- Used as WebSocket fallback (polling every 15s)

### 4. Database Migration

Add `hub_order_id` column to the `orders` table:
```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS hub_order_id text;
```

### 5. Checkout Flow Update (`src/pages/Checkout.tsx`)

In `handleSubmit`:
1. Insert order into local DB (existing) — capture the returned order `id`
2. Call `forward-order-to-hub` edge function with order details
3. Update the local order record with the returned `hub_order_id`
4. Pass `hub_order_id` and `orderId` to the confirmation page via navigation state

### 6. Order Confirmation Page Redesign (`src/pages/OrderConfirmation.tsx`)

Replace the static confirmation with a **live order tracker**:

**Status steps:** Pending → Confirmed → Preparing → Picked Up → On The Way → Delivered

**Real-time connection:**
- On mount, connect WebSocket to `{HUB_URL}` with `source=cafe` and API key as connection params
- Listen for status update messages; extract `hub_order_id` + new status
- Animate the tracker to the new step using Framer Motion

**Fallback polling:**
- If WebSocket disconnects, fall back to calling `check-hub-order-status` edge function every 15 seconds
- Auto-reconnect WebSocket with exponential backoff

**Tracker UI:**
- Horizontal/vertical stepper showing all 6 statuses
- Current step highlighted with animated pulse
- Completed steps show green checkmarks
- Smooth animation between steps

### 7. No Delivery Logic

Per Rule 4, no agent management, routing, or delivery tracking code. The site only sends orders and displays status from the hub.

---

### Summary of Changes

| File | Action |
|------|--------|
| `supabase/functions/forward-order-to-hub/index.ts` | **New** — POST order to hub |
| `supabase/functions/check-hub-order-status/index.ts` | **New** — GET order status fallback |
| DB migration | Add `hub_order_id` to `orders` table |
| `src/pages/Checkout.tsx` | Call hub after local insert, pass hub ID to confirmation |
| `src/pages/OrderConfirmation.tsx` | Add live tracker with WebSocket + polling fallback |
| Secrets | `ORDER_HUB_URL` and `ORDER_HUB_API_KEY` (prompted during implementation) |

