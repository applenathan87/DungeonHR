#!/usr/bin/env node
'use strict';
/*
 * 마왕성 인사팀 · 출근부 — 로컬 서버
 *
 * 의존성 0: Node 내장 모듈(http, fs, path, child_process)만 사용한다. npm install 불필요.
 * 역할: ① public/ 의 화면을 브라우저에 보내고 ② production/desk/ 의 md 파일을 읽고 쓴다.
 *
 * 실행: node tools/desk/server.js [--no-open] [--no-git]
 *   --no-open : 브라우저를 자동으로 열지 않음
 *   --no-git  : 퇴근 시 git 커밋/푸시를 건너뜀 (테스트용)
 * 환경변수 DESK_DATA_DIR : 데이터 폴더를 바꿈 (테스트용)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const todoMd = require('./todo'); // todo.md 파서/직렬화 (모르는 줄은 보존)

// ───────────────────────── 파일 읽기/쓰기 도우미 ─────────────────────────
/** UTF-8 로 읽되, 메모장 등이 붙이는 BOM(맨 앞 보이지 않는 글자)은 뗀다 — 안 떼면 frontmatter 판정이 깨진다 */
const readText = (file) => fs.readFileSync(file, 'utf8').replace(/^﻿/, '');

/** 임시 파일에 다 쓴 뒤 이름을 바꿔 끼운다 — 쓰는 도중 꺼져도 원본이 반쪽 파일로 남지 않는다 */
function writeFileAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text, 'utf8');
  try {
    fs.renameSync(tmp, file);
  } catch (e) {
    // 다른 프로그램이 파일을 잠근 경우(드묾) — 예전 방식으로라도 저장한다
    console.warn('[desk] atomic 저장 실패, 직접 덮어씀:', e.message);
    fs.writeFileSync(file, text, 'utf8');
    try { fs.unlinkSync(tmp); } catch {}
  }
}

// ───────────────────────── 설정 ─────────────────────────
const ROOT = __dirname; // tools/desk
const CONFIG_PATH = process.env.DESK_CONFIG ? path.resolve(process.env.DESK_CONFIG) : path.join(ROOT, 'desk.config.json'); // DESK_CONFIG 는 테스트용
const DEFAULTS = {
  port: 4123,
  dataDir: '../../production/desk',
  seasonStart: '2026-09-09',
  heatStart: null, // 히트맵 시작 달 (YYYY-MM-DD). 비우면 seasonStart 가 속한 달의 1일
  autoPush: true,
  heatLevels: [1, 2, 4, 6], // 색 단계 경계(시간). 경계 개수 + 1 = 단계 수
  maxPick: 3,
  pomodoro: { focus: 50, break: 10 }, // 뽀모도로 집중/휴식 (분)
};

function loadConfig() {
  try {
    return Object.assign({}, DEFAULTS, JSON.parse(readText(CONFIG_PATH)));
  } catch (e) {
    console.warn('[desk] desk.config.json 을 읽지 못해 기본값을 씁니다:', e.message);
    return Object.assign({}, DEFAULTS);
  }
}

const config = loadConfig();
const DATA_DIR = process.env.DESK_DATA_DIR
  ? path.resolve(process.env.DESK_DATA_DIR)
  : path.resolve(ROOT, config.dataDir);
const DEVLOG_DIR = path.join(DATA_DIR, 'devlog');
const TODO_PATH = path.join(DATA_DIR, 'todo.md');
const PUBLIC_DIR = path.join(ROOT, 'public');
const NO_OPEN = process.argv.includes('--no-open');
const NO_GIT = process.argv.includes('--no-git') || process.env.DESK_NO_GIT === '1';

