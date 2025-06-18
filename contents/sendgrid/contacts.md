# SendGrid Contacts API

The Contacts API allows you to manage your email lists and subscribers. You can add, update, and segment contacts for targeted email campaigns.

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
      custom_fields: {
        e1_T: 'Customer'
      }
    }
  ]
};

const request = {
  url: '/v3/marketing/contacts',
  method: 'PUT',
  body: data
};

client.request(request)
  .then(([response, body]) => {
    console.log(response.statusCode);
    console.log(body);
  });
```

### Response

```json
{
  "job_id": "job_12345",
  "upload_uri": "/v3/marketing/contacts/imports/job_12345",
  "upload_headers": {
    "authorization": "Bearer sg_imp_12345"
  }
}
```

