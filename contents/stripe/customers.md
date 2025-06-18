# Stripe Customers API

The Customers API allows you to create and manage customers. You can store multiple payment methods on a customer to charge at a later time.

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
const customer = await stripe.customers.create({
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  metadata: {
    user_id: '12345'
  }
});
```

### Response

```json
{
  "id": "cus_1234567890",
  "object": "customer",
  "email": "customer@example.com",
  "name": "John Doe",
  "created": 1234567890
}
```

