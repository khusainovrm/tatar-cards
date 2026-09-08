## ADDED Requirements

### Requirement: Group lifecycle
The system SHALL allow the user to create, rename, and delete custom card groups. Each group MUST have a stable identifier and a non-empty user-visible name.

#### Scenario: User creates a group
- **WHEN** the user submits a non-empty name that is not already used by another custom group
- **THEN** the system creates an empty group and makes it available for card assignment and study

#### Scenario: User submits a duplicate group name
- **WHEN** the user submits a group name that matches another custom group after trimming and case normalization
- **THEN** the system rejects the submission and explains that the name is already in use

#### Scenario: User deletes a group
- **WHEN** the user confirms deletion of a custom group
- **THEN** the system removes the group without deleting its cards or their learning progress

### Requirement: Group membership
The system SHALL allow an active card to belong to zero, one, or multiple custom groups. A group MUST store references to card identifiers rather than copies of card content.

#### Scenario: User adds a card to multiple groups
- **WHEN** the user assigns the same active card to two custom groups
- **THEN** the system includes that card in both groups without creating a duplicate card

#### Scenario: User removes a card from a group
- **WHEN** the user removes a card from one custom group
- **THEN** the system removes only that membership and retains the card, its other memberships, and its learning progress

### Requirement: All Cards group
The system SHALL provide a non-deletable system group named "All Cards" that dynamically contains every active built-in and user-created card exactly once.

#### Scenario: Catalog membership changes
- **WHEN** a card is created, deleted, hidden, or restored
- **THEN** the system updates the effective contents of "All Cards" without requiring manual membership changes

### Requirement: Group study eligibility
The system MUST exclude hidden and deleted cards when resolving a group for a new study session and MUST prevent a session from starting when no eligible cards remain.

#### Scenario: Group contains stale or hidden references
- **WHEN** the user starts a session for a group containing hidden or deleted card references and at least one active card
- **THEN** the system creates the session using only the active cards, with each card included once

#### Scenario: Group has no eligible cards
- **WHEN** the user attempts to study a group with no active cards
- **THEN** the system does not start a session and explains how to add or restore cards
