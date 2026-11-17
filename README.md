# Moment 🐸

**A journaling companion that picks up where you left off.**

Moment is a mobile-first product prototype for people who find traditional journaling intimidating or difficult to sustain. Instead of requiring daily streaks or forcing a blank-page experience, Moment offers optional starting prompts, low-pressure mood check-ins, persistent memories, and personalized follow-ups from Phrug, a friendly frog.

## Demo
Add a Vercel deployment URL here once published. On the Today page, select **Try two fictional demo entries** to explore Phrug's follow-up experience without entering personal information.

## Product hypothesis
A personalized invitation to revisit something you've previously written may be more useful than an arbitrary daily streak. This is **a hypothesis, not a validated retention outcome**.

## Implemented features
- Optional mood + reflection entry, with lightweight starter prompts
- Browser-local persistence (localStorage); reload and entries remain on that device
- Memories list and entry detail; revisit tags and entry deletion
- Phrug's deterministic follow-up suggestions derived from stored reflections, prioritizing entries explicitly marked for later
- Dismiss or switch follow-up prompts
- Fictional demo entries to let reviewers test the loop
- Responsive layout, no registration or API key needed

## What is deliberately not built
- No LLM calls: context-aware follow-ups use a transparent, simple keyword-and-template heuristic; they are **not AI-generated**.
- No backend, authentication, cross-device sync, notifications, streaks, or claims of clinical coaching.
- No empirical evidence of increased retention yet.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Validate
1. Open Today, write an entry, select *Let Phrug ask me about this later*, save.
2. Reload: the entry remains; its follow-up appears in Phrug's card.
3. Select *Reflect on this*, save the new response.
4. Open Memories and inspect the entries; return, dismiss follow-up, reload.
5. Use fictional demo entries to demonstrate the experience without private information.

## Privacy
Journal entries are stored **only in the browser's localStorage** on the current device. They are not sent to an AI service. Clearing browser data removes entries. Do not enter sensitive information in a shared demo browser. The public deployed website serves code but does not make locally stored journal entries public.

## Next experiments
- Compare contextual vs generic follow-up prompts with consenting test users.
- Track opt-in, prompt acceptance, and return-to-reflect (without collecting raw journal content by default).
- Explore permission-based AI prompting with privacy controls and server-held API keys.

## Tech
Next.js (App Router), React, TypeScript, CSS, Lucide.

## Development
Built as an early portfolio prototype with AI-assisted coding. Describe implemented features accurately, and distinguish design hypotheses from measured outcomes.

## Regression checks
`npm run lint` runs TypeScript checking (`tsc --noEmit`), not ESLint. Run `npm run build` for the production build.

The browser checks use fictional text and an isolated browser context:
```bash
npx playwright install chromium
npm run dev
# In another terminal:
npm run test:e2e
npm run test:a11y
```
Set `BASE_URL` to test another local server. If using an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path. Journey screenshots are written to ignored `test-results/`.

The journey check covers saving/reloading, follow-up responses and source context, Memories, revisit tags, switching/dismissal, deletion/reset, demos, keyboard dialog behavior, draft protection, invalid stored data and storage write failures. It checks horizontal overflow at 320, 375, 768 and 1024 pixels. The accessibility check runs axe WCAG 2 A/AA and 2.1 AA rules on empty/populated Today, Memories and the entry dialog; automated checks do not replace screen-reader or real-device testing.

Unreadable stored entries are left untouched and changes are blocked rather than silently replacing data. Memories offers an explicitly confirmed local reset. Failed writes retain the current draft; unsaved drafts are not persisted across reloads.

`package-lock.json` records the tested dependencies. A PostCSS 8.5.33 override replaces Next.js's older transitive version without a Next.js major upgrade; recheck this override during future Next.js updates.
