"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { whatsappUrl } from "@/lib/config";
import { pixel, trackRelief } from "@/lib/relief-track";

// ===== Edit prices here =====
const PRICES = { relief: 380, reliefOriginal: 500, complete: 499 } as const;
// ============================

const R = (n: number) => `R${n}`;

// Colors of the approved chat design (teal + navy). Scoped to this page only: they override the
// store tokens (ink, line, muted, surface) for everything inside the chat, so the rest of the store is untouched.
const RELIEF_THEME = {
  "--color-ink": "#0a7f8c",
  "--color-line": "#e2e8e9",
  "--color-muted": "#687782",
  "--color-surface": "#f1f5f6",
  color: "#0d1b2a",
} as CSSProperties;

type Msg = { id: number; from: "bot" | "me"; kind: "text" | "typing" | "image" | "card"; text?: string; complete?: boolean };
type Panel =
  | { type: "none" }
  | { type: "choices"; options: string[]; pick: (v: string) => void }
  | { type: "name"; submit: (v: string) => void }
  | { type: "final"; complete: boolean };
type Answers = { name: string; area: string; duration: string; frequency: string; goal: string; previous: string };

const EMPTY: Answers = { name: "", area: "", duration: "", frequency: "", goal: "", previous: "" };

class Cancelled extends Error {}

const AREAS = ["Lower back", "Knees", "Neck and shoulders", "Joints, hands or feet", "Muscles after work or exercise"];
const DURATIONS = ["Less than 2 weeks", "1 to 3 months", "More than 3 months", "On and off for years"];
const FREQUENCIES = ["Now and then", "Most days", "Every day"];
const GOALS = ["Sleeping through the night", "Working and standing comfortably", "Walking and climbing stairs", "Playing with my kids or exercising"];
const PREVIOUS = ["Painkiller pills", "Pharmacy creams", "Nothing yet", "A bit of everything"];

const REACT_AREA: Record<string, string> = {
  "Lower back": "Lower back pain is hard, it gets in the way of almost everything.",
  "Knees": "Knee pain makes every step feel like a decision.",
  "Neck and shoulders": "Neck and shoulder pain follows you around all day.",
  "Joints, hands or feet": "Pain in the joints makes simple things harder than they should be.",
  "Muscles after work or exercise": "Sore muscles can really slow you down.",
};
const REACT_TIME: Record<string, string> = {
  "Less than 2 weeks": "Good that you're dealing with it early.",
  "1 to 3 months": "A few months is a long time to put up with it.",
  "More than 3 months": "That's a long time to live with it. I'm sorry.",
  "On and off for years": "Years of it coming and going is exhausting.",
};

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const readTime = (t: string) => Math.min(5000, Math.max(3000, 1800 + t.length * 22));

function isChronic(a: Answers) {
  return a.duration === "More than 3 months" || a.duration === "On and off for years" || a.frequency === "Every day";
}

function waHref(a: Answers, complete: boolean) {
  const offer = complete
    ? `Complete Relief Plan, gel and tablets (${R(PRICES.complete)})`
    : `Relief Plan, gel (${R(PRICES.relief)})`;
  const msg =
    `Hi! I'd like to start my relief plan: ${offer}.\n` +
    `Name: ${a.name}\nPain area: ${a.area}\nHow long: ${a.duration}\nHow often: ${a.frequency}\nGoal: ${a.goal}\n\n` +
    `Please send me the payment details and I'll send my delivery address.`;
  return whatsappUrl(msg) ?? "#";
}

