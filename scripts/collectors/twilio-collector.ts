import { BaseApiCollector, ApiFunction } from '../base-collector'

export class TwilioCollector extends BaseApiCollector {
  constructor() {
    super('twilio')
  }

  async collect(): Promise<void> {
    console.log('Collecting Twilio API documentation...')
    
    const functions = await this.getTwilioFunctions()
    
    await this.generateMessagingDoc(functions.messaging)
    await this.generateVoiceDoc(functions.voice)
    await this.generateVerifyDoc(functions.verify)
    
    console.log('Twilio API documentation collection completed!')
  }

  private async getTwilioFunctions() {
    return {
      messaging: [
        {
          name: 'Send SMS',
          description: 'Send an SMS message to a phone number.',
          endpoint: '/2010-04-01/Accounts/{AccountSid}/Messages.json',
          method: 'POST',
          parameters: [
            {
              name: 'To',
              type: 'string',
              required: true,
              description: 'The destination phone number in E.164 format'
            },
            {
              name: 'From',
              type: 'string',
              required: true,
              description: 'A Twilio phone number or Messaging Service SID'
            },
            {
              name: 'Body',
              type: 'string',
              required: true,
              description: 'The text body of the message (up to 1600 characters)'
            },
            {
              name: 'MediaUrl',
              type: 'array',
              required: false,
              description: 'URLs of media to include (MMS)'
            },
            {
              name: 'StatusCallback',
              type: 'string',
              required: false,
              description: 'URL for status callbacks'
            }
          ],
          example: `const twilio = require('twilio');
const client = twilio(accountSid, authToken);

client.messages
  .create({
    body: 'Hello from Twilio!',
    from: '+1234567890',
    to: '+0987654321'
  })
  .then(message => console.log(message.sid))
  .catch(error => console.error(error));`,
          response: `{
  "sid": "SM1234567890abcdef",
  "date_created": "Thu, 30 Jul 2015 20:12:31 +0000",
  "date_updated": "Thu, 30 Jul 2015 20:12:33 +0000",
  "to": "+0987654321",
  "from": "+1234567890",
  "body": "Hello from Twilio!",
  "status": "sent",
  "num_segments": "1",
  "direction": "outbound-api",
  "price": "-0.00750",
  "price_unit": "USD"
}`
        },
        {
          name: 'Send WhatsApp Message',
          description: 'Send a WhatsApp message using Twilio.',
          endpoint: '/2010-04-01/Accounts/{AccountSid}/Messages.json',
          method: 'POST',
          parameters: [
            {
              name: 'To',
              type: 'string',
              required: true,
              description: 'WhatsApp number with whatsapp: prefix'
            },
            {
              name: 'From',
              type: 'string',
              required: true,
              description: 'Your Twilio WhatsApp number'
            },
            {
              name: 'Body',
              type: 'string',
              required: true,
              description: 'Message content'
            }
          ],
          example: `client.messages
  .create({
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:+15005550006',
    body: 'Hello from WhatsApp!'
  })
  .then(message => console.log(message.sid));`
        }
      ],
      voice: [
        {
          name: 'Make Outbound Call',
          description: 'Initiate an outbound voice call.',
          endpoint: '/2010-04-01/Accounts/{AccountSid}/Calls.json',
          method: 'POST',
          parameters: [
            {
              name: 'To',
              type: 'string',
              required: true,
              description: 'The phone number to call'
            },
            {
              name: 'From',
              type: 'string',
              required: true,
              description: 'Your Twilio phone number'
            },
            {
              name: 'Url',
              type: 'string',
              required: true,
              description: 'URL that returns TwiML instructions'
            },
            {
              name: 'Method',
              type: 'string',
              required: false,
              description: 'HTTP method for Url (GET or POST)'
            },
            {
              name: 'StatusCallback',
              type: 'string',
              required: false,
              description: 'URL for status callbacks'
            }
          ],
          example: `client.calls
  .create({
    url: 'http://demo.twilio.com/docs/voice.xml',
    to: '+0987654321',
    from: '+1234567890'
  })
  .then(call => console.log(call.sid));`,
          response: `{
  "sid": "CA1234567890abcdef",
  "date_created": "Tue, 10 Aug 2010 08:02:17 +0000",
  "date_updated": "Tue, 10 Aug 2010 08:02:47 +0000",
  "to": "+0987654321",
  "from": "+1234567890",
  "status": "completed",
  "duration": "30",
  "price": "-0.02000",
  "price_unit": "USD",
  "direction": "outbound-api"
}`
        }
      ],
      verify: [
        {
          name: 'Send Verification Code',
          description: 'Send a verification code via SMS, voice call, or email.',
          endpoint: '/v2/Services/{ServiceSid}/Verifications',
          method: 'POST',
          parameters: [
            {
              name: 'To',
              type: 'string',
              required: true,
              description: 'Phone number or email to verify'
            },
            {
              name: 'Channel',
              type: 'string',
              required: true,
              description: 'Delivery channel: sms, call, email, or whatsapp'
            },
            {
              name: 'Locale',
              type: 'string',
              required: false,
              description: 'Language locale for the verification message'
            }
          ],
          example: `const client = twilio(accountSid, authToken);

client.verify.v2.services('VA1234567890abcdef')
  .verifications
  .create({
    to: '+0987654321',
    channel: 'sms'
  })
  .then(verification => console.log(verification.status));`,
          response: `{
  "sid": "VE1234567890abcdef",
  "service_sid": "VA1234567890abcdef",
  "to": "+0987654321",
  "channel": "sms",
  "status": "pending",
  "valid": false,
  "date_created": "2023-12-01T10:00:00Z",
  "date_updated": "2023-12-01T10:00:00Z"
}`
        },
        {
          name: 'Check Verification Code',
          description: 'Verify the code entered by the user.',
          endpoint: '/v2/Services/{ServiceSid}/VerificationCheck',
          method: 'POST',
          parameters: [
            {
              name: 'To',
              type: 'string',
              required: true,
              description: 'Phone number or email being verified'
            },
            {
              name: 'Code',
              type: 'string',
              required: true,
              description: 'The verification code entered by user'
            }
          ],
          example: `client.verify.v2.services('VA1234567890abcdef')
  .verificationChecks
  .create({
    to: '+0987654321',
    code: '123456'
  })
  .then(verification_check => console.log(verification_check.status));`,
          response: `{
  "sid": "VE1234567890abcdef",
  "service_sid": "VA1234567890abcdef",
  "to": "+0987654321",
  "channel": "sms",
  "status": "approved",
  "valid": true,
  "date_created": "2023-12-01T10:00:00Z",
  "date_updated": "2023-12-01T10:01:00Z"
}`
        }
      ]
    }
  }

