# Twilio Verify API

The Verify API provides a complete solution for user verification and two-factor authentication. Support multiple channels including SMS, voice, email, and WhatsApp.

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
const client = twilio(accountSid, authToken);

client.verify.v2.services('VA1234567890abcdef')
  .verifications
  .create({
    to: '+0987654321',
    channel: 'sms'
  })
  .then(verification => console.log(verification.status));
```

### Response

```json
{
  "sid": "VE1234567890abcdef",
  "service_sid": "VA1234567890abcdef",
  "to": "+0987654321",
  "channel": "sms",
  "status": "pending",
  "valid": false,
  "date_created": "2023-12-01T10:00:00Z",
  "date_updated": "2023-12-01T10:00:00Z"
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
client.verify.v2.services('VA1234567890abcdef')
  .verificationChecks
  .create({
    to: '+0987654321',
    code: '123456'
  })
  .then(verification_check => console.log(verification_check.status));
```

### Response

```json
{
  "sid": "VE1234567890abcdef",
  "service_sid": "VA1234567890abcdef",
  "to": "+0987654321",
  "channel": "sms",
  "status": "approved",
  "valid": true,
  "date_created": "2023-12-01T10:00:00Z",
  "date_updated": "2023-12-01T10:01:00Z"
}
```