function PlanCard({ complete }: { complete: boolean }) {
  return (
    <div className="w-full max-w-[84%] rounded-2xl rounded-bl-sm border border-line bg-white p-4">
      <p className="text-[13px] font-semibold text-muted">What I&apos;d suggest</p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight">{complete ? "Complete Relief Plan" : "Relief Plan"}</h3>
      <div className="mb-1 mt-2 flex items-baseline gap-2.5">
        <span className="text-4xl font-semibold tracking-tight">{R(complete ? PRICES.complete : PRICES.relief)}</span>
        {!complete && <s className="text-muted">{R(PRICES.reliefOriginal)}</s>}
      </div>
      <p className="mb-2 text-[13px] text-muted">Free delivery · Pay by EFT or card · Cash on delivery unavailable</p>
      <div className="border-t border-line py-2.5 text-[15px]">
        <strong className="block font-semibold">1. Relief where it hurts</strong>
        <span className="text-muted">Apply the gel straight onto the area. It soothes muscle pain and stiffness, helps reduce the look of bruises and absorbs fast.</span>
      </div>
      {complete && (
        <div className="border-t border-line pt-2.5 text-[15px]">
          <strong className="block font-semibold">2. Support from within</strong>
          <span className="text-muted">Tablets to support you from the inside as well.</span>
        </div>
      )}
    </div>
  );
}

