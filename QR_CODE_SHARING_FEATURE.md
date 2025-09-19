# QR Code Sharing Feature Documentation

## 🎯 Overview

The QR Code Sharing feature allows users to easily share polls via QR codes and social media platforms. This feature enhances the user experience by providing multiple sharing options and making polls more accessible.

## 🏗️ Architecture

### Folder Structure
```
src/
├── components/
│   └── polls/
│       ├── QRCodeShare.tsx          # Main QR sharing component
│       └── QRCodeModal.tsx          # Modal for QR code display
├── lib/
│   └── qr/
│       ├── generator.ts             # QR code generation utilities
│       ├── share.ts                 # Sharing functionality
│       └── analytics.ts             # QR code usage analytics
└── app/
    └── polls/
        └── [id]/
            └── share/
                └── page.tsx         # Dedicated share page
```

## 🚀 Features

### 1. QR Code Generation
- **Server-side generation**: QR codes are generated on the client side for better performance
- **Customizable appearance**: Size, color, and error correction level can be configured
- **Multiple formats**: Supports both PNG (base64) and SVG formats
- **URL validation**: Ensures only valid URLs are used for QR code generation

### 2. Social Media Sharing
- **Twitter**: Direct sharing with poll title and description
- **Facebook**: Share with custom quote
- **LinkedIn**: Professional sharing with summary
- **WhatsApp**: Mobile-friendly sharing
- **Email**: Direct email composition

### 3. Link Sharing
- **Copy to clipboard**: One-click link copying
- **Share URL generation**: Consistent URL structure
- **Access control**: Respects poll visibility settings

### 4. Analytics Tracking
- **Usage tracking**: Monitors QR code generation and sharing
- **Platform analytics**: Tracks which platforms are used most
- **User behavior**: Anonymous usage patterns
- **Local storage**: Demo analytics stored in browser

## 🛠️ Technical Implementation

### Dependencies
```json
{
  "qrcode": "^1.5.3",
  "@types/qrcode": "^1.5.5"
}
```

### Key Components

#### QRCodeShare Component
```typescript
interface QRCodeShareProps {
  pollId: string;
  pollTitle: string;
  pollDescription?: string;
  className?: string;
}
```

**Features:**
- QR code generation with loading states
- Social media sharing buttons
- Copy to clipboard functionality
- Error handling and user feedback

#### QR Code Generator
```typescript
interface QRCodeConfig {
  size?: number;
  color?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

async function generateQRCode(
  url: string,
  config?: QRCodeConfig
): Promise<QRCodeResult>
```

#### Share Utilities
```typescript
interface ShareOptions {
  pollId: string;
  title?: string;
  description?: string;
  includeQR?: boolean;
}

function generateSocialShareData(options: ShareOptions): SocialShareData
```

## 🔒 Security Considerations

### 1. URL Validation
- Only HTTP/HTTPS URLs are allowed
- Prevents malicious URL generation
- Validates poll access permissions

### 2. Input Sanitization
- Poll titles and descriptions are truncated for social sharing
- Prevents XSS attacks through shared content
- Proper URL encoding for all parameters

### 3. Access Control
- Respects poll visibility settings
- Private polls only shareable by owners
- Public polls accessible to everyone

### 4. Rate Limiting
- Client-side debouncing for QR generation
- Prevents excessive API calls
- Graceful error handling

## 📊 Analytics

### Tracked Events
- `qr_generated`: QR code creation
- `qr_scanned`: QR code usage (when implemented)
- `link_copied`: Link copying
- `social_shared`: Social media sharing

### Data Collected
- Poll ID
- Share method (QR, link, social)
- Platform (Twitter, Facebook, etc.)
- Timestamp
- Session ID (anonymous)

## 🎨 User Experience

### 1. Responsive Design
- Mobile-friendly QR code display
- Responsive grid layout
- Touch-friendly buttons

### 2. Loading States
- QR generation progress indicator
- Disabled states during processing
- Error messages with retry options

### 3. Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility

## 🧪 Testing

### Test Coverage
- Unit tests for utility functions
- Component integration tests
- URL validation tests
- Social sharing URL generation tests

### Test Files
- `src/lib/qr/__tests__/generator.test.ts`
- `src/lib/qr/__tests__/share.test.ts`

## 🚀 Usage Examples

### Basic QR Code Sharing
```tsx
<QRCodeShare
  pollId="poll-123"
  pollTitle="What's your favorite color?"
  pollDescription="Help us choose the best color for our app"
/>
```

### Custom QR Code Generation
```typescript
const qrCode = await generateQRCode('https://example.com/poll/123', {
  size: 512,
  color: '#1f2937',
  backgroundColor: '#ffffff',
  errorCorrectionLevel: 'H'
});
```

### Social Media Sharing
```typescript
const shareData = generateSocialShareData({
  pollId: 'poll-123',
  title: 'Check out this poll!',
  description: 'Vote on this interesting question'
});

shareToTwitter(shareData);
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Default Settings
- QR Code Size: 256px
- Error Correction: Medium (M)
- Color: Dark gray (#1f2937)
- Background: White (#ffffff)

## 📈 Performance

### Optimizations
- Lazy loading of QR code library
- Client-side generation to reduce server load
- Cached QR codes for frequently shared polls
- Minimal bundle size impact

### Bundle Analysis
- QR code library: ~50KB gzipped
- Share utilities: ~5KB gzipped
- Total feature impact: ~55KB

## 🐛 Troubleshooting

### Common Issues

1. **QR Code not generating**
   - Check if URL is valid
   - Verify TextEncoder is available
   - Check browser console for errors

2. **Social sharing not working**
   - Ensure popup blockers are disabled
   - Check if URLs are properly encoded
   - Verify social media URLs are correct

3. **Copy to clipboard failing**
   - Check if site is served over HTTPS
   - Verify clipboard API is available
   - Fallback to text selection method

## 🔮 Future Enhancements

### Planned Features
- QR code scanning analytics
- Custom QR code styling
- Bulk sharing options
- Share link expiration
- Advanced analytics dashboard

### Potential Improvements
- Server-side QR generation for better performance
- QR code caching with Redis
- Real-time sharing statistics
- Integration with more social platforms

---

*This feature follows the project's established patterns and maintains consistency with the existing codebase architecture.*
