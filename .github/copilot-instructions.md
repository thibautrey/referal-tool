# Tools and Best Practices

## Frontend Stack

- Use React 19 with TypeScript for all frontend development
- Components should be built using shadcn/ui components (based on Radix UI primitives)
- Use Tailwind CSS for styling with the following configuration:
  - Follow the "new-york" style
  - Use neutral as base color
  - CSS variables are enabled
- Use Lucide icons as the primary icon library
- Use Vite as the build tool and development server
- Use ESLint with TypeScript-aware rules and React-specific plugins

## Backend Stack

- Node.js with TypeScript
- Express.js for API routes
- Prisma as the ORM for database operations
- Jest for testing
- Security middleware:
  - Helmet for security headers
  - CORS for cross-origin resource sharing
  - Express Rate Limit for API rate limiting
  - Input sanitization using various tools (@braintree/sanitize-url, validator)

## Project Structure

### Frontend

- Components should be organized in:
  - `/components/ui/` for shared UI components
  - `/components/layout/` for layout components
  - `/components/shared/` for reusable business components
- Use aliases for imports:
  - `@/components/` for components
  - `@/lib/` for utilities
  - `@/hooks/` for custom hooks

### Backend

- Follow REST API principles
- Organize code in:
  - `controllers/` for business logic
  - `routes/` for API endpoints
  - `services/` for reusable business services
  - `middleware/` for Express middleware
  - `utils/` for utility functions

## Development Practices

- All code must be typed with TypeScript
- Use environment variables for configuration
- Follow Git best practices:
  - Ignore node_modules, dist, build directories
  - Ignore environment files (.env)
  - Ignore IDE specific files
- Use Prettier and ESLint for code formatting and linting

## Testing

- Write tests using Jest
- Use ts-jest for TypeScript support
- Keep test files close to the code they test
- Use test helpers from `tests/utils/`

## Database

- Use Prisma migrations for database schema changes
- Run migrations during deployment
- Use Prisma Studio for database administration in development

## Security

- Implement proper authentication and authorization
- Sanitize all user inputs
- Use helmet for security headers
- Implement rate limiting for API endpoints
- Handle errors appropriately and avoid exposing sensitive information

## Performance

- Use proper caching strategies (Redis is available)
- Implement proper indexes in database
- Use proper TypeScript configuration for optimal build output

## Deployment

- Use Docker for containerization
- Follow the deployment process in deploy.sh
- Ensure all environment variables are properly set
- Use proper Node.js production settings
