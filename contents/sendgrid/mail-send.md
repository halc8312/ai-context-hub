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

sgMail.send(msg);
```

