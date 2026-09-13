'use strict';
/*
 * 마왕성 인사팀 · 출근부 — 화면 스크립트 (의존성 0, 브라우저 기본 API만)
 *
 * 흐름: 서버의 /api/state 를 받아(S) 화면 전체를 그린다(render).
 *       버튼을 누르면 서버에 POST → 돌아온 새 상태로 다시 그린다.
 */

// ───────────────────────── 작은 도우미 ─────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);

/** el('div', {class:'x', onclick: fn}, '텍스트', 자식...) — DOM 만들기 도우미 */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'checked' || k === 'value' || k === 'disabled') node[k] = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uniq = (arr) => [...new Set(arr.map((x) => String(x).trim()).filter(Boolean))];

// ── 할 일 도우미 (서버 todo.js 와 같은 규칙) ──
/** 본문이 [M00-01] 처럼 시작하면 그 id, 아니면 null */
const taskId = (s) => { const m = /^\[([A-Za-z]\w*-\d+)\]/.exec(String(s || '').trim()); return m ? m[1] : null; };
/** 같은 할 일인가 — 본문이 같거나, 둘 다 id 가 있고 같으면 (문장을 고쳐도 데브로그의 picked/done 과 연결 유지) */
const sameTask = (a, b) => { const x = String(a || '').trim(), y = String(b || '').trim(); if (x === y) return true; const i = taskId(x); return !!i && i === taskId(y); };
const STATUS_LABEL = { doing: '진행 중', hold: '보류', cancelled: '취소' };
/** 상태 표식. 열림·완료는 없음, 모르는 상태([?] 등)는 글자 그대로 보여 주고 건드리지 않는다 */
function statusTag(t) {
  const label = t.status === 'unknown' ? `[${t.marker}]` : STATUS_LABEL[t.status];
  return label ? el('span', { class: `tag ${t.status}` }, label) : null;
}
/** 할 일 한 줄: 본문 + 상태 표식 + (옵션) 추가 표식들·날짜 + (있으면) 메모 줄 */
function taskLabel(t, opts = {}) {
  return el('span', { class: 'txt' },
    el('span', { class: 't' }, t.text),
    statusTag(t),
    opts.tags || null,
    opts.date ? el('span', { class: 'note' }, opts.date) : null,
    t.note ? el('div', { class: 'note' }, t.note) : null,
  );
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad2 = (n) => String(n).padStart(2, '0');
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtDate = (s) => { const d = parseDate(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`; };
const fmtHours = (h) => `${Math.round(h * 10) / 10}h`;
const fmtDuration = (min) => { const h = Math.floor(min / 60), m = min % 60; return h ? `${h}시간 ${m}분` : `${m}분`; };

async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || res.statusText);
  return data;
}

// ───────────────────────── 상태 ─────────────────────────
let S = null;            // 서버가 준 상태 (/api/state)
let view = 'idle';       // 근무 카드의 화면: idle | clockout (출근 전 고르기는 idle 화면의 "오늘" 칸이 맡는다)
let tray = null;         // 출근 전 왼쪽 "오늘" 칸에 올려 둔 할 일 본문들 (순서 = 사용자 순서). null = 아직 초기화 전
let drag = null;         // 끌고 있는 카드 { text, from: 'tray' | 'backlog' }
let heatIndex = {};      // date → day 요약 (툴팁용)

async function load() {
  S = await api('/api/state');
  clockOffset = S.nowMs - Date.now();
  render();
  updateTitle();
}

// ───────────────────────── 뽀모도로 (시계·알림은 서버가 담당 — 크롬을 꺼도 울림) ─────────────────────────
let clockOffset = 0; // 서버 시각 − 브라우저 시각 (같은 PC라 거의 0)
const pomoCfg = () => Object.assign({ focus: 50, break: 10 }, (S && S.config.pomodoro) || {});
const pomoRemaining = () => (S && S.pomo ? Math.max(0, S.pomo.endsAt - (Date.now() + clockOffset)) : 0);
const pomoProgress = () => (S && S.pomo ? Math.min(100, 100 * (1 - pomoRemaining() / S.pomo.total)) : 0);
const fmtClock = (ms) => { const s = Math.ceil(ms / 1000); return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`; };

function updateTitle() {
  document.title = S && S.pomo ? `${fmtClock(pomoRemaining())} ${S.pomo.phase === 'focus' ? '집중' : '휴식'} · 출근부` : '마왕성 인사팀 · 출근부';
}

/** start | stop | test — 서버에 요청하고 돌아온 상태로 다시 그린다 */
async function pomoAction(action) {
  try {
    const r = await api('/api/pomodoro', { action });
    S = r.state;
    clockOffset = S.nowMs - Date.now();
    render();
    updateTitle();
    if (action === 'test') toast('알림을 보냈습니다. 화면 오른쪽 아래 윈도우 알림을 확인하세요.');
  } catch (e) {
    toast(e.message, true);
  }
}

/** 2초마다 서버의 뽀모도로 상태를 확인 — 단계가 바뀌면(집중→휴식→끝) 화면을 새로 그린다 */
async function pomoPoll() {
  if (!S || !S.active || document.hidden) return;
  try {
    const r = await api('/api/pomo');
    clockOffset = r.now - Date.now();
    if (JSON.stringify(r.pomo) === JSON.stringify(S.pomo)) return;
    const prev = S.pomo, next = r.pomo;
    await load();
    if (prev && prev.phase === 'focus' && next && next.phase === 'break') toast(`${pomoCfg().focus}분 집중 끝 — ${pomoCfg().break}분 휴식 시작`);
    else if (prev && prev.phase === 'break' && !next) toast('휴식 끝 — 준비되면 다음 집중을 시작하세요.');
  } catch {}
}
setInterval(pomoPoll, 2000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) pomoPoll(); });

