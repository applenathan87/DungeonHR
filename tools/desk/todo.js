'use strict';
/*
 * 마왕성 인사팀 · 출근부 — todo.md 파서/직렬화 (server.js 가 require 한다)
 *
 * 원칙: **앱이 이해하지 못한 줄은 절대 지우지 않는다.**
 *
 * 문서를 "블록" 목록으로 읽는다.
 *   task 블록 = `- [x] 본문` 줄 하나 + 그 아래 들여쓴 이어지는 줄들(메모 `  > 진행: 내용 · 날짜` 포함)
 *   raw  블록 = 그 밖의 모든 줄(제목·빈 줄·인용문·모르는 문장) — 원문 그대로 보관
 * 저장할 때는 바뀐(dirty) task 블록만 다시 만들고, 나머지는 원문 줄을 그대로 출력한다.
 * 그래서 손 안 댄 파일은 글자 하나 안 바뀐다 (줄바꿈 종류도 원래 것을 따른다).
 *
 * 상태 글자: [ ] 열림 open · [/] 진행 중 doing · [>] 보류 hold · [x] 완료 done · [-] 취소 cancelled
 *            그 외 글자([?] 등)는 unknown — 읽기만 하고 절대 고치지 않는다.
 * ID: 본문이 `[M00-01]` 처럼 시작하면 id = "M00-01" (본문 text 에는 접두어를 그대로 둔다 — 데브로그 기록과 호환).
 */

const STATUS_BY_MARKER = { ' ': 'open', '/': 'doing', '>': 'hold', x: 'done', X: 'done', '-': 'cancelled' };
const MARKER_BY_STATUS = { open: ' ', doing: '/', hold: '>', done: 'x', cancelled: '-' };
const NOTE_LABEL = { open: '메모', unknown: '메모', doing: '진행', hold: '보류', done: '완료', cancelled: '취소' };
const OPEN_ORDER = ['doing', 'open', 'unknown', 'hold']; // "할 일" 목록 표시 순서
const CLOSED = ['done', 'cancelled'];

const SECTION_OPEN = '할 일';
const SECTION_DONE = '완료';

const TASK_RE = /^([-*])\s+\[(.)\]\s+(.*)$/;                // 최상위(들여쓰기 없는) 할 일 줄
const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const ID_RE = /^\[([A-Za-z][\w]*-\d+)\]/;                    // [M00-01] …
const NOTE_RE = /^\s*>\s*(진행|보류|완료|취소|메모)\s*:\s*(.*?)\s*$/; // 메모 줄 (이어지는 줄 중 첫 번째만)
const NOTE_DATE_RE = /^(.*?)\s*(?:·\s*)?(\d{4}-\d{2}-\d{2})$/; // "내용 · 2026-09-13" 또는 "2026-09-13"
const LEGACY_DATE_RE = /^(.*?)\s*\((\d{4}-\d{2}-\d{2})\)\s*$/; // ver01 형식 "본문 (2026-09-09)"

const TEMPLATE = [
  '# 할 일',
  '',
  '> 출근부 앱(tools/desk)이 읽고 쓰는 파일. 손으로 고쳐도 됩니다. 앱이 모르는 줄은 그대로 둡니다.',
  '> 상태: `[ ]` 열림 · `[/]` 진행 중 · `[>]` 보류 · `[x]` 완료 · `[-]` 취소. 메모는 다음 줄에 `  > 진행: 내용 · 날짜`.',
  '',
  `## ${SECTION_OPEN}`,
  '',
  `## ${SECTION_DONE}`,
  '',
].join('\n');

// ───────────────────────── 읽기 ─────────────────────────

/** 할 일 본문에서 id 를 뽑는다. 없으면 null */
function taskId(text) {
  const m = ID_RE.exec(String(text || '').trim());
  return m ? m[1] : null;
}

