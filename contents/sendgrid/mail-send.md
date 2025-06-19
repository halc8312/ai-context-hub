# SendGrid Mail Send API

The Mail Send API is the core functionality of SendGrid, allowing you to send emails programmatically. It supports both simple and complex email sending scenarios.

## Key Features
- Send to multiple recipients
- Use dynamic templates
- Schedule emails
- Track opens and clicks
- Handle bounces and spam reports

## Send Email

Send an email to one or more recipients.

**Endpoint:** `POST /v3/mail/send`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| personalizations | array | Yes | Array of personalization objects (to, cc, bcc, subject) |
| from | object | Yes | From email address object with email and optional name |
| subject | string | Yes | Email subject line |
| content | array | Yes | Array of content objects (type and value) |
| template_id | string | No | The ID of a template to use |

### Example

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'recipient@example.com',
  from: 'sender@example.com',
  subject: 'Hello from SendGrid',
  text: 'This is a plain text email',
  html: '<p>This is an <strong>HTML</strong> email</p>',
};

sgMail.send(msg)
  .then(() => console.log('Email sent'))
  .catch((error) => console.error(error));
```

### Response

```json
{
  "status": 202,
  "headers": {
    "x-message-id": "abc123def456"
  }
}
```

## Send Multiple Emails

Send personalized emails to multiple recipients in a single API call.

**Endpoint:** `POST /v3/mail/send`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| personalizations | array | Yes | Array of personalization objects for each recipient |

### Example

```javascript
const msg = {
  personalizations: [
    {
      to: [{ email: 'recipient1@example.com' }],
      subject: 'Hello Recipient 1'
    },
    {
      to: [{ email: 'recipient2@example.com' }],
      subject: 'Hello Recipient 2'
    }
  ],
  from: { email: 'sender@example.com' },
  content: [
    {
      type: 'text/plain',
      value: 'Hello from SendGrid!'
    }
  ]
};

try {
  await sgMail.send(msg);
  console.log('Batch emails sent successfully');
} catch (error) {
  console.error('Batch send failed:', error.response?.body || error.message);
}
```

## Email Activity API

Query email activity and statistics.

**Endpoint:** `GET /v3/messages`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | No | Filter using query syntax |
| limit | integer | No | Number of results (1-1000) |
| next_page_token | string | No | Token for pagination |

### Example with Pagination

```javascript
const client = require('@sendgrid/client');
client.setApiKey(process.env.SENDGRID_API_KEY);

async function getEmailActivity(email) {
  const messages = [];
  let nextPageToken = null;
  
  do {
    try {
      const request = {
        url: '/v3/messages',
        method: 'GET',
        qs: {
          query: `to="${email}"`,
          limit: 100,
          next_page_token: nextPageToken
        }
      };
      
      const [response, body] = await client.request(request);
      messages.push(...body.messages);
      nextPageToken = body.next_page_token;
      
    } catch (error) {
      console.error('Failed to fetch activity:', error.response?.body || error.message);
      break;
    }
  } while (nextPageToken);
  
  return messages;
}
```

## Email Validation API

Validate email addresses before sending.

**Endpoint:** `POST /v3/validations/email`

### Example

```javascript
const request = {
  url: '/v3/validations/email',
  method: 'POST',
  body: {
    email: 'test@example.com',
    source: 'signup'
  }
};

try {
  const [response, body] = await client.request(request);
  
  if (body.result.verdict === 'Valid') {
    console.log('Email is valid');
    console.log('Score:', body.result.score);
  } else {
    console.log('Email validation failed:', body.result.verdict);
  }
} catch (error) {
  console.error('Validation error:', error.message);
}
```

## Sender Authentication

Verify sender domains for better deliverability.

**Endpoint:** `POST /v3/whitelabel/domains`

### Example

```javascript
const request = {
  url: '/v3/whitelabel/domains',
  method: 'POST',
  body: {
    domain: 'example.com',
    subdomain: 'mail',
    default: true,
    automatic_security: true
  }
};

try {
  const [response, body] = await client.request(request);
  console.log('Domain authentication created:', body.id);
  console.log('DNS records to add:', body.dns);
} catch (error) {
  console.error('Authentication failed:', error.response?.body || error.message);
}
```

## Suppression Management

Manage bounces, blocks, and unsubscribes.

**Endpoint:** `GET /v3/suppression/bounces`

### Example

```javascript
// Get bounced emails
const request = {
  url: '/v3/suppression/bounces',
  method: 'GET',
  qs: {
    start_time: 1718764800,
    end_time: 1718851200,
    limit: 100
  }
};

try {
  const [response, body] = await client.request(request);
  
  body.forEach(bounce => {
    console.log(`Email: ${bounce.email}`);
    console.log(`Reason: ${bounce.reason}`);
    console.log(`Created: ${new Date(bounce.created * 1000).toISOString()}`);
  });
} catch (error) {
  console.error('Failed to fetch bounces:', error.message);
}

// Remove email from suppression list
const deleteRequest = {
  url: '/v3/suppression/bounces/test@example.com',
  method: 'DELETE'
};

await client.request(deleteRequest);
```

