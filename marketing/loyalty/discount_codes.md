# MekongMind Discount & Loyalty Codes

Use these codes within Stripe, Polar, or Creem checkout dashboards to run promotions for MekongMind Cloud subscriptions.

---

## 1. Public Launch Codes

| Code | Discount | Duration | Target Audience | Usage Limit |
| :--- | :--- | :--- | :--- | :--- |
| **PHLAUNCH30** | 30% OFF | First 3 Months | Product Hunt launch visitors | First 500 redemptions |
| **MEKONG50** | 50% OFF | First 3 Months | Vietnam local dev communities | First 100 redemptions |
| **MINDYEAR** | 20% OFF | Yearly plan | Developer/Builder annual plans | Unlimited |

---

## 2. Developer & Contributor Rewards (Loyalty)

We issue these codes to reward our open-source ecosystem contributors.

| Code / Tier | Discount | Criteria | Lifecycle |
| :--- | :--- | :--- | :--- |
| **DEVVIP** | 50% OFF | Merged Pull Request in `mekongmind` core | 12 Months |
| **MCPHERO** | 100% FREE | Released a verified public MCP tool plugin | Ongoing / Free Tier |
| **ADAPTERBUILDER**| 50% OFF | Built a custom service adapter | 12 Months |

---

## 3. Integration setup details
These codes should be synchronized with the payment webhooks configured under our Billing adapter framework to automatically map tenant subscription metadata.
* **Stripe Coupon ID**: Match the coupon name directly (case sensitive).
* **Polar Discount Rule**: Bound to the "Developer Cloud" subscription product.