/** 그날 HH:MM 부터 지금까지 지난 분 */
function minutesSince(date, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const t = parseDate(date);
  t.setHours(h, m, 0, 0);
  return Math.max(0, Math.floor((Date.now() - t.getTime()) / 60000));
}
/** 근무 중이면 현재 세션의 경과 분 (부재 중이면 0) */
const elapsedMinutes = () => (S.active && S.active.status === 'open' ? minutesSince(S.active.date, S.active.openSince) : 0);
/** 부재 중이면 부재 시작 후 지난 분 */
const awayMinutes = () => (S.active && S.active.status === 'away' ? minutesSince(S.active.date, S.active.awaySince) : 0);
/** 오늘 누적 근무 분 = 닫힌 세션 합 + 현재 세션 경과. 부재 시간은 세션 사이 빈 틈이라 자동으로 빠진다 */
const todayWorkedMinutes = () => (S.active ? S.active.workedMinutes + elapsedMinutes() : 0);

/** 날짜별 작업시간 (활성인 날은 분 단위로 정확히) */
function hoursByDate() {
  const map = {};
  for (const d of S.days) map[d.date] = d.hours;
  if (S.active) map[S.active.date] = todayWorkedMinutes() / 60;
  return map;
}

// ───────────────────────── 그리기 ─────────────────────────
function render() {
  renderTop();
  renderWork();
  renderTodos();
  renderStats();
  renderHeatmap();
  renderLegend();
  renderHistory();
}

function renderTop() {
  $('#top-date').textContent = `${S.today.slice(0, 4)}년 ${fmtDate(S.today)}`;
  const day = S.active ? S.active.day : S.nextDayNumber;
  $('#top-day').textContent = `Day ${day}${S.active ? ' · 출근 중' : ''}`;
  $('#top-day').classList.toggle('on', !!S.active);
}

// ── 근무 카드 ──
function renderWork() {
  const c = $('#work-card');
  c.innerHTML = '';

  if (S.active) {
    if (view === 'clockout') return renderClockOutForm(c);
    const away = S.active.status === 'away';
    c.append(
      el('div', { class: 'work-head' },
        el('span', { class: `status-badge ${away ? 'away' : 'open'}` }, away ? '부재 중' : '출근 중'),
        el('span', { class: 'work-time' },
          '오늘 누적 ', el('strong', { id: 'elapsed' }, fmtDuration(todayWorkedMinutes())),
          away
            ? [` · ${S.active.awaySince} 부재 시작, `, el('strong', { id: 'away-elapsed' }, fmtDuration(awayMinutes())), ' 지남']
            : ` · ${S.active.openSince}부터 근무 중`,
        ),
      ),
      el('h2', {}, `Day ${S.active.day} · 오늘 할 일`),
      renderPickedList(),
      renderAddToToday(),
      away ? el('p', { class: 'muted small-text pomo-note' }, '부재 중에는 뽀모도로가 멈춥니다. 복귀하면 다시 시작할 수 있습니다.') : renderPomodoro(),
      el('div', { class: 'actions' },
        away
          ? el('button', { class: 'btn primary big', onclick: doBack }, '복귀')
          : el('button', { class: 'btn big', onclick: doAway }, '부재'),
        el('button', { class: `btn big${away ? '' : ' primary'}`, onclick: () => { view = 'clockout'; renderWork(); } }, '퇴근'),
      ),
    );
    return;
  }

  // 출근 전: 왼쪽 카드가 곧 "오늘" 칸. 오른쪽 대기 목록에서 카드를 끌어(또는 "오늘로") 올려 두고 출근 도장을 찍는다.
  // 위치가 곧 상태 — 왼쪽에 있으면 오늘 할 일, 오른쪽에 있으면 대기. 고르기용 체크박스는 없다.
  syncTray();
  if (S.todayDay) {
    c.append(
      el('span', { class: 'status-badge closed' }, '퇴근 완료'),
      el('h2', {}, `Day ${S.todayDay.day} — ${S.todayDay.summary}`),
      el('p', { class: 'muted' }, `오늘 ${fmtHours(S.todayDay.hours)} · ${S.todayDay.sessions.join(', ')}`),
      renderTray(),
      el('div', { class: 'actions' },
        el('button', { class: 'btn', onclick: () => openDevlog(S.today) }, '오늘 일지 보기'),
        el('button', { class: 'btn primary big', onclick: doClockIn }, '다시 출근'),
      ),
    );
    return;
  }

  c.append(
    el('span', { class: 'status-badge idle' }, '퇴근 상태'),
    el('h2', {}, `Day ${S.nextDayNumber}을 시작할까요?`),
    el('p', { class: 'muted' }, '오른쪽 대기 목록에서 카드를 끌어 오늘 할 일을 올려 두고 출근 도장을 찍으세요. 출근하면 오늘 날짜의 데브로그 파일이 생깁니다.'),
    renderTray(),
    el('div', { class: 'actions' },
      el('button', { class: 'btn primary big', onclick: doClockIn }, '출근 도장 찍기'),
    ),
  );
}

// ── 출근 전 "오늘" 칸 (tray) ──
// 순서·추천은 서버(state.pick)가 정한다. 화면은 tray(사용자 순서)와 대기 목록(서버 순서)을 보여 주고 카드를 옮길 뿐이다.

