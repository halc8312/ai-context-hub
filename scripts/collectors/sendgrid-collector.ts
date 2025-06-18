import { BaseApiCollector, ApiFunction } from '../base-collector'

export class SendGridCollector extends BaseApiCollector {
  constructor() {
    super('sendgrid')
  }

  async collect(): Promise<void> {
    console.log('Collecting SendGrid API documentation...')
    
    const functions = await this.getSendGridFunctions()
    
    await this.generateMailSendDoc(functions.mailSend)
    await this.generateContactsDoc(functions.contacts)
    await this.generateTemplatesDoc(functions.templates)
    
    console.log('SendGrid API documentation collection completed!')
  }

  private async getSendGridFunctions() {
    return {
      mailSend: [
        {
          name: 'Send Email',
          description: 'Send an email to one or more recipients.',
          endpoint: '/v3/mail/send',
          method: 'POST',
          parameters: [
            {
              name: 'personalizations',
              type: 'array',
              required: true,
              description: 'Array of personalization objects (to, cc, bcc, subject)'
            },
            {
              name: 'from',
              type: 'object',
              required: true,
              description: 'From email address object with email and optional name'
            },
            {
              name: 'subject',
              type: 'string',
              required: true,
              description: 'Email subject line'
            },
            {
              name: 'content',
              type: 'array',
              required: true,
              description: 'Array of content objects (type and value)'
            },
            {
              name: 'template_id',
              type: 'string',
              required: false,
              description: 'The ID of a template to use'
            }
          ],
          example: `const sgMail = require('@sendgrid/mail');
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
  .catch((error) => console.error(error));`,
          response: `{
  "status": 202,
  "headers": {
    "x-message-id": "abc123def456"
  }
}`
        },
        {
          name: 'Send Multiple Emails',
          description: 'Send personalized emails to multiple recipients in a single API call.',
          endpoint: '/v3/mail/send',
          method: 'POST',
          parameters: [
            {
              name: 'personalizations',
              type: 'array',
              required: true,
              description: 'Array of personalization objects for each recipient'
            }
          ],
          example: `const msg = {
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

sgMail.send(msg);`
        }
      ],
      contacts: [
        {
          name: 'Add Contacts',
          description: 'Add or update contacts in your SendGrid account.',
          endpoint: '/v3/marketing/contacts',
          method: 'PUT',
          parameters: [
            {
              name: 'contacts',
              type: 'array',
              required: true,
              description: 'Array of contact objects to add or update'
            },
            {
              name: 'list_ids',
              type: 'array',
              required: false,
              description: 'Array of list IDs to add the contacts to'
            }
          ],
          example: `const client = require('@sendgrid/client');
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
  });`,
          response: `{
  "job_id": "job_12345",
  "upload_uri": "/v3/marketing/contacts/imports/job_12345",
  "upload_headers": {
    "authorization": "Bearer sg_imp_12345"
  }
}`
        }
      ],
      templates: [
        {
          name: 'Create Email Template',
          description: 'Create a new transactional email template.',
          endpoint: '/v3/templates',
          method: 'POST',
          parameters: [
            {
              name: 'name',
              type: 'string',
              required: true,
              description: 'Name of the template'
            },
            {
              name: 'generation',
              type: 'string',
              required: false,
              description: 'Template generation (legacy or dynamic)'
            }
          ],
          example: `const data = {
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
  });`,
          response: `{
  "id": "d-12345",
  "name": "Welcome Email Template",
  "generation": "dynamic",
  "updated_at": "2023-12-01T10:00:00Z"
}`
        }
      ]
    }
  }

  private async generateMailSendDoc(functions: ApiFunction[]) {
    let markdown = `# SendGrid Mail Send API

The Mail Send API is the core functionality of SendGrid, allowing you to send emails programmatically. It supports both simple and complex email sending scenarios.

## Key Features
- Send to multiple recipients
- Use dynamic templates
- Schedule emails
- Track opens and clicks
- Handle bounces and spam reports

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('mail-send.md', markdown)
  }

  private async generateContactsDoc(functions: ApiFunction[]) {
    let markdown = `# SendGrid Contacts API

The Contacts API allows you to manage your email lists and subscribers. You can add, update, and segment contacts for targeted email campaigns.

## Key Features
- Bulk import contacts
- Custom fields support
- List management
- Segmentation

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('contacts.md', markdown)
  }

  private async generateTemplatesDoc(functions: ApiFunction[]) {
    let markdown = `# SendGrid Templates API

The Templates API enables you to create and manage reusable email templates. Use dynamic templates to personalize emails with Handlebars syntax.

## Key Features
- Dynamic content with Handlebars
- Version control
- Test data support
- Template sharing

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('templates.md', markdown)
  }
}