/** 같은 할 일인가 — 본문이 같거나, 둘 다 id 가 있고 id 가 같으면 */
function sameTask(a, b) {
  const x = String(a || '').trim();
  const y = String(b || '').trim();
  if (x === y) return true;
  const ia = taskId(x);
  return !!ia && ia === taskId(y);
}

/** 이어지는 줄들에서 메모 줄 하나를 찾아 { note, noteDate, noteIndex } 로 */
function parseNote(tail) {
  for (let i = 0; i < tail.length; i++) {
    const m = NOTE_RE.exec(tail[i]);
    if (!m) continue;
    let note = m[2];
    let noteDate = null;
    const d = NOTE_DATE_RE.exec(note);
    if (d) { note = d[1].trim(); noteDate = d[2]; }
    return { note, noteDate, noteIndex: i };
  }
  return { note: '', noteDate: null, noteIndex: -1 };
}

function makeTask(lines) {
  const [first, ...tail] = lines;
  const m = TASK_RE.exec(first);
  const marker = m[2];
  const status = STATUS_BY_MARKER[marker] || 'unknown';
  let text = m[3].trim();
  const { note, noteDate: parsedDate, noteIndex } = parseNote(tail);
  let noteDate = parsedDate;
  // ver01 형식: 완료 본문 끝의 "(YYYY-MM-DD)" 는 완료 날짜로 읽는다 (이 항목을 건드릴 때 새 형식으로 바뀐다)
  if (CLOSED.includes(status) && !noteDate) {
    const lg = LEGACY_DATE_RE.exec(text);
    if (lg) { text = lg[1].trim(); noteDate = lg[2]; }
  }
  return {
    type: 'task',
    bullet: m[1],
    marker,
    status,
    id: taskId(text),
    text,
    note,
    noteDate,
    extra: tail.filter((_, i) => i !== noteIndex), // 메모 줄이 아닌 이어지는 줄 — 그대로 보존
    lines,          // 원문 (dirty 가 아니면 이걸 그대로 출력)
    dirty: false,
  };
}

function makeRaw(line) {
  const h = HEADING_RE.exec(line);
  return { type: 'raw', line, heading: h ? { level: h[1].length, text: h[2].trim() } : null, blank: line.trim() === '' };
}

/** 텍스트 → { eol, blocks } */
function parse(textRaw) {
  const text = String(textRaw || '').replace(/^﻿/, '');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  if (text.trim() === '') return { eol, blocks: [] }; // 빈 파일
  const lines = text.split(/\r?\n/);
  // 파일 끝 개행 뒤의 빈 문자열은 줄이 아니다 (serialize 가 끝 개행을 다시 붙인다)
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();

  const blocks = [];
  let cur = null; // 조립 중인 task 줄 묶음
  const flush = () => { if (cur) { blocks.push(makeTask(cur)); cur = null; } };
  for (const line of lines) {
    if (TASK_RE.test(line)) { flush(); cur = [line]; continue; }
    if (cur && line.trim() !== '' && /^\s/.test(line)) { cur.push(line); continue; } // 들여쓴 이어지는 줄
    flush();
    blocks.push(makeRaw(line));
  }
  flush();
  return { eol, blocks };
}

// ───────────────────────── 쓰기 ─────────────────────────

function renderTask(t) {
  if (!t.dirty) return t.lines;
  const out = [`${t.bullet} [${t.marker}] ${t.text}`];
  if (t.note || t.noteDate) {
    const label = NOTE_LABEL[t.status] || '메모';
    out.push(`  > ${label}: ${[t.note, t.noteDate].filter(Boolean).join(' · ')}`);
  }
  return out.concat(t.extra);
}

/** { eol, blocks } → 텍스트. 파일 끝에는 항상 개행 하나 */
function serialize(doc) {
  const lines = [];
  for (const b of doc.blocks) {
    if (b.type === 'task') lines.push(...renderTask(b));
    else lines.push(b.line);
  }
  return lines.join(doc.eol) + doc.eol;
}

// ───────────────────────── 조회 ─────────────────────────

