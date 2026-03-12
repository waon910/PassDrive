# PassDrive UI/UX Guidelines v0.1

## 1. Purpose

This document defines the UI and UX rules for PassDrive.

The product is for English-speaking learners preparing for the Japanese driver's license written test on iPad. The UI must reduce cognitive friction, build trust, and support repeated practice without feeling generic or cluttered.

## 2. Product Experience Goals

The UI should feel:

- calm
- trustworthy
- focused
- efficient
- clear for non-native context learning

The UI should not feel:

- exam-hostile
- playful to the point of trivializing rules
- crowded
- mobile-phone compressed
- dashboard-noisy

## 3. Device Context

- Primary device: iPad browser
- Primary orientations: landscape first, portrait supported
- Primary input: touch
- Primary context: self-study, repeated short sessions, moderate ambient distraction

## 3.1 iPad Layout Best Practices Baseline

This project uses Apple iPadOS guidance as the baseline for layout decisions.

Applied takeaways:

- Use the large display to keep the primary study content visible without horizontal scrolling.
- Keep controls close to the content they modify instead of separating decisions and actions across distant panels.
- Avoid excessive modal or full-screen interruptions during normal study loops.
- Support comfortable touch interaction with controls sized for finger input.
- Preserve clarity, hierarchy, and adaptability across orientation changes and multitasking widths.

Implementation consequences for PassDrive:

- The app shell should use a persistent navigation rail in landscape and a stacked navigation block in narrow widths.
- Page headers should be compact, because vertical space is more valuable for question reading than for decorative hero content.
- Practice and mock exam screens should reserve most of the viewport for the active question and its immediate controls.
- Secondary information should be collapsed into short status lines or lightweight metadata instead of card walls.
- Learner-facing copy should be compressed aggressively so the study surface stays dominant.

## 4. UX Principles

### 4.1 One primary action per screen

- Every screen must make the next best action obvious.
- Secondary actions should remain visible but visually subordinate.

### 4.2 Learn, answer, understand

The default learning sequence is:

1. read the question
2. answer confidently
3. understand why
4. continue immediately

### 4.3 Reduce uncertainty

- Always show current mode, current progress, and what happens next.
- Avoid hidden state transitions.
- Use explicit labels such as `Practice`, `Mock Exam`, `Mistakes Only`, `Review Status`.

### 4.4 Favor composure over stimulation

- Motion should support orientation, not decorate the page.
- Use strong information hierarchy instead of flashy effects.

### 4.5 Support repeated use

- Fast re-entry matters.
- Returning users should be able to continue with one tap.

## 5. Layout System

### 5.1 Landscape layout

Default pattern:

- left navigation rail or persistent side navigation
- large main content area
- optional secondary panel only when it directly supports the current action

Use landscape to reduce context switching, not to add extra noise.

### 5.2 Portrait layout

Default pattern:

- top title and context
- stacked content sections
- bottom-pinned or visually strong primary action when needed

### 5.3 Spacing

- Use generous spacing around question content
- Prefer fewer, larger sections over many dense blocks
- Cards must not become narrow phone-style widgets on tablet widths
- Minimize dead header space above the active study content

## 6. Typography

- Prioritize readability for English learning content
- Headlines may be expressive, but body text must remain highly legible
- Question stems and explanations require comfortable line height
- Avoid overly condensed or geometric-only typography for long-form reading

Recommended behavior:

- strong serif or humanist display face for major headings
- clear sans-serif for controls and body text
- consistent distinction between question text, explanation text, metadata, and labels

## 7. Color and Visual Direction

- Use a warm, trustworthy palette with enough contrast
- Reserve high-emphasis colors for action, correctness, warnings, and status
- Correctness should not rely on green/red alone
- Review or rights state may use badges, text, and iconography together

Visual tone:

- editorial and intentional
- not corporate dashboard blue-only
- not gamified neon

## 8. Navigation Rules

- Global destinations should be stable and easy to re-enter
- During active answering flows, reduce non-essential navigation prominence
- The user should always know whether they are in practice mode, mock exam mode, or review mode
- Keep navigation labels short enough to scan from a rail at arm’s-length viewing distance

## 9. Screen-Specific Guidance

### 9.1 Home Dashboard

Must answer:

- where the learner stands
- what they should do next
- what their weakest area is

Must include:

- clear primary CTA
- recent or current progress
- fast access to mistakes and mock exam

### 9.2 Practice Setup

- Keep setup lightweight
- Avoid advanced filtering overload in MVP
- Show enough structure to help intent selection

### 9.3 Practice Question

- The question stem must dominate the screen
- Answer choices must be large and tap-safe
- Explanation must feel integrated, not buried
- After submission, the next action must be immediate and obvious
- Avoid introducing side panels, metric blocks, or promotional copy while answering

### 9.4 Mock Exam

- Must feel more serious than normal practice
- Timer, question index, and progress should remain visible
- Do not display explanations before finishing
- Place time and progress near the question, not in distant supporting cards

### 9.5 Results Summary

- Start with pass/fail and score
- Then show weak areas
- Then offer next action

### 9.6 Mistakes Review

- Make it easy to restart only weak items
- Sorting and filtering should emphasize rapid correction

### 9.7 Signs and Terms

- In MVP, prefer one dominant reference card and one lightweight supporting list
- Searching must be lightweight and immediate when introduced

## 10. Interaction Design Rules

- Tap targets should feel comfortable on tablet and generally respect Apple’s 44pt minimum guidance
- Selection state must be visually obvious before submission
- Submission must feel deliberate
- Use confirmation only when the cost of accidental action is meaningful

## 11. Motion

- Use short, meaningful transitions for panel changes, answer reveal, and navigation continuity
- Do not animate every card or metric
- Motion should reinforce orientation and state change

## 12. Copywriting Rules

- All learner-facing copy is English
- Use natural English, not literal translation tone
- Keep instructions short and precise
- Prefer direct phrasing over motivational filler

Examples:

- Good: `Review mistakes`
- Good: `You passed the mock exam`
- Bad: `Let us begin your exciting study journey`

## 13. Accessibility Requirements

- Maintain strong contrast for text and controls
- Use labels and icons together where meaning matters
- Support text zoom without layout breakage
- Preserve keyboard accessibility where possible even though touch is primary

## 14. Anti-Patterns

Avoid:

- phone-first cramped layouts stretched onto iPad
- more than one dominant CTA in the same visual zone
- dense metric walls with no instructional meaning
- hidden answer state
- instant explanation walls before answer submission in normal practice
- decorative motion that slows repeated study
- purple-on-white generic SaaS aesthetics

## 15. Done Criteria for New Screens

A screen is not done unless:

- the primary action is obvious in under three seconds
- the screen reads well in iPad landscape
- the screen remains coherent in iPad portrait
- the learner can tell what mode they are in
- the spacing supports reading, not just information packing
- the copy is short and native-sounding

## 16. Source Notes

This document was aligned against Apple Developer design guidance reviewed on March 11, 2026:

- Human Interface Guidelines overview
- Designing for iPadOS
- UI Design Dos and Don’ts
- Accessibility guidance
