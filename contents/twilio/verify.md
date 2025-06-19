# Twilio Verify API

**Version:** v2  
**Last Updated:** 2025-06-19  
**SDK Version:** twilio-node v5.x or higher

The Verify API provides a complete solution for user verification and two-factor authentication. Support multiple channels including SMS, voice, email, and WhatsApp.

## Rate Limiting
- Verification attempts: 5 per unique phone number per 10 minutes
- Service creation: 100 services per account
- Check attempts: 5 incorrect codes triggers 10-minute lockout
- Use rate limit headers to monitor usage

## Security Considerations
- Enable fraud detection features
- Implement IP-based rate limiting
- Use custom code length (4-10 digits)
- Set appropriate code expiration times
- Monitor verification patterns for abuse

## Key Features
- Multi-channel verification
- Time-based expiration
- Customizable messages
- Fraud prevention
- Global reach

## Send Verification Code

Send a verification code via SMS, voice call, or email.

**Endpoint:** `POST /v2/Services/{ServiceSid}/Verifications`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| To | string | Yes | Phone number or email to verify |
| Channel | string | Yes | Delivery channel: sms, call, email, or whatsapp |
| Locale | string | No | Language locale for the verification message |

### Example

```javascript
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// First, create a Verify Service if you don't have one
const service = await client.verify.v2.services.create({
  friendlyName: 'My App Verification',
  codeLength: 6,
  lookupEnabled: true, // Enable phone number lookup
  skipSmsToLandlines: true, // Don't send SMS to landlines
  dtmfInputRequired: false,
  doNotShareWarningEnabled: true
});

try {
  const verification = await client.verify.v2
    .services(service.sid)
    .verifications
    .create({
      to: '+0987654321',
      channel: 'sms',
      locale: 'en', // Language for the message
      customFriendlyName: 'MyApp', // Custom app name in message
      customMessage: 'Your MyApp verification code is: ', // Custom prefix
      channelConfiguration: {
        substitutions: {
          app_name: 'MyApp'
        }
      }
    });
    
  console.log('Verification sent');
  console.log('Status:', verification.status);
  console.log('Valid:', verification.valid);
  console.log('Lookup:', verification.lookup);
} catch (error) {
  if (error.code === 60200) {
    console.error('Invalid phone number');
  } else if (error.code === 60203) {
    console.error('Max verification attempts reached');
  } else if (error.code === 60205) {
    console.error('SMS is not supported for landline');
  } else {
    console.error('Verification error:', error.message);
  }
}
```

### Response

```json
{
  "sid": "VE3b8f7a0a5c8e4f9b9d1234567890abcd",
  "service_sid": "VA1234567890abcdef",
  "account_sid": "AC1234567890abcdef",
  "to": "+0987654321",
  "channel": "sms",
  "status": "pending",
  "valid": false,
  "date_created": "2025-06-19T10:00:00Z",
  "date_updated": "2025-06-19T10:00:00Z",
  "lookup": {
    "carrier": {
      "error_code": null,
      "name": "Verizon",
      "mobile_country_code": "310",
      "mobile_network_code": "012",
      "type": "mobile"
    }
  },
  "amount": null,
  "payee": null,
  "send_code_attempts": [
    {
      "attempt_sid": "VL1234567890abcdef",
      "channel": "sms",
      "time": "2025-06-19T10:00:00Z"
    }
  ],
  "url": "https://verify.twilio.com/v2/Services/VA.../Verifications/VE..."
}
```

## Check Verification Code

Verify the code entered by the user.

**Endpoint:** `POST /v2/Services/{ServiceSid}/VerificationCheck`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| To | string | Yes | Phone number or email being verified |
| Code | string | Yes | The verification code entered by user |

### Example

```javascript
try {
  const verificationCheck = await client.verify.v2
    .services('VA1234567890abcdef')
    .verificationChecks
    .create({
      to: '+0987654321',
      code: '123456',
      verificationSid: 'VE3b8f7a0a5c8e4f9b9d1234567890abcd' // Optional: specific verification
    });
    
  if (verificationCheck.status === 'approved') {
    console.log('✓ Verification successful');
    console.log('Valid:', verificationCheck.valid);
  } else {
    console.log('✗ Verification failed');
    console.log('Status:', verificationCheck.status);
  }
} catch (error) {
  if (error.code === 60202) {
    console.error('Max check attempts reached - verification locked');
  } else if (error.code === 20404) {
    console.error('Verification not found or expired');
  } else {
    console.error('Check failed:', error.message);
  }
}
```

### Response

```json
{
  "sid": "VE3b8f7a0a5c8e4f9b9d1234567890abcd",
  "service_sid": "VA1234567890abcdef",
  "account_sid": "AC1234567890abcdef",
  "to": "+0987654321",
  "channel": "sms",
  "status": "approved",
  "valid": true,
  "amount": null,
  "payee": null,
  "date_created": "2025-06-19T10:00:00Z",
  "date_updated": "2025-06-19T10:01:00Z"
}
```

## Email Verification

Send verification codes via email.

**Endpoint:** `POST /v2/Services/{ServiceSid}/Verifications`

### Example

```javascript
const verification = await client.verify.v2
  .services('VA1234567890abcdef')
  .verifications
  .create({
    to: 'user@example.com',
    channel: 'email',
    channelConfiguration: {
      substitutions: {
        name: 'John Doe'
      }
    }
  });
```

## WhatsApp Verification

Send verification codes via WhatsApp.

### Example

```javascript
const verification = await client.verify.v2
  .services('VA1234567890abcdef')
  .verifications
  .create({
    to: 'whatsapp:+0987654321',
    channel: 'whatsapp'
  });
```

## Rate Limit Protection

Implement rate limiting and fraud protection.

### Example

```javascript
// Create rate limit bucket
const bucket = await client.verify.v2
  .services('VA1234567890abcdef')
  .rateLimits
  .create({
    uniqueName: 'ip-address-limit',
    description: 'Limit verifications per IP address'
  });

// Create rate limit rule
const bucketItem = await client.verify.v2
  .services('VA1234567890abcdef')
  .rateLimits(bucket.sid)
  .buckets
  .create({
    max: 5,
    interval: 600, // 10 minutes
    key: req.ip // IP address from request
  });
```

## Verification Status

Get verification statistics.

**Endpoint:** `GET /v2/Services/{ServiceSid}/Verifications`

### Example

```javascript
// List recent verifications
const verifications = await client.verify.v2
  .services('VA1234567890abcdef')
  .verifications
  .list({
    status: 'approved',
    dateCreatedAfter: new Date('2025-06-01'),
    limit: 20
  });

verifications.forEach(v => {
  console.log(`${v.to}: ${v.status} at ${v.dateUpdated}`);
});
```

## Push Verification

Use push notifications for app-based verification.

### Example

```javascript
// Create push verification
const verification = await client.verify.v2
  .services('VA1234567890abcdef')
  .verifications
  .create({
    to: 'user@example.com', // User identity
    channel: 'push',
    customMessage: 'Approve login from Chrome on Windows?',
    pushDetails: {
      title: 'Login Request',
      body: 'Approve login to MyApp?',
      actionButtons: ['Approve', 'Deny']
    }
  });

// Check push verification status
const challenge = await client.verify.v2
  .services('VA1234567890abcdef')
  .entities('user@example.com')
  .challenges(verification.sid)
  .fetch();

console.log('Push status:', challenge.status);
```

