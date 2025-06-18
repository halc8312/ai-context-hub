import { BaseApiCollector, ApiFunction } from '../base-collector'

export class SupabaseCollector extends BaseApiCollector {
  constructor() {
    super('supabase')
  }

  async collect(): Promise<void> {
    console.log('Collecting Supabase API documentation...')
    
    const functions = await this.getSupabaseFunctions()
    
    await this.generateAuthDoc(functions.auth)
    await this.generateDatabaseDoc(functions.database)
    await this.generateStorageDoc(functions.storage)
    
    console.log('Supabase API documentation collection completed!')
  }

  private async getSupabaseFunctions() {
    return {
      auth: [
        {
          name: 'Sign Up',
          description: 'Create a new user account with email and password.',
          endpoint: 'supabase.auth.signUp()',
          method: 'Function',
          parameters: [
            {
              name: 'email',
              type: 'string',
              required: true,
              description: 'User email address'
            },
            {
              name: 'password',
              type: 'string',
              required: true,
              description: 'User password (min 6 characters)'
            },
            {
              name: 'options',
              type: 'object',
              required: false,
              description: 'Additional options like email redirect URL, user metadata'
            }
          ],
          example: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
})`,
          response: `{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "created_at": "2023-12-01T10:00:00Z",
    "app_metadata": {},
    "user_metadata": {
      "first_name": "John",
      "last_name": "Doe"
    }
  },
  "session": null
}`
        },
        {
          name: 'Sign In',
          description: 'Authenticate a user with email and password.',
          endpoint: 'supabase.auth.signInWithPassword()',
          method: 'Function',
          parameters: [
            {
              name: 'email',
              type: 'string',
              required: true,
              description: 'User email address'
            },
            {
              name: 'password',
              type: 'string',
              required: true,
              description: 'User password'
            }
          ],
          example: `const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

if (data.session) {
  console.log('User logged in:', data.user)
}`,
          response: `{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "expires_in": 3600
  }
}`
        }
      ],
      database: [
        {
          name: 'Select Data',
          description: 'Query data from a table with filters and modifiers.',
          endpoint: 'supabase.from().select()',
          method: 'Function',
          parameters: [
            {
              name: 'table',
              type: 'string',
              required: true,
              description: 'Name of the table to query'
            },
            {
              name: 'columns',
              type: 'string',
              required: false,
              description: 'Columns to select (default: *)'
            },
            {
              name: 'filters',
              type: 'object',
              required: false,
              description: 'Filter conditions using methods like eq, gt, lt'
            }
          ],
          example: `// Select all columns
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
  .limit(10)`,
          response: `[
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
]`
        },
        {
          name: 'Insert Data',
          description: 'Insert new rows into a table.',
          endpoint: 'supabase.from().insert()',
          method: 'Function',
          parameters: [
            {
              name: 'table',
              type: 'string',
              required: true,
              description: 'Name of the table'
            },
            {
              name: 'data',
              type: 'object | array',
              required: true,
              description: 'Data to insert (single object or array)'
            },
            {
              name: 'options',
              type: 'object',
              required: false,
              description: 'Options like returning data, on conflict behavior'
            }
          ],
          example: `// Insert single row
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
  ])`,
          response: `{
  "data": [
    {
      "id": 3,
      "name": "New Product",
      "price": 29.99,
      "category": "accessories",
      "created_at": "2023-12-01T10:00:00Z"
    }
  ]
}`
        },
        {
          name: 'Real-time Subscription',
          description: 'Subscribe to real-time changes in your database.',
          endpoint: 'supabase.channel().on()',
          method: 'Function',
          parameters: [
            {
              name: 'event',
              type: 'string',
              required: true,
              description: 'Event type: INSERT, UPDATE, DELETE, or *'
            },
            {
              name: 'schema',
              type: 'string',
              required: true,
              description: 'Database schema (usually public)'
            },
            {
              name: 'table',
              type: 'string',
              required: true,
              description: 'Table name to subscribe to'
            }
          ],
          example: `const channel = supabase
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
channel.unsubscribe()`,
          response: `{
  "eventType": "INSERT",
  "new": {
    "id": 4,
    "name": "Real-time Product",
    "price": 49.99
  },
  "old": {},
  "schema": "public",
  "table": "products"
}`
        }
      ],
      storage: [
        {
          name: 'Upload File',
          description: 'Upload a file to Supabase Storage.',
          endpoint: 'supabase.storage.from().upload()',
          method: 'Function',
          parameters: [
            {
              name: 'bucket',
              type: 'string',
              required: true,
              description: 'Storage bucket name'
            },
            {
              name: 'path',
              type: 'string',
              required: true,
              description: 'File path within the bucket'
            },
            {
              name: 'file',
              type: 'File | Blob | ArrayBuffer',
              required: true,
              description: 'File data to upload'
            },
            {
              name: 'options',
              type: 'object',
              required: false,
              description: 'Upload options like contentType, upsert'
            }
          ],
          example: `const file = event.target.files[0]

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(\`public/\${file.name}\`, file, {
    contentType: file.type,
    upsert: false
  })

if (data) {
  console.log('File uploaded:', data.path)
}`,
          response: `{
  "path": "public/avatar.jpg",
  "id": "file-id-here",
  "fullPath": "avatars/public/avatar.jpg"
}`
        },
        {
          name: 'Get Public URL',
          description: 'Get a public URL for a file in storage.',
          endpoint: 'supabase.storage.from().getPublicUrl()',
          method: 'Function',
          parameters: [
            {
              name: 'bucket',
              type: 'string',
              required: true,
              description: 'Storage bucket name'
            },
            {
              name: 'path',
              type: 'string',
              required: true,
              description: 'File path within the bucket'
            }
          ],
          example: `const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar.jpg')

console.log('Public URL:', data.publicUrl)`,
          response: `{
  "publicUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/public/avatar.jpg"
}`
        }
      ]
    }
  }

  private async generateAuthDoc(functions: ApiFunction[]) {
    let markdown = `# Supabase Authentication API

Supabase Auth provides a complete authentication solution with support for email/password, magic links, social providers, and more.

## Key Features
- Email & password authentication
- Magic link authentication
- Social OAuth providers (Google, GitHub, etc.)
- Multi-factor authentication
- Row Level Security integration

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('auth.md', markdown)
  }

  private async generateDatabaseDoc(functions: ApiFunction[]) {
    let markdown = `# Supabase Database API

The Supabase Database API provides a simple interface to PostgreSQL with real-time capabilities, allowing you to build reactive applications.

## Key Features
- PostgreSQL database
- Real-time subscriptions
- Row Level Security
- Database functions
- Full-text search

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('database.md', markdown)
  }

  private async generateStorageDoc(functions: ApiFunction[]) {
    let markdown = `# Supabase Storage API

Supabase Storage allows you to store and serve large files like images, videos, and documents with built-in CDN and transformations.

## Key Features
- File uploads and downloads
- Public and private buckets
- Image transformations
- CDN integration
- Access policies

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('storage.md', markdown)
  }
}