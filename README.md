# TraceIQ

**See exactly what your AI agent did, and why.**

TraceIQ is a visual debugger purpose-built for [Composio](https://composio.dev) execution logs. It transforms opaque JSON log payloads into a readable, interactive timeline that any developer can navigate in seconds.

## The Problem

When an AI agent using Composio fails or behaves unexpectedly, developers have no visual way to inspect the sequence of tool calls, what was passed in, what came back, how long each call took, and where things went wrong.

## The Solution

TraceIQ connects to your Composio project via API key and provides:

- **Session Grouping** - Tool calls grouped by session into coherent agent runs
- **Visual Timeline** - Step-by-step timeline with status indicators, latency bars, and error highlights
- **Detail Inspection** - Click any step to see full request/response payloads in a syntax-highlighted JSON viewer
- **One-Click Replay** - Re-execute any tool call with its original payload to verify fixes
- **Filtering & Search** - Filter by status (success/failed/running), time range, tool name, or session ID
- **Copy Payloads** - One-click copy of any request or response JSON

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Fonts | Inter + JetBrains Mono |
| API | Composio REST API v3.1 |

## Getting Started

### Prerequisites

- Node.js 20+
- A Composio project API key

### Local Development

```bash
git clone https://github.com/yourusername/trace-iq.git
cd trace-iq
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste your Composio API key, and start debugging.

### Mock Mode

To explore the UI without a Composio API key, enable mock mode:

```bash
# In .env.local
NEXT_PUBLIC_MOCK_MODE=true
```

This loads realistic sample data with 4 sessions covering different agent workflows, statuses, and toolkits.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COMPOSIO_BASE_URL` | Composio API base URL | `https://backend.composio.dev` |
| `NEXT_PUBLIC_MOCK_MODE` | Enable mock data mode | `false` |

## Architecture

```
src/
├── app/
│   ├── page.tsx                     # Connect screen
│   ├── dashboard/page.tsx           # Session feed
│   ├── session/[sessionId]/page.tsx # Timeline view
│   └── api/composio/                # Proxy routes
│       ├── logs/route.ts            # POST -> log list
│       ├── logs/[id]/route.ts       # GET -> log detail
│       └── replay/route.ts          # POST -> replay
├── components/                      # UI components
├── store/                           # Zustand store
├── lib/                             # API wrappers, utils
└── types/                           # TypeScript interfaces
```

**Key design decisions:**

- All Composio API calls go through Next.js API routes, the API key is never exposed to the browser
- No database - all data fetched live from Composio, API key stored in `sessionStorage`
- Dark mode only - this is a developer tool

## Security

- API key stored in `sessionStorage` (cleared on tab close)
- Key forwarded server-side only, never in browser network requests
- No persistent storage, no logging of credentials