/** tray 초기화·정리: 처음이면 서버 추천 1장을 올려 두고 시작, 목록에서 사라진 항목은 뺀다 */
function syncTray() {
  const pick = S.pick || { items: [], preselect: null };
  if (tray === null) tray = pick.preselect ? [pick.preselect] : [];
  tray = tray.filter((text) => pick.items.some((t) => sameTask(t.text, text)));
}
/** tray 본문들을 Task 객체로 (사용자 순서 유지) */
const trayItems = () => tray.map((text) => S.pick.items.find((t) => sameTask(t.text, text))).filter(Boolean);
/** 대기 목록 = 서버가 정한 순서에서 tray 에 올라간 것을 뺀 나머지 */
const backlogItems = () => S.pick.items.filter((t) => !tray.some((x) => sameTask(x, t.text)));
/** tray 의 index 자리에 넣는다 (이미 있으면 그 자리에서 빼서 옮김) */
function trayInsert(text, index) {
  const cur = tray.findIndex((x) => sameTask(x, text));
  if (cur >= 0) { tray.splice(cur, 1); if (cur < index) index--; }
  tray.splice(Math.max(0, Math.min(index, tray.length)), 0, text);
}
const trayRemove = (text) => { tray = tray.filter((x) => !sameTask(x, text)); };
/** 드롭 위치: 포인터가 어느 카드의 위쪽 절반에 있으면 그 카드 앞, 아니면 맨 뒤 */
function dropIndex(ul, y) {
  const rows = [...ul.querySelectorAll('li[data-text]')];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].getBoundingClientRect();
    if (y < r.top + r.height / 2) return i;
  }
  return rows.length;
}
const rerenderIdle = () => { renderWork(); renderTodos(); };

// 드래그: 브라우저 기본 API. 카드(li)에서 시작해 tray 또는 오른쪽 카드에 놓는다
function startDrag(e, text, from) {
  drag = { text, from };
  e.dataTransfer.setData('text/plain', text);
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}
function endDrag(e) {
  e.currentTarget.classList.remove('dragging');
  drag = null;
  $('#todo-card').classList.remove('over');
}
const nextTag = (t) => (t.reason === 'next' ? el('span', { class: 'tag next' }, '어제 이어가기') : null);

/** 왼쪽 "오늘" 칸. 드롭 = 올리기·순서 바꾸기, "−" = 대기로 내리기 */
function renderTray() {
  const items = trayItems();
  const max = S.config.maxPick;
  const over = items.length > max;
  const ul = el('ul', {
    class: `list tray${items.length ? '' : ' empty'}`,
    ondragover: (e) => { if (!drag) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; ul.classList.add('over'); },
    ondragleave: (e) => { if (!ul.contains(e.relatedTarget)) ul.classList.remove('over'); },
    ondrop: (e) => { e.preventDefault(); ul.classList.remove('over'); if (!drag) return; trayInsert(drag.text, dropIndex(ul, e.clientY)); drag = null; rerenderIdle(); },
  });
  for (const t of items) {
    ul.append(el('li', { draggable: 'true', 'data-text': t.text, ondragstart: (e) => startDrag(e, t.text, 'tray'), ondragend: endDrag },
      el('span', { class: 'grip', title: '끌어서 순서 바꾸기' }, '⋮⋮'),
      taskLabel(t, { tags: nextTag(t) }),
      el('button', { class: 'icon-btn', title: '대기 목록으로 내리기', onclick: () => { trayRemove(t.text); rerenderIdle(); } }, '−'),
    ));
  }
  if (!items.length) ul.append(el('li', { class: 'placeholder' }, `오른쪽 대기 목록에서 카드를 끌어 오세요 · ${max}개 이하 권장 · 고르지 않고 출근해도 됩니다`));
  return el('div', { class: 'tray-wrap' },
    el('div', { class: 'tray-head' },
      el('span', { class: 'field-label' }, '오늘 할 일'),
      el('span', { class: `muted small-text${over ? ' warn' : ''}` }, `${items.length}/${max}${over ? ' · 권장 개수를 넘었습니다' : ''}`),
    ),
    ul,
  );
}

/** 출근 전 오른쪽 = 대기 목록 (서버 순서). 끌거나 "오늘로"로 왼쪽에 올린다. 완료 체크는 여기 없다 — 실수로 완료되는 걸 막는다 */
function renderBacklog(ul, extra) {
  syncTray();
  const pick = S.pick;
  $('#todo-hint').textContent = '왼쪽 "오늘 할 일"로 끌어 올리거나 "오늘로"를 누르세요. 순서는 진행 중 → 어제 이어가기 → 열림.';
  $('#todo-hint').hidden = false;
  const rest = backlogItems();
  for (const t of rest) {
    ul.append(el('li', { draggable: 'true', 'data-text': t.text, ondragstart: (e) => startDrag(e, t.text, 'backlog'), ondragend: endDrag },
      el('span', { class: 'grip', title: '끌어서 오늘로' }, '⋮⋮'),
      taskLabel(t, { tags: nextTag(t) }),
      el('span', { class: 'li-actions' },
        el('button', { class: 'btn small', onclick: () => { trayInsert(t.text, tray.length); rerenderIdle(); } }, '오늘로'),
        el('button', { class: 'icon-btn danger', title: '삭제', onclick: () => confirm(`삭제할까요?\n${t.text}`) && todo('remove', t.text) }, '×'),
      ),
    ));
  }
  if (!rest.length) ul.append(el('li', { class: 'muted' }, tray.length ? '대기 중인 할 일이 없습니다.' : '할 일이 없습니다. 위에서 추가하세요.'));
  if (pick.unmatched.length) extra.append(el('p', { class: 'muted small-text' }, `어제 적은 것 중 목록에 없음: ${pick.unmatched.join(' · ')}`));
  if (pick.hold.length) {
    // 보류는 접어 둔다. 펼치면 항목마다 "해제" → 열림으로 되돌아와 대기 목록에 다시 나타난다
    const det = el('details', { class: 'hold' }, el('summary', {}, `보류 ${pick.hold.length}개`));
    const hl = el('ul', { class: 'list' });
    for (const t of pick.hold) {
      hl.append(el('li', {}, taskLabel(t), el('button', { class: 'btn small', title: '열림으로 되돌리기', onclick: () => todo('status', t.text, { status: 'open' }) }, '해제')));
    }
    det.append(hl);
    extra.append(det);
  }
}

