"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookHeart,
  CalendarDays,
  Heart,
  RotateCcw,
  X,
} from "lucide-react";

type Entry = {
  id: string;
  text: string;
  mood: string;
  createdAt: string;
  revisit: boolean;
  dismissed: boolean;
  sourceId?: string;
};
type Tab = "today" | "memories";
const KEY = "moment.entries.v1";
const moods = ["🌤️", "😊", "😌", "😐", "😔", "😟"];
const moodNames = ["Hopeful", "Happy", "Calm", "Neutral", "Sad", "Worried"];
function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    !!e.id &&
    typeof e.text === "string" &&
    typeof e.mood === "string" &&
    typeof e.createdAt === "string" &&
    Number.isFinite(Date.parse(e.createdAt)) &&
    typeof e.revisit === "boolean" &&
    typeof e.dismissed === "boolean" &&
    (e.sourceId === undefined || typeof e.sourceId === "string")
  );
}
const starters = [
  "Something on my mind…",
  "A small win today…",
  "Something I’m grateful for…",
  "Something I want to remember…",
];
const demo: Entry[] = [
  {
    id: "demo1",
    text: "I have a big presentation next week and I keep putting off practicing. I think I’m scared of getting it wrong.",
    mood: "😟",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    revisit: true,
    dismissed: false,
  },
  {
    id: "demo2",
    text: "Dance practice made me feel a lot more like myself today. It was nice to stop overthinking for a while.",
    mood: "😊",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    revisit: false,
    dismissed: false,
  },
];
function followUp(e: Entry): string {
  const text = e.text.toLowerCase();
  if (/\bpresentation\b/.test(text)) return "How’s the presentation feeling?";
  if (/\binterview\b/.test(text)) return "How’s the interview feeling?";
  if (/\b(exam|deadline|test)\b/.test(text)) return "How’s it feeling now?";
  if (/friend|family|relationship|conversation/.test(text))
    return "How are things between you?";
  if (/dance|practice|exercise|walk|gym/.test(text))
    return "How has that been feeling?";
  if (/worr|scared|anxious|stress|overwhelm/.test(text))
    return "A little lighter today?";
  if (/happy|grateful|proud|excited/.test(text))
    return "Still holding a little of that joy?";
  return "Anything you’d like to add?";
}
const fmt = (d: string) =>
  new Date(d).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