// --log <파일>: 콘솔 출력을 파일에도 남긴다 (창 없이 실행할 때 사용). 여러 프로세스가 같이 써도 안전하게 appendFileSync 로.
const LOG_FILE = (() => {
  const i = process.argv.indexOf('--log');
  return i >= 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : null;
})();
if (LOG_FILE) {
  for (const level of ['log', 'warn', 'error']) {
    const orig = console[level].bind(console);
    console[level] = (...args) => {
      orig(...args);
      try { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${args.map(String).join(' ')}\n`); } catch {}
    };
  }
}

// ───────────────────────── 날짜/시간 ─────────────────────────
const pad2 = (n) => String(n).padStart(2, '0');
const todayStr = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const timeStr = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

function minutesOf(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** "HH:MM-HH:MM" 세션 문자열의 길이(분). 열린 세션("HH:MM-")은 0. 자정을 넘기면 24시간을 더한다. */
function sessionMinutes(s) {
  const [a, b] = s.split('-');
  if (!b) return 0;
  let d = minutesOf(b) - minutesOf(a);
  if (d < 0) d += 24 * 60;
  return d;
}

const computeHours = (sessions) =>
  Math.round((sessions.reduce((acc, s) => acc + sessionMinutes(s), 0) / 60) * 10) / 10;

const uniq = (arr) => [...new Set(arr.map((x) => String(x).trim()).filter(Boolean))];
/** 폼 칸(여러 줄 문자열) 또는 배열 → 줄 배열 */
const asLines = (v) => (Array.isArray(v) ? v : String(v || '').split(/\r?\n/));

// ───────────────────────── frontmatter (YAML 부분집합) ─────────────────────────
// 지원 형식: `key: 값`, `key: []`, 그리고
// key:
//   - 항목
// 문자열은 JSON 따옴표로 저장/해석해서 특수문자 걱정을 없앤다.

function serializeValue(v) {
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s) || /^[a-z]+$/.test(s)) return s; // 날짜·status 같은 단순값은 따옴표 없이
  return JSON.stringify(s);
}

function serializeFrontmatter(fm) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      if (v.length === 0) lines.push(`${k}: []`);
      else {
        lines.push(`${k}:`);
        v.forEach((item) => lines.push(`  - ${serializeValue(item)}`));
      }
    } else lines.push(`${k}: ${serializeValue(v)}`);
  }
  lines.push('---');
  return lines.join('\n');
}

function parseValue(raw) {
  const s = raw.trim();
  if (s === '') return '';
  if (s === '[]') return [];
  if (s.startsWith('"')) {
    try { return JSON.parse(s); } catch { return s; }
  }
  if (s.startsWith('[')) {
    try { return JSON.parse(s); } catch { return s.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean); }
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s === 'true') return true;
  if (s === 'false') return false;
  return s;
}

/** md 텍스트 → { fm: frontmatter 객체, body: 본문 } */
function parseDoc(text) {
  if (!text.startsWith('---')) return { fm: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, body: text };
  const fmText = text.slice(3, end).replace(/^\r?\n/, '');
  const body = text.slice(end + 4).replace(/^\r?\n/, '');
  const fm = {};
  let listKey = null;
  for (const rawLine of fmText.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const li = line.match(/^\s+-\s*(.*)$/);
    if (li && listKey) { fm[listKey].push(parseValue(li[1])); continue; }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, val] = kv;
    if (val.trim() === '') { fm[key] = []; listKey = key; }
    else { fm[key] = parseValue(val); listKey = null; }
  }
  return { fm, body };
}

// ───────────────────────── 본문 섹션 ─────────────────────────
const SECTIONS = ['한 일', '배운 것', '막힌 것', '다음에 할 것'];

/** 본문 → [{ name, lines }] (name=null 은 첫 헤더 앞 텍스트) */
function parseSections(body) {
  const out = [];
  let cur = { name: null, lines: [] };
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { out.push(cur); cur = { name: h[1], lines: [] }; continue; }
    cur.lines.push(line);
  }
  out.push(cur);
  return out;
}

const bulletsOf = (section) =>
  section
    ? section.lines.map((l) => l.match(/^\s*[-*]\s+(.*)$/)).filter(Boolean).map((m) => m[1].trim()).filter(Boolean)
    : [];

/** 폼 입력(줄 배열) → 4단 본문. 모르는 섹션은 뒤에 그대로 보존한다. */
function buildBody(fields, existingBody) {
  const map = { '한 일': fields.did, '배운 것': fields.learned, '막힌 것': fields.blocked, '다음에 할 것': fields.next };
  const existing = existingBody ? parseSections(existingBody) : [];
  const parts = [];
  for (const name of SECTIONS) {
    const lines = (map[name] || [])
      .map((l) => String(l).trim())
      .filter(Boolean)
      .map((l) => (/^[-*]\s/.test(l) ? l : `- ${l}`));
    parts.push(`## ${name}\n${lines.join('\n')}`.trimEnd());
  }
  for (const s of existing) {
    if (s.name && !SECTIONS.includes(s.name)) parts.push(`## ${s.name}\n${s.lines.join('\n').trim()}`);
  }
  return parts.join('\n\n') + '\n';
}

// ───────────────────────── 데브로그 파일 (하루 한 파일) ─────────────────────────
const dayPath = (date) => path.join(DEVLOG_DIR, `${date}.md`);

function readDay(date) {
  const p = dayPath(date);
  if (!fs.existsSync(p)) return null;
  const { fm, body } = parseDoc(readText(p));
  return { date, fm, body };
}

function writeDay(day) {
  writeFileAtomic(dayPath(day.date), serializeFrontmatter(day.fm) + '\n\n' + day.body);
}

function listDays() {
  if (!fs.existsSync(DEVLOG_DIR)) return [];
  return fs
    .readdirSync(DEVLOG_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .map((f) => readDay(f.slice(0, -3)))
    .filter(Boolean);
}

const isOpenSession = (s) => typeof s === 'string' && s.endsWith('-');
const openSessionOf = (day) => (day.fm.sessions || []).find(isOpenSession) || null;
/** 근무 중(열린 세션)이거나 부재 중이면 "활성" — 아직 퇴근하지 않은 날 */
const isActiveDay = (day) => !!openSessionOf(day) || day.fm.status === 'away';
/** 닫힌 세션들의 합(분). 부재로 나뉜 세션 사이의 빈 시간은 자연히 빠진다 */
const closedMinutes = (sessions) => (sessions || []).reduce((acc, s) => acc + sessionMinutes(s), 0);

/** 활성인 날(자정을 넘긴 경우 어제일 수 있음) */
function findActiveDay() {
  const days = listDays();
  for (let i = days.length - 1; i >= 0; i--) if (isActiveDay(days[i])) return days[i];
  return null;
}

/** Day 번호 = 시즌 시작일 이후 작업한 날 수 + 1 */
function nextDayNumber(date) {
  const n = listDays().filter((d) => d.date >= config.seasonStart && d.date < date).length;
  return n + 1;
}

/** "Day 3 — 요약" → "요약". 아직 요약이 없는 "Day 3" 만 있으면 빈 문자열. */
const stripDayPrefix = (title) => String(title || '').replace(/^Day\s*\d+\s*([—–-]\s*)?/, '');

/** API 로 내보낼 요약 (히트맵 툴팁·목록·통계용) */
function summarizeDay(d) {
  const secs = parseSections(d.body);
  const find = (n) => secs.find((s) => s.name === n);
  const sessions = d.fm.sessions || [];
  const open = openSessionOf(d);
  const status = open ? 'open' : d.fm.status === 'away' ? 'away' : 'closed';
  const last = sessions[sessions.length - 1] || '';
  return {
    date: d.date,
    day: d.fm.day || 0,
    title: d.fm.title || '',
    summary: stripDayPrefix(d.fm.title),
    status,
    hours: Number(d.fm.hours) || 0,
    sessions,
    openSince: open ? open.slice(0, -1) : null,
    awaySince: status === 'away' ? last.split('-')[1] || null : null, // 부재 버튼을 누른 시각
    workedMinutes: closedMinutes(sessions),                            // 닫힌 세션 합(분) — 화면의 "오늘 누적"용
    pomodoros: Number(d.fm.pomodoros) || 0,
    picked: d.fm.picked || [],
    done: d.fm.done || [],
    did: bulletsOf(find('한 일')),
    learned: bulletsOf(find('배운 것')),
    blocked: bulletsOf(find('막힌 것')),
    next: bulletsOf(find('다음에 할 것')),
  };
}

// ───────────────────────── 할 일 (todo.md) ─────────────────────────
// 파싱·직렬화는 todo.js 가 맡는다. 여기서는 파일을 읽고(loadTodoDoc) 고친 뒤 저장(saveTodoDoc)만 한다.
// 같은 할 일인지는 todoMd.sameTask 로 비교한다 — 본문이 같거나 [M00-01] 같은 id 가 같으면 같은 것 (문장을 고쳐도 연결 유지).

const loadTodoDoc = () => todoMd.parse(fs.existsSync(TODO_PATH) ? readText(TODO_PATH) : todoMd.TEMPLATE);
const saveTodoDoc = (doc) => writeFileAtomic(TODO_PATH, todoMd.serialize(doc));

/** 화면용: { open: [{id,status,marker,text,note,noteDate}…] (진행 중→열림→모름→보류), done: [완료·취소] } */
const readTodos = () => todoMd.split(loadTodoDoc());

/** 오늘 파일(열린 세션 우선, 없으면 오늘 날짜 파일)의 done 목록에 넣거나 뺀다 */
function markDoneInDay(text, add) {
  const day = findActiveDay() || readDay(todayStr());
  if (!day) return;
  const done = uniq(day.fm.done || []).filter((x) => !todoMd.sameTask(x, text));
  day.fm.done = add ? [...done, text] : done;
  writeDay(day);
}

/**
 * 할 일 조작. action = add | remove | done | undone | status | pick | unpick
 * extra.status ('open'|'doing'|'hold'|'done'|'cancelled') 와 extra.note 는 status 동작에서 쓴다.
 */
function todoAction(action, textRaw, extra = {}) {
  const text = String(textRaw || '').trim();
  if (!text) throw new Error('내용이 비어 있습니다');
  const today = todayStr();

  if (action === 'pick' || action === 'unpick') {
    const day = findActiveDay();
    if (!day) throw new Error('출근 중일 때만 오늘 할 일을 바꿀 수 있습니다');
    const picked = uniq(day.fm.picked || []).filter((x) => !todoMd.sameTask(x, text));
    day.fm.picked = action === 'pick' ? [...picked, text] : picked;
    writeDay(day);
    return;
  }

  const doc = loadTodoDoc();
  let block = todoMd.findTask(doc, text);
  const closed = (s) => todoMd.CLOSED.includes(s);

  switch (action) {
    case 'add':
      if (!block) { todoMd.addTask(doc, text); saveTodoDoc(doc); }
      break;
    case 'remove':
      if (block) { todoMd.removeTask(doc, block); saveTodoDoc(doc); }
      break;
    case 'done':
    case 'undone':
    case 'status': {
      const status = action === 'done' ? 'done' : action === 'undone' ? 'open' : String(extra.status || '');
      if (!['open', 'doing', 'hold', 'done', 'cancelled'].includes(status)) throw new Error('알 수 없는 상태: ' + status);
      if (!block) block = todoMd.addTask(doc, text); // 목록에 없던 것(오늘 고른 뒤 지운 항목 등)도 완료로 남길 수 있게
      const wasClosed = closed(block.status);
      todoMd.setStatus(doc, block, status, extra.note, today);
      saveTodoDoc(doc);
      if (status === 'done') markDoneInDay(block.text, true);
      else if (wasClosed) markDoneInDay(block.text, false);
      break;
    }
    default:
      throw new Error('알 수 없는 동작: ' + action);
  }
}

/**
 * 이어가기(M00-01): 퇴근 보고 "다음에 할 것"의 각 줄을 todo.md "할 일" 절 끝에 새 항목으로 넣는다.
 * 같은 문장이거나 같은 [M00-NN] id 가 이미 있으면(완료 포함) 건너뛴다 → 같은 날 두 번 퇴근해도 중복이 안 생긴다.
 * 돌려주는 값 = 실제로 추가된 본문들
 */
function carryNextToTodo(lines) {
  const doc = loadTodoDoc();
  const added = [];
  for (const raw of lines) {
    const text = String(raw || '').trim().replace(/^[-*]\s+/, ''); // "- " 로 시작해도 본문만
    if (!text || todoMd.findTask(doc, text)) continue;
    todoMd.addTask(doc, text);
    added.push(text);
  }
  if (added.length) saveTodoDoc(doc);
  return added;
}

// ───────────────────────── 출근 / 퇴근 ─────────────────────────
function clockIn(pickedRaw) {
  if (findActiveDay()) throw new Error('이미 출근 중입니다');
  const picked = uniq(Array.isArray(pickedRaw) ? pickedRaw : []);
  const date = todayStr();
  const now = timeStr();
  let d = readDay(date);
  if (d) {
    // 오늘 두 번째 출근: 세션만 추가
    d.fm.sessions = [...(d.fm.sessions || []), `${now}-`];
    d.fm.status = 'open';
    d.fm.picked = uniq([...(d.fm.picked || []), ...picked]);
  } else {
    const day = nextDayNumber(date);
    d = {
      date,
      fm: { title: `Day ${day}`, date, day, status: 'open', sessions: [`${now}-`], hours: 0, picked, done: [], pomodoros: 0, tags: [] },
      body: buildBody({}, ''),
    };
  }
  writeDay(d);
  return d;
}

function clockOut(fields) {
  const d = findActiveDay();
  if (!d) throw new Error('출근 상태가 아닙니다');
  const summary = String(fields.title || '').trim();
  if (!summary) throw new Error('오늘을 한 줄로 적어야 퇴근할 수 있습니다');
  const sessions = [...(d.fm.sessions || [])];
  const i = sessions.findIndex(isOpenSession);
  if (i >= 0) sessions[i] = sessions[i] + timeStr(); // 부재 중에 퇴근하면 닫을 세션이 없다
  d.fm.sessions = sessions;
  d.fm.status = 'closed';
  d.fm.hours = computeHours(sessions);
  d.fm.title = `Day ${d.fm.day} — ${summary}`;
  d.body = buildBody(
    { did: asLines(fields.did), learned: asLines(fields.learned), blocked: asLines(fields.blocked), next: asLines(fields.next) },
    d.body,
  );
  writeDay(d);
  pomoClear(); // 퇴근하면 뽀모도로는 멈춘다
  return d;
}

// ───────────────────────── 부재 / 복귀 / 뽀모도로 ─────────────────────────
/** 부재: 현재 세션을 닫고 status=away. 복귀 전까지의 시간은 근무에서 빠진다 */
function goAway() {
  const d = findActiveDay();
  if (!d) throw new Error('출근 상태가 아닙니다');
  if (d.fm.status === 'away') throw new Error('이미 부재 중입니다');
  const sessions = [...(d.fm.sessions || [])];
  const i = sessions.findIndex(isOpenSession);
  sessions[i] = sessions[i] + timeStr();
  d.fm.sessions = sessions;
  d.fm.status = 'away';
  d.fm.hours = computeHours(sessions);
  writeDay(d);
  pomoClear(); // 자리를 비우면 뽀모도로는 멈춘다
  return d;
}

/** 복귀: 새 세션을 열고 status=open */
function comeBack() {
  const d = findActiveDay();
  if (!d || d.fm.status !== 'away') throw new Error('부재 중이 아닙니다');
  d.fm.sessions = [...(d.fm.sessions || []), `${timeStr()}-`];
  d.fm.status = 'open';
  writeDay(d);
  return d;
}

/** 집중 블록 하나 완료 → 그날 파일의 pomodoros 를 1 올린다 (통계·툴팁용) */
function addPomodoro() {
  const d = findActiveDay() || readDay(todayStr());
  if (!d) throw new Error('오늘 출근 기록이 없습니다');
  d.fm.pomodoros = (Number(d.fm.pomodoros) || 0) + 1;
  writeDay(d);
  return d;
}

// ───────────────────────── 뽀모도로 시계 (서버가 갖는다 — 크롬을 꺼도 알림이 울림) ─────────────────────────
const POMO_FILE = path.join(ROOT, '.pomo.json'); // 서버가 재시작해도 이어가도록 (git 무시)
let pomo = null;      // { phase: 'focus' | 'break', startedAt, endsAt, total } — 모두 ms
let pomoTimer = null;

const pomoCfg = () => Object.assign({}, DEFAULTS.pomodoro, config.pomodoro || {});

function pomoLoad() {
  try { const p = JSON.parse(fs.readFileSync(POMO_FILE, 'utf8')); if (p && p.endsAt) pomo = p; } catch {}
}
function pomoSave() {
  try {
    if (pomo) fs.writeFileSync(POMO_FILE, JSON.stringify(pomo));
    else if (fs.existsSync(POMO_FILE)) fs.unlinkSync(POMO_FILE);
  } catch {}
}
function pomoSchedule() {
  clearTimeout(pomoTimer);
  if (pomo) pomoTimer = setTimeout(pomoFire, Math.max(0, pomo.endsAt - Date.now()));
}
function pomoStart(phase) {
  const mins = phase === 'focus' ? pomoCfg().focus : pomoCfg().break;
  pomo = { phase, startedAt: Date.now(), endsAt: Date.now() + mins * 60000, total: mins * 60000 };
  pomoSave();
  pomoSchedule();
}
function pomoClear() {
  pomo = null;
  pomoSave();
  clearTimeout(pomoTimer);
}
/** 시간이 다 됐을 때: 집중이면 기록 + 알림 + 휴식 자동 시작, 휴식이면 알림만 (다음 집중은 버튼으로) */
function pomoFire() {
  if (!pomo) return;
  const cfg = pomoCfg();
  const wasFocus = pomo.phase === 'focus';
  pomo = null;
  pomoSave();
  if (wasFocus) {
    try { addPomodoro(); } catch (e) { console.warn('[desk] 뽀모도로 기록 실패:', e.message); }
    notifyOS(`${cfg.focus}분 집중 끝`, `${cfg.break}분 쉬세요. 휴식 타이머가 시작됐습니다.`);
    const d = findActiveDay();
    if (d && openSessionOf(d)) pomoStart('break'); // 근무 중일 때만 휴식을 이어간다
  } else {
    notifyOS('휴식 끝', '준비되면 다음 집중을 시작하세요.');
  }
}

/** OS 알림 + 소리. 윈도우는 PowerShell 로 토스트, 맥은 osascript. 브라우저가 닫혀 있어도 뜬다 */
function notifyOS(title, body) {
  console.log(`[desk] 알림: ${title} — ${body}`);
  const done = (label) => (err, so, se) => { if (err) console.warn(`[desk] ${label} 실패:`, String(se || err.message).trim()); };
  if (process.platform === 'win32') {
    const escXml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
    const xml = `<toast duration="long"><visual><binding template="ToastGeneric"><text>${escXml(title)}</text><text>${escXml(body)}</text></binding></visual><audio silent="true"/></toast>`;
    const ps = [
      '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null',
      '[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null',
      '$x = New-Object Windows.Data.Xml.Dom.XmlDocument',
      `$x.LoadXml('${xml}')`,
      '$t = New-Object Windows.UI.Notifications.ToastNotification $x',
      "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe').Show($t)",
      '(New-Object Media.SoundPlayer "$env:WINDIR\\Media\\Alarm01.wav").PlaySync()', // 방해 금지 모드여도 소리는 난다
    ].join('; ');
    execFile('powershell', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', ps], { windowsHide: true }, done('윈도우 알림'));
  } else if (process.platform === 'darwin') {
    const q = (s) => String(s).replace(/["\\]/g, '\\$&');
    execFile('osascript', ['-e', `display notification "${q(body)}" with title "${q(title)}" sound name "Glass"`], done('맥 알림'));
  }
}

// ───────────────────────── git (데이터 폴더만 커밋 → 푸시) ─────────────────────────
function git(args, cwd) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, windowsHide: true }, (err, stdout, stderr) => {
      resolve({ ok: !err, out: String(stdout || '').trim(), err: String(stderr || '').trim() || (err ? err.message : '') });
    });
  });
}

async function pushData(message) {
  if (NO_GIT) return { skipped: true, reason: '--no-git' };
  if (!config.autoPush) return { skipped: true, reason: 'autoPush=false' };
  const top = await git(['rev-parse', '--show-toplevel'], DATA_DIR);
  if (!top.ok) return { ok: false, error: '데이터 폴더가 git 저장소 안에 없습니다: ' + top.err };
  const repo = top.out;
  const rel = path.relative(repo, DATA_DIR).split(path.sep).join('/') || '.';
  const add = await git(['add', '-A', '--', rel], repo);
  if (!add.ok) return { ok: false, error: add.err };
  const status = await git(['status', '--porcelain', '--', rel], repo);
  if (!status.out) return { ok: true, nothing: true };
  const commit = await git(['commit', '-m', message, '--', rel], repo);
  if (!commit.ok) return { ok: false, error: commit.err };
  const push = await git(['push'], repo);
  return push.ok ? { ok: true, pushed: true } : { ok: true, pushed: false, error: push.err };
}

// ───────────────────────── 상태 (화면이 한 번에 받아가는 것) ─────────────────────────
function stateJson() {
  const today = todayStr();
  const days = listDays().map(summarizeDay);
  const active = days.find((d) => d.status === 'open' || d.status === 'away') || null;
  const todayDay = days.find((d) => d.date === today) || null;
  const todos = readTodos();
  // "어제" = 가장 최근에 퇴근한 날 (오늘 퇴근했다가 다시 출근하면 오늘). 그날의 "다음에 할 것"이 출근 추천의 재료
  const lastClosed = [...days].reverse().find((d) => d.status === 'closed') || null;
  const lastNext = { date: lastClosed ? lastClosed.date : null, lines: lastClosed ? lastClosed.next : [] };
  return {
    now: new Date().toISOString(),
    nowMs: Date.now(),
    today,
    active,
    todayDay,
    pomo, // 서버의 뽀모도로 시계 (없으면 null)
    nextDayNumber: todayDay ? todayDay.day : nextDayNumber(today),
    todos,
    lastNext,
    pick: todoMd.pickList([...todos.open, ...todos.done], lastNext.lines), // 출근 화면 고르기 목록 + 미리 체크 1개
    days,
    config: {
      seasonStart: config.seasonStart,
      heatStart: /^\d{4}-\d{2}-\d{2}$/.test(config.heatStart || '') ? config.heatStart : `${config.seasonStart.slice(0, 7)}-01`,
      heatLevels: config.heatLevels,
      maxPick: config.maxPick,
      pomodoro: Object.assign({}, DEFAULTS.pomodoro, config.pomodoro || {}),
      autoPush: config.autoPush && !NO_GIT,
    },
    dataDir: DATA_DIR,
  };
}

// ───────────────────────── HTTP ─────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}
const json = (res, obj, code = 200) => send(res, code, JSON.stringify(obj));
const fail = (res, e, code = 400) => json(res, { error: e && e.message ? e.message : String(e) }, code);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function serveStatic(res, urlPath) {
  const rel = urlPath === '/' ? '/index.html' : urlPath;
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return send(res, 404, 'not found', 'text/plain; charset=utf-8');
  }
  send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream');
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  try {
    if (req.method === 'GET' && p === '/api/state') return json(res, stateJson());

    if (req.method === 'GET' && p.startsWith('/api/devlog/')) {
      const date = p.slice('/api/devlog/'.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !fs.existsSync(dayPath(date))) return fail(res, new Error('없는 날짜'), 404);
      return json(res, { date, text: fs.readFileSync(dayPath(date), 'utf8') });
    }

    if (req.method === 'POST' && p === '/api/clockin') {
      const body = await readBody(req);
      const d = clockIn(body.picked);
      return json(res, { ok: true, day: summarizeDay(d), state: stateJson() });
    }

    if (req.method === 'POST' && p === '/api/clockout') {
      const body = await readBody(req);
      const d = clockOut(body);
      const added = carryNextToTodo(asLines(body.next)); // 커밋 전에 todo.md 를 갱신해야 같은 커밋에 들어간다
      const msg = `desk: ${d.date} 퇴근 (${d.fm.hours}h) — ${stripDayPrefix(d.fm.title)}`;
      const gitResult = await pushData(msg);
      return json(res, { ok: true, day: summarizeDay(d), added, git: gitResult, state: stateJson() });
    }

    if (req.method === 'POST' && p === '/api/away') {
      const d = goAway();
      return json(res, { ok: true, day: summarizeDay(d), state: stateJson() });
    }

    if (req.method === 'POST' && p === '/api/back') {
      const d = comeBack();
      return json(res, { ok: true, day: summarizeDay(d), state: stateJson() });
    }

    if (req.method === 'GET' && p === '/api/pomo') {
      // 화면이 2초마다 묻는 가벼운 상태 (전체 state 보다 싸다)
      const d = findActiveDay() || readDay(todayStr());
      return json(res, { now: Date.now(), pomo, pomodoros: d ? Number(d.fm.pomodoros) || 0 : 0 });
    }

    if (req.method === 'POST' && p === '/api/pomodoro') {
      const body = await readBody(req);
      if (body.action === 'start') {
        const d = findActiveDay();
        if (!d || !openSessionOf(d)) throw new Error('근무 중일 때만 시작할 수 있습니다');
        pomoStart('focus');
      } else if (body.action === 'stop') {
        pomoClear();
      } else if (body.action === 'test') {
        notifyOS('출근부 알림 테스트', '이 알림이 보이면 크롬을 꺼도 뽀모도로 알림이 옵니다.');
      } else {
        throw new Error('알 수 없는 동작: ' + body.action);
      }
      return json(res, { ok: true, state: stateJson() });
    }

    if (req.method === 'POST' && p === '/api/todos') {
      const body = await readBody(req);
      todoAction(body.action, body.text, { status: body.status, note: body.note });
      return json(res, { ok: true, state: stateJson() });
    }

    if (req.method === 'GET' && !p.startsWith('/api/')) return serveStatic(res, p);
    return fail(res, new Error('not found'), 404);
  } catch (e) {
    return fail(res, e);
  }
}