async function doClockIn() {
  try {
    const r = await api('/api/clockin', { picked: tray || [] }); // tray 순서 = 오늘 할 일 순서로 기록
    tray = null;
    view = 'idle';
    S = r.state;
    render();
    stamp('출근', 'green');
  } catch (e) {
    toast(e.message, true);
  }
}

/** 부재: 세션을 닫고 시간 계산에서 빠지게. 돌아가던 뽀모도로는 멈춘다 */
async function doAway() {
  try {
    const r = await api('/api/away', {});
    S = r.state;
    render();
    stamp('부재', 'yellow');
  } catch (e) {
    toast(e.message, true);
  }
}

/** 복귀: 새 세션을 연다 */
async function doBack() {
  try {
    const r = await api('/api/back', {});
    S = r.state;
    render();
    stamp('복귀', 'green');
  } catch (e) {
    toast(e.message, true);
  }
}

/**
 * 출근 뒤 왼쪽 "오늘 할 일". 줄마다 [완료 | 진행 중 | 내일로] — 누르는 즉시 todo.md 에 저장된다 (퇴근은 확인 도장일 뿐).
 *   완료   → [x] + 데브로그 done
 *   진행 중 → [/] + "어디까지" 한 줄(선택)
 *   내일로 → 열림 그대로 (진행 메모가 있었으면 메모 줄로 보존) → 내일 아침 "어제 이어가기"
 * 기본값은 현재 상태(열림=내일로, 진행 중=진행 중)라서 완료만 직접 누르면 된다 — 손 안 댄 항목이 진행 중으로 남지 않는다.
 */
let focusNote = null; // 방금 "진행 중"을 고른 항목 — 다시 그린 뒤 메모 칸에 커서를 둔다
function renderPickedList() {
  const ul = el('ul', { class: 'list picked' });
  for (const text of S.active.picked) {
    const isDone = S.active.done.some((d) => sameTask(d, text));
    const info = S.todos.open.find((x) => sameTask(x.text, text)) || S.todos.done.find((x) => sameTask(x.text, text)) || { status: 'open', text, note: '' };
    const status = isDone || info.status === 'done' ? 'done' : info.status === 'doing' ? 'doing' : 'open';
    const seg = (label, value, title) => el('button', {
      type: 'button', class: `seg-btn${status === value ? ` on ${value}` : ''}`, 'data-status': value, title,
      onclick: () => setToday(text, value, info),
    }, label);
    const li = el('li', { class: `today-row${status === 'done' ? ' is-done' : ''}` },
      taskLabel({ ...info, text, note: status === 'doing' ? '' : info.note }), // 진행 중이면 메모는 아래 입력칸에
      el('div', { class: 'seg' },
        seg('완료', 'done', '끝냈다'),
        seg('진행 중', 'doing', '손은 댔는데 안 끝났다 — 어디까지 했는지 한 줄'),
        seg('내일로', 'open', '오늘 못 했다 — 내일 아침 이어가기로 올라온다'),
      ),
      el('button', { class: 'icon-btn', title: '오늘 목록에서 빼기', onclick: () => todo('unpick', text) }, '−'),
    );
    if (status === 'doing') {
      const input = el('input', {
        type: 'text', class: 'note-input', value: info.note || '', placeholder: '어디까지 했나요? (선택) — Enter 로 저장',
        onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } },
        onchange: (e) => todo('status', text, { status: 'doing', note: e.target.value.trim() }),
      });
      li.append(input);
      if (focusNote && sameTask(focusNote, text)) { focusNote = null; setTimeout(() => input.focus(), 0); }
    }
    ul.append(li);
  }
  if (!S.active.picked.length) ul.append(el('li', { class: 'muted' }, '오늘 고른 할 일이 없습니다.'));
  return ul;
}

/** [완료 | 진행 중 | 내일로] 누름. 내일로는 열림으로 되돌리되 진행 메모는 버리지 않는다(메모 줄로 남음) */
function setToday(text, value, info) {
  if (value === 'done') return todo('done', text);
  if (value === 'doing') { focusNote = text; return todo('status', text, { status: 'doing', note: info.note || '' }); }
  return todo('status', text, { status: 'open', note: info.status === 'doing' ? info.note : '' });
}

function renderAddToToday() {
  const rest = S.todos.open.filter((t) => !S.active.picked.some((p) => sameTask(p, t.text)));
  const det = el('details', { class: 'add-today' }, el('summary', {}, `오늘 할 일에 추가 (${rest.length})`));
  const ul = el('ul', { class: 'list' });
  for (const t of rest) {
    ul.append(el('li', {}, taskLabel(t), el('button', { class: 'btn small', onclick: () => todo('pick', t.text) }, '오늘로')));
  }
  if (!rest.length) ul.append(el('li', { class: 'muted' }, '남은 할 일이 없습니다.'));
  det.append(ul);
  return det;
}

