import { useEffect, useMemo, useState } from "react";
import { DEFAULT_ANSWERS, Answers, recommend } from "./rules";
import { GLOSSARY } from "./glossary";
import Tooltip from "./components/Tooltip";

const LS_KEY = "arch-advisor-answers-v1";

function useAnswers() {
  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? { ...DEFAULT_ANSWERS, ...JSON.parse(raw) } : DEFAULT_ANSWERS;
    } catch {
      return DEFAULT_ANSWERS;
    }
  });
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(answers));
  }, [answers]);
  return [answers, setAnswers] as const;
}

export default function Questionnaire() {
  const [a, setA] = useAnswers();
  const rec = useMemo(() => recommend(a), [a]);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setA({ ...a, [k]: v });

  return (
    <div className="grid gap-8">
      {/* Questions */}
      <section className="grid gap-6">
        <Row label="Team size">
          <Select value={a.team} onChange={(v) => set("team", v)} options={[
            ["solo","Solo"],["small","2–5 devs"],["multi","Multiple teams"]
          ]}/>
        </Row>

        <Row label={<Tooltip label="RPS now" text={GLOSSARY.RPS} />}>
          <Select value={a.rpsNow} onChange={(v)=>set("rpsNow", v)} options={[
            ["<100","< 100"],["100-1000","100–1000"],[">1000","> 1000"]
          ]}/>
        </Row>

        <Row label="RPS in ~12 months">
          <Select value={a.rpsSoon} onChange={(v)=>set("rpsSoon", v)} options={[
            ["<100","< 100"],["100-1000","100–1000"],[">1000","> 1000"]
          ]}/>
        </Row>

        <Row label="Traffic spikes/bursts?">
          <Toggle value={a.spikes} onChange={(v)=>set("spikes", v)}/>
        </Row>

        <Row label="Background work (emails, exports, jobs)">
          <Select value={a.bgWork} onChange={(v)=>set("bgWork", v)} options={[
            ["none","None"],["some","Some"],["heavy","Heavy"]
          ]}/>
        </Row>

        <Row label={<Tooltip label="Latency target (p95 / SLO)" text={`${GLOSSARY.SLO} ${GLOSSARY.p95}`} />}>
          <Select value={a.latency} onChange={(v)=>set("latency", v)} options={[
            ["<150","< 150ms"],["150-500","150–500ms"],[">500","> 500ms"]
          ]}/>
        </Row>

        <Row label={<Tooltip label="Consistency" text={GLOSSARY.Consistency} />}>
          <Select value={a.consistency} onChange={(v)=>set("consistency", v)} options={[
            ["strong","Strong"],["eventual","Eventual"]
          ]}/>
        </Row>

        <Row label={<Tooltip label="Integrations" text={GLOSSARY.Integrations} />} >
          <Number value={a.integrations} onChange={(v)=>set("integrations", v)} min={0} max={20}/>
        </Row>

        <Row label="Independent deploys needed?">
          <Toggle value={a.indepDeploys} onChange={(v)=>set("indepDeploys", v)}/>
        </Row>

        <Row label="Ops maturity">
          <Select value={a.ops} onChange={(v)=>set("ops", v)} options={[
            ["low","Low (no K8s)"],["mid","Moderate"],["high","High (K8s/obs)"]
          ]}/>
        </Row>

        <Row label="Budget">
          <Select value={a.budget} onChange={(v)=>set("budget", v)} options={[
            ["lean","Lean"],["mod","Moderate"],["managedOK","Managed OK"]
          ]}/>
        </Row>

        <Row label="Regulatory/data boundaries">
          <Select value={a.regulation} onChange={(v)=>set("regulation", v)} options={[
            ["none","None"],["light","Light"],["strict","Strict"]
          ]}/>
        </Row>
      </section>

      {/* Recommendation */}
      <section className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Recommendation</h2>
        <div className="text-slate-800">
          <div><span className="font-medium">Primary:</span> {rec.primary}</div>
          {rec.addons.length > 0 && (
            <div className="mt-2">
              <span className="font-medium">Add-ons:</span>
              <ul className="list-disc ml-6 mt-1">
                {rec.addons.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          {rec.rationale.length > 0 && (
            <div className="mt-2">
              <span className="font-medium">Why:</span>
              <ul className="list-disc ml-6 mt-1">
                {rec.rationale.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-2">
            <span className="font-medium">Starter stack:</span>
            <ul className="list-disc ml-6 mt-1">
              {rec.starterStack.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-3 grid gap-3">

          {/* Score summary */}
          <div className="text-slate-700">
            <div className="font-medium">Confidence: {(rec.confidence * 100).toFixed(0)}%</div>
            <ul className="mt-1 text-sm list-disc ml-6">
              {rec.scores.map(s => (
                <li key={s.option}>
                  <span className="font-medium">{s.option}</span>: {s.score} pts
                </li>
              ))}
            </ul>
          </div>

          {/* Why this beats alternatives */}
          {rec.scores[1] && (
            <div className="text-slate-700">
              <div className="font-medium">Why this over {rec.scores[1].option}:</div>
              <ul className="mt-1 text-sm list-disc ml-6">
                {rec.scores[0].reasons.slice(0,3).map((r,i)=><li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* Per-answer explanations */}
          <div>
            <div className="font-medium">Evidence from your answers</div>
            <ul className="mt-1 text-sm list-disc ml-6">
              {rec.explanations.map((e, i) => (
                <li key={i}>
                  <span className="font-semibold">{e.criterion}</span> = <span className="font-mono">{e.yourAnswer}</span>
                  {' — '}<span className="italic">{e.because}</span>
                  {' '}<span className="text-slate-500">({e.impact}, +{e.contribution})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trade-offs */}
          <div>
            <div className="font-medium">Trade-offs to accept</div>
            <ul className="mt-1 text-sm list-disc ml-6">
              {rec.tradeoffs.map((t,i)=><li key={i}>{t}</li>)}
            </ul>
          </div>

          {/* Tipping points */}
          <div>
            <div className="font-medium">What would change the recommendation?</div>
            <ul className="mt-1 text-sm list-disc ml-6">
              {rec.tippingPoints.map((t,i)=>(
                <li key={i}>
                  If <span className="font-mono">{t.condition}</span>, switch to <span className="font-semibold">{t.newRec}</span>. {t.why}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      

      <footer className="text-xs text-slate-500">
        Tooltips include RPS, SLO, p95, and more. Data persists to localStorage.
      </footer>
    </div>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

function Select<T extends string>({
  value, onChange, options,
}: {
  value: T; onChange: (v: T) => void; options: [T, string][];
}) {
  return (
    <select
      className="rounded-lg border bg-white px-3 py-2"
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-2 rounded-lg border ${value ? "bg-emerald-600 text-white" : "bg-white"}`}
    >
      {value ? "Yes" : "No"}
    </button>
  );
}

function Number({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const [text, setText] = useState(String(value));

  // keep local text in sync if parent changes elsewhere
  useEffect(() => setText(String(value)), [value]);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const commit = () => {
    const n = parseInt(text, 10);
    if (Number.isFinite(n)) onChange(clamp(n));
    else setText(String(value)); // revert if user leaves it empty/invalid
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="px-2 py-1 rounded border"
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Decrement"
      >
        –
      </button>

      <input
        type="text"            // text avoids the NaN/0 snap-back while typing
        inputMode="numeric"    // mobile numeric keypad
        pattern="[0-9]*"
        className="w-24 rounded-lg border bg-white px-3 py-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        aria-label="Integrations count"
      />

      <button
        type="button"
        className="px-2 py-1 rounded border"
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increment"
      >
        +
      </button>
    </div>
  );
}

