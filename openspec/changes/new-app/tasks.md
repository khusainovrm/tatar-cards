## 1. Project Setup

- [x] 1.1 Scaffold a React and TypeScript application with Vite and confirm the development server renders the application shell
- [x] 1.2 Add lint, typecheck, unit/component test, E2E test, and production build scripts and confirm each command starts successfully
- [x] 1.3 Create feature boundaries for cards, groups, study, settings, infrastructure, and presentation with import rules that keep browser APIs out of domain modules
- [x] 1.4 Configure client-side routing and a Vercel rewrite that serves the SPA entry document for application routes without rewriting static assets

## 2. Domain Models and Built-in Catalog

- [x] 2.1 Define typed domain models for built-in cards, custom cards, groups, card progress, settings, and the versioned persisted-state envelope
- [x] 2.2 Define stable, non-overlapping identifier conventions for built-in cards, custom cards, and groups, including UUID generation for user-created entities
- [x] 2.3 Implement build-time validation that rejects duplicate card identifiers, empty card sides, and unsupported word or phrase types
- [x] 2.4 Populate `cards.ts` with the initial Tatar word and phrase catalog, Russian translations, stable identifiers, and content types
- [x] 2.5 Implement the catalog projection that merges immutable built-in cards with custom cards and excludes hidden built-in cards
- [x] 2.6 Add unit tests for catalog validation, identifier collisions, merged catalog output, and hide/restore behavior with retained progress

## 3. Card and Group Business Logic

- [x] 3.1 Implement use cases for creating and editing custom cards with trimmed non-empty Tatar and Russian sides
- [x] 3.2 Implement atomic custom-card deletion that also removes group memberships and card progress
- [x] 3.3 Implement use cases for hiding and restoring built-in cards without modifying source data or discarding progress
- [x] 3.4 Implement custom-group creation, rename, and deletion with normalized unique-name validation
- [x] 3.5 Implement multi-group card membership using card identifiers and preserve cards and progress when memberships or groups are removed
- [x] 3.6 Implement the non-deletable dynamic `All Cards` group and group resolution that deduplicates active cards and ignores hidden or stale references
- [x] 3.7 Add unit tests for card mutations, cascade deletion, group lifecycle, multi-group membership, `All Cards`, and empty-group study eligibility

## 4. Local Persistence and Recovery

- [x] 4.1 Define the namespaced `localStorage` key, schema version 1, runtime validator, and default user state
- [x] 4.2 Implement a storage repository interface with in-memory and `localStorage` adapters so application use cases do not access browser storage directly
- [x] 4.3 Implement startup hydration that completes validation and migration before any default state can be persisted
- [x] 4.4 Implement sequential migration infrastructure, fixtures for older schemas, and built-in card identifier remapping across all stored references
- [x] 4.5 Implement safe mode for malformed or newer unsupported state that preserves the raw value, exposes the built-in catalog read-only, and requires confirmation before reset
- [x] 4.6 Implement save-failure handling that retains the current in-memory view and displays an unsaved-state error until persistence succeeds
- [x] 4.7 Add unit and integration tests for reload restoration, offline writes, migrations, safe hydration, malformed/newer state, confirmed reset, and quota failures

## 5. Study Session Engine

- [x] 5.1 Define the concrete version 1 `CardProgress` fields and review intervals while preserving the specified due, unseen, and not-due priority order
- [x] 5.2 Implement a deterministic session state machine for reveal, known, learning, undo, missing-card skip, completion, and result summary transitions
- [x] 5.3 Implement session creation from a deduplicated snapshot of eligible group card identifiers and reject groups with no eligible cards
- [x] 5.4 Implement review ordering that prioritizes due and unseen cards and reinserts a learning card after another card when possible
- [x] 5.5 Implement progress updates for known and learning ratings and exact reversal of the most recent active-session rating
- [x] 5.6 Add unit tests for all state transitions, snapshot behavior, review ordering, learning-card reinsertion, progress updates, undo, and completion totals

## 6. Catalog and Group Interface

- [x] 6.1 Build the mobile-first application shell, navigation, safe-area layout, loading state, empty states, and persistent error presentation
- [x] 6.2 Build the catalog view for active and hidden cards with visible word/phrase type, Tatar text, and Russian translation
- [x] 6.3 Build accessible create and edit forms for custom cards with inline validation and a confirmed deletion flow
- [x] 6.4 Build controls to hide and restore built-in cards and verify that the catalog and available study cards update immediately
- [x] 6.5 Build group list and group editor views for create, rename, delete, multi-group membership, and the read-only dynamic `All Cards` group
- [x] 6.6 Add component tests for catalog rendering, card form validation, custom-card deletion, built-in visibility, group name conflicts, and membership changes

## 7. Study Interface and Gestures

- [x] 7.1 Build the study screen with concealed translation, explicit reveal action, remaining-card progress, completion summary, and active-session undo
- [x] 7.2 Implement Pointer Events swipe tracking with distance or velocity thresholds, right-to-known and left-to-learning mapping, and snap-back for cancelled gestures
- [x] 7.3 Prevent ratings before reveal and expose visible known and learning buttons plus keyboard actions that call the same session commands as swipes
- [x] 7.4 Add transform-based card feedback without disrupting page scrolling and disable non-essential motion under `prefers-reduced-motion`
- [x] 7.5 Ensure long Tatar phrases and Russian translations remain readable at a 320 CSS-pixel viewport without hiding study controls or causing horizontal page scrolling
- [x] 7.6 Add component tests for reveal gating, both swipe outcomes, threshold cancellation, button/keyboard equivalence, undo, reduced motion, and long content

## 8. PWA and Vercel Delivery

- [x] 8.1 Add the PWA integration and a valid manifest with application identity, standalone display mode, start URL, theme colors, and required icon sizes
- [x] 8.2 Configure service-worker precaching for the hashed application shell and bundled built-in catalog without placing user state in Cache Storage
- [x] 8.3 Implement the update-ready notice so an active study session is not automatically reloaded and activation occurs only after user confirmation on a safe screen
- [x] 8.4 Verify the production build is installable over HTTPS and can reload the catalog, groups, study flow, and persisted state offline after one successful online load
- [x] 8.5 Verify direct application routes and static assets resolve correctly in a Vercel preview deployment

## 9. End-to-End Verification

- [x] 9.1 Add a mobile-viewport E2E flow that creates a custom card and group, studies with swipe and button controls, reloads, and verifies restored state
- [x] 9.2 Add E2E coverage for hiding and restoring a built-in card, deleting a custom card, and preserving unrelated groups and progress
- [x] 9.3 Add E2E coverage for warmed-cache offline startup and controlled service-worker update behavior during an active session
- [x] 9.4 Run lint, typecheck, unit/component tests, E2E tests, production build, and built-in catalog validation with no failures
- [x] 9.5 Perform keyboard and mobile Safari/Chrome checks for focus order, touch targets, swipe-scroll interaction, safe areas, reduced motion, and 320 CSS-pixel layout