/** 뽀모도로 패널 (근무 중일 때만). 대기 / 집중 / 휴식 세 모습 */
function renderPomodoro() {
  const cfg = pomoCfg();
  const pomo = S.pomo;
  const count = S.active.pomodoros || 0;
  const box = el('div', { class: 'pomo' });
  const head = (label) => el('div', { class: 'pomo-head' },
    el('span', { class: 'pomo-label' }, label),
    el('span', { class: 'muted small-text' }, `오늘 ${count}개 완료`),
  );
  if (!pomo) {
    box.append(
      head('뽀모도로'),
      el('div', { class: 'pomo-row' },
        el('button', { class: 'btn primary', onclick: () => pomoAction('start') }, `집중 시작 · ${cfg.focus}분`),
        el('span', { class: 'muted small-text' }, `${cfg.focus}분이 끝나면 윈도우 알림과 소리가 울리고 ${cfg.break}분 휴식이 이어집니다. 크롬을 꺼도 됩니다.`),
        el('button', { class: 'btn small', onclick: () => pomoAction('test') }, '알림 테스트'),
      ),
    );
    return box;
  }
  const isFocus = pomo.phase === 'focus';
  box.classList.add(isFocus ? 'focus' : 'break');
  box.append(
    head(isFocus ? '집중 중' : '휴식 중'),
    el('div', { class: 'pomo-time', id: 'pomo-time' }, fmtClock(pomoRemaining())),
    el('div', { class: 'pomo-bar' }, el('div', { class: 'pomo-fill', id: 'pomo-fill', style: `width:${pomoProgress()}%` })),
    el('div', { class: 'pomo-row' },
      el('button', { class: 'btn small', onclick: () => pomoAction('stop') }, isFocus ? '중지' : '휴식 끝내기'),
      el('span', { class: 'muted small-text' }, isFocus ? '끝나면 서버가 윈도우 알림과 소리로 알립니다. 이 창을 닫아도 됩니다.' : '끝나면 알림이 오고, 다음 집중은 버튼으로 시작합니다.'),
    ),
  );
  return box;
}

const field = (label, input) => el('label', { class: 'field' }, el('span', { class: 'field-label' }, label), input);
const textarea = (name, value) => el('textarea', { name, rows: 3, value, placeholder: '줄마다 하나씩' });

function renderClockOutForm(c) {
  const d = S.active;
  const f = el('form', { class: 'clockout', onsubmit: doClockOut });
  f.append(
    el('h2', {}, `Day ${d.day} 퇴근 보고`),
    field('오늘을 한 줄로 (필수)', el('input', { name: 'title', type: 'text', required: true, value: d.summary || '', placeholder: '예: 출근부 v1 완성, 첫 퇴근' })),
    field('한 일', textarea('did', uniq([...d.did, ...d.done]).join('\n'))),
    field('배운 것', textarea('learned', d.learned.join('\n'))),
    field('막힌 것', textarea('blocked', d.blocked.join('\n'))),
    field('다음에 할 것', textarea('next', d.next.join('\n'))),
    el('p', { class: 'muted small-text' },
      '줄마다 하나씩 적으면 목록으로 저장됩니다.' + (S.config.autoPush ? ' 퇴근하면 데이터 폴더만 커밋·푸시됩니다.' : ''),
    ),
    el('div', { class: 'actions' },
      el('button', { type: 'button', class: 'btn', onclick: () => { view = 'idle'; renderWork(); } }, '취소'),
      el('button', { type: 'submit', class: 'btn primary big' }, '퇴근 도장 찍기'),
    ),
  );
  c.append(f);
  f.querySelector('input[name=title]').focus();
}

async function doClockOut(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = Object.fromEntries(['title', 'did', 'learned', 'blocked', 'next'].map((k) => [k, fd.get(k) || '']));
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = '저장 중…';
  try {
    const r = await api('/api/clockout', body);
    view = 'idle';
    S = r.state;
    tray = null; // 다음 출근의 "오늘" 칸은 새 추천으로 다시 시작
    updateTitle();
    render();
    const d = r.day;
    stamp('퇴근', 'green', {
      message: '오늘도 수고하셨습니다!',
      sub: `Day ${d.day} · ${fmtDuration(d.workedMinutes)}${d.pomodoros ? ` · 뽀모도로 ${d.pomodoros}개` : ''}`,
      duration: 3200,
      confetti: true,
    });
    const g = r.git || {};
    const plus = r.added && r.added.length ? ` · 다음에 할 것 ${r.added.length}개를 할 일에 추가` : '';
    if (g.skipped) toast(`저장 완료${plus} (git 건너뜀: ${g.reason})`);
    else if (!g.ok) toast(`저장은 됐지만 git 커밋 실패: ${g.error}`, true);
    else if (g.nothing) toast(`저장 완료${plus} · 커밋할 변경 없음`);
    else if (g.pushed) toast(`저장 · 커밋 · 푸시 완료${plus}`);
    else toast(`저장 · 커밋 완료${plus}, 푸시 실패: ${g.error}`, true);
  } catch (err) {
    toast(err.message, true);
    btn.disabled = false;
    btn.textContent = '퇴근 도장 찍기';
  }
}

// ── 할 일 카드 ──
function renderTodos() {
  const ul = $('#todo-list');
  ul.innerHTML = '';
  const extra = $('#todo-extra');
  extra.innerHTML = '';
  renderDoneList();
  if (!S.active) return renderBacklog(ul, extra); // 출근 전 = 대기 목록 (끌어서 오늘로)
  $('#todo-hint').hidden = true;
  const isPicked = (t) => !!S.active && S.active.picked.some((p) => sameTask(p, t.text));
  for (const t of S.todos.open) {
    ul.append(el('li', { class: isPicked(t) ? 'is-picked' : '' },
      el('label', {},
        el('input', { type: 'checkbox', onchange: () => todo('done', t.text) }),
        taskLabel(t),
      ),
      el('span', { class: 'li-actions' },
        S.active && !isPicked(t) ? el('button', { class: 'icon-btn', title: '오늘 할 일로', onclick: () => todo('pick', t.text) }, '+') : null,
        el('button', { class: 'icon-btn danger', title: '삭제', onclick: () => confirm(`삭제할까요?\n${t.text}`) && todo('remove', t.text) }, '×'),
      ),
    ));
  }
  if (!S.todos.open.length) ul.append(el('li', { class: 'muted' }, '할 일이 없습니다.'));
}

