# Supabase Database API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** @supabase/supabase-js v2.x or higher

The Supabase Database API provides a simple interface to PostgreSQL with real-time capabilities, allowing you to build reactive applications.

## Rate Limiting
- API requests: 1000 per minute
- Realtime connections: Based on plan
- Row limits: Default 1000 rows per query
- Use pagination for large datasets

## Security Considerations
- Always enable Row Level Security (RLS)
- Use service role key only server-side
- Implement proper data validation
- Use prepared statements to prevent SQL injection
- Monitor database performance and queries

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
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

try {
  // Select all columns
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('*')
  
  if (allError) {
    console.error('Query failed:', allError.message)
    return
  }
  
  // Select with complex filters and joins
  const { data, error, count } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      category:categories(name),
      reviews(
        rating,
        comment,
        user:users(name)
      )
    `, { count: 'exact' }) // Get total count
    .eq('category', 'electronics')
    .gt('price', 100)
    .lte('price', 1000)
    .or('brand.eq.Apple,brand.eq.Samsung')
    .order('price', { ascending: false })
    .range(0, 9) // Pagination: items 0-9
  
  if (error) {
    if (error.code === 'PGRST116') {
      console.error('No rows found');
    } else if (error.code === '42501') {
      console.error('Permission denied - check RLS policies');
    } else {
      console.error('Query error:', error.message);
    }
  } else {
    console.log(`Found ${count} total products`);
    console.log('Products:', data);
  }
} catch (err) {
  console.error('Network error:', err);
}
```

### Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "MacBook Pro",
      "price": 999.99,
      "category": {
        "name": "Electronics"
      },
      "reviews": [
        {
          "rating": 5,
          "comment": "Great laptop!",
          "user": {
            "name": "John Doe"
          }
        }
      ]
    },
    {
      "id": 2,
      "name": "iPhone 15",
      "price": 899.99,
      "category": {
        "name": "Electronics"
      },
      "reviews": []
    }
  ],
  "count": 25,
  "error": null
}
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
try {
  // Insert single row
  const { data: newProduct, error: insertError } = await supabase
    .from('products')
    .insert({
      name: 'New Product',
      price: 29.99,
      category_id: 3,
      description: 'A great new product',
      stock: 100,
      created_at: new Date().toISOString()
    })
    .select() // Return inserted data
    .single() // Expect single row
  
  if (insertError) {
    if (insertError.code === '23505') {
      console.error('Duplicate key violation');
    } else if (insertError.code === '23503') {
      console.error('Foreign key violation');
    } else {
      console.error('Insert failed:', insertError.message);
    }
  } else {
    console.log('Product created:', newProduct);
  }
  
  // Bulk insert with upsert
  const { data: bulkData, error: bulkError } = await supabase
    .from('products')
    .upsert([
      { id: 1, name: 'Updated Product 1', price: 19.99 },
      { name: 'New Product 2', price: 39.99 }
    ], {
      onConflict: 'id', // Update if ID exists
      ignoreDuplicates: false
    })
    .select()
  
  if (!bulkError) {
    console.log('Bulk operation completed:', bulkData);
  }
} catch (err) {
  console.error('Database error:', err);
}
```

### Response

```json
{
  "data": {
    "id": 3,
    "name": "New Product",
    "price": 29.99,
    "category_id": 3,
    "description": "A great new product",
    "stock": 100,
    "created_at": "2025-06-19T10:00:00Z",
    "updated_at": "2025-06-19T10:00:00Z"
  },
  "error": null
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
// Subscribe to specific events with filters
const channel = supabase
  .channel('products-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'products',
      filter: 'category_id=eq.1' // Only electronics
    },
    (payload) => {
      console.log('New product added:', payload.new)
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'products',
      filter: 'price>100'
    },
    (payload) => {
      console.log('Price updated:', payload.old, '->', payload.new)
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'products'
    },
    (payload) => {
      console.log('Product deleted:', payload.old)
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Realtime subscription active');
    }
  })

