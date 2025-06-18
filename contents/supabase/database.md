# Supabase Database API

The Supabase Database API provides a simple interface to PostgreSQL with real-time capabilities, allowing you to build reactive applications.

## Key Features
- PostgreSQL database
- Real-time subscriptions
- Row Level Security
- Database functions
- Full-text search

## Select Data

Query data from a table with filters and modifiers.

**Endpoint:** `Function supabase.from().select()`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| table | string | Yes | Name of the table to query |
| columns | string | No | Columns to select (default: *) |
| filters | object | No | Filter conditions using methods like eq, gt, lt |

### Example

```javascript
// Select all columns
const { data, error } = await supabase
  .from('products')
  .select()

// Select specific columns with filter
const { data, error } = await supabase
  .from('products')
  .select('id, name, price')
  .eq('category', 'electronics')
  .gt('price', 100)
  .order('price', { ascending: false })
  .limit(10)
```

### Response

```json
[
  {
    "id": 1,
    "name": "Laptop",
    "price": 999.99,
    "category": "electronics"
  },
  {
    "id": 2,
    "name": "Smartphone",
    "price": 699.99,
    "category": "electronics"
  }
]
```

## Insert Data

Insert new rows into a table.

**Endpoint:** `Function supabase.from().insert()`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| table | string | Yes | Name of the table |
| data | object | array | Yes | Data to insert (single object or array) |
| options | object | No | Options like returning data, on conflict behavior |

### Example

```javascript
// Insert single row
const { data, error } = await supabase
  .from('products')
  .insert({
    name: 'New Product',
    price: 29.99,
    category: 'accessories'
  })
  .select()

// Insert multiple rows
const { data, error } = await supabase
  .from('products')
  .insert([
    { name: 'Product 1', price: 19.99 },
    { name: 'Product 2', price: 39.99 }
  ])
```

### Response

```json
{
  "data": [
    {
      "id": 3,
      "name": "New Product",
      "price": 29.99,
      "category": "accessories",
      "created_at": "2023-12-01T10:00:00Z"
    }
  ]
}
```

## Real-time Subscription

Subscribe to real-time changes in your database.

**Endpoint:** `Function supabase.channel().on()`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| event | string | Yes | Event type: INSERT, UPDATE, DELETE, or * |
| schema | string | Yes | Database schema (usually public) |
| table | string | Yes | Table name to subscribe to |

### Example

```javascript
const channel = supabase
  .channel('products-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'products'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Cleanup subscription
channel.unsubscribe()
```

### Response

```json
{
  "eventType": "INSERT",
  "new": {
    "id": 4,
    "name": "Real-time Product",
    "price": 49.99
  },
  "old": {},
  "schema": "public",
  "table": "products"
}
```

