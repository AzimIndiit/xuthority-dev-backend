# Subscription System Quick Start Guide

## Overview

The subscription system is now fully implemented with Stripe integration and provides three subscription plans:

- **Free**: Permanent free plan with basic features
- **Basic**: 7-day trial plan that converts to Free plan
- **Standard**: $12/month plan with 7-day trial and Stripe integration

## Environment Setup

Add these environment variables to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# URLs
FRONTEND_URL=http://localhost:3000
```

## Database Setup

1. **Run the subscription setup script:**
```bash
npm run setup:subscription
```

This will:
- Create subscription plans in the database
- Create Stripe products/prices for paid plans
- Provide setup instructions

2. **Or run just the seeding:**
```bash
npm run seed:subscription
```

## API Endpoints

### Get Subscription Plans
```bash
GET /api/v1/subscription/plans
```

Example response:
```json
{
  "success": true,
  "data": [
    {
      "id": "686ce023c9679bba4d43df89",
      "name": "Free",
      "price": 0,
      "period": "",
      "isFree": true,
      "trialDays": 0,
      "features": ["Limited Product Listing", "Basic Analytics", "Standard Branding"],
      "buttonText": "Get Started",
      "formattedPrice": "Free"
    },
    {
      "id": "686ce020c9679bba4d43df3b",
      "name": "Basic",
      "price": 0,
      "period": "for 7 days",
      "isFree": true,
      "trialDays": 7,
      "features": ["Basic Product Listing", "Basic Analytics", "Standard Branding", "Review Response"],
      "buttonText": "Start Trial",
      "formattedPrice": "Free"
    },
    {
      "id": "686ce022c9679bba4d43df86",
      "name": "Standard",
      "price": 12,
      "period": "monthly",
      "isFree": false,
      "trialDays": 7,
      "features": ["Enhanced branding", "Advanced analytics.", "Review management.", "Dispute management."],
      "buttonText": "Start Trial",
      "formattedPrice": "$12.00"
    }
  ]
}
```

### Get Current Subscription (Authenticated)
```bash
GET /api/v1/subscription/current
Authorization: Bearer <jwt-token>
```

### Create Checkout Session (Authenticated)
```bash
POST /api/v1/subscription/checkout
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "planId": "686ce022c9679bba4d43df86"
}
```

### Create Billing Portal Session (Authenticated)
```bash
POST /api/v1/subscription/billing-portal
Authorization: Bearer <jwt-token>
```

## Frontend Integration

The frontend subscription page is located at:
```
http://localhost:3000/profile/my-subscription
```

Key React hooks available:
- `useSubscriptionPlans()` - Get all available plans
- `useCurrentSubscription()` - Get user's current subscription
- `useCreateSubscription()` - Create checkout session
- `useCreateBillingPortalSession()` - Access billing portal
- `useCancelSubscription()` - Cancel subscription

## Testing

1. **Start the development server:**
```bash
npm run dev
```

2. **Test the API endpoints:**
```bash
# Get plans
curl -X GET "http://localhost:8081/api/v1/subscription/plans"

# Test authentication (should return 401)
curl -X GET "http://localhost:8081/api/v1/subscription/current"
```

3. **Test the frontend:**
   - Visit: `http://localhost:3000/profile/my-subscription`
   - Sign in with a user account
   - Try subscribing to the Standard plan
   - Use Stripe test card: `4242 4242 4242 4242`

## Stripe Webhook Setup

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `http://localhost:8081/api/v1/subscription/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

## Plan Logic

### Basic Plan (Free Trial)
- 7-day trial with enhanced features
- Converts to permanent Free plan after trial
- No payment required

### Standard Plan (Paid)
- 7-day trial with full features
- $12/month after trial
- Stripe integration required
- Includes billing portal access

### Free Plan (Permanent)
- No trial period
- Limited features
- Always free

## Troubleshooting

**Plans not showing:**
```bash
# Check if plans exist in database
npm run setup:subscription
```

**Stripe errors:**
- Verify environment variables
- Check webhook endpoint URL
- Ensure Stripe is in test mode

**Authentication errors:**
- Verify JWT tokens
- Check auth middleware configuration

For complete documentation, see: `docs/SUBSCRIPTION_SETUP.md` 