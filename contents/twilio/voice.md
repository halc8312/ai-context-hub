# Twilio Voice API

**Version:** 2010-04-01  
**Last Updated:** 2025-06-19  
**SDK Version:** twilio-node v5.x or higher

The Voice API enables you to make and receive phone calls programmatically. Control calls with TwiML (Twilio Markup Language) for interactive voice applications.

## Rate Limiting
- Outbound calls: 1 call per second per number
- Concurrent calls: Based on account type
- API requests: 100 requests per second
- Use queue and conference features for scaling

## Security Considerations
- Validate webhook signatures
- Implement call screening
- Use secure TwiML hosting (HTTPS)
- Monitor for toll fraud
- Implement proper authentication for sensitive operations

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
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

try {
  const call = await client.calls.create({
    url: 'https://demo.twilio.com/docs/voice.xml', // Must be HTTPS
    to: '+0987654321',
    from: '+1234567890',
    method: 'POST',
    statusCallback: 'https://webhook.site/call-status',
    statusCallbackMethod: 'POST',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    timeout: 60, // Ring timeout in seconds
    record: false, // Enable recording if needed
    machineDetection: 'DetectMessageEnd', // AMD for voicemail detection
    asyncAmd: true,
    asyncAmdStatusCallback: 'https://webhook.site/amd-result'
  });
  
  console.log('Call initiated');
  console.log('Call SID:', call.sid);
  console.log('Status:', call.status);
  console.log('Direction:', call.direction);
} catch (error) {
  if (error.code === 21211) {
    console.error('Invalid "To" phone number');
  } else if (error.code === 21212) {
    console.error('Invalid "From" phone number');
  } else if (error.code === 20003) {
    console.error('Authentication failed');
  } else {
    console.error('Call failed:', error.message);
  }
}
```

### Response

```json
{
  "sid": "CA3b8f7a0a5c8e4f9b9d1234567890abcd",
  "date_created": "Wed, 19 Jun 2025 10:00:00 +0000",
  "date_updated": "Wed, 19 Jun 2025 10:00:30 +0000",
  "parent_call_sid": null,
  "account_sid": "AC1234567890abcdef",
  "to": "+0987654321",
  "to_formatted": "(098) 765-4321",
  "from": "+1234567890",
  "from_formatted": "(123) 456-7890",
  "phone_number_sid": "PN1234567890abcdef",
  "status": "queued",
  "start_time": null,
  "end_time": null,
  "duration": null,
  "price": null,
  "price_unit": "USD",
  "direction": "outbound-api",
  "answered_by": null,
  "api_version": "2010-04-01",
  "forwarded_from": null,
  "group_sid": null,
  "caller_name": null,
  "queue_time": "0",
  "trunk_sid": null,
  "uri": "/2010-04-01/Accounts/AC.../Calls/CA3b8f7a0a5c8e4f9b9d1234567890abcd.json",
  "subresource_uris": {
    "notifications": "/2010-04-01/Accounts/AC.../Calls/CA.../Notifications.json",
    "recordings": "/2010-04-01/Accounts/AC.../Calls/CA.../Recordings.json",
    "payments": "/2010-04-01/Accounts/AC.../Calls/CA.../Payments.json",
    "events": "/2010-04-01/Accounts/AC.../Calls/CA.../Events.json"
  }
}
```

## TwiML Response Example

Control call flow with TwiML.

### Example TwiML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">Welcome to our service.</Say>
  <Gather action="/gather-result" method="POST" numDigits="1" timeout="10">
    <Say>Press 1 for sales, 2 for support, or 3 to leave a message.</Say>
  </Gather>
  <Say>We didn't receive any input. Goodbye!</Say>
</Response>
```

### Handling Gather Input

```javascript
app.post('/gather-result', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const digit = req.body.Digits;
  
  switch(digit) {
    case '1':
      twiml.say('Connecting you to sales.');
      twiml.dial('+1234567890');
      break;
    case '2':
      twiml.say('Connecting you to support.');
      twiml.enqueue('support-queue');
      break;
    case '3':
      twiml.say('Please leave a message after the beep.');
      twiml.record({
        maxLength: 60,
        action: '/recording-complete',
        transcribe: true,
        transcribeCallback: '/transcription-ready'
      });
      break;
    default:
      twiml.say('Invalid option.');
      twiml.redirect('/welcome');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});
```

## Conference Calls

Create multi-party conference calls.

### Example

```javascript
// Add participant to conference
const participant1 = await client.conferences('MyConference')
  .participants
  .create({
    from: '+1234567890',
    to: '+0987654321',
    statusCallback: 'https://webhook.site/participant-status',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
  });

// TwiML for conference
const twiml = new twilio.twiml.VoiceResponse();
twiml.dial().conference({
  statusCallback: 'https://webhook.site/conference-status',
  statusCallbackEvent: 'start end join leave mute hold',
  maxParticipants: 10,
  record: 'record-from-start',
  trim: 'trim-silence'
}, 'MyConference');
```

## Call Recording

Record calls for quality or compliance.

### Example

```javascript
// Start recording an active call
const recording = await client.calls('CA3b8f7a0a5c8e4f9b9d1234567890abcd')
  .recordings
  .create({
    recordingChannels: 'dual', // Record both sides separately
    recordingStatusCallback: 'https://webhook.site/recording-status',
    recordingStatusCallbackEvent: ['completed', 'failed']
  });

// Retrieve recording
const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recording.sid}.mp3`;
```

## Twilio Flex (Contact Center)

Build a cloud contact center.

### Example

```javascript
// Create Flex Flow
const flexFlow = await client.flexApi.v1.flexFlows.create({
  friendlyName: 'Customer Support Flow',
  chatServiceSid: 'IS1234567890abcdef',
  channelType: 'voice',
  integrationType: 'task',
  'integration.workspaceSid': 'WS1234567890abcdef',
  'integration.workflowSid': 'WW1234567890abcdef',
  'integration.channel': 'voice'
});

// Create task for agent
const task = await client.taskrouter.v1
  .workspaces('WS1234567890abcdef')
  .tasks
  .create({
    attributes: JSON.stringify({
      type: 'call',
      from: '+0987654321',
      priority: 'high'
    }),
    workflowSid: 'WW1234567890abcdef'
  });
```

## Video API

Create video rooms for WebRTC communication.

### Example

```javascript
// Create video room
const room = await client.video.v1.rooms.create({
  uniqueName: 'DailyStandup',
  type: 'group', // or 'peer-to-peer', 'group-small'
  recordParticipantsOnConnect: true,
  maxParticipants: 10,
  videoCcodecs: ['VP8', 'H264'],
  mediaRegion: 'us1'
});

// Generate access token for participant
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const token = new AccessToken(
  accountSid,
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET
);

token.identity = 'user@example.com';
const grant = new VideoGrant();
grant.room = 'DailyStandup';
token.addGrant(grant);

console.log('Access Token:', token.toJwt());
```

