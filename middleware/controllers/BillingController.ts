// Install Stripe SDK: npm install stripe @types/stripe --save
import { Request, Response } from 'express';
import Tenant from '../models/Tenant';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

type PlanKey = 'free' | 'pro' | 'enterprise';
const PLANS: Record<PlanKey, { priceId: string | undefined; maxCampaigns: number; maxUsers: number }> = {
  free: { priceId: process.env.STRIPE_PRICE_FREE, maxCampaigns: 10, maxUsers: 5 },
  pro: { priceId: process.env.STRIPE_PRICE_PRO, maxCampaigns: 100, maxUsers: 50 },
  enterprise: { priceId: process.env.STRIPE_PRICE_ENTERPRISE, maxCampaigns: 1000, maxUsers: 500 },
};

export default class BillingController {
  // Create Stripe customer for a tenant
  static async createCustomer(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
      if (tenant.stripeCustomerId) return res.json({ customerId: tenant.stripeCustomerId });

      const customer = await stripe.customers.create({
        name: tenant.displayName,
        email: tenant.billingInfo?.contactEmail,
        metadata: { tenantId: (tenant._id as string) },
      });
      tenant.stripeCustomerId = customer.id;
      await tenant.save();
      return res.json({ customerId: customer.id });
    } catch (err: any) {
      return res.status(500).json({ message: 'Stripe error', error: err.message });
    }
  }

  // Create or update a subscription for a tenant
  static async createOrUpdateSubscription(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const { plan } = req.body as { plan: PlanKey };
      if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
      if (!tenant.stripeCustomerId) return res.status(400).json({ message: 'No Stripe customer' });

      // Cancel old subscription if exists
      if (tenant.stripeSubscriptionId) {
        await stripe.subscriptions.del(tenant.stripeSubscriptionId);
      }
      // Create new subscription
      const subscription = await stripe.subscriptions.create({
        customer: tenant.stripeCustomerId,
        items: [{ price: PLANS[plan].priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      tenant.stripeSubscriptionId = subscription.id;
      tenant.plan = plan;
      tenant.planLimits = {
        maxCampaigns: PLANS[plan].maxCampaigns,
        maxUsers: PLANS[plan].maxUsers,
      };
      await tenant.save();
      return res.json({ subscriptionId: subscription.id, clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret });
    } catch (err: any) {
      return res.status(500).json({ message: 'Stripe error', error: err.message });
    }
  }

  // Stripe webhook handler
  static async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle subscription events
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const tenant = await Tenant.findOne({ stripeCustomerId: customerId });
      if (tenant) {
        tenant.stripeSubscriptionId = subscription.id;
        tenant.subscription = {
          id: subscription.id,
          startDate: new Date(subscription.start_date * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
          renewalDate: new Date(subscription.current_period_end * 1000),
          status: subscription.status as any,
        };
        await tenant.save();
      }
    }
    res.json({ received: true });
  }

  // Get Stripe customer portal session
  static async getCustomerPortal(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const tenant = await Tenant.findById(tenantId);
      if (!tenant || !tenant.stripeCustomerId) return res.status(404).json({ message: 'Tenant or Stripe customer not found' });
      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: process.env.BILLING_PORTAL_RETURN_URL,
      });
      return res.json({ url: session.url });
    } catch (err: any) {
      return res.status(500).json({ message: 'Stripe error', error: err.message });
    }
  }
} 