/** 문서의 task 블록들 (파일 순서). 각 블록에 section(속한 ## 제목) 을 붙여 준다 */
function tasksOf(doc) {
  const out = [];
  let section = null;
  for (const b of doc.blocks) {
    if (b.type === 'raw') { if (b.heading && b.heading.level <= 2) section = b.heading.text; continue; }
    b.section = section;
    out.push(b);
  }
  return out;
}

/** 본문으로 할 일 찾기 — 정확히 같은 본문 우선, 없으면 id 가 같은 것 */
function findTask(doc, text) {
  const tasks = tasksOf(doc);
  const want = String(text || '').trim();
  return tasks.find((t) => t.text === want) || tasks.find((t) => sameTask(t.text, want)) || null;
}

/** 화면·API 로 내보낼 모양 (원문 줄은 뺀다) */
function publicTask(t) {
  return { id: t.id, status: t.status, marker: t.marker, text: t.text, note: t.note || '', noteDate: t.noteDate || null };
}

const rank = (s) => { const i = OPEN_ORDER.indexOf(s); return i < 0 ? OPEN_ORDER.length : i; };

/** { open: [진행 중 → 열림 → 모름 → 보류], done: [완료·취소, 파일 순서] } */
function split(doc) {
  const tasks = tasksOf(doc).map(publicTask);
  const open = tasks.filter((t) => !CLOSED.includes(t.status));
  open.sort((a, b) => rank(a.status) - rank(b.status)); // 안정 정렬 — 같은 상태끼리는 파일 순서
  return { open, done: tasks.filter((t) => CLOSED.includes(t.status)) };
}

// ───────────────────────── 출근 화면 "고르기" 목록 ─────────────────────────
/**
 * 규칙(2026-09-13 결정): 진행 중 → 어제의 "다음에 할 것"(적은 순서) → 열림 → 모르는 상태. 보류는 따로(접힘).
 * 미리 체크는 1개만: 어제의 다음 첫 줄에 해당하는 항목 → 없으면 메모 날짜가 가장 최근인 진행 중 → 없으면 없음.
 * (관성으로 어제 일을 전부 다시 고르는 걸 막으려고 하나만 체크한다)
 * 규칙을 여기(서버)에 두는 이유: 나중에 today.md·주간 회고가 같은 규칙을 그대로 쓴다.
 *
 * tasks = publicTask 배열(완료 섞여도 됨), lastNext = 어제 퇴근 때 적은 줄들
 * → { items: [{…task, reason: 'next'|null}], hold: [보류], preselect: 본문|null, unmatched: [어제 줄 중 목록에 없는 것] }
 */
function pickList(tasks, lastNext = []) {
  const next = lastNext.map((s) => String(s || '').trim()).filter(Boolean);
  const nextIndex = (t) => next.findIndex((n) => sameTask(n, t.text));
  const scored = tasks
    .filter((t) => !CLOSED.includes(t.status))
    .map((t, i) => {
      const ni = nextIndex(t);
      const rank = t.status === 'hold' ? 4 : t.status === 'doing' ? 0 : ni >= 0 ? 1 : t.status === 'open' ? 2 : 3;
      return { t: { ...t, reason: ni >= 0 ? 'next' : null }, rank, sub: rank === 1 ? ni : i };
    });
  scored.sort((a, b) => a.rank - b.rank || a.sub - b.sub);
  const all = scored.map((x) => x.t);
  const items = all.filter((t) => t.status !== 'hold');
  const hold = all.filter((t) => t.status === 'hold');

  let preselect = null;
  for (const n of next) {
    const hit = items.find((t) => sameTask(n, t.text));
    if (hit) { preselect = hit.text; break; }
  }
  if (!preselect) {
    const doing = items.filter((t) => t.status === 'doing').sort((a, b) => String(b.noteDate || '').localeCompare(String(a.noteDate || '')));
    if (doing.length) preselect = doing[0].text;
  }
  const unmatched = next.filter((n) => !tasks.some((t) => sameTask(n, t.text)));
  return { items, hold, preselect, unmatched };
}

