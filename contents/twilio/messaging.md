# Twilio Messaging API

The Twilio Messaging API allows you to send SMS and MMS messages globally. It also supports WhatsApp messaging for business communications.

## Key Features
- Global SMS delivery
- MMS support for media
- WhatsApp Business messaging
- Message status tracking
- Two-way messaging

## Send SMS

Send an SMS message to a phone number.

**Endpoint:** `POST /2010-04-01/Accounts/{AccountSid}/Messages.json`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| To | string | Yes | The destination phone number in E.164 format |
| From | string | Yes | A Twilio phone number or Messaging Service SID |
| Body | string | Yes | The text body of the message (up to 1600 characters) |
| MediaUrl | array | No | URLs of media to include (MMS) |
| StatusCallback | string | No | URL for status callbacks |

### Example

```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

client.messages
  .create({
    body: 'Hello from Twilio!',
    from: '+1234567890',
    to: '+0987654321'
  })
  .then(message => console.log(message.sid))
  .catch(error => console.error(error));
```

### Response

```json
{
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
}
```

## Send WhatsApp Message

Send a WhatsApp message using Twilio.

**Endpoint:** `POST /2010-04-01/Accounts/{AccountSid}/Messages.json`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| To | string | Yes | WhatsApp number with whatsapp: prefix |
| From | string | Yes | Your Twilio WhatsApp number |
| Body | string | Yes | Message content |

### Example

```javascript
client.messages
  .create({
    from: 'whatsapp:+14155238886',
    to: 'whatsapp:+15005550006',
    body: 'Hello from WhatsApp!'
  })
  .then(message => console.log(message.sid));
```

