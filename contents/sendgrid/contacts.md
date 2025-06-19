# SendGrid Contacts API

**Version:** v3  
**Last Updated:** 2025-06-19  
**SDK Version:** @sendgrid/client v8.x or higher

The Contacts API allows you to manage your email lists and subscribers. You can add, update, and segment contacts for targeted email campaigns.

## Rate Limiting
- Bulk operations: 30 requests per minute
- Individual operations: 600 requests per minute
- CSV import size limit: 1GB or 1 million contacts
- Use job status endpoints to monitor bulk operations

## Security Considerations
- Comply with GDPR and privacy regulations
- Implement double opt-in for subscriptions
- Hash or encrypt sensitive custom fields
- Regularly clean your contact lists

## Key Features
- Bulk import contacts
- Custom fields support
- List management
- Segmentation

## Add Contacts

Add or update contacts in your SendGrid account.

**Endpoint:** `PUT /v3/marketing/contacts`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| contacts | array | Yes | Array of contact objects to add or update |
| list_ids | array | No | Array of list IDs to add the contacts to |

### Example

```javascript
const client = require('@sendgrid/client');
client.setApiKey(process.env.SENDGRID_API_KEY);

const data = {
  contacts: [
    {
      email: 'user@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '+1234567890',
      address_line_1: '123 Main St',
      city: 'San Francisco',
      state_province_region: 'CA',
      postal_code: '94111',
      country: 'USA',
      custom_fields: {
        e1_T: 'Customer',
        e2_N: 12345 // Custom field ID and value
      }
    }
  ],
  list_ids: ['list-id-1', 'list-id-2'] // Optional: Add to specific lists
};

const request = {
  url: '/v3/marketing/contacts',
  method: 'PUT',
  body: data
};

try {
  const [response, body] = await client.request(request);
  console.log('Contacts queued for import');
  console.log('Job ID:', body.job_id);
  
  // Monitor job status
  await checkJobStatus(body.job_id);
} catch (error) {
  if (error.response?.statusCode === 429) {
    console.error('Rate limit exceeded. Retry after:', error.response.headers['x-ratelimit-reset']);
  } else {
    console.error('Failed to add contacts:', error.response?.body || error.message);
  }
}

// Helper function to check job status
async function checkJobStatus(jobId) {
  const statusRequest = {
    url: `/v3/marketing/contacts/imports/${jobId}`,
    method: 'GET'
  };
  
  let status;
  do {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    const [response, body] = await client.request(statusRequest);
    status = body.status;
    console.log('Import status:', status);
    
    if (status === 'completed') {
      console.log('Contacts imported successfully');
      console.log('Total processed:', body.results.requested_count);
      console.log('Created:', body.results.created_count);
      console.log('Updated:', body.results.updated_count);
      console.log('Errors:', body.results.errored_count);
    }
  } while (status === 'pending' || status === 'processing');
}
```

### Response

```json
{
  "job_id": "YzJhNmM3M2UtMDE4NC00OTg0LTk2NjYtZGE4MDBlYjgwMzll",
  "upload_uri": "/v3/marketing/contacts/imports/YzJhNmM3M2UtMDE4NC00OTg0LTk2NjYtZGE4MDBlYjgwMzll",
  "upload_headers": {
    "authorization": "Bearer sg_imp_ZGE4MDBlYjgwMzll"
  }
}
```

## Search Contacts

Search for contacts using query syntax.

**Endpoint:** `POST /v3/marketing/contacts/search`

### Example with Pagination

```javascript
async function searchContacts(query) {
  const contacts = [];
  let pageToken = null;
  
  do {
    const request = {
      url: '/v3/marketing/contacts/search',
      method: 'POST',
      body: {
        query: query, // e.g., "email LIKE '%@example.com' AND created_at > '2025-01-01'"
        page_size: 100,
        page_token: pageToken
      }
    };
    
    try {
      const [response, body] = await client.request(request);
      contacts.push(...body.result);
      pageToken = body._metadata.next;
    } catch (error) {
      console.error('Search failed:', error.response?.body || error.message);
      break;
    }
  } while (pageToken);
  
  return contacts;
}

// Example usage
const activeCustomers = await searchContacts(
  "custom_fields.e1_T = 'Customer' AND CONTAINS(email, 'gmail.com')"
);
```

## Delete Contacts

Delete contacts from your account.

**Endpoint:** `DELETE /v3/marketing/contacts`

### Example

```javascript
const request = {
  url: '/v3/marketing/contacts',
  method: 'DELETE',
  qs: {
    ids: 'contact-id-1,contact-id-2,contact-id-3'
  }
};

try {
  const [response, body] = await client.request(request);
  console.log('Delete job started:', body.job_id);
} catch (error) {
  console.error('Failed to delete contacts:', error.message);
}
```

## Export Contacts

Export contacts to a CSV file.

**Endpoint:** `POST /v3/marketing/contacts/exports`

### Example

```javascript
const request = {
  url: '/v3/marketing/contacts/exports',
  method: 'POST',
  body: {
    list_ids: ['list-id-1'],
    segment_ids: ['segment-id-1'],
    file_type: 'csv',
    max_file_size: 5000 // MB
  }
};

try {
  const [response, body] = await client.request(request);
  console.log('Export started:', body.id);
  
  // Check export status
  const statusRequest = {
    url: `/v3/marketing/contacts/exports/${body.id}`,
    method: 'GET'
  };
  
  // Poll for completion
  let exportStatus;
  do {
    await new Promise(resolve => setTimeout(resolve, 10000));
    const [statusResponse, statusBody] = await client.request(statusRequest);
    exportStatus = statusBody.status;
    
    if (exportStatus === 'completed') {
      console.log('Export ready for download:', statusBody.urls);
    }
  } while (exportStatus === 'pending' || exportStatus === 'processing');
} catch (error) {
  console.error('Export failed:', error.message);
}
```

