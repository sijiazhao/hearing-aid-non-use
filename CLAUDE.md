# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static web questionnaire for researching hearing aid non-use, built as a single-page application with vanilla HTML/CSS/JS (no build tools, no frameworks, no dependencies). Contact: Dr Sijia Zhao, University of Oxford.

## Running

Open `index.html` directly in a browser — no server required. There is no build step, no package manager, and no test suite.

## Architecture

Three files make up the entire application:

- **`index.html`** — All questionnaire content and structure. Sections are `<section class="section">` elements shown/hidden via an `.active` class. Each section has a `data-section` attribute with a global index. Note: `data-section` indices are not contiguous (sections 4 and 5 map to indices 3 and 5, skipping 4).
- **`script.js`** — Navigation state machine and response collection. A `sections` array defines all sections with visibility predicates (`show` functions) that depend on `state.hasHearingAids` and `state.wearFrequency`. Navigation (`nextSection`/`prevSection`) walks only visible sections. Responses are collected into a flat object, stored in `localStorage`, and downloadable as JSON.
- **`styles.css`** — Responsive design with CSS custom properties in `:root`. Targets elderly/clinical users with large font sizes (base 1.125rem), high-contrast focus indicators, and accessible touch targets. Includes print styles that show all sections.

## Questionnaire Flow Logic

The flow is conditional based on user responses:

1. **Welcome** → always shown
2. **About You** → always shown
3. **Your Hearing Aids** (ownership) → always shown; selecting "No" screens out to thank-you page
4. **Usage Patterns** → shown only for daily wearers (`yes-daily`), skipped for `yes-not-wearing`
5. **Reasons for Non-Use** → shown only for `yes-not-wearing`; includes an "apathy" sub-flow (items with `data-apathy="true"` trigger a follow-up Likert scale)
6. **Support & Comments** → shown for all hearing aid owners
7. **Thank You** → always shown; displays formatted summary and offers JSON download

## Design Notes

- `listening_energy_daily_life_section.md` contains a draft section (removed from v1 pilot) exploring the HHIA → LEEAS → FSS → AMI pathway. Not currently wired into the questionnaire.
- No backend — all data stays client-side. Responses persist only in `localStorage` under key `haq-last-response`.
- Accessibility: uses semantic fieldsets/legends, `sr-only` class for screen-reader-only labels, and `:focus-visible` outlines.
