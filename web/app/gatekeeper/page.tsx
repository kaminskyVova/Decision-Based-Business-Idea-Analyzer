'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { runGatekeeper } from '../../src/core/gatekeeper/gatekeeper';
import { buildClarificationQuestions } from '../../src/core/clarification/clarification';
import type { GatekeeperInput } from '../../src/core/gatekeeper/types';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(0,0,0,0.18)',
  color: 'inherit',
  outline: 'none',
};

const taStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' };

export default function GatekeeperPage() {
  const [form, setForm] = useState<GatekeeperInput>({
    problem: '',
    goal: '',
    region: '',
    capital: '',
    time_horizon: '',
    responsibility_confirmed: false,
    production_related: false,
    notes: '',
  });

  const result = useMemo(() => runGatekeeper(form), [form]);

  const questions = useMemo(() => {
    return result.decision === 'RETURN_WITH_CONDITIONS'
      ? buildClarificationQuestions(result)
      : [];
  }, [result]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((p) => ({ ...p, [name]: checked } as GatekeeperInput));
      return;
    }

    setForm((p) => ({ ...p, [name]: value } as GatekeeperInput));
  }

  const badge =
    result.decision === 'ADMITTED'
      ? { text: 'ADMITTED', bg: '#15803d' }
      : result.decision === 'HARD_FAIL'
      ? { text: 'HARD_FAIL', bg: '#b91c1c' }
      : { text: 'RETURN_WITH_CONDITIONS', bg: '#ca8a04' };

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Gatekeeper</h1>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            color: 'white',
            fontSize: 12,
            background: badge.bg,
          }}
        >
          {badge.text}
        </span>
        <span style={{ fontSize: 12, opacity: 0.75 }}>stage: {result.stage}</span>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
        <Link href="/">Home</Link>
        <Link href="/analysis">Analysis</Link>
        <Link href="/plan">Plan</Link>
      </div>

      <section style={{ marginTop: 18, maxWidth: 860 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Problem</div>
            <textarea
              name="problem"
              value={String(form.problem ?? '')}
              onChange={handleChange}
              placeholder="Что не работает, где потери, 1–2 примера..."
              rows={3}
              style={taStyle}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Goal</div>
            <textarea
              name="goal"
              value={String(form.goal ?? '')}
              onChange={handleChange}
              placeholder="Метрика + срок. Например: 'выйти на 50 заказов/мес за 90 дней'..."
              rows={2}
              style={taStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Region</div>
              <input
                name="region"
                value={String(form.region ?? '')}
                onChange={handleChange}
                placeholder="Россия Крым / Norway Oslo"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Capital</div>
              <input
                name="capital"
                value={String(form.capital ?? '')}
                onChange={handleChange}
                placeholder="100000 / до 200000 / 100k"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>Time horizon</div>
            <input
              name="time_horizon"
              value={String(form.time_horizon ?? '')}
              onChange={handleChange}
              placeholder="2 недели / 1 месяц / 6 месяцев"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 6 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                name="responsibility_confirmed"
                checked={Boolean(form.responsibility_confirmed)}
                onChange={handleChange}
              />
              <span>Подтверждаю ответственность</span>
            </label>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                name="production_related"
                checked={Boolean(form.production_related)}
                onChange={handleChange}
              />
              <span>Production related</span>
            </label>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 18, maxWidth: 860 }}>
        {result.missing_fields?.length ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Missing fields</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {result.missing_fields.map((f) => (
                <li key={String(f)}>{String(f)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {questions.length ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Clarification questions</div>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
              {questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <details>
          <summary style={{ cursor: 'pointer', opacity: 0.85 }}>Raw result (debug)</summary>
          <pre
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </section>
    </main>
  );
}