// ───────────────────────── 시작 ─────────────────────────
function openBrowser(url) {
  if (NO_OPEN) return;
  const [cmd, args] =
    process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin' ? ['open', [url]]
    : ['xdg-open', [url]];
  execFile(cmd, args, { windowsHide: true }, () => {});
}

fs.mkdirSync(DEVLOG_DIR, { recursive: true });
if (!fs.existsSync(TODO_PATH)) writeFileAtomic(TODO_PATH, todoMd.TEMPLATE);
pomoLoad();      // 재시작 전에 돌던 뽀모도로가 있으면 이어간다 (이미 지났으면 바로 울림)
pomoSchedule();

const PORT = Number(process.env.DESK_PORT) || config.port; // DESK_PORT 는 테스트용 포트 바꾸기
const server = http.createServer(handle);
const url = `http://localhost:${PORT}`;

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`[desk] 이미 켜져 있는 출근부가 있습니다 (${url})${NO_OPEN ? ' — 그대로 씁니다' : ' → 브라우저만 엽니다'}`);
    openBrowser(url);
    setTimeout(() => process.exit(0), 300);
  } else {
    console.error('[desk] 서버 오류:', e);
    process.exit(1);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('┌──────────────────────────────────────────┐');
  console.log('│  마왕성 인사팀 · 출근부                    │');
  console.log('└──────────────────────────────────────────┘');
  console.log(`  화면    : ${url}`);
  console.log(`  데이터  : ${DATA_DIR}`);
  console.log(`  시즌    : ${config.seasonStart} 부터  ·  자동 푸시: ${config.autoPush && !NO_GIT ? 'ON' : 'OFF'}`);
  console.log('  끄기    : 이 창을 닫거나 Ctrl+C');
  openBrowser(url);
});