/** 완료 접힘 목록 (체크를 풀면 되돌리기) — 출근 전후 공통 */
function renderDoneList() {
  const dl = $('#done-list');
  dl.innerHTML = '';
  for (const t of S.todos.done.slice(0, 15)) {
    dl.append(el('li', {}, el('label', {},
      el('input', { type: 'checkbox', checked: true, onchange: () => todo('undone', t.text) }),
      taskLabel(t, { date: t.noteDate }),
    )));
  }
  $('#done-count').textContent = S.todos.done.length ? `(${S.todos.done.length})` : '';
}

/** 할 일 조작. extra = { status, note } (action 'status' 일 때) */
async function todo(action, text, extra = {}) {
  try {
    const r = await api('/api/todos', { action, text, ...extra });
    S = r.state;
    render();
  } catch (e) {
    toast(e.message, true);
  }
}

$('#todo-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('#todo-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  await todo('add', text);
  input.focus();
});

// 출근 전: 왼쪽 "오늘" 칸의 카드를 오른쪽 카드 위에 놓으면 대기 목록으로 내려간다
{
  const card = $('#todo-card');
  card.addEventListener('dragover', (e) => {
    if (!drag || drag.from !== 'tray') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    card.classList.add('over');
  });
  card.addEventListener('dragleave', (e) => { if (!card.contains(e.relatedTarget)) card.classList.remove('over'); });
  card.addEventListener('drop', (e) => {
    if (!drag || drag.from !== 'tray') return;
    e.preventDefault();
    card.classList.remove('over');
    trayRemove(drag.text);
    drag = null;
    rerenderIdle();
  });
}

// ── 통계 ──
function computeStats() {
  const hours = hoursByDate();
  const today = parseDate(S.today);
  const weekStart = dateStr(addDays(today, -((today.getDay() + 6) % 7))); // 월요일
  const monthPrefix = S.today.slice(0, 7);
  let week = 0, month = 0, total = 0, days = 0;
  for (const [date, h] of Object.entries(hours)) {
    if (date >= weekStart && date <= S.today) week += h;
    if (date.startsWith(monthPrefix)) month += h;
    if (date >= S.config.seasonStart) { total += h; days += 1; }
  }
  // 연속 출근일: 오늘 기록이 아직 없으면 어제부터 거슬러 센다
  const has = new Set(S.days.map((d) => d.date));
  let streak = 0;
  let cur = has.has(S.today) ? today : addDays(today, -1);
  while (has.has(dateStr(cur))) { streak++; cur = addDays(cur, -1); }
  return { todayH: hours[S.today] || 0, week, month, total, days, streak };
}

const todayPomodoros = () => ((S.todayDay || {}).pomodoros || 0);

function renderStats() {
  const s = computeStats();
  const tile = (label, value, sub) => el('div', { class: 'tile' }, el('div', { class: 'tile-value' }, value), el('div', { class: 'tile-label' }, label), sub ? el('div', { class: 'tile-sub muted' }, sub) : null);
  const row = $('#stats-row');
  row.innerHTML = '';
  row.append(
    tile('오늘', fmtHours(s.todayH), todayPomodoros() ? `뽀모도로 ${todayPomodoros()}개` : null),
    tile('이번 주', fmtHours(s.week)),
    tile('이번 달', fmtHours(s.month)),
    tile('연속 출근', `${s.streak}일`),
    tile('시즌 누적', fmtHours(s.total), `${s.days}일 출근`),
  );
}

// ── 히트맵 ──
/** 색 단계: 기록이 없으면 0, 출근한 날은 1 + 넘은 경계 개수 (경계 4개면 5단계). 시간이 0이어도 최소 1 */
function level(h, hasRecord) {
  if (!hasRecord) return 0;
  return 1 + S.config.heatLevels.filter((t) => h >= t).length;
}

/**
 * 히트맵: 설정의 heatStart(시작 달)부터 앞으로 최소 53주. 왼쪽 = 시작, 오른쪽 = 미래.
 * 오늘이 그 범위를 넘어가면 오늘 주까지 열이 늘어난다(가로 스크롤). 아직 안 온 날은 흐린 빈 칸.
 */
function renderHeatmap() {
  const hours = hoursByDate();
  heatIndex = Object.fromEntries(S.days.map((d) => [d.date, d]));
  const GAP = 3, LEFT = 24, TOP = 18;
  const monday = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const today = parseDate(S.today);
  const heatStart = parseDate(S.config.heatStart);
  const start = monday(heatStart);                                   // 시작 달 첫 주의 월요일
  let windowEnd = new Date(heatStart.getFullYear() + 1, heatStart.getMonth(), heatStart.getDate() - 1); // 딱 1년 뒤 전날
  let end = monday(windowEnd);
  if (monday(today) > end) { end = monday(today); windowEnd = addDays(end, 6); } // 1년을 넘기면 오늘 주까지 늘림
  const WEEKS = Math.round((end - start) / (7 * 86400000)) + 1;
  // 칸 크기는 카드 너비에 맞춰 계산 → 위 통계 타일과 좌우 끝이 맞는다 (창 크기가 바뀌면 다시 그림)
  const avail = $('.heatmap-wrap').clientWidth || 1000;
  const STEP = Math.max(10, Math.floor((avail - LEFT) / WEEKS));
  const CELL = STEP - GAP;
  const width = LEFT + WEEKS * STEP, height = TOP + 7 * STEP;
  const ym = (d) => `${d.getFullYear()}.${pad2(d.getMonth() + 1)}`;
  $('#season-label').textContent = `${ym(heatStart)} ~ ${ym(windowEnd)} · 시즌 시작 ${S.config.seasonStart}`;

  let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="출근 히트맵">`;
  ['월', '화', '수', '목', '금', '토', '일'].forEach((name, r) => {
    svg += `<text class="hm-label" x="0" y="${TOP + r * STEP + CELL - 3}">${name}</text>`;
  });
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = addDays(start, w * 7);
    // 그 주에 1일이 들어 있으면 달 이름표. 첫 열은 시작일의 달로.
    let label = null;
    for (let r = 0; r < 7; r++) {
      const d = addDays(weekStart, r);
      if (d.getDate() === 1 && d >= heatStart && d <= windowEnd) { label = d.getMonth() + 1; break; }
    }
    if (w === 0 && label === null) label = heatStart.getMonth() + 1;
    if (label !== null) svg += `<text class="hm-label" x="${LEFT + w * STEP}" y="11">${label}월</text>`;

    for (let r = 0; r < 7; r++) {
      const d = addDays(weekStart, r);
      if (d < heatStart || d > windowEnd) continue; // 창 밖(시작 전·1년 뒤)은 빈자리로
      const ds = dateStr(d);
      const x = LEFT + w * STEP, y = TOP + r * STEP;
      if (ds > S.today) { // 미래: 흐린 빈 칸, 마우스 반응 없음
        svg += `<rect class="hm-cell lvl-0 future" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2"></rect>`;
        continue;
      }
      const lvl = level(hours[ds] || 0, !!heatIndex[ds]);
      const todayCls = ds === S.today ? ' today' : ''; // 오늘 칸은 테두리로 표시
      svg += `<rect class="hm-cell lvl-${lvl}${todayCls}" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" data-date="${ds}" tabindex="0" aria-label="${ds}"></rect>`;
    }
  }
  svg += '</svg>';
  $('#heatmap').innerHTML = svg;
}

