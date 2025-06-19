# Stripe Customers API

**Version:** 2025-01-01.preview.30  
**Last Updated:** 2025-06-19  
**SDK Version:** stripe-node v16.x or higher

The Customers API allows you to create and manage customers. You can store multiple payment methods on a customer to charge at a later time.

## Rate Limiting
- Default rate limit: 100 requests per second
- Burst capability: Up to 200 requests per second
- Use pagination for large customer lists

## Security Considerations
- Store customer IDs securely in your database
- Never expose customer payment methods to unauthorized users
- Use metadata for internal references, not sensitive data
- Implement proper authentication before customer operations

## Create a Customer

Creates a new customer object.

**Endpoint:** `POST /v1/customers`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | No | Customer's email address |
| name | string | No | Customer's full name or business name |
| phone | string | No | Customer's phone number |
| metadata | object | No | Set of key-value pairs for storing additional information |

### Example

```javascript
const stripe = require('stripe')('sk_test_...', {
  apiVersion: '2025-01-01.preview.30'
});

try {
  const customer = await stripe.customers.create({
    email: 'customer@example.com',
    name: 'John Doe',
    phone: '+1234567890',
    address: {
      line1: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94111',
      country: 'US'
    },
    metadata: {
      user_id: '12345',
      signup_channel: 'web'
    },
    tax_exempt: 'none',
    preferred_locales: ['en']
  });
  
  console.log('Customer created:', customer.id);
} catch (error) {
  if (error.type === 'StripeInvalidRequestError') {
    console.error('Invalid customer data:', error.message);
  } else {
    console.error('Customer creation failed:', error.message);
  }
}
```

### Response

```json
{
  "id": "cus_QMvPKq8MYXsC2x",
  "object": "customer",
  "email": "customer@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "created": 1718764800,
  "livemode": false,
  "address": {
    "line1": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94111",
    "country": "US"
  },
  "metadata": {
    "user_id": "12345",
    "signup_channel": "web"
  },
  "tax_exempt": "none",
  "preferred_locales": ["en"]
}
```

## Update a Customer

Update customer information.

**Endpoint:** `POST /v1/customers/:id`

### Example

```javascript
try {
  const customer = await stripe.customers.update(
    'cus_QMvPKq8MYXsC2x',
    {
      metadata: {
        loyalty_tier: 'gold'
      },
      preferred_locales: ['en', 'es']
    }
  );
} catch (error) {
  console.error('Customer update failed:', error.message);
}
```

## List Customers

Retrieve a paginated list of customers.

**Endpoint:** `GET /v1/customers`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| limit | integer | No | Number of customers to return (1-100) |
| starting_after | string | No | Cursor for pagination |
| email | string | No | Filter by email address |
| created | object | No | Filter by creation date |

### Example with Pagination

```javascript
async function getAllCustomers() {
  const customers = [];
  let hasMore = true;
  let startingAfter = null;
  
  while (hasMore) {
    try {
      const response = await stripe.customers.list({
        limit: 100,
        starting_after: startingAfter
      });
      
      customers.push(...response.data);
      hasMore = response.has_more;
      
      if (hasMore && response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    } catch (error) {
      console.error('Error fetching customers:', error.message);
      // Implement exponential backoff for rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return customers;
}
```

## Add Payment Method

Attach a payment method to a customer.

**Endpoint:** `POST /v1/payment_methods/:id/attach`

### Example

```javascript
try {
  // First create or retrieve a payment method
  const paymentMethod = await stripe.paymentMethods.attach(
    'pm_card_visa',
    {
      customer: 'cus_QMvPKq8MYXsC2x'
    }
  );
  
  // Optionally set as default payment method
  await stripe.customers.update('cus_QMvPKq8MYXsC2x', {
    invoice_settings: {
      default_payment_method: paymentMethod.id
    }
  });
} catch (error) {
  console.error('Failed to attach payment method:', error.message);
}
```

## Delete a Customer

Permanently delete a customer. This cannot be undone.

**Endpoint:** `DELETE /v1/customers/:id`

### Example

```javascript
try {
  const deleted = await stripe.customers.del('cus_QMvPKq8MYXsC2x');
  console.log('Customer deleted:', deleted.id);
} catch (error) {
  console.error('Failed to delete customer:', error.message);
}
```

