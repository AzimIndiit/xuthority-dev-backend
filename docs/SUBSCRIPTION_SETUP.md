# Subscription System Setup Guide

This guide covers the complete setup and implementation of the subscription system with Stripe integration for the Xuthority platform.

## Overview

The subscription system provides:
- **Multiple subscription plans** (Free, Basic, Standard)
- **7-day trial period** for the Standard plan
- **Stripe integration** for payment processing
- **Automatic trial expiration** handling
- **Webhook support** for real-time updates
- **Billing portal** integration
- **Subscription analytics**

## Architecture

### Models
- **SubscriptionPlan**: Defines available subscription plans
- **UserSubscription**: Tracks user subscription status and details

### Key Features
- Trial period management with automatic expiration
- Stripe checkout session creation
- Webhook handling for subscription events
- Billing portal for customer self-service
- Usage tracking and limits enforcement

## Environment Setup

### Required Environment Variables

Add these to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe URLs
STRIPE_SUCCESS_URL=http://localhost:3000/profile/my-subscription?success=true
STRIPE_CANCEL_URL=http://localhost:3000/profile/my-subscription?canceled=true
STRIPE_RETURN_URL=http://localhost:3000/profile/my-subscription

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Optional Stripe Product/Price IDs
STRIPE_STANDARD_PRICE_ID=price_your_standard_plan_price_id
STRIPE_STANDARD_PRODUCT_ID=prod_your_standard_plan_product_id
```

### Stripe Setup

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Get your test API keys from the dashboard

2. **Create Products and Prices**
   ```bash
   # Standard Plan Product
   curl https://api.stripe.com/v1/products \
     -u sk_test_your_secret_key: \
     -d name="Standard Plan" \
     -d description="Enhanced features for growing businesses"

   # Standard Plan Price (with 7-day trial)
   curl https://api.stripe.com/v1/prices \
     -u sk_test_your_secret_key: \
     -d unit_amount=1200 \
     -d currency=usd \
     -d recurring[interval]=month \
     -d product=prod_your_standard_product_id
   ```

3. **Set up Webhooks**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/subscription/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`

## Database Setup

### Run Database Migrations

```bash
# Seed subscription plans
node -e "
const { seedSubscriptionPlans } = require('./src/database/seeds/subscriptionPlanSeeder');
const connectDB = require('./src/config/database');

connectDB().then(async () => {
  await seedSubscriptionPlans();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
"
```

### Verify Setup

```bash
# Check if plans were created
node -e "
const { SubscriptionPlan } = require('./src/models');
const connectDB = require('./src/config/database');

connectDB().then(async () => {
  const plans = await SubscriptionPlan.find({});
  console.log('Available plans:', plans.map(p => ({
    name: p.name,
    price: p.price,
    trialDays: p.trialPeriodDays
  })));
  process.exit(0);
});
"
```

## API Endpoints

### Public Endpoints

```bash
# Get all subscription plans
GET /api/subscription/plans
```

### Protected Endpoints (Require Authentication)

```bash
# Get current user's subscription
GET /api/subscription/current

# Create checkout session
POST /api/subscription/checkout
{
  "planId": "plan_id_here",
  "successUrl": "optional_custom_success_url",
  "cancelUrl": "optional_custom_cancel_url"
}

# Create billing portal session
POST /api/subscription/billing-portal

# Update subscription
PUT /api/subscription/update
{
  "newPlanId": "new_plan_id_here"
}

# Cancel subscription
DELETE /api/subscription/cancel
{
  "reason": "optional_cancellation_reason"
}

# Resume subscription
POST /api/subscription/resume
```

### Webhook Endpoint (Public but verified)

```bash
# Stripe webhooks
POST /api/subscription/webhook
```

### Admin Endpoints

```bash
# Get subscription analytics
GET /api/subscription/analytics?startDate=2024-01-01&endDate=2024-12-31
```

## Frontend Integration

### Update Frontend Hook

The frontend already has the subscription hook at `src/hooks/useSubscription.ts`. Update it to use the real API endpoints:

```typescript
// In src/hooks/useSubscription.ts
const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },
  // ... other methods
};
```

### Handle Subscription Status

