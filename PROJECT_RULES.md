# Polling App - Project Rules & Conventions

## 🎯 Core Principles

### 1. **Component Architecture**
- **Server Components First**: Use Server Components for data fetching and static content
- **Client Components Only When Necessary**: Use 'use client' only for interactivity (hooks, event listeners, browser APIs)
- **Composition Over Inheritance**: Build reusable components through composition
- **Single Responsibility**: Each component should have one clear purpose

### 2. **File Organization**
- **Feature-Based Structure**: Group related components in feature folders (`/polls/`, `/auth/`, `/dashboard/`)
- **Co-location**: Keep related files close together (components, types, utilities)
- **Consistent Naming**: Use PascalCase for components, camelCase for utilities, kebab-case for routes
- **Index Files**: Use index.ts files for clean imports and public APIs

### 3. **Data Flow & State Management**
- **Server Actions for Mutations**: Use Server Actions for form submissions and data changes
- **Server Components for Data Fetching**: Fetch data directly in Server Components
- **Minimal Client State**: Use useState/useReducer only for local UI state
- **No Client-Side Data Fetching**: Avoid useEffect + fetch patterns in page components

### 4. **Security & Performance**
- **Input Validation**: Always validate and sanitize user inputs using Zod schemas
- **CSRF Protection**: Include CSRF tokens in all forms and API calls
- **Rate Limiting**: Implement rate limiting for public endpoints
- **Error Boundaries**: Use Next.js error.tsx files for error handling
- **Lazy Loading**: Code-split heavy dependencies and components

### 5. **QR Code Sharing Feature Rules**
- **QR Generation**: Use server-side QR generation for better performance and security
- **Share URL Structure**: Use consistent URL patterns: `/polls/[id]/share`
- **Analytics Tracking**: Track QR code usage for insights (anonymized)
- **Access Control**: Verify poll visibility before generating share links
- **Progressive Enhancement**: Ensure sharing works without JavaScript

## 🛠️ Technical Standards

### Code Style
- **TypeScript Strict Mode**: Use strict TypeScript configuration
- **ESLint Rules**: Follow Next.js and React best practices
- **Prettier Formatting**: Consistent code formatting across the project
- **Import Organization**: Group imports (React, Next.js, third-party, local)

### Testing
- **Unit Tests**: Test utility functions and pure components
- **Integration Tests**: Test Server Actions and API routes
- **Component Tests**: Test user interactions and form submissions
- **Coverage Threshold**: Maintain >80% test coverage

### Documentation
- **JSDoc Comments**: Document public functions and complex logic
- **README Updates**: Keep README current with new features
- **Type Definitions**: Use clear, descriptive TypeScript interfaces
- **Code Comments**: Explain "why" not "what" in code comments

## 🚫 Anti-Patterns to Avoid

- ❌ **Client-Side Data Fetching**: Don't use useEffect + fetch in page components
- ❌ **API Routes for Forms**: Don't create separate API routes for form submissions
- ❌ **Prop Drilling**: Avoid passing props through multiple component layers
- ❌ **Hardcoded Values**: Don't hardcode URLs, API keys, or configuration
- ❌ **Missing Error Handling**: Always handle errors gracefully
- ❌ **Inconsistent Styling**: Don't mix different styling approaches

## ✅ Best Practices

- ✅ **Server-First Approach**: Leverage Next.js App Router capabilities
- ✅ **Type Safety**: Use TypeScript interfaces for all data structures
- ✅ **Form Validation**: Use react-hook-form with Zod validation
- ✅ **Accessibility**: Include proper ARIA labels and keyboard navigation
- ✅ **SEO Optimization**: Use proper meta tags and structured data
- ✅ **Performance**: Optimize images, use proper caching strategies

## 🔄 Development Workflow

1. **Feature Planning**: Use AI to plan architecture before implementation
2. **Context Anchors**: Use @code, #file, @thread for precise AI interactions
3. **Incremental Development**: Build features incrementally with proper testing
4. **Code Review**: Use AI agent for automated code review and suggestions
5. **Documentation**: Update documentation as features are added

---

*These rules ensure consistency, maintainability, and scalability across the polling app project.*
