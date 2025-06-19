# Supabase Storage API

**Version:** v1  
**Last Updated:** 2025-06-19  
**SDK Version:** @supabase/supabase-js v2.x or higher

Supabase Storage allows you to store and serve large files like images, videos, and documents with built-in CDN and transformations.

## Rate Limiting
- Upload size: 50MB (Free), 5GB (Pro)
- Requests: 100 per second
- Bandwidth: Based on plan
- Transformations: 100 per second

## Security Considerations
- Configure bucket policies properly
- Use signed URLs for private files
- Validate file types and sizes
- Scan uploads for malware
- Implement proper access controls
- Use RLS policies on storage.objects table

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
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// File upload from browser
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  
  // Validate file
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  
  if (file.size > maxSize) {
    console.error('File too large');
    return;
  }
  
  if (!allowedTypes.includes(file.type)) {
    console.error('Invalid file type');
    return;
  }
  
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `public/avatars/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.error('File already exists');
      } else if (error.message.includes('quota exceeded')) {
        console.error('Storage quota exceeded');
      } else {
        console.error('Upload failed:', error.message);
      }
    } else {
      console.log('File uploaded successfully');
      console.log('Path:', data.path);
      console.log('ID:', data.id);
      
      // Update user profile with avatar URL
      const { publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path).data
        
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })
    }
  } catch (err) {
    console.error('Network error:', err);
  }
}
```

### Response

```json
{
  "path": "public/avatars/1718764800000-a1b2c3d4e5.jpg",
  "id": "bf6b2e4c-4444-4444-9999-1234567890ab",
  "fullPath": "avatars/public/avatars/1718764800000-a1b2c3d4e5.jpg"
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
// Get public URL (for public buckets)
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatars/avatar.jpg')

console.log('Public URL:', data.publicUrl)

// With transformations for images
const { data: transformedUrl } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatars/avatar.jpg', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover', // 'contain', 'fill'
      format: 'webp',
      quality: 80
    }
  })

console.log('Optimized URL:', transformedUrl.publicUrl)
```

### Response

```json
{
  "publicUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/public/avatars/avatar.jpg"
}
```

## Create Signed URL

Generate temporary access URLs for private files.

**Endpoint:** `Function supabase.storage.from().createSignedUrl()`

### Example

```javascript
// Create signed URL for private file
const { data, error } = await supabase.storage
  .from('private-documents')
  .createSignedUrl('confidential/report.pdf', 3600) // Expires in 1 hour

if (data) {
  console.log('Signed URL:', data.signedUrl)
  // Share this URL for temporary access
}

// Create signed URLs for multiple files
const filePaths = ['file1.pdf', 'file2.pdf', 'file3.pdf']
const { data: urls, error: urlsError } = await supabase.storage
  .from('private-documents')
  .createSignedUrls(filePaths, 3600)

urls?.forEach(({ path, signedUrl, error }) => {
  if (!error) {
    console.log(`${path}: ${signedUrl}`)
  }
})
```

## Download File

Download files from storage.

**Endpoint:** `Function supabase.storage.from().download()`

### Example

```javascript
// Download file
const { data, error } = await supabase.storage
  .from('documents')
  .download('public/report.pdf')

if (data) {
  // Create download link
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = 'report.pdf'
  a.click()
  URL.revokeObjectURL(url)
}

// Download with progress tracking
const downloadWithProgress = async (bucket, path, onProgress) => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
    
  const response = await fetch(publicUrl)
  const reader = response.body.getReader()
  const contentLength = +response.headers.get('Content-Length')
  
  let receivedLength = 0
  const chunks = []
  
  while(true) {
    const {done, value} = await reader.read()
    if (done) break
    
    chunks.push(value)
    receivedLength += value.length
    
    onProgress(receivedLength / contentLength * 100)
  }
  
  return new Blob(chunks)
}
```

## List Files

List files in a bucket or folder.

**Endpoint:** `Function supabase.storage.from().list()`

### Example

```javascript
// List files in folder
const { data: files, error } = await supabase.storage
  .from('avatars')
  .list('public', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  })

if (files) {
  files.forEach(file => {
    console.log(`Name: ${file.name}`)
    console.log(`Size: ${file.metadata?.size || 0} bytes`)
    console.log(`Type: ${file.metadata?.mimetype}`)
    console.log(`Modified: ${file.updated_at}`)
  })
}

// List with search
const { data: searchResults } = await supabase.storage
  .from('documents')
  .list('reports', {
    limit: 20,
    offset: 0,
    search: 'quarterly' // Search in filenames
  })
```

## Delete Files

Remove files from storage.

**Endpoint:** `Function supabase.storage.from().remove()`

### Example

```javascript
// Delete single file
const { error } = await supabase.storage
  .from('avatars')
  .remove(['public/old-avatar.jpg'])

if (!error) {
  console.log('File deleted successfully')
}

// Delete multiple files
const filesToDelete = [
  'temp/file1.jpg',
  'temp/file2.jpg',
  'temp/file3.jpg'
]

const { data, error: deleteError } = await supabase.storage
  .from('uploads')
  .remove(filesToDelete)

if (data) {
  console.log('Deleted files:', data)
}
```

## Move/Copy Files

Move or copy files within storage.

**Endpoint:** `Function supabase.storage.from().move()` / `.copy()`

### Example

```javascript
// Move file
const { error: moveError } = await supabase.storage
  .from('documents')
  .move('temp/draft.pdf', 'published/final.pdf')

// Copy file
const { error: copyError } = await supabase.storage
  .from('templates')
  .copy('master/template.docx', 'copies/template-copy.docx')
```

## Bucket Management

Manage storage buckets (requires service role).

### Example

```javascript
// Create bucket
const { data: bucket, error } = await supabase.storage
  .createBucket('user-uploads', {
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/*', 'application/pdf']
  })

// Update bucket
const { data: updated, error: updateError } = await supabase.storage
  .updateBucket('user-uploads', {
    public: true,
    fileSizeLimit: 52428800 // 50MB
  })

// List buckets
const { data: buckets, error: listError } = await supabase.storage
  .listBuckets()
```

## Storage Policies

Configure RLS policies for storage access.

### SQL Example

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to update/delete own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-files' AND
  auth.uid() = owner
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-files' AND
  auth.uid() = owner
);
```

