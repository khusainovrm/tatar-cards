## ADDED Requirements

### Requirement: Mobile-first responsive interface
The system SHALL provide a usable interface from a 320 CSS-pixel-wide viewport upward, account for device safe-area insets, and avoid horizontal page scrolling during normal use.

#### Scenario: User opens the application on a narrow phone
- **WHEN** the application is displayed at a 320 CSS-pixel viewport width
- **THEN** primary content and controls remain visible, readable, and operable without horizontal page scrolling

#### Scenario: Card contains a long phrase
- **WHEN** a Tatar phrase or Russian translation exceeds the typical card length
- **THEN** the card expands or scrolls its content without clipping the text or hiding study controls

### Requirement: Installable PWA
The system SHALL provide a valid web app manifest and service worker so supported browsers can install the application in standalone display mode. The manifest MUST define application identity, start URL, theme colors, and required icons.

#### Scenario: Browser evaluates installability
- **WHEN** the production application is served over HTTPS on Vercel with its manifest and service worker available
- **THEN** a supported browser recognizes it as installable and launches the installed app at the configured start URL

### Requirement: Offline application shell
The system SHALL cache the versioned application shell and built-in card data after a successful online load so the application can subsequently start and run its local study flows without a network connection.

#### Scenario: User returns while offline
- **WHEN** the user has successfully loaded the current production version before and later launches it without network connectivity
- **THEN** the system loads the application, built-in cards, and persisted user state and permits catalog, group, and study operations

#### Scenario: First visit is offline
- **WHEN** the user visits the application for the first time without any cached application version
- **THEN** the system is not required to load and MUST NOT claim that offline setup has completed

### Requirement: Controlled application updates
The system MUST NOT automatically reload the page or activate an incompatible application version during an active study session. When an update is ready, it SHALL inform the user and allow activation at a safe point.

#### Scenario: Update becomes ready during study
- **WHEN** a new service worker is ready while a study session is active
- **THEN** the system keeps the current version running and displays a non-blocking update notice

#### Scenario: User accepts an update
- **WHEN** the user accepts a ready update from a safe screen
- **THEN** the system activates the new application version and reloads into state restored through the supported storage migration path

### Requirement: Static Vercel deployment
The system SHALL produce a static production build deployable to Vercel and MUST route supported client-side URLs to the application entry document without intercepting static asset requests.

#### Scenario: User opens a client-side URL directly
- **WHEN** the user requests a supported application route directly from the Vercel deployment
- **THEN** Vercel serves the application entry document and the client renders the requested route