  private async generateMessagingDoc(functions: ApiFunction[]) {
    let markdown = `# Twilio Messaging API

The Twilio Messaging API allows you to send SMS and MMS messages globally. It also supports WhatsApp messaging for business communications.

## Key Features
- Global SMS delivery
- MMS support for media
- WhatsApp Business messaging
- Message status tracking
- Two-way messaging

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('messaging.md', markdown)
  }

  private async generateVoiceDoc(functions: ApiFunction[]) {
    let markdown = `# Twilio Voice API

The Voice API enables you to make and receive phone calls programmatically. Control calls with TwiML (Twilio Markup Language) for interactive voice applications.

## Key Features
- Outbound calling
- Inbound call handling
- Call recording
- Conference calling
- Text-to-speech

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('voice.md', markdown)
  }

  private async generateVerifyDoc(functions: ApiFunction[]) {
    let markdown = `# Twilio Verify API

The Verify API provides a complete solution for user verification and two-factor authentication. Support multiple channels including SMS, voice, email, and WhatsApp.

## Key Features
- Multi-channel verification
- Time-based expiration
- Customizable messages
- Fraud prevention
- Global reach

`

    functions.forEach(func => {
      markdown += this.formatFunctionToMarkdown(func)
    })

    await this.saveMarkdown('verify.md', markdown)
  }
}