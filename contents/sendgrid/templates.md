# SendGrid Templates API

**Version:** v3  
**Last Updated:** 2025-06-19  
**SDK Version:** @sendgrid/client v8.x or higher

The Templates API enables you to create and manage reusable email templates. Use dynamic templates to personalize emails with Handlebars syntax.

## Rate Limiting
- Template operations: 600 requests per minute
- Template rendering: Based on mail send limits
- Version history: Last 300 versions retained

## Security Considerations
- Sanitize user input in templates to prevent XSS
- Use template versioning for audit trails
- Test templates thoroughly before production use
- Restrict template access with teammate permissions

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
const client = require('@sendgrid/client');
client.setApiKey(process.env.SENDGRID_API_KEY);

const data = {
  name: 'Welcome Email Template',
  generation: 'dynamic'
};

const request = {
  url: '/v3/templates',
  method: 'POST',
  body: data
};

try {
  const [response, body] = await client.request(request);
  console.log('Template created:', body.id);
  
  // Create a version for the template
  const versionData = {
    template_id: body.id,
    active: 1,
    name: 'Version 1',
    subject: 'Welcome to {{company_name}}!',
    html_content: `
      <html>
        <body>
          <h1>Welcome {{first_name}}!</h1>
          <p>Thank you for signing up with {{company_name}}.</p>
          {{#if premium_user}}
            <p>As a premium user, you get exclusive benefits!</p>
          {{else}}
            <p><a href="{{upgrade_url}}">Upgrade to Premium</a></p>
          {{/if}}
          <p>Best regards,<br>The {{company_name}} Team</p>
        </body>
      </html>
    `,
    plain_content: 'Welcome {{first_name}}! Thank you for signing up.',
    test_data: JSON.stringify({
      first_name: 'John',
      company_name: 'Acme Corp',
      premium_user: false,
      upgrade_url: 'https://example.com/upgrade'
    })
  };
  
  const versionRequest = {
    url: `/v3/templates/${body.id}/versions`,
    method: 'POST',
    body: versionData
  };
  
  const [versionResponse, versionBody] = await client.request(versionRequest);
  console.log('Template version created:', versionBody.id);
} catch (error) {
  console.error('Template creation failed:', error.response?.body || error.message);
}
```

### Response

```json
{
  "id": "d-4a5b2ee5d8a5497aab5b93822a8c3662",
  "name": "Welcome Email Template",
  "generation": "dynamic",
  "updated_at": "2025-06-19T10:00:00Z",
  "versions": []
}
```

## Send Email with Template

Use a template to send personalized emails.

### Example

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'recipient@example.com',
  from: 'sender@example.com',
  templateId: 'd-4a5b2ee5d8a5497aab5b93822a8c3662',
  dynamicTemplateData: {
    first_name: 'Jane',
    company_name: 'Example Inc',
    premium_user: true,
    upgrade_url: 'https://example.com/upgrade'
  }
};

try {
  await sgMail.send(msg);
  console.log('Template email sent successfully');
} catch (error) {
  console.error('Failed to send template email:', error.response?.body || error.message);
}
```

## List Templates

Retrieve all templates with pagination.

**Endpoint:** `GET /v3/templates`

### Example with Pagination

```javascript
async function getAllTemplates() {
  const templates = [];
  let pageToken = null;
  
  do {
    const request = {
      url: '/v3/templates',
      method: 'GET',
      qs: {
        generations: 'dynamic',
        page_size: 100,
        page_token: pageToken
      }
    };
    
    try {
      const [response, body] = await client.request(request);
      templates.push(...body.result);
      pageToken = body._metadata?.next;
    } catch (error) {
      console.error('Failed to list templates:', error.message);
      break;
    }
  } while (pageToken);
  
  return templates;
}
```

## Update Template Version

Update an existing template version.

**Endpoint:** `PATCH /v3/templates/{template_id}/versions/{version_id}`

### Example

```javascript
const request = {
  url: '/v3/templates/d-4a5b2ee5d8a5497aab5b93822a8c3662/versions/version-id-here',
  method: 'PATCH',
  body: {
    subject: 'Welcome to {{company_name}} - Special Offer Inside!',
    html_content: '<h1>Updated content with special offer</h1>'
  }
};

try {
  const [response, body] = await client.request(request);
  console.log('Template version updated');
} catch (error) {
  console.error('Update failed:', error.message);
}
```

## Template Statistics

Get email statistics for a specific template.

**Endpoint:** `GET /v3/stats`

### Example

```javascript
const request = {
  url: '/v3/stats',
  method: 'GET',
  qs: {
    start_date: '2025-06-01',
    end_date: '2025-06-19',
    aggregated_by: 'day',
    template_ids: 'd-4a5b2ee5d8a5497aab5b93822a8c3662'
  }
};

try {
  const [response, body] = await client.request(request);
  
  body.forEach(stat => {
    console.log(`Date: ${stat.date}`);
    console.log(`Sent: ${stat.stats[0].metrics.requests}`);
    console.log(`Delivered: ${stat.stats[0].metrics.delivered}`);
    console.log(`Opens: ${stat.stats[0].metrics.opens}`);
    console.log(`Clicks: ${stat.stats[0].metrics.clicks}`);
  });
} catch (error) {
  console.error('Failed to get stats:', error.message);
}
```

