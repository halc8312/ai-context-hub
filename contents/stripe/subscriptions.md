# Stripe Subscriptions API

The Subscriptions API allows you to create and manage recurring payments. Subscriptions automatically generate invoices and charge customers on a recurring basis.

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
const subscription = await stripe.subscriptions.create({
  customer: 'cus_1234567890',
  items: [
    {price: 'price_1234567890'},
  ],
  trial_period_days: 14
});
```

### Response

```json
{
  "id": "sub_1234567890",
  "object": "subscription",
  "customer": "cus_1234567890",
  "status": "trialing",
  "current_period_end": 1234567890
}
```

