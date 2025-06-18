# Stripe Payment Intents API

Payment Intents API is the recommended way to handle complex payment flows. It tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required.

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
const stripe = require('stripe')('sk_test_...');

const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // $20.00
  currency: 'usd',
  payment_method_types: ['card'],
  description: 'Order #12345'
});
```

### Response

```json
{
  "id": "pi_1234567890",
  "object": "payment_intent",
  "amount": 2000,
  "currency": "usd",
  "status": "requires_payment_method",
  "client_secret": "pi_1234567890_secret_abcdef"
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
const paymentIntent = await stripe.paymentIntents.retrieve(
  'pi_1234567890'
);
```

### Response

```json
{
  "id": "pi_1234567890",
  "object": "payment_intent",
  "amount": 2000,
  "currency": "usd",
  "status": "succeeded"
}
```

