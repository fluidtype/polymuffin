# Polymuffin

Polymuffin is an experimental market-prediction dashboard scaffolded with Next.js 15 (App Router),
TypeScript, Tailwind CSS 4, and the ShaderGradient background stack. The repository currently ships
placeholder pages, API routes, and UI components so that future feature blocks can focus purely on
product logic.

## Requirements

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:3000](http://localhost:3000). The home page and the
`/search` route both display placeholder copy to confirm routing works before wiring real data.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server with Turbopack. |
| `npm run build` | Create a production build. |
| `npm run start` | Run the production server. |
| `npm run lint` | Lint the project with the repo ESLint config. |
| `npm run check:lockfiles` | Detect `package-lock.json` files outside the project root that can cause Next.js workspace warnings. |

## Lockfile hygiene

Next.js issues the warning `Next.js inferred your workspace root` when it finds a `package-lock.json`
in a parent directory (for example `C:\Users\User\package-lock.json`). Run the helper script and
remove any paths it reports:

```bash
npm run check:lockfiles
```

- **Windows**: `del <path-to-lockfile>`
- **macOS/Linux**: `rm <path-to-lockfile>`

Keeping only the `package-lock.json` that lives in the project root prevents the workspace warning
and ensures dependency installs remain deterministic.

## Environment variables

Create a `.env.local` file (ignored by git) with the values below to prepare for upcoming API
integrations:

```
NEXT_PUBLIC_SITE_NAME=Polymuffin
X_BEARER_TOKEN=
POLYMARKET_GAMMA=https://gamma-api.polymarket.com
```

## Project structure

```
src/
  app/
    api/        # Placeholder API routes returning 501
    search/     # Search route placeholder
    layout.tsx  # Global layout with dark theme defaults
    page.tsx    # Home dashboard placeholder
  components/  # UI stubs (SearchBar, MarketCard, TweetCard, Section, ShaderBg)
  lib/         # Data model and HTTP stubs for future integrations
public/
  README.md    # Reserved for future static asset documentation
```

The scaffolding compiles cleanly so subsequent feature blocks can iterate without bootstrapping
friction.