/** 범례: 적게 [한 날의 단계 색들] 많이 — 글자 없이 색만. 경계 시간은 마우스를 올렸을 때 title 로만 */
function renderLegend() {
  const th = S.config.heatLevels;
  const lg = $('#legend');
  lg.innerHTML = '';
  lg.append(el('span', { class: 'muted' }, '적게'));
  for (let i = 1; i <= th.length + 1; i++) {
    const lo = th[i - 2], hi = th[i - 1];
    const name = i === 1 ? `${hi}h 미만` : hi === undefined ? `${lo}h 이상` : `${lo}~${hi}h`;
    lg.append(el('span', { class: `swatch lvl-${i}`, title: name }));
  }
  lg.append(el('span', { class: 'muted' }, '많이'));
}

function tooltipHtml(ds) {
  const d = heatIndex[ds];
  const h = hoursByDate()[ds] || 0;
  const year = ds.slice(0, 4) !== S.today.slice(0, 4) ? `${ds.slice(0, 4)}년 ` : ''; // 작년 칸은 연도도 표시
  const head = `<div class="tt-date">${year}${fmtDate(ds)}${d ? ` · Day ${d.day}` : ''}</div>`;
  if (!d) return head + '<div class="muted">출근 기록 없음</div>';
  const items = (d.did.length ? d.did : d.done).slice(0, 6);
  return (
    head +
    `<div class="tt-title">${esc(d.summary || '(퇴근 전)')}</div>` +
    `<div class="tt-hours">${fmtHours(h)}${d.status === 'open' ? ' · 출근 중' : d.status === 'away' ? ' · 부재 중' : ''}${d.pomodoros ? ` · 뽀모도로 ${d.pomodoros}` : ''}</div>` +
    (items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '')
  );
}

function showTooltip(target) {
  const ds = target.dataset.date;
  const tt = $('#tooltip');
  tt.innerHTML = tooltipHtml(ds);
  tt.hidden = false;
  const r = target.getBoundingClientRect();
  const pad = 8;
  let x = r.left + r.width / 2 - tt.offsetWidth / 2;
  let y = r.top - tt.offsetHeight - pad;
  x = Math.max(pad, Math.min(x, window.innerWidth - tt.offsetWidth - pad));
  if (y < pad) y = r.bottom + pad;
  tt.style.left = `${x}px`;
  tt.style.top = `${y}px`;
}
const hideTooltip = () => { $('#tooltip').hidden = true; };

const heat = $('#heatmap');
heat.addEventListener('pointerover', (e) => { const c = e.target.closest('.hm-cell'); if (c && c.dataset.date) showTooltip(c); });
heat.addEventListener('pointerout', (e) => { if (e.target.closest('.hm-cell')) hideTooltip(); });
heat.addEventListener('focusin', (e) => { const c = e.target.closest('.hm-cell'); if (c && c.dataset.date) showTooltip(c); });
heat.addEventListener('focusout', hideTooltip);
heat.addEventListener('click', (e) => { const c = e.target.closest('.hm-cell'); if (c && heatIndex[c.dataset.date]) openDevlog(c.dataset.date); });
heat.addEventListener('keydown', (e) => { const c = e.target.closest('.hm-cell'); if (c && e.key === 'Enter' && heatIndex[c.dataset.date]) openDevlog(c.dataset.date); });
$('.heatmap-wrap').addEventListener('scroll', hideTooltip);
let resizeTimer = null;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (S) renderHeatmap(); }, 150); });

// ── 지난 데브로그 ──
function renderHistory() {
  const ul = $('#history-list');
  ul.innerHTML = '';
  const days = [...S.days].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40);
  for (const d of days) {
    ul.append(el('li', {},
      el('button', { class: 'history-item', onclick: () => openDevlog(d.date) },
        el('span', { class: 'h-date' }, `${d.date.slice(0, 4) === S.today.slice(0, 4) ? d.date.slice(5) : d.date} (${WEEKDAYS[parseDate(d.date).getDay()]})`),
        el('span', { class: 'pill small' }, `Day ${d.day}`),
        el('span', { class: 'h-hours' }, d.status === 'open' ? '출근 중' : d.status === 'away' ? '부재 중' : fmtHours(d.hours)),
        el('span', { class: 'h-title' }, d.summary || '(퇴근 전)'),
      ),
    ));
  }
  if (!days.length) ul.append(el('li', { class: 'muted' }, '아직 데브로그가 없습니다. 첫 출근을 해보세요.'));
}

