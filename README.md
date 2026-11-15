# MangaForge Frontend

MangaForge is a browser-based manga creation platform for writers, artists, and creative teams who want to turn an idea into a structured comic or manga project without juggling multiple tools. The frontend gives users a polished workflow for planning a series, generating character concepts, building storyboards, and editing manga pages with AI-assisted creative tools.

This project is the user-facing app for the MangaForge ecosystem. It includes the marketing landing page, authentication flow, project dashboard, AI project generation wizard, and the production editor where panels, dialogue, layouts, and visual decisions come together.

## What this project does

MangaForge helps creators do the following:

- Create a manga or comic project from a title, genre, audience, and story concept.
- Define visual direction and character identity before production starts.
- Generate a starting project structure with chapters, pages, and character references.
- Work inside a manga studio editor to manage panels, images, text, and composition.
- Apply AI actions to improve or regenerate scenes, modify dialogue, adjust camera framing, and iterate on visual storytelling.
- Organize projects, assets, templates, stories, and exports in one dashboard.
- Produce a presentation-ready manga workflow that feels closer to a creative studio than a simple prompt UI.

In short, the app is designed to support the entire lifecycle of manga production: concept creation, storyboarding, visual composition, and iterative refinement.

## Core features

### 1. Marketing and onboarding

The app opens with a premium landing experience that introduces the platform, showcases manga art styles, explains the production workflow, and highlights plans for creators.

### 2. Authentication

Users can sign up, log in, recover their password, and access protected routes. The app separates public pages from the dashboard and studio editor with route protection.

### 3. Project dashboard

The dashboard includes:

- Projects overview
- Story library
- Character management
- Templates and generation presets
- Asset library
- Export center
- Settings and help

This gives teams a central place to manage their creative work.

### 4. AI manga generation flow

The create-project flow collects:

- Project title and description
- Genre and target audience
- Art direction and visual style
- Story content and script input
- Character details and appearance notes
- Chapter/page/panel configuration

Once submitted, the app creates a project shell and character record, then routes the user to the editor.

### 5. Studio editor

The studio editor is the heart of the product. It allows creators to:

- Add and manage panels on a page
- Edit object placement and style
- Modify image and panel properties
- Add dialogue bubbles and narration elements
- Undo/redo changes
- Resize, reorder, and manipulate elements
- Use AI-assisted editing actions such as regenerating framing, changing camera angle, improving composition, rewriting dialogue, and enhancing visuals

### 6. Preview and production modes

The frontend supports a preview mode that works without a backend by generating demo content locally. This is useful for demos, UI validation, and local development without a live API.

When a backend is configured, the app connects to real API endpoints for authentication, generation, projects, characters, assets, stories, and export jobs.

## Tech stack

This frontend is built with:

- React 19
- TypeScript
- Vite
- React Router
- Framer Motion
- GSAP + ScrollTrigger
- Lucide React
- CSS-based custom visual design for the manga aesthetic

## Project structure

```text
src/
  App.tsx                    # App routing and protected routes
  pages/                     # Landing, auth, dashboard, and editor pages
  components/                # UI, editor, landing, and dashboard components
  services/                  # API and generation logic
  store/                     # Context providers for auth and studio state
  types/                     # Type definitions for projects, characters, and editor data
  utils/                     # Editor logic and helper functions
  config/                    # API and media configuration
```

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

The app runs on the Vite default port, configured as:

- http://localhost:3000

## Environment configuration

The project includes a sample environment file: [.env.example](.env.example)

Copy it to `.env.local` if needed:

```bash
cp .env.example .env.local
```

Then configure:

```env
VITE_API_BASE_URL="http://127.0.0.1:5000"
VITE_API_MODE="production"
```

### How the app decides between preview and backend mode

The app reads `VITE_API_BASE_URL` and `VITE_API_MODE` from the environment:

- If `VITE_API_BASE_URL` is empty, it runs in preview mode with mock data.
- If a backend URL is provided, it uses the production API routes configured in `src/config/api.ts`.

This makes it easy to demo the interface without a backend or connect it to a full API for real usage.

## Typical user workflow

1. Visit the landing page and learn about the platform.
2. Create an account or log in.
3. Start a new manga project.
4. Enter story details, art direction, and character profile.
5. Generate a project structure.
6. Open the studio editor to iterate on the design.
7. Refine compositions, dialogue, and visual pacing.
8. Export assets or continue producing the series.

## Important notes

- The app is designed for frontend/demo use and can run without a live backend in preview mode.
- Real API integration is expected via the backend endpoints defined in `src/config/api.ts`.
- The interface focuses heavily on a premium manga/creator workflow, so the style and UX are tailored to comic production rather than a generic AI app shell.

## Scripts

```bash
npm run dev      # start the Vite development server
npm run build    # build the production bundle
npm run preview  # preview the production build
npm run lint     # TypeScript check
```

## License

This project is currently provided as a frontend application for MangaForge development and demo work. Update this section if you want to add a formal license for distribution or deployment.

## Summary

MangaForge Frontend is a creative workspace for building manga projects from idea to storyboard. It blends a polished product experience with AI-assisted generation and a page editor built for comic storytelling, helping creators move from concept to visual production in a single interface.
