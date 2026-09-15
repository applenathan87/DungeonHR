'use strict';
/*
 * 마왕성 인사팀 · 출근부 — 기간 집계 (주 · 월)
 *
 * 데브로그 요약(server.js summarizeDay 결과)만으로 계산한다. 새 데이터는 없다.
 * 주/월 기록 보기, 금요일 회고 통계, today.md, 건강검진이 **같은 숫자**를 쓰도록 여기 한 곳에서만 계산한다.
 *
 * 입력 day = { date, day, hours, pomodoros, status, title, summary, sessions, did, memo, next }
 *   집중 시간 = 완료한 뽀모도로 수 × 집중 분(설정, 기본 50) — 서버가 센 값이라 정직하다.
 *   완료 = "한 일"의 `[완료]` 줄 (표기 없는 ver01 줄도 "한 일"이었으므로 완료로 센다), `[진행]` 줄은 제외
 *   결정 = 메모 중 `결정:`으로 시작하는 줄
 */

const pad2 = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
const utc = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const addDays = (s, n) => { const d = utc(s); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };
const round1 = (x) => Math.round(x * 10) / 10;

/** ISO 주: 월요일 시작. → { key: '2026-W38', start: 월요일, end: 일요일 } */
function isoWeek(dateStr) {
  const d = utc(dateStr);
  const dow = d.getUTCDay() || 7;                 // 월=1 … 일=7
  const monday = new Date(d); monday.setUTCDate(d.getUTCDate() - (dow - 1));
  const thu = new Date(monday); thu.setUTCDate(monday.getUTCDate() + 3); // 그 주의 목요일이 속한 해가 ISO 연도
  const year = thu.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4dow = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4); week1Monday.setUTCDate(jan4.getUTCDate() - (jan4dow - 1));
  const week = Math.round((monday - week1Monday) / (7 * 86400000)) + 1;
  const start = fmt(monday);
  return { key: `${year}-W${pad2(week)}`, start, end: addDays(start, 6) };
}

const DONE_RE = /^\[완료\]\s*(.*)$/;
const DOING_RE = /^\[진행\]\s*(.*)$/;
const DECISION_RE = /^결정\s*:\s*(.*)$/;

/** 하루 요약 → 집계용 한 줄 */
function dayRow(d, focusMinutes) {
  const did = d.did || [];
  const done = did.filter((l) => !DOING_RE.test(l)).map((l) => (DONE_RE.exec(l) || [, l])[1].trim());
  const doing = did.filter((l) => DOING_RE.test(l)).map((l) => DOING_RE.exec(l)[1].trim());
  const decisions = (d.memo || []).map((l) => DECISION_RE.exec(l)).filter(Boolean).map((m) => m[1].trim());
  const pomodoros = Number(d.pomodoros) || 0;
  return {
    date: d.date,
    dow: utc(d.date).getUTCDay(),               // 0=일 … 6=토
    day: d.day || 0,
    status: d.status || 'closed',
    summary: d.summary || '',
    hours: round1(Number(d.hours) || 0),
    pomodoros,
    focusHours: round1((pomodoros * focusMinutes) / 60),
    done, doing, decisions,
  };
}

/** 여러 날 → 합계 */
function sum(rows) {
  const hours = round1(rows.reduce((a, r) => a + r.hours, 0));
  const focusHours = round1(rows.reduce((a, r) => a + r.focusHours, 0));
  const last = rows.filter((r) => r.status === 'closed').slice(-1)[0];
  return {
    workDays: rows.length,
    hours,
    focusHours,
    focusRatio: hours > 0 ? Math.min(1, focusHours / hours) : 0,
    pomodoros: rows.reduce((a, r) => a + r.pomodoros, 0),
    done: rows.flatMap((r) => r.done),
    doing: last ? last.doing : [],               // 기간 마지막 근무일에 진행 중으로 남은 것
    decisions: rows.flatMap((r) => r.decisions),
  };
}

/**
 * days(요약 배열, 순서 무관) → { weeks: [최신순], months: [최신순] }
 * week  = { key, start, end, days: [dayRow…(날짜순)], …sum }
 * month = { key: 'YYYY-MM', start, end, weeks: [그달에 걸친 주 — 그달 날짜만 합산, 오래된 순], days, …sum }
 */
function aggregate(days, focusMinutes = 50) {
  const rows = (days || []).map((d) => dayRow(d, focusMinutes)).sort((a, b) => (a.date < b.date ? -1 : 1));
  const weekMap = new Map();
  for (const r of rows) {
    const w = isoWeek(r.date);
    if (!weekMap.has(w.key)) weekMap.set(w.key, { ...w, days: [] });
    weekMap.get(w.key).days.push(r);
  }
  const weeks = [...weekMap.values()].map((w) => ({ ...w, ...sum(w.days) })).sort((a, b) => (a.key < b.key ? 1 : -1));

  const monthMap = new Map();
  for (const r of rows) {
    const key = r.date.slice(0, 7);
    if (!monthMap.has(key)) monthMap.set(key, { key, start: `${key}-01`, end: fmt(new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0))), days: [] });
    monthMap.get(key).days.push(r);
  }
  const months = [...monthMap.values()].map((m) => {
    const inMonth = new Map();
    for (const r of m.days) {
      const w = isoWeek(r.date);
      if (!inMonth.has(w.key)) inMonth.set(w.key, { ...w, days: [] });
      inMonth.get(w.key).days.push(r);
    }
    const wk = [...inMonth.values()].map((w) => ({ ...w, ...sum(w.days) })).sort((a, b) => (a.key < b.key ? -1 : 1));
    return { ...m, weeks: wk, ...sum(m.days) };
  }).sort((a, b) => (a.key < b.key ? 1 : -1));

  return { weeks, months };
}

module.exports = { isoWeek, aggregate, dayRow, sum };