// ── 데브로그 보기 (모달) ──
async function openDevlog(date) {
  try {
    const { text } = await api(`/api/devlog/${date}`);
    const d = heatIndex[date] || S.days.find((x) => x.date === date);
    const body = $('#modal-body');
    body.innerHTML = '';
    body.append(
      el('div', { class: 'modal-meta muted' }, `${date.slice(0, 4)}년 ${fmtDate(date)}${d ? ` · Day ${d.day} · ${fmtHours(d.hours)} · ${d.sessions.join(', ')}` : ''}`),
      el('h2', { class: 'modal-title' }, d ? d.title : date),
    );
    const content = el('div', { class: 'md' });
    content.innerHTML = renderMarkdown(text);
    body.append(content, el('p', { class: 'muted small-text' }, `파일: production/desk/devlog/${date}.md`));
    $('#modal').hidden = false;
  } catch (e) {
    toast(e.message, true);
  }
}

$('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) $('#modal').hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#modal').hidden = true; });

/** 아주 작은 마크다운 변환기 (제목·목록·문단·굵게·코드·링크만) */
function renderMarkdown(text) {
  let body = text;
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end > 0) body = text.slice(end + 4);
  }
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  let html = '', inList = false, para = [];
  const flushPara = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trimEnd();
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flushPara(); closeList(); const lv = m[1].length + 1; html += `<h${lv}>${inline(m[2])}</h${lv}>`; continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { flushPara(); if (!inList) { html += '<ul>'; inList = true; } html += `<li>${inline(m[1])}</li>`; continue; }
    if (!line.trim()) { flushPara(); closeList(); continue; }
    para.push(line);
  }
  flushPara();
  closeList();
  return html;
}

// ── 도장 · 토스트 · 타이머 ──
/**
 * 도장 연출. kind = 'green'(출근·복귀·퇴근) | 'yellow'(부재) | 'red'
 * opts: { message, sub, duration(ms), confetti }
 */
let stampTimer = null;
function stamp(text, kind = 'red', opts = {}) {
  const s = $('#stamp');
  const dur = opts.duration || 1500;
  $('#stamp-text').textContent = text;
  $('#stamp-msg').textContent = opts.message || '';
  $('#stamp-sub').textContent = opts.sub || '';
  s.className = `stamp ${kind}${opts.message ? ' with-msg' : ''}`;
  s.style.setProperty('--stamp-dur', `${dur}ms`);
  s.hidden = false;
  void s.offsetWidth; // 애니메이션 재시작용
  s.classList.add('play');
  clearTimeout(stampTimer);
  stampTimer = setTimeout(() => { s.hidden = true; }, dur);
  if (opts.confetti) confetti();
}

/** 캔버스 컨페티 — 양쪽 아래 대포 두 발 + 위에서 내리는 색종이 비. 라이브러리 없음 */
function confetti(duration = 3000) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#confetti');
  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth, H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.width = `${W}px`; cv.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cv.hidden = false;
  const colors = ['#f2a93b', '#f7b955', '#5fcf6e', '#f3ede4', '#c8452f', '#fad599'];
  const parts = [];
  const push = (q) => parts.push(Object.assign({
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)], life: 1, phase: Math.random() * Math.PI * 2,
  }, q));
  const cannon = (x, y, dir) => {
    for (let i = 0; i < 80; i++) {
      const angle = -Math.PI / 2 + dir * (Math.PI / 7) + (Math.random() - 0.5) * (Math.PI / 4);
      const speed = 13 + Math.random() * 10;
      push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, g: 0.28, drag: 0.975 });
    }
  };
  cannon(W * 0.1, H * 0.95, 1);
  cannon(W * 0.9, H * 0.95, -1);
  const t0 = performance.now();
  function frame(t) {
    const p = (t - t0) / duration;
    if (p < 0.45) for (let i = 0; i < 3; i++) push({ x: Math.random() * W, y: -12, vx: (Math.random() - 0.5) * 1.5, vy: 2 + Math.random() * 3, g: 0.02, drag: 1 }); // 색종이 비
    ctx.clearRect(0, 0, W, H);
    for (const q of parts) {
      q.vy += q.g; q.vx *= q.drag; q.vy *= q.drag;
      q.x += q.vx + Math.sin(t / 180 + q.phase) * 0.6; q.y += q.vy; q.rot += q.vr;
      if (p > 0.7) q.life = Math.max(0, 1 - (p - 0.7) / 0.3);
      if (q.y > H + 20) continue;
      ctx.save();
      ctx.globalAlpha = q.life;
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.fillStyle = q.color;
      ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
      ctx.restore();
    }
    if (p < 1) requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, W, H); cv.hidden = true; }
  }
  requestAnimationFrame(frame);
}

let toastTimer = null;
function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, isError ? 7000 : 3500);
}

let tick = 0;
setInterval(() => {
  if (!S) return;
  if (S.active) {
    const e = $('#elapsed');
    if (e) e.textContent = fmtDuration(todayWorkedMinutes());
    const a = $('#away-elapsed');
    if (a) a.textContent = fmtDuration(awayMinutes());
    if (++tick % 60 === 0) { renderStats(); renderHeatmap(); }
  }
  if (S.pomo) {
    const t = $('#pomo-time');
    if (t) t.textContent = fmtClock(pomoRemaining());
    const f = $('#pomo-fill');
    if (f) f.style.width = `${pomoProgress()}%`;
    updateTitle();
    if (pomoRemaining() === 0) pomoPoll(); // 끝났으면 바로 서버 상태를 확인해 화면을 바꾼다
  }
}, 1000);

load().catch((e) => toast('서버에 연결할 수 없습니다: ' + e.message, true));
