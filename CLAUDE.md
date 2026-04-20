# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Style

Commentaires : uniquement pour le code genuinement complexe (algorithme non-évident, invariant subtil, contournement de bug). Pas de commentaires sur du code dont le nom est déjà explicite.

## Commands

```bash
npm run setup        # First-time setup: install deps + prisma generate + migrate
npm run dev          # Start dev server with turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests (vitest)
npm test -- src/path/to/file.test.ts  # Run a single test file
npm run db:reset     # Reset and re-migrate the SQLite database
npx prisma migrate dev  # Apply new schema changes
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` (already wired into npm scripts) due to Node.js compatibility shims.

## Architecture

**UIGen** is an AI-powered React component generator. Users describe components in a chat; Claude generates and iterates on them via tool calls; results render in a live preview.

### Data flow

1. User sends a message → `POST /api/chat` with the current message history and virtual file system state
2. The route streams a `streamText` response using the Vercel AI SDK, giving Claude two tools: `str_replace_editor` and `file_manager`
3. Claude calls these tools to create/edit files in a `VirtualFileSystem` instance (in-memory, server-side)
4. On finish, the updated file tree and full message history are persisted to `Project.data` / `Project.messages` (JSON strings in SQLite)
5. The client receives the stream via `useChat`, updates `FileSystemContext`, and re-renders the preview

### Virtual file system

`src/lib/file-system.ts` — `VirtualFileSystem` is an in-memory tree of `FileNode` objects. It never touches disk. It serializes to/from plain JSON for persistence and transport. The AI tools (`str-replace.ts`, `file-manager.ts`) wrap it with the interface Claude expects.

### Preview rendering

`src/components/preview/PreviewFrame.tsx` — runs inside an iframe. Files are transpiled client-side using `@babel/standalone` via `src/lib/transform/jsx-transformer.ts`, which also resolves missing imports to placeholder stubs so partial code doesn't crash the preview.

### Auth

JWT-based, stored in an httpOnly cookie (`auth-token`). `src/lib/auth.ts` (server-only) handles session creation/verification. `src/middleware.ts` protects `/api/projects` and `/api/filesystem` routes. Anonymous users can create and use projects; persistence requires a registered account (`userId` is nullable on `Project`).

### State management

- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — source of truth for the virtual file tree on the client
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps `useChat` from the AI SDK, manages message state and streaming
- `useAuth` (`src/hooks/use-auth.ts`) — session state for the client

### Database

Prisma with SQLite (`prisma/dev.db`). Two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON stored as strings. The generated client lives in `src/generated/prisma/`.

Always read `prisma/schema.prisma` when you need to understand the structure of persisted data.

### Key env vars

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | If absent, a mock provider returns static code instead of calling Claude |
| `JWT_SECRET` | Falls back to `"development-secret-key"` if unset |
