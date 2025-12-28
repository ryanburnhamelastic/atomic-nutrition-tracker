# Web Application Template

A modern, production-ready template for building web applications with React, TypeScript, Tailwind CSS, Clerk authentication, Neon PostgreSQL, and Netlify deployment.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with dark mode support
- **Authentication**: Clerk
- **Database**: Neon (PostgreSQL serverless)
- **Deployment**: Netlify with serverless functions
- **PWA**: Vite PWA plugin with offline support

## Quick Start

### 1. Clone and Install

```bash
# Copy the template to a new project
cp -r template my-new-app
cd my-new-app

# Install dependencies
npm install
```

### 2. Set Up Services

#### Clerk Authentication
1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your keys from the Clerk dashboard

#### Neon Database
1. Create an account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Project Structure

```
template/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Shared UI components
│   │   └── layout/         # Layout components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and API client
│   ├── pages/              # Page components
│   ├── types/              # TypeScript types
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind styles
├── netlify/
│   └── functions/          # Serverless API functions
├── public/                 # Static assets
└── configuration files
```

## Customization Guide

### 1. Update App Name

Search and replace "Template App" in:
- `vite.config.ts` (PWA manifest)
- `index.html` (title and meta tags)
- `src/components/layout/Header.tsx`

### 2. Add Database Tables

Edit `netlify/functions/db.ts`:

```typescript
export async function initDb(): Promise<void> {
  const sql = getDb();

  // Existing users table...

  // Add your tables
  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
```

### 3. Add API Endpoints

Create new function in `netlify/functions/`:

```typescript
// netlify/functions/items.ts
import { Handler, HandlerEvent } from '@netlify/functions';
import { initDb, getDb, corsHeaders } from './db';
import { authenticateRequest, unauthorizedResponse } from './auth';

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  await initDb();
  const sql = getDb();
  const authResult = await authenticateRequest(event);

  if (!authResult.authenticated) {
    return unauthorizedResponse(corsHeaders);
  }

  // Handle methods...
};

export { handler };
```

### 4. Add API Client Methods

Edit `src/lib/api.ts`:

```typescript
export const itemsApi = {
  list: () => apiRequest<Item[]>('/items'),
  get: (id: string) => apiRequest<Item>(`/items/${id}`),
  create: (data: CreateItemInput) =>
    apiRequest<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

### 5. Add Types

Edit `src/types/index.ts`:

```typescript
export interface Item {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}
```

### 6. Add Routes

Edit `src/App.tsx`:

```tsx
<Route path="/items" element={<Items />} />
<Route path="/items/:id" element={<ItemDetail />} />
```

### 7. Add Navigation

Edit `src/components/layout/BottomNav.tsx` and `Header.tsx`

## Deployment

### Netlify Setup

1. Connect your GitHub repository to Netlify
2. Add environment variables in Netlify dashboard:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - Connect Neon integration (auto-sets `NETLIFY_DATABASE_URL`)

3. Deploy!

### Build Settings

Already configured in `netlify.toml`:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Patterns & Best Practices

### API Calls with Hooks

```tsx
import { useApi } from '../hooks/useApi';
import { itemsApi } from '../lib/api';

function ItemsList() {
  const { data: items, loading, error, refetch } = useApi(
    () => itemsApi.list(),
    []
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <ul>
      {items?.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```

### Mutations

```tsx
import { useMutation } from '../hooks/useApi';
import { itemsApi } from '../lib/api';

function CreateItem() {
  const { mutate, loading, error } = useMutation(itemsApi.create);

  const handleSubmit = async (data: CreateItemInput) => {
    const result = await mutate(data);
    if (result.data) {
      // Success
    }
  };
}
```

### Dark Mode

Use Tailwind's dark mode classes:

```tsx
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
  Content
</div>
```

### Component Classes

Pre-defined utility classes in `index.css`:

```tsx
<div className="card">Card content</div>
<input className="input" />
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-danger">Danger</button>
```

## License

MIT
