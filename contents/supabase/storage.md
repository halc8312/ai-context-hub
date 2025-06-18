# Supabase Storage API

Supabase Storage allows you to store and serve large files like images, videos, and documents with built-in CDN and transformations.

## Key Features
- File uploads and downloads
- Public and private buckets
- Image transformations
- CDN integration
- Access policies

## Upload File

Upload a file to Supabase Storage.

**Endpoint:** `Function supabase.storage.from().upload()`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| bucket | string | Yes | Storage bucket name |
| path | string | Yes | File path within the bucket |
| file | File | Blob | ArrayBuffer | Yes | File data to upload |
| options | object | No | Upload options like contentType, upsert |

### Example

```javascript
const file = event.target.files[0]

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`public/${file.name}`, file, {
    contentType: file.type,
    upsert: false
  })

if (data) {
  console.log('File uploaded:', data.path)
}
```

### Response

```json
{
  "path": "public/avatar.jpg",
  "id": "file-id-here",
  "fullPath": "avatars/public/avatar.jpg"
}
```

## Get Public URL

Get a public URL for a file in storage.

**Endpoint:** `Function supabase.storage.from().getPublicUrl()`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| bucket | string | Yes | Storage bucket name |
| path | string | Yes | File path within the bucket |

### Example

```javascript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar.jpg')

console.log('Public URL:', data.publicUrl)
```

### Response

```json
{
  "publicUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/public/avatar.jpg"
}
```