// Handle connection states
channel.on('system', {}, (payload) => {
  console.log('System event:', payload)
})

// Cleanup subscription
setTimeout(() => {
  supabase.removeChannel(channel)
}, 60000)
```

### Response

```json
{
  "schema": "public",
  "table": "products",
  "commit_timestamp": "2025-06-19T10:00:00Z",
  "eventType": "INSERT",
  "new": {
    "id": 4,
    "name": "Real-time Product",
    "price": 49.99,
    "category_id": 1,
    "created_at": "2025-06-19T10:00:00Z"
  },
  "old": {},
  "errors": null
}
```

## Update Data

Update existing rows in a table.

**Endpoint:** `Function supabase.from().update()`

### Example

```javascript
// Update single row
const { data: updated, error } = await supabase
  .from('products')
  .update({ 
    price: 24.99,
    on_sale: true,
    updated_at: new Date().toISOString()
  })
  .eq('id', 1)
  .select()
  .single()

// Bulk update with conditions
const { data: bulkUpdated, error: bulkError } = await supabase
  .from('products')
  .update({ 
    on_sale: true,
    discount_percentage: 20
  })
  .gt('price', 100)
  .lt('stock', 10)
  .select()
```

## Delete Data

Delete rows from a table.

**Endpoint:** `Function supabase.from().delete()`

### Example

```javascript
// Delete with confirmation
const { data: deleted, error } = await supabase
  .from('products')
  .delete()
  .eq('id', 1)
  .select() // Return deleted row

if (!error && deleted.length > 0) {
  console.log('Deleted product:', deleted[0]);
}

// Soft delete pattern
const { error: softDeleteError } = await supabase
  .from('products')
  .update({ 
    deleted_at: new Date().toISOString(),
    is_deleted: true
  })
  .eq('id', 2)
```

## RPC Functions

Call PostgreSQL functions.

**Endpoint:** `Function supabase.rpc()`

### Example

```javascript
// Call a stored procedure
const { data, error } = await supabase
  .rpc('calculate_order_total', {
    order_id: 123,
    include_tax: true
  })

if (!error) {
  console.log('Order total:', data);
}

// Call aggregate function
const { data: stats, error: statsError } = await supabase
  .rpc('get_product_statistics', {
    category_id: 1
  })
```

## Database Webhooks

Configure webhooks for database events.

### SQL Example

```sql
-- Create webhook function
CREATE OR REPLACE FUNCTION notify_webhook()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload = json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'data', row_to_json(NEW),
    'old_data', row_to_json(OLD),
    'timestamp', current_timestamp
  );
  
  PERFORM net.http_post(
    url := 'https://webhook.site/your-endpoint',
    body := payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', 'your-secret'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER product_changes_webhook
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION notify_webhook();
```

## Edge Functions Integration

Call Supabase Edge Functions from the client.

### Example

```javascript
// Invoke edge function
const { data, error } = await supabase.functions.invoke('process-payment', {
  body: {
    amount: 99.99,
    currency: 'USD',
    customer_id: 'cus_123'
  },
  headers: {
    'x-custom-header': 'value'
  }
})

if (!error) {
  console.log('Payment processed:', data);
}
```

## Vector/Embeddings Support

Work with vector embeddings for AI applications.

### Example

```javascript
// Store embeddings
const { error: insertError } = await supabase
  .from('documents')
  .insert({
    content: 'This is a sample document',
    embedding: [0.1, 0.2, 0.3, ...], // 1536-dimensional vector
  })

// Similarity search
const { data: similar, error: searchError } = await supabase
  .rpc('match_documents', {
    query_embedding: [0.1, 0.15, 0.25, ...],
    match_threshold: 0.8,
    match_count: 10
  })

// Example RPC function for similarity search
/*
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  FROM documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
*/
```