Update the `MySubscriptionPage` to show real data:

```typescript
// In src/pages/user/MySubscriptionPage.tsx
// Remove mock data and use real API calls
const { data: subscriptionPlans, isLoading: plansLoading } = useSubscriptionPlans();
const { data: currentSubscription, isLoading: subscriptionLoading } = useCurrentSubscription();
```

## Trial Period Logic

### How Trials Work

1. **Standard Plan Trial**:
   - User subscribes to Standard plan
   - Gets 7-day trial period
   - After trial expires, subscription converts to paid
   - If payment fails, subscription is canceled

2. **Basic Plan Trial**:
   - User gets 7-day free access to Basic features
   - After trial expires, user is moved to permanent Free plan
   - No payment required

### Trial Expiration Handling

Set up a cron job to handle expired trials:

```javascript
// Add to your job scheduler or cron
const { subscriptionService } = require('./src/services/subscriptionService');

// Run daily
cron.schedule('0 2 * * *', async () => {
  await subscriptionService.handleExpiredTrials();
});
```

## Webhook Security

The webhook endpoint automatically verifies Stripe signatures:

```javascript
// In subscriptionController.js
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
```

Make sure to:
1. Use the raw body for webhook verification
2. Set the correct webhook secret in environment variables
3. Handle webhook events idempotently

## Testing

### Test Subscription Flow

1. **Create Test User**
2. **Subscribe to Standard Plan**:
   ```bash
   POST /api/subscription/checkout
   {
     "planId": "standard_plan_id"
   }
   ```
3. **Complete Stripe Checkout**
4. **Verify Subscription Created**:
   ```bash
   GET /api/subscription/current
   ```

### Test Webhook Events

Use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:5000/api/subscription/webhook
```

### Test Trial Expiration

```bash
# Manually trigger trial expiration check
node -e "
const { subscriptionService } = require('./src/services/subscriptionService');
const connectDB = require('./src/config/database');

connectDB().then(async () => {
  await subscriptionService.handleExpiredTrials();
  process.exit(0);
});
"
```

## Monitoring and Analytics

### Track Key Metrics

- Active subscriptions
- Trial conversion rates
- Churn rates
- Revenue metrics
- Plan distribution

### Admin Dashboard Integration

Add subscription metrics to your admin dashboard:

```bash
GET /api/subscription/analytics
```

## Troubleshooting

### Common Issues

1. **Webhook Events Not Processing**
   - Verify webhook secret
   - Check endpoint URL in Stripe dashboard
   - Ensure raw body parsing for webhooks

2. **Trial Not Expiring**
   - Check if cron job is running
   - Verify trial end dates in database
   - Run manual trial expiration check

3. **Stripe Checkout Failing**
   - Verify API keys
   - Check product/price IDs
   - Ensure customer creation is working

### Debug Mode

Enable debug logging in development:

```bash
NODE_ENV=development DEBUG=subscription:* npm start
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Webhook endpoint accessible
- [ ] Database migrations run
- [ ] Subscription plans seeded
- [ ] Stripe products/prices created
- [ ] SSL certificate configured
- [ ] Monitoring set up

### Post-deployment Verification

1. Test subscription flow end-to-end
2. Verify webhook events are being received
3. Check database for subscription records
4. Monitor error logs
5. Test billing portal access

## Security Considerations

1. **Always verify webhook signatures**
2. **Use HTTPS for all webhook endpoints**
3. **Store Stripe keys securely**
4. **Implement rate limiting on subscription endpoints**
5. **Log all subscription events for audit purposes**
6. **Validate all user inputs**
7. **Use least privilege access for Stripe API keys**

## Support and Maintenance

### Regular Tasks

- Monitor subscription metrics
- Review failed payments
- Update subscription plans as needed
- Handle customer subscription issues
- Maintain webhook event handling
- Review and update trial periods

### Customer Support

For subscription-related customer support:
1. Check user's subscription status in database
2. Use Stripe dashboard for payment history
3. Use billing portal for customer self-service
4. Handle cancellations through admin interface

---

This subscription system provides a robust foundation for managing user subscriptions with Stripe integration. The trial period logic ensures users can experience premium features before committing to paid plans. 