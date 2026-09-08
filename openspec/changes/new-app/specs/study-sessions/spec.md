## ADDED Requirements

### Requirement: Group-based study session
The system SHALL allow the user to start a study session from any group containing at least one eligible card. The system MUST create the session from a snapshot of that group's eligible card identifiers so later catalog edits do not corrupt the active session.

#### Scenario: User starts a session
- **WHEN** the user starts studying a group with eligible cards
- **THEN** the system presents one card from that group and displays the session's remaining-card progress

#### Scenario: Card is removed during a session
- **WHEN** a card referenced by an active session is deleted before it is presented
- **THEN** the system skips the missing card and continues with the remaining valid snapshot entries

### Requirement: Answer reveal
The system SHALL initially show the prompt side without exposing its translation and SHALL reveal the translation only after an explicit user action.

#### Scenario: User reveals a translation
- **WHEN** the user activates the current card before rating it
- **THEN** the system displays the Russian translation while retaining the Tatar prompt

### Requirement: Swipe-based rating
The system SHALL interpret a completed right swipe as "known" and a completed left swipe as "learning" after the answer has been revealed. The system MUST require a configured distance or velocity threshold before committing a swipe and MUST return the card to its resting position when that threshold is not reached.

#### Scenario: User swipes right past the threshold
- **WHEN** the revealed card completes a right swipe meeting the gesture threshold
- **THEN** the system records a "known" result and advances the session

#### Scenario: User swipes left past the threshold
- **WHEN** the revealed card completes a left swipe meeting the gesture threshold
- **THEN** the system records a "learning" result and schedules the card for additional practice

#### Scenario: User cancels a short swipe
- **WHEN** the pointer is released before the swipe threshold is reached
- **THEN** the system records no result and returns the same card to its resting position

#### Scenario: User swipes before revealing the answer
- **WHEN** the user attempts a rating swipe before revealing the translation
- **THEN** the system records no result and keeps the current card active

### Requirement: Equivalent non-gesture controls
The system MUST provide visible controls and keyboard-accessible actions for reveal, "known", and "learning" that invoke the same business commands as swipe interaction.

#### Scenario: User rates with a button
- **WHEN** the user reveals a card and activates the visible "known" or "learning" control
- **THEN** the system records the same result and advances in the same way as the corresponding swipe

#### Scenario: User prefers reduced motion
- **WHEN** the operating system reports a reduced-motion preference
- **THEN** the system MUST avoid non-essential card movement while retaining all study actions

### Requirement: Learning progress and review ordering
The system SHALL store per-card learning progress after every completed rating. New sessions MUST prioritize cards due for review and cards with no prior result before cards that are not yet due, and a card rated "learning" MUST reappear after at least one different card when another card is available in the active session.

#### Scenario: Session contains due and not-due cards
- **WHEN** the system builds a session containing due, unseen, and not-due cards
- **THEN** it orders due and unseen cards before not-due cards

#### Scenario: User rates a card as learning
- **WHEN** the user rates a revealed card as "learning" and another card remains available
- **THEN** the system schedules at least one different card before presenting the learning card again

### Requirement: Session completion and undo
The system SHALL show a completion summary when no scheduled cards remain and SHALL allow the user to undo the most recent rating while the session remains active.

#### Scenario: User completes a session
- **WHEN** all scheduled cards have received their required ratings
- **THEN** the system displays counts of "known" and "learning" results for that session

#### Scenario: User undoes the latest rating
- **WHEN** the user invokes undo before leaving or completing the active session
- **THEN** the system restores the previous card and reverses that rating's progress change
