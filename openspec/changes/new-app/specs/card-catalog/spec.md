## ADDED Requirements

### Requirement: Built-in card catalog
The system SHALL provide a built-in catalog loaded from `cards.ts`, where every card has a stable unique identifier, Tatar text, a Russian translation, and a content type of word or phrase.

#### Scenario: User opens the catalog
- **WHEN** the application finishes loading valid built-in card data
- **THEN** the system displays the available word and phrase cards with their Tatar text and Russian translations

#### Scenario: Built-in data contains an invalid card
- **WHEN** `cards.ts` contains a card with a missing side or a duplicate identifier
- **THEN** the production build validation MUST fail and identify the invalid card

### Requirement: User-created cards
The system SHALL allow the user to create cards containing non-empty Tatar text and a non-empty Russian translation. The system SHALL assign each user-created card a stable identifier that cannot collide with a built-in card identifier.

#### Scenario: User creates a valid card
- **WHEN** the user submits non-empty Tatar text and Russian translation
- **THEN** the system adds the card to the catalog and makes it available for grouping and study

#### Scenario: User submits an incomplete card
- **WHEN** the user submits a card with either text side empty after whitespace is trimmed
- **THEN** the system rejects the submission and identifies each field that requires a value

### Requirement: User-created card maintenance
The system SHALL allow the user to edit and delete user-created cards. Deleting a user-created card MUST remove its group memberships and learning progress as one logical operation.

#### Scenario: User edits a custom card
- **WHEN** the user saves valid changes to a user-created card
- **THEN** the system displays the updated content everywhere that card is referenced

#### Scenario: User deletes a custom card
- **WHEN** the user confirms deletion of a user-created card
- **THEN** the system removes the card, its group memberships, and its learning progress

### Requirement: Built-in card visibility
The system SHALL allow the user to hide and restore built-in cards without modifying the source catalog. A hidden card MUST be excluded from new study sessions while its existing learning progress is retained.

#### Scenario: User hides a built-in card
- **WHEN** the user hides a visible built-in card
- **THEN** the system excludes that card from the active catalog and subsequently created study sessions

#### Scenario: User restores a built-in card
- **WHEN** the user restores a previously hidden built-in card
- **THEN** the system returns the card to the active catalog with its prior learning progress intact
