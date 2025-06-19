# Twilio Messaging API

**Version:** 2010-04-01  
**Last Updated:** 2025-06-19  
**SDK Version:** twilio-node v5.x or higher

The Twilio Messaging API allows you to send SMS and MMS messages globally. It also supports WhatsApp messaging for business communications.

## Rate Limiting
- Default: 1 message per second per phone number
- Messaging Service: Up to 10 messages per second
- WhatsApp: 80 messages per second per number
- Use Messaging Services for higher throughput

## Security Considerations
- Validate webhook signatures
- Implement opt-out handling
- Use Messaging Services for compliance
- Store phone numbers securely (consider hashing)
- Follow regional regulations (GDPR, TCPA)

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
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

try {
  const message = await client.messages.create({
    body: 'Hello from Twilio!',
    from: '+1234567890', // Your Twilio number
    to: '+0987654321',
    statusCallback: 'https://webhook.site/status', // Optional: delivery status webhook
    validityPeriod: 14400, // Optional: message validity in seconds
    smartEncoded: true, // Optional: auto-detect encoding
    messagingServiceSid: 'MG1234567890abcdef' // Optional: use messaging service
  });
  
  console.log('Message sent successfully');
  console.log('SID:', message.sid);
  console.log('Status:', message.status);
  console.log('Price:', message.price, message.priceUnit);
} catch (error) {
  console.error('Failed to send message:');
  
  if (error.code === 20003) {
    console.error('Authentication failed - check credentials');
  } else if (error.code === 21211) {
    console.error('Invalid "To" phone number');
  } else if (error.code === 21608) {
    console.error('The "To" phone number is not verified');
  } else if (error.code === 20429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  }
}
```

### Response

```json
{
  "sid": "SM3b8f7a0a5c8e4f9b9d1234567890abcd",
  "date_created": "Wed, 19 Jun 2025 10:00:00 +0000",
  "date_updated": "Wed, 19 Jun 2025 10:00:01 +0000",
  "to": "+0987654321",
  "from": "+1234567890",
  "body": "Hello from Twilio!",
  "status": "sent",
  "num_segments": "1",
  "num_media": "0",
  "direction": "outbound-api",
  "api_version": "2010-04-01",
  "price": "-0.00790",
  "price_unit": "USD",
  "error_code": null,
  "error_message": null,
  "uri": "/2010-04-01/Accounts/AC.../Messages/SM3b8f7a0a5c8e4f9b9d1234567890abcd.json",
  "subresource_uris": {
    "media": "/2010-04-01/Accounts/AC.../Messages/SM3b8f7a0a5c8e4f9b9d1234567890abcd/Media.json"
  }
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
try {
  const message = await client.messages.create({
    from: 'whatsapp:+14155238886', // Your WhatsApp Business number
    to: 'whatsapp:+15005550006',
    body: 'Hello from WhatsApp!',
    mediaUrl: ['https://example.com/image.jpg'], // Optional: attach media
    persistentAction: ['geo:-1.232,36.821|Nairobi, Kenya'] // Optional: location
  });
  
  console.log('WhatsApp message sent:', message.sid);
} catch (error) {
  if (error.code === 63003) {
    console.error('WhatsApp capability not enabled for this number');
  } else if (error.code === 63016) {
    console.error('User has not opted in to receive WhatsApp messages');
  } else {
    console.error('WhatsApp error:', error.message);
  }
}
```

## Send MMS with Media

Send multimedia messages with images, videos, or audio.

**Endpoint:** `POST /2010-04-01/Accounts/{AccountSid}/Messages.json`

### Example

```javascript
try {
  const message = await client.messages.create({
    body: 'Check out this image!',
    from: '+1234567890',
    to: '+0987654321',
    mediaUrl: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.png'
    ]
  });
  
  console.log('MMS sent:', message.sid);
} catch (error) {
  console.error('MMS failed:', error.message);
}
```

## List Messages with Pagination

Retrieve sent and received messages.

**Endpoint:** `GET /2010-04-01/Accounts/{AccountSid}/Messages.json`

### Example

```javascript
async function getAllMessages(dateFrom) {
  const messages = [];
  let page = await client.messages.page({
    dateSent: dateFrom,
    pageSize: 100
  });
  
  while (page) {
    messages.push(...page.instances);
    
    // Check rate limit headers
    console.log('Remaining requests:', page.httpResponse.headers['x-rate-limit-remaining']);
    
    if (page.nextPageUrl) {
      page = await page.nextPage();
    } else {
      page = null;
    }
  }
  
  return messages;
}

// Usage
const messages = await getAllMessages(new Date('2025-06-01'));
console.log(`Total messages: ${messages.length}`);
```

## Webhook Handling

Handle message status callbacks.

### Example

```javascript
const express = require('express');
const app = express();

// Webhook validation
app.post('/sms-status', twilio.webhook(), (req, res) => {
  const messageSid = req.body.MessageSid;
  const messageStatus = req.body.MessageStatus;
  const errorCode = req.body.ErrorCode;
  
  console.log(`Message ${messageSid} status: ${messageStatus}`);
  
  if (messageStatus === 'failed' || messageStatus === 'undelivered') {
    console.error(`Message failed with error: ${errorCode}`);
    // Handle failure (retry, notify, etc.)
  }
  
  res.sendStatus(200);
});
```

## Conversations API

Manage multi-channel conversations.

**Endpoint:** `POST /v1/Conversations`

### Example

```javascript
const conversation = await client.conversations.v1.conversations.create({
  friendlyName: 'Customer Support Chat',
  uniqueName: 'support-12345',
  attributes: JSON.stringify({
    topic: 'Technical Support',
    priority: 'high'
  })
});

// Add participants
await client.conversations.v1
  .conversations(conversation.sid)
  .participants
  .create({
    messagingBinding: {
      address: '+1234567890',
      proxyAddress: '+0987654321'
    }
  });

// Send a message in the conversation
await client.conversations.v1
  .conversations(conversation.sid)
  .messages
  .create({
    author: 'system',
    body: 'Welcome to customer support!'
  });
```

