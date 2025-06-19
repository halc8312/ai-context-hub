# Stripe Payment Intents API

**Version:** 2025-01-01.preview.30  
**Last Updated:** 2025-06-19  
**SDK Version:** stripe-node v16.x or higher

Payment Intents API is the recommended way to handle complex payment flows. It tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required.

## Rate Limiting
- Default rate limit: 100 requests per second
- Burst capability: Up to 200 requests per second
- Use idempotency keys to safely retry requests

## Security Considerations
- Always use server-side code for payment processing
- Never expose secret keys in client-side code
- Implement webhook signature verification
- Use HTTPS for all API communications

## Create a PaymentIntent

Creates a PaymentIntent object to track a payment from start to finish.

**Endpoint:** `POST /v1/payment_intents`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| amount | integer | Yes | Amount intended to be collected by this PaymentIntent (in cents) |
| currency | string | Yes | Three-letter ISO currency code (e.g., usd) |
| payment_method_types | array | No | Payment method types to be used (e.g., ["card"]) |
| description | string | No | Description of the payment |

### Example

```javascript
const stripe = require('stripe')('sk_test_...', {
  apiVersion: '2025-01-01.preview.30'
});

try {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000, // $20.00
    currency: 'usd',
    payment_method_types: ['card'],
    description: 'Order #12345',
    metadata: {
      order_id: '12345',
      customer_email: 'customer@example.com'
    }
  }, {
    idempotencyKey: 'unique-request-key' // Prevent duplicate charges
  });
  
  console.log('PaymentIntent created:', paymentIntent.id);
} catch (error) {
  // Error handling
  if (error.type === 'StripeCardError') {
    console.error('Card was declined:', error.message);
  } else if (error.type === 'StripeRateLimitError') {
    console.error('Too many requests:', error.message);
  } else if (error.type === 'StripeInvalidRequestError') {
    console.error('Invalid parameters:', error.message);
  } else {
    console.error('Payment failed:', error.message);
  }
}
```

### Response

```json
{
  "id": "pi_3PQx5K2eZvKYlo2C0E1dJFKq",
  "object": "payment_intent",
  "amount": 2000,
  "currency": "usd",
  "status": "requires_payment_method",
  "client_secret": "pi_3PQx5K2eZvKYlo2C0E1dJFKq_secret_kfDSyZXLW",
  "created": 1718764800,
  "livemode": false,
  "metadata": {
    "order_id": "12345",
    "customer_email": "customer@example.com"
  }
}
```

## Retrieve a PaymentIntent

Retrieves the details of a PaymentIntent that has previously been created.

**Endpoint:** `GET /v1/payment_intents/:id`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | The identifier of the PaymentIntent to be retrieved |

### Example

```javascript
try {
  const paymentIntent = await stripe.paymentIntents.retrieve(
    'pi_3PQx5K2eZvKYlo2C0E1dJFKq'
  );
  
  // Check payment status
  if (paymentIntent.status === 'succeeded') {
    console.log('Payment successful!');
  } else {
    console.log('Payment status:', paymentIntent.status);
  }
} catch (error) {
  console.error('Failed to retrieve payment intent:', error.message);
}
```

### Response

```json
{
  "id": "pi_3PQx5K2eZvKYlo2C0E1dJFKq",
  "object": "payment_intent",
  "amount": 2000,
  "currency": "usd",
  "status": "succeeded",
  "charges": {
    "object": "list",
    "data": [
      {
        "id": "ch_3PQx5K2eZvKYlo2C0jHrLwDN",
        "amount": 2000,
        "captured": true,
        "created": 1718764801
      }
    ]
  }
}
```

## Update a PaymentIntent

Update properties of an existing PaymentIntent.

**Endpoint:** `POST /v1/payment_intents/:id`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| amount | integer | No | Updated amount in cents |
| metadata | object | No | Updated metadata |
| description | string | No | Updated description |

### Example

```javascript
try {
  const paymentIntent = await stripe.paymentIntents.update(
    'pi_3PQx5K2eZvKYlo2C0E1dJFKq',
    {
      metadata: {
        shipping_tracking: 'TRACK123456'
      }
    }
  );
} catch (error) {
  console.error('Update failed:', error.message);
}
```

## List PaymentIntents

Retrieve a list of PaymentIntents with pagination support.

**Endpoint:** `GET /v1/payment_intents`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| limit | integer | No | Number of objects to return (1-100) |
| starting_after | string | No | Cursor for pagination |
| created | object | No | Filter by creation date |

### Example with Pagination

```javascript
// Paginate through all payment intents
async function listAllPaymentIntents() {
  let hasMore = true;
  let startingAfter = null;
  const allPaymentIntents = [];
  
  while (hasMore) {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100,
        starting_after: startingAfter
      });
      
      allPaymentIntents.push(...paymentIntents.data);
      hasMore = paymentIntents.has_more;
      
      if (hasMore && paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      }
    } catch (error) {
      console.error('Error listing payment intents:', error.message);
      break;
    }
  }
  
  return allPaymentIntents;
}
```

## Webhook Events

Important events to handle for PaymentIntents:

- `payment_intent.succeeded` - Payment was successful
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.requires_action` - Additional authentication required

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
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Fulfill the order
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      // Notify customer
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  response.status(200).json({received: true});
});
```

