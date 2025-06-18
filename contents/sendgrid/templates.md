# SendGrid Templates API

The Templates API enables you to create and manage reusable email templates. Use dynamic templates to personalize emails with Handlebars syntax.

## Key Features
- Dynamic content with Handlebars
- Version control
- Test data support
- Template sharing

## Create Email Template

Create a new transactional email template.

**Endpoint:** `POST /v3/templates`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Name of the template |
| generation | string | No | Template generation (legacy or dynamic) |

### Example

```javascript
const data = {
  name: 'Welcome Email Template',
  generation: 'dynamic'
};

const request = {
  url: '/v3/templates',
  method: 'POST',
  body: data
};

client.request(request)
  .then(([response, body]) => {
    console.log('Template created:', body);
  });
```

### Response

```json
{
  "id": "d-12345",
  "name": "Welcome Email Template",
  "generation": "dynamic",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

