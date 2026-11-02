# Task Manager

A simple task manager built with **Next.js 15 (App Router)**, **tRPC v11** and **Tailwind CSS v4**.
The backend keeps tasks in memory and the frontend consumes the endpoints through tRPC + React Query.

## Getting started

Requirements: Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Tests:

```bash
npm test           # or npm run test:watch
```

The app starts with 25 sample tasks so pagination can be seen right away.
Since storage is in memory, data is lost when the server restarts.

## Features

- **CRUD over tRPC**: create, list (paginated), get by id, update and delete tasks.
- **Validation**: required title (up to 100 characters) and optional description (up to 500), using the same zod schema on the backend and in the form.
- **Meaningful errors**: operations on a missing task return `NOT_FOUND` ("Task 5 not found"); validation errors return `BAD_REQUEST` with messages per field.
- **Server-side rendered list**: the first page is fetched on the server and arrives ready in the HTML.
- **Delete from the list** with confirmation and success/error feedback (toast).
- **Create/edit form** with client-side validation, per-field errors and loading states.
- **Infinite scroll** (bonus): new pages load automatically while scrolling.

## Tests

Written with **Vitest** and **Testing Library**, without mocking the API: tests use the real router and in-memory store.

- `src/server/routers/task.test.ts`: CRUD, validation, `NOT_FOUND` and cursor pagination, calling procedures directly.
- `src/lib/errors.test.ts`: goes through the real HTTP route (`/api/trpc`) and checks per-field errors and the messages shown to the user.
- `src/app/tasks/task-form.test.tsx` and `src/app/task-list.test.tsx`: components rendered with the real providers (the tRPC client calls the HTTP handler in memory). They cover form validation, creating, editing, deleting with confirmation, errors and infinite scroll.

## Structure

```
src/
├── app/
│   ├── page.tsx                 # Task list (SSR + prefetch)
│   ├── task-list.tsx            # List, delete and infinite scroll (client)
│   ├── tasks/
│   │   ├── task-form.tsx        # Shared form (create/edit)
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   └── api/trpc/[trpc]/route.ts # tRPC HTTP endpoint
├── server/
│   ├── trpc.ts                  # tRPC setup and error formatting
│   ├── task-store.ts            # In-memory "database"
│   └── routers/                 # Task procedures
├── trpc/
│   ├── client.tsx               # tRPC/React Query provider for the browser
│   └── server.tsx               # Direct router calls from Server Components
├── lib/                         # zod schema and error helpers (shared)
├── components/                  # Toast feedback, page header and shared Tailwind styles
└── test/                        # Test setup and helpers
```

## Decisions

- **SSR with hydration**: the list page runs `prefetchInfiniteQuery` calling the router directly on the server (no HTTP round trip) and hands the cache to the client through `HydrationBoundary`. The HTML already contains the tasks, and the client keeps using React Query for pagination and invalidation. The page uses `force-dynamic` because data changes on every request.
- **Cursor pagination**: ids are numeric and incremental, so the id itself is the cursor (`id < cursor`). Unlike an offset, it doesn't skip or repeat items when tasks are created or deleted between pages.
- **Single schema**: `src/lib/task-schema.ts` is used both as tRPC input and for form validation, so the rules never diverge.
- **Errors**: tRPC's `errorFormatter` sends zod errors per field, and `src/lib/errors.ts` turns any error (server, validation or network) into a user-friendly message.
- **superjson**: lets `Date` values (`createdAt`) travel between server and client without manual conversion.
- **Store in `globalThis`**: keeps `next dev` hot reload from wiping tasks on every code change.
- **Tailwind, no UI or form libraries**: utility classes plus a few shared style constants (`src/components/styles.ts`) and `useState` for the form, following the challenge's "less is more".