export default function ReliefChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [nameDraft, setNameDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const idRef = useRef(0);
  const answers = useRef<Answers>({ ...EMPTY });

  const toEnd = useCallback(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  useEffect(toEnd, [msgs, panel, toEnd]);

  const sleep = useCallback(
    (ms: number, token: number) =>
      new Promise<void>((res, rej) => setTimeout(() => (runRef.current === token ? res() : rej(new Cancelled())), ms)),
    [],
  );
  const push = useCallback((m: Omit<Msg, "id">) => {
    const id = ++idRef.current;
    setMsgs((p) => [...p, { ...m, id }]);
    return id;
  }, []);
  const drop = useCallback((id: number) => setMsgs((p) => p.filter((x) => x.id !== id)), []);

  const say = useCallback(
    async (text: string, token: number, hold = 200) => {
      const t = push({ from: "bot", kind: "typing" });
      await sleep(Math.min(1500, 550 + text.length * 14), token);
      drop(t);
      push({ from: "bot", kind: "text", text });
      await sleep(hold, token);
    },
    [push, drop, sleep],
  );
  const show = useCallback(
    async (kind: "image" | "card", token: number, delay: number, hold: number, complete = false) => {
      const t = push({ from: "bot", kind: "typing" });
      await sleep(delay, token);
      drop(t);
      push({ from: "bot", kind, complete });
      await sleep(hold, token);
    },
    [push, drop, sleep],
  );
  const choose = useCallback(
    (options: string[], token: number) =>
      new Promise<string>((res, rej) => {
        if (runRef.current !== token) return rej(new Cancelled());
        setPanel({
          type: "choices",
          options,
          pick: (v) => {
            setPanel({ type: "none" });
            push({ from: "me", kind: "text", text: v });
            res(v);
          },
        });
      }),
    [push],
  );
  const askName = useCallback(
    (token: number) =>
      new Promise<string>((res, rej) => {
        if (runRef.current !== token) return rej(new Cancelled());
        setNameDraft("");
        setPanel({
          type: "name",
          submit: (v) => {
            setPanel({ type: "none" });
            push({ from: "me", kind: "text", text: v });
            res(v);
          },
        });
      }),
    [push],
  );

  const run = useCallback(async () => {
    const token = ++runRef.current;
    setMsgs([]);
    setPanel({ type: "none" });
    const a: Answers = { ...EMPTY };
    answers.current = a;
    try {
      await say("Hi, welcome to Pain relief support.", token);
      await say("I'll ask you a few quick questions about your pain, then tell you what I'd suggest. It takes about 30 seconds.", token);
      await say("First, what's your first name?", token);
      a.name = await askName(token);
      trackRelief("relief_started");
      await say(`Nice to meet you, ${a.name}.`, token);

      await say(`So, ${a.name}, where does it hurt?`, token);
      a.area = await choose(AREAS, token);
      await say(REACT_AREA[a.area], token);

      await say("How long has it been going on?", token);
      a.duration = await choose(DURATIONS, token);
      await say(REACT_TIME[a.duration], token);

      await say("And how often does it come back?", token);
      a.frequency = await choose(FREQUENCIES, token);

      await say("What would you like to get back to doing?", token);
      a.goal = await choose(GOALS, token);
      await say("That's what I'll build your plan around.", token);

      await say("Last one. What have you used so far?", token);
      a.previous = await choose(PREVIOUS, token);
      await say(`Okay, thank you, ${a.name}. That helps.`, token);

      await say(`That's everything, ${a.name}. Give me a moment to put it together.`, token, 1500);
      const s1 = `Here is what I have: pain in your ${a.area.toLowerCase()}, ${a.duration.toLowerCase()}, coming back ${a.frequency.toLowerCase()}. You want to get back to ${lowerFirst(a.goal)}.`;
      await say(s1, token, readTime(s1));

      const s2 = "Based on that, I'd start with relief right where it hurts:";
      await say(s2, token, readTime(s2));
      await say("The heart of your plan is Go-Pain Arnica Gel, 100g.", token, 2500);
      await show("image", token, 900, 3500);
      const p1 = "It's an arnica gel made for muscular aches, sprains and strains, and for the tightness and spasms that come with exercise. It also helps reduce swelling and bruising.";
      await say(p1, token, readTime(p1));
      const p2 = "You rub it straight onto the spot that hurts and it absorbs fast, so you can get on with your day.";
      await say(p2, token, readTime(p2));
      trackRelief(
        "relief_plan_shown",
        { area: a.area, duration: a.duration, frequency: a.frequency, goal: a.goal, previous: a.previous, chronic: isChronic(a) },
        `${a.area} · ${a.duration} · ${a.frequency}`,
      );
      pixel("Lead");
      await show("card", token, 1100, 5000, false);
      const p3 = `That is ${R(PRICES.reliefOriginal - PRICES.relief)} off the usual price of ${R(PRICES.reliefOriginal)}.`;
      await say(p3, token, readTime(p3));

      const u1 = isChronic(a)
        ? "Because yours has been with you a while, there is one more option to consider. The Gel + Tablets combo is for people who want support from the outside and the inside."
        : "If you'd also like support from the inside, there is the Gel + Tablets combo.";
      await say(u1, token, readTime(u1));
      const u2 = `It's ${R(PRICES.complete)} in total, just ${R(PRICES.complete - PRICES.relief)} more than the gel alone. Would you like to add the tablets?`;
      await say(u2, token, readTime(u2));
      const pick = await choose([`Yes, add the tablets (${R(PRICES.complete)} total)`, `No, just the gel (${R(PRICES.relief)})`], token);
      const complete = pick.startsWith("Yes");
      trackRelief("relief_upsell", { accepted: complete, price: complete ? PRICES.complete : PRICES.relief }, complete ? "Added tablets (combo)" : "Gel only");
      if (complete) await say(`Good choice. Your plan is now the Gel + Tablets combo for ${R(PRICES.complete)}, with free delivery.`, token, 3000);
      else await say("No problem, we'll keep it simple with the gel.", token, 2200);

      const s3 = "Delivery is free and goes out from Mpumalanga, same day or next day.";
      await say(s3, token, readTime(s3));
      const s4 = "To order, tap the button below and we continue on WhatsApp. We confirm your plan and you send your full name, province, city, street address and postal code.";
      await say(s4, token, readTime(s4));
      const s5 = "You pay by EFT or card. Cash on delivery is unavailable. Once the payment reflects, your order goes out.";
      await say(s5, token, readTime(s5));
      setPanel({ type: "final", complete });
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    }
  }, [say, show, choose, askName]);

  useEffect(() => {
    run();
    return () => {
      runRef.current++;
    };
  }, [run]);

  const onWhatsApp = (complete: boolean) => {
    const a = answers.current;
    const price = complete ? PRICES.complete : PRICES.relief;
    trackRelief(
      "relief_whatsapp_click",
      { plan: complete ? "complete" : "relief", price, area: a.area, duration: a.duration, frequency: a.frequency },
      `${complete ? "Complete Relief Plan" : "Relief Plan"} ${R(price)} · ${a.area}`,
    );
    pixel("InitiateCheckout", { value: price, currency: "ZAR" });
  };

  const swap = async (complete: boolean) => {
    const token = runRef.current;
    trackRelief("relief_upsell", { accepted: complete, price: complete ? PRICES.complete : PRICES.relief, changed_after_summary: true }, complete ? "Switched to combo" : "Switched to gel only");
    setPanel({ type: "none" });
    push({
      from: "me",
      kind: "text",
      text: complete ? `Add support from within (${R(PRICES.complete)})` : `I only want the relief for the area (${R(PRICES.relief)})`,
    });
    try {
      await say(complete ? "Of course. Here is the version with support from within as well." : "No problem. Here is the version with the gel only.", token);
      await show("card", token, 900, 4000, complete);
      setPanel({ type: "final", complete });
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    }
  };

  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col bg-white" style={RELIEF_THEME}>
      <header className="flex items-center gap-3 border-b border-line px-5 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))]">
        <div aria-hidden className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ink text-lg font-semibold text-white">P</div>
        <b className="text-[17px] font-semibold tracking-tight">Pain relief support</b>
      </header>

      <div ref={logRef} className="flex-1 overflow-y-auto scroll-smooth px-5 pb-2 pt-5" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`card-in mb-2.5 flex ${m.from === "me" ? "justify-end" : ""}`}>
            {m.kind === "typing" && (
              <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-surface px-4 py-3.5" aria-label="Typing">
                {[0, 1, 2].map((i) => (
                  <i key={i} className="h-[7px] w-[7px] animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
            {m.kind === "text" && (
              <div className={`max-w-[84%] whitespace-pre-line px-4 py-2.5 text-[16px] leading-snug ${m.from === "me" ? "rounded-2xl rounded-br-sm bg-ink font-medium text-white" : "rounded-2xl rounded-bl-sm bg-surface"}`}>
                {m.text}
              </div>
            )}
            {m.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/go-pain-gel.jpg" alt="Go-Pain Arnica Gel 100g tube" width={520} height={1151} onLoad={toEnd} className="h-auto w-[56%] max-w-[230px] rounded-2xl rounded-bl-sm border border-line bg-white" />
            )}
            {m.kind === "card" && <PlanCard complete={!!m.complete} />}
          </div>
        ))}
      </div>

      {panel.type !== "none" && (
        <div className="max-h-[48dvh] overflow-y-auto border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {panel.type === "choices" &&
            panel.options.map((o) => (
              <button key={o} type="button" onClick={() => panel.pick(o)} className="btn btn-outline mb-2 h-auto min-h-[3rem] w-full justify-start py-3 text-left">
                {o}
              </button>
            ))}

          {panel.type === "name" && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = nameDraft.trim();
                if (v) panel.submit(v);
              }}
            >
              <input autoFocus className="field flex-1" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Your first name" autoComplete="given-name" maxLength={40} aria-label="Your first name" />
              <button type="submit" className="btn btn-primary w-12 px-0" aria-label="Send">→</button>
            </form>
          )}

          {panel.type === "final" && (
            <>
              <a href={waHref(answers.current, panel.complete)} target="_blank" rel="noopener noreferrer" onClick={() => onWhatsApp(panel.complete)} className="btn btn-primary mb-1.5 w-full justify-between">
                <span>Continue on WhatsApp</span>
                <span aria-hidden>→</span>
              </a>
              <button type="button" onClick={() => swap(!panel.complete)} className="block min-h-11 w-full text-center text-sm text-muted underline underline-offset-4">
                {panel.complete ? `I only want the relief for the area (${R(PRICES.relief)})` : `Add support from within (${R(PRICES.complete)})`}
              </button>
              <button type="button" onClick={() => run()} className="block min-h-11 w-full text-center text-sm text-muted underline underline-offset-4">
                Start again
              </button>
              <p className="px-2 pt-1 text-center text-xs text-muted">For external use. If your pain is severe or came on suddenly, please see a doctor.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
