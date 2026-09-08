## ADDED Requirements

### Requirement: Local persistence of user state
The system SHALL persist user-created cards, hidden built-in card identifiers, custom groups, group memberships, learning progress, and user settings in the browser's `localStorage`. The system MUST NOT require an account or network request to save this state.

#### Scenario: User reloads the application
- **WHEN** the user changes persisted state and reloads the application in the same browser profile
- **THEN** the system restores the last successfully saved state

#### Scenario: User is offline
- **WHEN** the user changes persisted state while the installed application is running offline
- **THEN** the system saves and restores that state locally without attempting a network request

### Requirement: Versioned storage schema
The system SHALL store persisted state in a namespaced envelope with an explicit schema version and SHALL apply validated sequential migrations before making older supported data editable.

#### Scenario: Stored state uses an older supported schema
- **WHEN** the application loads valid persisted state from a supported older schema version
- **THEN** the system migrates it to the current schema without losing valid cards, groups, visibility choices, or progress

#### Scenario: Built-in card identifier is migrated
- **WHEN** a release provides an explicit mapping from a retired built-in card identifier to its replacement
- **THEN** the migration updates group memberships, visibility state, and progress to reference the replacement identifier

### Requirement: Safe hydration
The system MUST finish reading and validating persisted state before it permits an empty default state to be saved.

#### Scenario: Application starts with existing state
- **WHEN** persisted state exists and application hydration is in progress
- **THEN** the system MUST NOT overwrite that state with initial defaults

### Requirement: Invalid or unsupported state recovery
The system MUST NOT automatically overwrite raw persisted data when it is malformed or has a schema version newer than the application supports. It SHALL provide read-only access to the built-in catalog and an explicit option to reset local user data.

#### Scenario: Stored JSON is malformed
- **WHEN** the application cannot parse or validate persisted state
- **THEN** the system preserves the raw stored value, loads the built-in catalog in safe mode, and explains that user data could not be loaded

#### Scenario: Stored schema is newer than the application
- **WHEN** the persisted schema version is greater than the maximum version supported by the running application
- **THEN** the system preserves the stored value and prevents that application version from overwriting it

#### Scenario: User confirms reset
- **WHEN** the user explicitly confirms resetting invalid local data
- **THEN** the system removes the persisted envelope and initializes a valid empty user state

### Requirement: Save failure visibility
The system MUST detect `localStorage` write failures and MUST tell the user that the affected change has not been durably saved.

#### Scenario: Browser rejects a write
- **WHEN** a state change cannot be written because storage is unavailable or its quota is exceeded
- **THEN** the system keeps the current in-memory view, marks it as unsaved, and displays a persistent error until a later save succeeds or the page is left
