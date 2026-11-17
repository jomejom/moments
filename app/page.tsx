"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookHeart,
  CalendarDays,
  Check,
  Heart,
  Leaf,
  MessageCircle,
  RotateCcw,
  Sparkles,
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
  const s = e.text.toLowerCase();
  if (/presentation|interview|exam|deadline|test/.test(s))
    return "You mentioned something important coming up. How has that been going?";
  if (/friend|family|relationship|conversation/.test(s))
    return "You had something on your mind about a relationship. Has anything changed since then?";
  if (/dance|practice|exercise|walk|gym/.test(s))
    return "You mentioned an activity that stood out to you. What did it give you that day?";
  if (/worr|scared|anxious|stress|overwhelm/.test(s))
    return "You wrote about something that felt difficult. Does it feel any different today?";
  if (/happy|grateful|proud|excited/.test(s))
    return "You shared a positive moment. What would you like to remember about it?";
  return "Last time you shared something meaningful. Is there anything you’d like to add or revisit?";
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
    <div
      className={`frog ${small ? "frog-small" : ""}`}
      aria-label="Phrug the friendly frog"
      role="img"
    >
      <span className="eye left" />
      <span className="eye right" />
      <span className="cheek c-left" />
      <span className="cheek c-right" />
      <span className="smile" />
    </div>
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
    window.setTimeout(() => setSaved(false), 3500);
  };
  const startFollow = () => {
    if (!follow) return;
    if (
      text.trim() &&
      !window.confirm(
        "Replace your unfinished draft with a response to this reflection?",
      )
    )
      return;
    setText("");
    setFollowSource(follow.id);
    setTab("today");
    window.setTimeout(() => document.getElementById("reflection")?.focus(), 80);
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
    updateEntries((old) => [
      ...demo.filter((d) => !old.some((e) => e.id === d.id)),
      ...old,
    ]);
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
              <span className="brand-caption">a little space to feel</span>
            </div>
          </div>
          <div className="header-note">
            <Leaf size={15} /> made for slow moments
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
          <main id="main-content" tabIndex={-1} className="main-layout">
            <section className="main-column">
              <div className="welcome">
                <span className="eyebrow">
                  <span className="tiny-star">✳</span> YOUR LITTLE CORNER OF THE
                  INTERNET
                </span>
                <h1>
                  Hey, you. <span>How are you feeling?</span>
                </h1>
                <p>
                  You don't need to have the right words. Just start somewhere,
                  and we'll figure it out together.
                </p>
              </div>
              <article className="reflection card">
                <div className="card-heading">
                  <span className="icon-box">
                    <MessageCircle size={19} />
                  </span>
                  <div>
                    <h2>A moment for yourself</h2>
                    <p>Anything counts. Even a sentence.</p>
                  </div>
                </div>
                <div className="mood-label">
                  How's your heart today? <span>(optional)</span>
                </div>
                <div className="moods" role="group" aria-label="Choose a mood">
                  {moods.map((m, i) => (
                    <button
                      aria-label={moodNames[i]}
                      aria-pressed={mood === m}
                      className={mood === m ? "selected" : ""}
                      onClick={() => setMood(mood === m ? "" : m)}
                      key={m}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="divider" />
                <label htmlFor="reflection" className="prompt-title">
                  What's on your mind?
                </label>
                <div className="starters">
                  {starters.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setText((prev) => (prev ? `${prev}\n${s} ` : `${s} `));
                        document.getElementById("reflection")?.focus();
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {followSource && (
                  <div className="follow-active">
                    Continuing a previous reflection: “
                    {entries.find((e) => e.id === followSource)
                      ? followUp(entries.find((e) => e.id === followSource)!)
                      : "Add your response"}
                    ”{" "}
                    <button
                      onClick={() => setFollowSource(undefined)}
                      aria-label="Remove follow-up"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <textarea
                  id="reflection"
                  placeholder="There's no perfect way to begin. Write whatever comes to mind…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                />
                <div className="journal-footer">
                  <label className="revisit">
                    <input
                      type="checkbox"
                      checked={revisit}
                      onChange={(e) => setRevisit(e.target.checked)}
                    />
                    <span>Let Phrug ask me about this later</span>
                  </label>
                  <button
                    className="primary"
                    disabled={!text.trim()}
                    onClick={save}
                  >
                    {saved ? (
                      <>
                        <Check size={17} /> Saved
                      </>
                    ) : (
                      <>
                        Save my moment <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
                {saved && (
                  <div role="status" className="success">
                    Your reflection is saved in this browser. No streaks, no
                    pressure. ♡
                  </div>
                )}
              </article>
            </section>
            <aside className="side-column">
              <div className="phrug-card">
                <div className="phrug-glow" />
                <div className="phrug-top">
                  <Frog />
                  <span className="phrug-hello">
                    hi, i'm phrug! <span>✳</span>
                  </span>
                </div>
                <h3>A gentle nudge, from me to you</h3>
                {follow ? (
                  <>
                    <p className="phrug-question">“{followUp(follow)}”</p>
                    <p className="phrug-source">
                      Remembering your reflection from {fmt(follow.createdAt)}
                    </p>
                    <div className="phrug-buttons">
                      <button className="phrug-respond" onClick={startFollow}>
                        Reflect on this <ArrowRight size={16} />
                      </button>
                      <button
                        disabled={candidates.length < 2}
                        className="phrug-other"
                        onClick={() => setPromptIndex((i) => i + 1)}
                      >
                        Another <RotateCcw size={14} />
                      </button>
                    </div>
                    <button className="dismiss" onClick={discardFollow}>
                      Don't bring this up again
                    </button>
                  </>
                ) : (
                  <>
                    <p className="phrug-question">
                      “Whenever you're ready, write a little something. I'll
                      remember what matters to you.”
                    </p>
                    <p className="phrug-source">
                      Your next visit can pick up where you left off.
                    </p>
                  </>
                )}
              </div>
              <div className="gentle-card">
                <div className="gentle-heading">
                  <Sparkles size={18} /> <b>A note on showing up</b>
                </div>
                <p>
                  No streaks to maintain. No days to make up. Every time you
                  return is enough.
                </p>
              </div>
              {entries.length === 0 && (
                <button className="demo-btn" onClick={addDemo}>
                  Try two fictional demo entries <ArrowRight size={14} />
                </button>
              )}
            </aside>
          </main>
        ) : (
          <main id="main-content" tabIndex={-1} className="memories">
            <div className="welcome">
              <span className="eyebrow">
                <span className="tiny-star">✳</span> YOUR COLLECTION OF LITTLE
                MOMENTS
              </span>
              <h1>
                Look how far <span>you've wandered.</span>
              </h1>
              <p>
                Every reflection belongs here, even the small and messy ones.
              </p>
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
                <h3>Your memories will live here.</h3>
                <p>
                  When you save a reflection, it'll find a home in this little
                  collection.
                </p>
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
        <footer>
          made with care, for the little moments <span>✳</span>{" "}
          <span className="footer-right">Moment · prototype v0.1</span>
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
            <span className="eyebrow">A MOMENT FROM YOUR PAST</span>
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