function Frog({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={`phrug-mascot ${small ? "mascot-small" : ""}`}
      viewBox="0 0 200 164"
      role="img"
      aria-label="Phrug the friendly frog"
    >
      <ellipse cx="100" cy="151" rx="65" ry="7" fill="#355b3910" />
      <ellipse cx="59" cy="140" rx="25" ry="12" fill="#80b76b" />
      <ellipse cx="141" cy="140" rx="25" ry="12" fill="#80b76b" />
      <path
        d="M25 98C22 78 31 61 45 51C39 20 75 9 91 36C97 34 103 34 109 36C125 9 161 20 155 51C169 61 178 78 175 98C173 134 145 146 100 146S27 134 25 98Z"
        fill="#9dce85"
        stroke="#689653"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M41 111C53 133 78 136 100 136S147 133 159 111C152 136 129 145 100 145S48 136 41 111Z"
        fill="#8cc174"
      />
      <ellipse cx="69" cy="63" rx="8" ry="11" fill="#293f2d" />
      <ellipse cx="131" cy="63" rx="8" ry="11" fill="#293f2d" />
      <circle cx="66.5" cy="59" r="2.5" fill="white" />
      <circle cx="128.5" cy="59" r="2.5" fill="white" />
      <ellipse cx="52" cy="86" rx="13" ry="7" fill="#eda99e" opacity=".8" />
      <ellipse cx="148" cy="86" rx="13" ry="7" fill="#eda99e" opacity=".8" />
      <path
        d="M87 85Q93 94 100 86Q107 94 113 85"
        fill="none"
        stroke="#365338"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M44 113Q49 125 59 123M156 113Q151 125 141 123"
        fill="none"
        stroke="#689653"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]),
    [hydrated, setHydrated] = useState(false),
    [tab, setTab] = useState<Tab>("today");
  const [text, setText] = useState(""),
    [mood, setMood] = useState(""),
    [revisit, setRevisit] = useState(false),
    [saved, setSaved] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [promptIndex, setPromptIndex] = useState(0),
    [followSource, setFollowSource] = useState<string | undefined>();
  const [step, setStep] = useState<
    "greeting" | "mood" | "topic" | "write" | "saved"
  >("greeting");
  const [writingPrompt, setWritingPrompt] = useState("What's on your mind?");
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!hydrated || tab !== "today") return;
    if (step === "write") document.getElementById("reflection")?.focus();
    else stepHeading.current?.focus();
  }, [step, tab, hydrated]);
  const [storageError, setStorageError] = useState("");
  const unreadableStorage = useRef(false);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const data: unknown = raw ? JSON.parse(raw) : [];
      if (
        !Array.isArray(data) ||
        !data.every(isEntry) ||
        new Set(data.map((e) => e.id)).size !== data.length
      )
        throw new Error("Invalid entries");
      setEntries(data);
    } catch {
      unreadableStorage.current = true;
      setStorageError(
        "Your saved reflections could not be opened. Existing browser data has been left untouched. Please check browser storage before continuing.",
      );
    }
    setHydrated(true);
  }, []);
  const updateEntries = (
    change: (old: Entry[]) => Entry[],
    clearUnreadable = false,
  ) => {
    if (unreadableStorage.current && !clearUnreadable) {
      setStorageError(
        "Saved data could not be read. To avoid overwriting it, changes are blocked. You can explicitly delete local reflections in Memories to start over.",
      );
      return false;
    }
    const next = change(entries);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setEntries(next);
      unreadableStorage.current = false;
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "Could not save changes in this browser. Your draft is still here. Check available storage and try again.",
      );
      return false;
    }
  };
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = dialogRef.current;
    modal?.querySelector<HTMLButtonElement>("button")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }
      if (event.key === "Tab" && modal) {
        const items = Array.from(
          modal.querySelectorAll<HTMLElement>(
            'button, [href], input, textarea, [tabindex="0"]',
          ),
        );
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [selected]);
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries],
  );
  const candidates = useMemo(
    () =>
      [
        ...sorted.filter((e) => e.revisit && !e.dismissed),
        ...sorted.filter((e) => !e.revisit && !e.dismissed),
      ].filter((e, i, arr) => arr.findIndex((a) => a.id === e.id) === i),
    [sorted],
  );
  const follow = candidates.length
    ? candidates[promptIndex % candidates.length]
    : undefined;
  const save = () => {
    if (!text.trim()) return;
    if (
      !updateEntries((old) => [
        {
          id: randomId(),
          text: text.trim(),
          mood,
          createdAt: new Date().toISOString(),
          revisit,
          dismissed: false,
          sourceId: followSource,
        },
        ...old,
      ])
    )
      return;
    setText("");
    setMood("");
    setRevisit(false);
    setFollowSource(undefined);
    setSaved(true);
    setStep("saved");
  };
  const chooseReflection = (
    source?: Entry,
    prompt = "What's on your mind?",
  ) => {
    if (
      text.trim() &&
      source?.id !== followSource &&
      !window.confirm(
        "Replace your unfinished draft with a different reflection?",
      )
    )
      return;
    if (source?.id !== followSource) setText("");
    setFollowSource(source?.id);
    setWritingPrompt(source ? followUp(source) : prompt);
    setSaved(false);
    setStep("write");
  };
  const beginAgain = () => {
    setSaved(false);
    setWritingPrompt("What's on your mind?");
    setStep("mood");
  };
  const discardFollow = () => {
    if (!follow) return;
    updateEntries((old) =>
      old.map((e) =>
        e.id === follow.id ? { ...e, dismissed: true, revisit: false } : e,
      ),
    );
    setPromptIndex(0);
  };
  const addDemo = () => {
    if (
      entries.length &&
      !window.confirm(
        "Add two fictional demo entries alongside your existing reflections?",
      )
    )
      return;
    const added = updateEntries((old) => [
      ...demo.filter((d) => !old.some((e) => e.id === d.id)),
      ...old,
    ]);
    if (added) {
      setTab("today");
      setStep("mood");
    }
    setPromptIndex(0);
  };
  const reset = () => {
    if (
      window.confirm(
        "Delete all reflections stored in this browser? This cannot be undone.",
      )
    ) {
      if (updateEntries(() => [], true)) {
        setSelected(null);
        setFollowSource(undefined);
        setStep("greeting");
        setPromptIndex(0);
      }
    }
  };
  const selectedEntry = sorted.find((e) => e.id === selected);
  return (
    <div className="app-shell">
      <div className="site" inert={!!selected}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <Frog small />
            </div>
            <div>
              <span className="brand-name">
                moment<span className="brand-dot">.</span>
              </span>
            </div>
          </div>
        </header>
        <nav className="tabs" aria-label="Main navigation">
          <button
            aria-current={tab === "today" ? "page" : undefined}
            className={tab === "today" ? "active" : ""}
            onClick={() => setTab("today")}
          >
            <Heart size={17} /> Today
          </button>
          <button
            aria-current={tab === "memories" ? "page" : undefined}
            className={tab === "memories" ? "active" : ""}
            onClick={() => setTab("memories")}
          >
            <BookHeart size={17} /> Memories{" "}
            <span className="count">{entries.length}</span>
          </button>
        </nav>
        {storageError && (
          <p className="storage-error" role="alert">
            {storageError}
          </p>
        )}
        {!hydrated ? (
          <main id="main-content" tabIndex={-1} className="loading">
            Opening your little space…
          </main>
        ) : tab === "today" ? (
          <main id="main-content" tabIndex={-1} className="guided-main">
            <section
              className={`guided-scene scene-${step}`}
              aria-labelledby="step-heading"
            >
              <div className="guide-mascot">
                <Frog />
              </div>
              <h1 id="step-heading" ref={stepHeading} tabIndex={-1}>
                {step === "greeting"
                  ? entries.length
                    ? "Welcome back."
                    : "Hi, I’m Phrug."
                  : step === "mood"
                    ? "How are you feeling?"
                    : step === "topic"
                      ? follow
                        ? followUp(follow)
                        : "What’s on your mind?"
                      : step === "saved"
                        ? "Safely kept."
                        : writingPrompt}
              </h1>
              {step === "greeting" && (
                <>
                  <p className="guide-copy">Take a breath.</p>
                  <button
                    className="primary guide-primary"
                    onClick={() => setStep("mood")}
                  >
                    Begin <ArrowRight size={17} />
                  </button>
                </>
              )}
              {step === "mood" && (
                <>
                  <div
                    className="guided-moods"
                    role="group"
                    aria-label="Choose a mood"
                  >
                    {moods.map((m, i) => (
                      <button
                        key={m}
                        aria-pressed={mood === m}
                        className={mood === m ? "selected" : ""}
                        onClick={() => setMood(mood === m ? "" : m)}
                      >
                        <span aria-hidden="true">{m}</span>
                        {moodNames[i]}
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary guide-primary"
                    onClick={() => setStep("topic")}
                  >
                    Continue <ArrowRight size={17} />
                  </button>
                  <div className="guide-navigation">
                    <button
                      className="text-button"
                      onClick={() => setStep("greeting")}
                    >
                      Back
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setMood("");
                        setStep("topic");
                      }}
                    >
                      Skip
                    </button>
                  </div>
                </>
              )}
              {step === "topic" && (
                <>
                  {follow ? (
                    <>
                      <div className="memory-nudge">
                        <span>{fmt(follow.createdAt)}</span>
                        <blockquote>
                          {follow.text.length > 90
                            ? `${follow.text.slice(0, 90)}…`
                            : follow.text}
                        </blockquote>
                      </div>
                      <div className="guide-choices">
                        <button
                          className="primary"
                          onClick={() => chooseReflection(follow)}
                        >
                          Stay with this <ArrowRight size={17} />
                        </button>
                        <button
                          className="secondary"
                          onClick={() => chooseReflection()}
                        >
                          Something new
                        </button>
                      </div>
                      <details className="other-nudges">
                        <summary>More</summary>
                        <div>
                          <button
                            className="text-button"
                            disabled={candidates.length < 2}
                            onClick={() => setPromptIndex((i) => i + 1)}
                          >
                            Another memory <RotateCcw size={14} />
                          </button>
                          <button
                            className="text-button"
                            onClick={discardFollow}
                          >
                            Don’t bring this up again
                          </button>
                        </div>
                      </details>
                    </>
                  ) : (
                    <>
                      <button
                        className="primary guide-primary"
                        onClick={() => chooseReflection()}
                      >
                        Start writing <ArrowRight size={17} />
                      </button>
                      <details className="starting-points">
                        <summary>A little help</summary>
                        <div className="guided-starters">
                          {starters.map((prompt) => (
                            <button
                              className="secondary"
                              key={prompt}
                              onClick={() =>
                                chooseReflection(undefined, prompt)
                              }
                            >
                              {prompt}
                              <ArrowRight size={15} />
                            </button>
                          ))}
                        </div>
                      </details>
                    </>
                  )}
                  <button
                    className="text-button back-button"
                    onClick={() => setStep("mood")}
                  >
                    Back
                  </button>
                </>
              )}
              {step === "write" && (
                <>
                  <div className="reflection guided-editor card">
                    <label
                      htmlFor="reflection"
                      className="editor-label sr-only"
                    >
                      Your reflection
                    </label>
                    <textarea
                      id="reflection"
                      placeholder="No need to rush…"
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        setSaved(false);
                      }}
                      rows={6}
                    />
                    <label className="revisit">
                      <input
                        type="checkbox"
                        checked={revisit}
                        onChange={(e) => setRevisit(e.target.checked)}
                      />
                      <span>Revisit this later</span>
                    </label>
                    <button
                      className="primary"
                      disabled={!text.trim()}
                      onClick={save}
                    >
                      Save <ArrowRight size={17} />
                    </button>
                  </div>
                  <button
                    className="text-button back-button"
                    onClick={() => setStep("topic")}
                  >
                    Back
                  </button>
                </>
              )}
              {step === "saved" && (
                <>
                  {saved && (
                    <p className="guide-copy" role="status">
                      Just here, in this browser.
                    </p>
                  )}
                  <div className="guide-choices">
                    <button
                      className="primary"
                      onClick={() => setTab("memories")}
                    >
                      My memories <BookHeart size={17} />
                    </button>
                    <button className="secondary" onClick={beginAgain}>
                      Write again
                    </button>
                  </div>
                </>
              )}
            </section>
          </main>
        ) : (
          <main id="main-content" tabIndex={-1} className="memories">
            <div className="welcome">
              <h1>Your memories.</h1>
            </div>
            <div className="mem-header">
              <h2>
                <CalendarDays size={21} /> Your memories
              </h2>
              <span>
                {entries.length}{" "}
                {entries.length === 1 ? "reflection" : "reflections"}
              </span>
            </div>
            {sorted.length === 0 ? (
              <div className="empty card">
                <Frog small />
                <h3>A little space for your moments.</h3>
                <button className="primary" onClick={() => setTab("today")}>
                  Write your first moment <ArrowRight size={16} />
                </button>
                <button className="demo-btn" onClick={addDemo}>
                  Or explore with fictional demo entries
                </button>
              </div>
            ) : (
              <div className="entry-list">
                {sorted.map((e) => (
                  <button
                    key={e.id}
                    className="entry card"
                    onClick={() => setSelected(e.id)}
                  >
                    <div className="entry-top">
                      <span>{fmt(e.createdAt)}</span>
                      <span>
                        {e.mood}{" "}
                        {e.revisit && !e.dismissed ? "· revisit later" : ""}
                      </span>
                    </div>
                    <p>{e.text}</p>
                    <span className="entry-open">
                      Read reflection <ArrowRight size={15} />
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className="privacy-note">
              Your reflections stay in this browser. Clearing browser data or
              switching devices may remove them.
            </p>
            <button className="reset" onClick={reset}>
              Delete all local reflections
            </button>
          </main>
        )}
        <footer className="quiet-footer">
          <details>
            <summary>About this space</summary>
            <p>
              Reflections stay in this browser. Clearing browser data removes
              them. Phrug uses simple patterns, not AI.
            </p>
            {entries.length === 0 && (
              <button className="demo-btn" onClick={addDemo}>
                Try two fictional demo entries
              </button>
            )}
          </details>
        </footer>
      </div>
      {selectedEntry && (
        <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
          <article
            ref={dialogRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Journal entry"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2>
              {fmt(selectedEntry.createdAt)} {selectedEntry.mood}
            </h2>
            <p>{selectedEntry.text}</p>
            {selectedEntry.sourceId &&
              entries.find((e) => e.id === selectedEntry.sourceId) && (
                <div className="response-context">
                  In response to:{" "}
                  {entries.find((e) => e.id === selectedEntry.sourceId)?.text}
                </div>
              )}
            <div className="modal-actions">
              <button
                onClick={() => {
                  updateEntries((old) =>
                    old.map((e) =>
                      e.id === selectedEntry.id
                        ? { ...e, revisit: !e.revisit, dismissed: false }
                        : e,
                    ),
                  );
                }}
              >
                {selectedEntry.revisit
                  ? "✓ Phrug will revisit this"
                  : "Ask Phrug to revisit this"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Delete this reflection?")) {
                    updateEntries((old) =>
                      old.filter((e) => e.id !== selectedEntry.id),
                    );
                    setSelected(null);
                  }
                }}
              >
                Delete entry
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
