# Twilio Voice API

The Voice API enables you to make and receive phone calls programmatically. Control calls with TwiML (Twilio Markup Language) for interactive voice applications.

## Key Features
- Outbound calling
- Inbound call handling
- Call recording
- Conference calling
- Text-to-speech

## Make Outbound Call

Initiate an outbound voice call.

**Endpoint:** `POST /2010-04-01/Accounts/{AccountSid}/Calls.json`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| To | string | Yes | The phone number to call |
| From | string | Yes | Your Twilio phone number |
| Url | string | Yes | URL that returns TwiML instructions |
| Method | string | No | HTTP method for Url (GET or POST) |
| StatusCallback | string | No | URL for status callbacks |

### Example

```javascript
client.calls
  .create({
    url: 'http://demo.twilio.com/docs/voice.xml',
    to: '+0987654321',
    from: '+1234567890'
  })
  .then(call => console.log(call.sid));
```

### Response

```json
{
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
}
```

