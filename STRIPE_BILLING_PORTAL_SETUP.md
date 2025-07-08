# Stripe Billing Portal Setup Guide

## 🚨 Issue: "Failed to create billing portal session"

**Error Message:**
```
No configuration provided and your test mode default configuration has not been created. 
Provide a configuration or create your default by saving your customer portal settings in test mode.
```

## ✅ **Solution: Configure Stripe Billing Portal**

### **Step 1: Access Stripe Dashboard**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure you're in **Test Mode** (toggle in top right)

### **Step 2: Navigate to Billing Portal Settings**
1. In the left sidebar, click **Settings**
2. Click **Billing** → **Customer portal**
3. Or go directly to: https://dashboard.stripe.com/test/settings/billing/portal

### **Step 3: Configure Portal Settings**

#### **Basic Configuration:**
1. **Portal name:** `Xuthority Billing Portal`
2. **Business name:** `Xuthority`
3. **Privacy policy URL:** `https://xuthority.com/privacy-policy`
4. **Terms of service URL:** `https://xuthority.com/terms-of-service`

#### **Feature Configuration:**
Enable these features:
- ✅ **Subscription management** - Allow customers to view/manage subscriptions
- ✅ **Payment method management** - Allow customers to update payment methods
- ✅ **Billing history** - Allow customers to view invoices
- ✅ **Cancel subscriptions** - Allow customers to cancel (optional)

#### **Branding:**
1. Upload your logo (optional)
2. Set brand colors to match your app
3. Choose accent color: `#3B82F6` (blue)

### **Step 4: Save Configuration**
1. Click **Save** at the bottom of the page
2. The portal is now configured for Test Mode

## 🔧 **Applied Code Fixes**

### **1. Fixed Metadata String Conversion**
**Issue:** Stripe metadata was receiving buffer/hash values instead of strings

**Fix Applied:**
```javascript
// Before (causing errors)
metadata: {
  userId: userId.toString(),
  planId: plan._id.toString(),
}

// After (fixed)
metadata: {
  userId: String(userId), // Ensure it's a string
  planId: String(plan._id), // Ensure it's a string
}
```

### **2. Server Restart**
- Restarted server to apply metadata fixes
- Changes are now live

## 🧪 **Testing the Fix**

### **Test Billing Portal:**
1. Go to your subscription page: `/profile/my-subscription`
2. Click **"Manage Billing"** button
3. Should redirect to Stripe Customer Portal successfully

### **Test Checkout:**
1. Try subscribing to a paid plan
2. Metadata errors should be resolved
3. Checkout should complete successfully

## 📋 **Production Setup**

When ready for production:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Repeat the portal configuration** for Live Mode
3. **Update environment variables** with live keys:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

## 🚀 **Verification Checklist**

- [ ] Stripe billing portal configured in Test Mode
- [ ] Server restarted with metadata fixes
- [ ] Billing portal button works
- [ ] Checkout metadata errors resolved
- [ ] Subscription creation working
- [ ] Webhooks processing correctly

## 🔗 **Useful Links**

- [Stripe Customer Portal Docs](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Test Mode Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal)
- [Live Mode Portal Settings](https://dashboard.stripe.com/settings/billing/portal)

---

## 🎉 **Expected Result**

After completing these steps:
- ✅ **"Manage Billing"** button will work correctly
- ✅ **Checkout sessions** will create without metadata errors
- ✅ **Subscription management** will be fully functional
- ✅ **Customer portal** will display with your branding 