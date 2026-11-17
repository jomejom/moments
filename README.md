# Moment 🐸

### A little space to reflect. A companion that remembers.

Moment is a working journaling prototype built around one idea: returning to a thought can be more meaningful than maintaining a streak. Phrug, a friendly frog, guides users through a quiet check-in and helps them revisit earlier reflections.

**[Try the live demo →](https://moments-nine-pi.vercel.app/)** · [View the code](https://github.com/jomejom/moments)

![Moment’s opening screen: Phrug, a short greeting, and a single Begin button.](docs/greeting.png)

## Try it in a minute

1. Open the demo and select **Begin**.
2. Choose a feeling, or skip. Write a reflection and save it.
3. Reload and check in again. Phrug offers a question based on your previous entry.
4. Choose **Stay with this** to respond, or **Something new** to start fresh. Find saved reflections in **Memories**.

To explore without writing your own entry, open **About this space → Try two fictional demo entries**.

## The experience

- **One thought at a time.** Greeting, optional mood, topic, writing, and confirmation appear as separate steps.
- **A reason to return.** Follow-ups draw on previous reflections, prioritizing entries marked **Revisit this later**. Users can switch or dismiss a nudge.
- **Room to choose.** Starting prompts are optional, a new topic is always available, and Back preserves the current draft.
- **Memories with context.** Saved responses link to their original reflection. Entries can be read, marked for revisiting, or deleted.
- **A quieter interface.** Brief copy, spacious layouts, serif prompts, and a custom SVG Phrug keep the current question in focus.

[See the returning-user experience on mobile →](docs/returning-mobile.png)

## Implementation and tradeoffs

Built with **Next.js App Router, React, TypeScript, CSS, and Lucide**, and deployed on **Vercel** from GitHub.

The core journey runs entirely in the browser. Reflections persist in `localStorage`; stored records are validated before rendering, failed saves retain the draft, and unreadable data is protected from accidental replacement.

Phrug’s follow-ups use **deterministic keywords and templates**, rather than an LLM. This keeps the prototype usable without API keys or paid services, while demonstrating the contextual follow-up experience. The questions can be generic and are not clinical guidance.

Accessibility work includes descriptive labels, keyboard focus management between steps, an entry dialog with focus trapping and Escape dismissal, reduced-motion support, and contrast checks.

## Scope and privacy

This is an early portfolio prototype built with AI-assisted coding. It explores a product hypothesis; increased engagement or retention has **not** been measured.

There is no account, backend, cross-device sync, or notification system. Journal content stays in the current browser and is not sent to an AI service. Clearing browser data removes saved entries. Unsaved drafts do not survive reloads, and browser tabs are not synchronized.

## Run locally

Use Node.js 20.9+ and npm.

```bash
git clone https://github.com/jomejom/moments.git
cd moments
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No environment variables are required.

## Validation

```bash
npm run lint       # TypeScript checking (tsc --noEmit)
npm run build      # Production build
```

For browser checks, keep the app running and use another terminal:

```bash
npx playwright install chromium
npm run test:e2e
npm run test:a11y
```

The regression suite covers both guided journeys, save/reload persistence, response links, draft protection, storage failures, memory controls, keyboard dialog behavior, and overflow checks at 320–1024 px. Axe checks cover 11 interface states against WCAG 2 A/AA and 2.1 AA rules. These checks passed for the current interface; real-device, cross-browser, and screen-reader testing remain areas for further validation.

Tests use isolated browser contexts and fictional text. Set `BASE_URL` to check a different server, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation. Screenshots are saved to ignored `test-results/`.

## Next experiment

Compare contextual follow-ups with generic prompts in a consent-based usability study. Measure how often participants open and complete a response, without collecting raw journal text. Use the results to evaluate the idea before making retention claims.
