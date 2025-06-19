# Stripe Subscriptions API

**Version:** 2025-01-01.preview.30  
**Last Updated:** 2025-06-19  
**SDK Version:** stripe-node v16.x or higher

The Subscriptions API allows you to create and manage recurring payments. Subscriptions automatically generate invoices and charge customers on a recurring basis.

## Rate Limiting
- Default rate limit: 100 requests per second
- Use webhooks for status updates instead of polling
- Implement pagination for large subscription lists

## Security Considerations
- Verify webhook signatures for subscription events
- Store subscription IDs securely
- Implement proper access controls for subscription management
- Use test clocks for testing subscription lifecycles

## Create a Subscription

Creates a new subscription on an existing customer.

**Endpoint:** `POST /v1/subscriptions`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| customer | string | Yes | The identifier of the customer to subscribe |
| items | array | Yes | List of subscription items, each with an attached price |
| trial_period_days | integer | No | Number of trial period days before charging |

### Example

```javascript
const stripe = require('stripe')('sk_test_...', {
  apiVersion: '2025-01-01.preview.30'
});

try {
  const subscription = await stripe.subscriptions.create({
    customer: 'cus_QMvPKq8MYXsC2x',
    items: [
      {price: 'price_1OqGtB2eZvKYlo2C9qZ0Xqyi'},
    ],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    expand: ['latest_invoice.payment_intent'],
    trial_period_days: 14,
    metadata: {
      order_id: '12345'
    }
  });
  
  console.log('Subscription created:', subscription.id);
  console.log('Status:', subscription.status);
} catch (error) {
  if (error.type === 'StripeCardError') {
    console.error('Card declined:', error.message);
  } else if (error.type === 'StripeInvalidRequestError') {
    console.error('Invalid parameters:', error.message);
  } else {
    console.error('Subscription creation failed:', error.message);
  }
}
```

### Response

```json
{
  "id": "sub_1OqGvx2eZvKYlo2CJqZ8qW4P",
  "object": "subscription",
  "customer": "cus_QMvPKq8MYXsC2x",
  "status": "trialing",
  "current_period_start": 1718764800,
  "current_period_end": 1719974400,
  "created": 1718764800,
  "trial_start": 1718764800,
  "trial_end": 1719974400,
  "items": {
    "object": "list",
    "data": [
      {
        "id": "si_QMvRBXGcWr4eaa",
        "object": "subscription_item",
        "price": {
          "id": "price_1OqGtB2eZvKYlo2C9qZ0Xqyi",
          "currency": "usd",
          "recurring": {
            "interval": "month",
            "interval_count": 1
          },
          "unit_amount": 999
        }
      }
    ]
  },
  "latest_invoice": {
    "id": "in_1OqGvx2eZvKYlo2CFwhqTYmG",
    "payment_intent": {
      "id": "pi_3OqGvx2eZvKYlo2C0vgFDvoe",
      "status": "requires_payment_method"
    }
  },
  "metadata": {
    "order_id": "12345"
  }
}
```

## Update a Subscription

Modify an existing subscription.

**Endpoint:** `POST /v1/subscriptions/:id`

### Example

```javascript
try {
  const subscription = await stripe.subscriptions.update(
    'sub_1OqGvx2eZvKYlo2CJqZ8qW4P',
    {
      items: [
        {
          id: 'si_QMvRBXGcWr4eaa',
          price: 'price_1OqGtB2eZvKYlo2C9qZ0Xqyi',
          quantity: 2 // Update quantity
        }
      ],
      proration_behavior: 'create_prorations'
    }
  );
} catch (error) {
  console.error('Failed to update subscription:', error.message);
}
```

## Cancel a Subscription

Cancel a subscription immediately or at period end.

**Endpoint:** `DELETE /v1/subscriptions/:id`

### Example

```javascript
try {
  // Cancel at period end
  const subscription = await stripe.subscriptions.update(
    'sub_1OqGvx2eZvKYlo2CJqZ8qW4P',
    {
      cancel_at_period_end: true
    }
  );
  
  // Or cancel immediately
  const canceledSubscription = await stripe.subscriptions.cancel(
    'sub_1OqGvx2eZvKYlo2CJqZ8qW4P'
  );
} catch (error) {
  console.error('Failed to cancel subscription:', error.message);
}
```

## List Subscriptions

Retrieve subscriptions with pagination.

**Endpoint:** `GET /v1/subscriptions`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| customer | string | No | Filter by customer ID |
| status | string | No | Filter by status (active, past_due, etc.) |
| limit | integer | No | Number of objects to return (1-100) |
| starting_after | string | No | Cursor for pagination |

### Example with Pagination

```javascript
async function getActiveSubscriptions(customerId) {
  const subscriptions = [];
  let hasMore = true;
  let startingAfter = null;
  
  while (hasMore) {
    try {
      const response = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 100,
        starting_after: startingAfter
      });
      
      subscriptions.push(...response.data);
      hasMore = response.has_more;
      
      if (hasMore && response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    } catch (error) {
      console.error('Error listing subscriptions:', error.message);
      break;
    }
  }
  
  return subscriptions;
}
```

## Webhook Events

Key subscription events to handle:

- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment

### Webhook Handler Example

```javascript
const endpointSecret = 'whsec_...';

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.');
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('New subscription:', subscription.id);
      // Provision access
      break;
    case 'invoice.payment_failed':
      const invoice = event.data.object;
      console.log('Payment failed for subscription:', invoice.subscription);
      // Send dunning email
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('Subscription canceled:', deletedSubscription.id);
      // Revoke access
      break;
  }
  
  response.status(200).json({received: true});
});
```

## Payment Links API

Create no-code payment pages for subscriptions.

**Endpoint:** `POST /v1/payment_links`

### Example

```javascript
try {
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: 'price_1OqGtB2eZvKYlo2C9qZ0Xqyi',
        quantity: 1
      }
    ],
    after_completion: {
      type: 'redirect',
      redirect: {
        url: 'https://example.com/success'
      }
    }
  });
  
  console.log('Payment link:', paymentLink.url);
} catch (error) {
  console.error('Failed to create payment link:', error.message);
}
```

## Checkout Sessions API

Create hosted checkout pages for subscriptions.

**Endpoint:** `POST /v1/checkout/sessions`

### Example

```javascript
try {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: 'price_1OqGtB2eZvKYlo2C9qZ0Xqyi',
        quantity: 1
      }
    ],
    success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://example.com/cancel',
    customer_email: 'customer@example.com'
  });
  
  // Redirect to session.url
  console.log('Checkout URL:', session.url);
} catch (error) {
  console.error('Failed to create checkout session:', error.message);
}
```