// ───────────────────────── 수정 ─────────────────────────

/** `## name` 절의 범위 { start: 제목 블록 인덱스, end: 다음 제목(같거나 높은 단계) 인덱스 }. 없으면 만들어서 돌려준다 */
function ensureSection(doc, name) {
  const bl = doc.blocks;
  let start = bl.findIndex((b) => b.type === 'raw' && b.heading && b.heading.level === 2 && b.heading.text === name);
  if (start < 0) {
    if (bl.length && !(bl[bl.length - 1].type === 'raw' && bl[bl.length - 1].blank)) bl.push(makeRaw(''));
    bl.push(makeRaw(`## ${name}`));
    start = bl.length - 1;
  }
  let end = bl.length;
  for (let i = start + 1; i < bl.length; i++) {
    const b = bl[i];
    if (b.type === 'raw' && b.heading && b.heading.level <= 2) { end = i; break; }
  }
  return { start, end };
}

/** 블록을 빼낸다. 빈 줄로 나뉜 목록이었다면 남는 빈 줄 하나도 같이 정리 */
function detach(doc, block) {
  const i = doc.blocks.indexOf(block);
  if (i < 0) return;
  doc.blocks.splice(i, 1);
  const prev = doc.blocks[i - 1];
  const next = doc.blocks[i];
  if (prev && next && prev.type === 'raw' && prev.blank && next.type === 'raw' && next.blank) doc.blocks.splice(i, 1);
}

/** 블록을 절의 맨 위(제목 바로 아래) 또는 맨 아래(마지막 할 일 뒤)에 넣는다 */
function insertInSection(doc, block, name, where) {
  const { start, end } = ensureSection(doc, name);
  let at = start + 1;
  if (where === 'bottom') {
    for (let i = start + 1; i < end; i++) if (doc.blocks[i].type === 'task') at = i + 1;
  }
  doc.blocks.splice(at, 0, block);
}

/** 새 할 일을 "## 할 일" 절 맨 아래에 추가하고 블록을 돌려준다 */
function addTask(doc, text, status = 'open') {
  const t = makeTask([`- [${MARKER_BY_STATUS[status] || ' '}] ${String(text).trim()}`]);
  t.dirty = true;
  insertInSection(doc, t, SECTION_OPEN, 'bottom');
  return t;
}

function removeTask(doc, block) {
  detach(doc, block);
}

/**
 * 상태를 바꾼다. note 는 진행/보류 메모(없으면 비움), date 는 오늘(YYYY-MM-DD).
 * 완료·취소 → "## 완료" 맨 위로. 완료 절에 있던 것을 열면 → "## 할 일" 맨 위로. 그 밖(열림↔진행↔보류)은 제자리.
 */
function setStatus(doc, block, status, note, date) {
  if (!MARKER_BY_STATUS[status]) throw new Error('알 수 없는 상태: ' + status);
  const wasClosed = CLOSED.includes(block.status);
  const nowClosed = CLOSED.includes(status);
  block.status = status;
  block.marker = MARKER_BY_STATUS[status];
  block.note = String(note || '').trim();
  block.noteDate = status === 'open' && !block.note ? null : date || null;
  block.dirty = true;
  if (nowClosed) { detach(doc, block); insertInSection(doc, block, SECTION_DONE, 'top'); }
  else if (wasClosed) { detach(doc, block); insertInSection(doc, block, SECTION_OPEN, 'top'); }
  return block;
}

/** 본문을 바꾼다 (id 도 다시 뽑는다) */
function setText(doc, block, text) {
  block.text = String(text).trim();
  block.id = taskId(block.text);
  block.dirty = true;
  return block;
}

module.exports = {
  TEMPLATE, SECTION_OPEN, SECTION_DONE, CLOSED, OPEN_ORDER,
  parse, serialize, tasksOf, findTask, publicTask, split, pickList,
  addTask, removeTask, setStatus, setText,
  taskId, sameTask,
};
