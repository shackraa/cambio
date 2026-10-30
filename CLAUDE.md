## Project Overview
This is a real-time multiplayer memory and strategy card game called Cambio. It supports 2-4 players and features both online multiplayer via Supabase Realtime and a local offline mode with AI bots.

**Tech Stack:**
- **Framework:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS (v4), Framer Motion (for animations and UI transitions)
- **State Management:** Zustand (with Immer middleware for immutable updates)
- **Routing:** React Router DOM
- **Backend/Multiplayer:** Supabase (Realtime channels and database for room management)

## Project Structure
- `src/components/`: Reusable UI elements (e.g., `GameCard.tsx`, `ChatPanel.tsx`, `GameBoard.tsx`, `Leaderboard.tsx`).
- `src/engine/`: Core game logic without React dependencies (e.g., `gameEngine.ts` handling deck creation, shuffling, scoring, and powers).
- `src/hooks/`: Custom React hooks connecting UI to logic (e.g., `useRoom.ts` for Supabase room creation, `useRealtimeGame.ts` for online syncing, `useBotAI.ts` for offline AI opponents).
- `src/i18n/`: Internationalization files (e.g., `translations.ts` containing the EN/TR dictionary).
- `src/pages/`: Main route views (`HomeScreen.tsx`, `LobbyScreen.tsx`, `GameBoard.tsx`, `ResultsScreen.tsx`).
- `src/store/`: Zustand global state managers (`useGameStore.ts` for game state, `useToastStore.ts` for notifications, `useLangStore.ts` for language).
- `src/types/`: Centralized TypeScript interfaces (`game.ts`).

## Development Commands
- **Install dependencies:** `npm install`
- **Run local development server:** `npm run dev`
- **Build for production:** `npm run build`
- **Run linter:** `npm run lint`
- **Preview production build:** `npm run preview`

## Architecture Notes
- **State Management:** `useGameStore.ts` acts as the central source of truth for the game loop. It handles everything from dealing cards to resolving phases (peek, draw, action, stick).
- **Multiplayer Synchronization:** Online play heavily relies on Supabase Realtime Broadcast. `useRealtimeGame.ts` captures local player actions and broadcasts them to the room. The player designated as the "Host" (`isHost: true`) acts as the authoritative state manager and periodically broadcasts the full game state to keep clients in sync.
- **Offline / AI Mode:** When `isOnlineMode` is false, `GameBoard.tsx` initializes a local game and activates the `useBotAI.ts` hook. The bot logic watches the Zustand store and simulates human turns using `setTimeout` delays.
- **Aesthetics:** The UI relies heavily on a premium "glassmorphism" design system (dark backgrounds, gold accents, `backdrop-blur`, and layered borders) and Framer Motion for micro-interactions.

## Coding Conventions
- **Component Style:** Functional components using React Hooks.
- **State Updates:** Direct mutations within Zustand `set` functions are allowed because it is wrapped with the `immer` middleware.
- **Styling:** Inline Tailwind classes are preferred. Complex dynamic styles or gradients are occasionally applied via the `style` prop.
- **Naming:** PascalCase for React components and files containing them. camelCase for hooks, utilities, and variables.
- **i18n:** Avoid hardcoding visible strings in components. Always use the `useLangStore` and `translations` object to support the dynamic TR/EN toggle.

## Important Constraints
- **Multiplayer Host Logic:** Do not remove or alter the `lobbyInfo.isHost` checks in the game logic. The game relies on the host to dictate state transitions (like ending the peek phase) to prevent race conditions among clients.
- **Bot AI Dependency:** The `useBotAI.ts` hook relies on the exact string values of `phase` and `peekState`. Any refactoring of the game phases in `useGameStore.ts` must be accompanied by updates to the bot logic, otherwise offline play will break.
- **Session Storage:** Room routing and player identity rely on `sessionStorage` (`playerId`, `seat`, `roomId`, `isHost`). Be careful not to clear this unexpectedly during gameplay.

## Tools & MCP Servers
- **Context7:** Automatically use Context7 when you need library/API documentation, code generation, setup, or configuration steps. Context7 provides up-to-date documentation from official sources without hallucinations.
- **MarkItDown:** Automatically convert PDFs, documents, and other files to Markdown for better analysis.
