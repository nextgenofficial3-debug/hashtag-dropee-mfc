

## Plan: Auto-approve Reviews, UI/UX Polish, and Notification Clarification

### 1. Auto-approve Reviews (no admin moderation)

**Database change:** Update the `reviews` table default for `is_approved` from `false` to `true` via migration:
```sql
ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT true;
```

**Frontend changes:**
- `ReviewsSection.tsx`: Remove the `.eq('is_approved', true)` filter — fetch all reviews instead. Remove the "Verified" badge (since there's no approval gate). Update the success toast to say the review is live immediately.
- `AdminReviews.tsx`: Remove approve/hide toggle buttons since all reviews auto-show. Keep the delete button for moderation. Simplify the UI.

### 2. UI/UX Improvements for Mobile

**ReviewsSection.tsx:**
- Make review cards responsive: full-width on mobile (`w-full` instead of `min-w-[300px]`), stack vertically on small screens instead of horizontal scroll
- Add snap scrolling on the horizontal carousel for smooth swipe: `snap-x snap-mandatory` with `snap-center` on cards
- Reduce padding on mobile (`py-12` instead of `py-20`)
- Make the form more touch-friendly with larger tap targets

**Header.tsx:**
- Fix the `NotificationBell` placement — currently it's outside the flex container for action buttons, causing layout issues. Move it inside the `flex items-center gap-3` div.

**AdminOrders.tsx:**
- Make the order cards stack better on mobile: single-column layout with items/status below customer info
- Make the status dropdown full-width on mobile

### 3. Notification System — Clarify Purpose and Usage

The push notification system is used for:
- **Order status updates**: When an admin changes an order status (pending → preparing → out for delivery → delivered), a push notification is sent to ALL subscribers
- **Customer opt-in**: The bell icon in the header lets customers subscribe

**Current limitation**: Notifications go to ALL subscribers, not just the specific customer. This is by design since orders don't require user accounts.

No code changes needed for this — just clarification. The system works as: customer subscribes via bell → places order → admin updates status → all subscribers get notified.

### Summary of Changes

| File | Change |
|------|--------|
| Migration SQL | Set `is_approved` default to `true` |
| `ReviewsSection.tsx` | Remove approval filter, mobile-first card layout with snap scroll, immediate feedback toast |
| `AdminReviews.tsx` | Remove approve/hide buttons, keep delete only, cleaner mobile layout |
| `Header.tsx` | Fix NotificationBell position inside action buttons group |
| `AdminOrders.tsx` | Improve mobile card layout |

