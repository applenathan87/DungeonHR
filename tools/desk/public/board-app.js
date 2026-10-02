/*
 * 마일스톤 판 — 화면 (2026-10-02, 아티팩트 판의 코드를 옮김)
 *
 * 서버(/api/board)에서 판을 받아 그리고, 카드를 끌어 옮기거나 날 수를 고친 뒤 「저장」을 누르면 서버로 보낸다.
 * 서버는 production/milestones/board.json 에 적는다. 판을 받을 때 같이 온 지문(version)을 저장할 때 돌려주어,
 * 그사이 파일이 바뀌었으면 서버가 거절한다(409).
 */
(function () {
  'use strict';
  var LANES = [{ k: 'a', name: '아트' }, { k: 'p', name: '기획' }, { k: 'c', name: '코드' }];
  var state = null;        // 지금 화면의 판 { savedAt, milestones, cards }
  var version = null;      // 받아 온 판 파일의 지문
  var moved = new Set();   // 저장 안 한 변경이 있는 카드
  var dirty = false, busy = false, selected = null;

  var board = document.getElementById('board');
  var saveBtn = document.getElementById('save');
  var discardBtn = document.getElementById('discard');
  var copyBtn = document.getElementById('copy');
  var statusEl = document.getElementById('status');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { n = +n || 0; return String(Math.round(n * 10) / 10); }
  function byId(id) { for (var i = 0; i < state.cards.length; i++) if (state.cards[i].id === id) return state.cards[i]; return null; }
  function sumOf(m, l) { return state.cards.filter(function (c) { return c.m === m && c.l === l; }).reduce(function (a, c) { return a + (+c.d || 0); }, 0); }

  // ── 서버와 주고받기 ──
  function api(method, body) {
    return fetch('/api/board', {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) { var e = new Error(data.error || ('오류 ' + r.status)); e.status = r.status; throw e; }
        return data;
      });
    });
  }

  /** 판을 서버에서 다시 받는다 (처음 열 때 · 「저장 안 한 변경 버리기」) */
  function load() {
    busy = true; updateControls();
    setStatus('판을 불러오는 중');
    return api('GET').then(function (data) {
      state = data.board; version = data.version;
      moved.clear(); dirty = false; selected = null; busy = false;
      if (data.file) document.getElementById('file-label').textContent = ' · ' + data.file;
      render();
    }, function (e) {
      busy = false; updateControls();
      setStatus('판을 불러오지 못했습니다: ' + e.message + '. 출근부 서버가 켜져 있는지 확인하세요', true);
    });
  }

  function save() {
    if (!dirty || busy) return;
    busy = true; updateControls();
    setStatus('저장하는 중');
    api('POST', { version: version, cards: state.cards }).then(function (data) {
      state = data.board; version = data.version;
      moved.clear(); dirty = false; busy = false;
      render();
      setStatus('저장했습니다 · ' + state.savedAt);
    }, function (e) {
      busy = false; updateControls();
      if (e.status === 409) setStatus('판을 연 뒤 다른 곳에서 판 파일이 바뀌어 저장하지 않았습니다. 「글로 복사」로 지금 판을 남겨 둔 뒤 「저장 안 한 변경 버리기」를 누르면 바뀐 판을 불러옵니다', true);
      else setStatus('저장하지 못했습니다: ' + e.message, true);
    });
  }

  // ── 그리기 ──
  function cardHTML(c) {
    var cls = 'card' + (c.est ? ' est' : '') + (moved.has(c.id) ? ' changed' : '') + (selected === c.id ? ' sel' : '');
    return '<li class="' + cls + '" draggable="true" tabindex="0" data-id="' + esc(c.id) + '">' +
      '<span class="t">' + esc(c.t) + (c.from ? ' <span class="from">' + esc(c.from) + '</span>' : '') +
      (c.n ? '<span class="cn">' + esc(c.n) + '</span>' : '') + '</span>' +
      '<button type="button" class="d" data-id="' + esc(c.id) + '" title="날 수 고치기">' + fmt(c.d) + '</button></li>';
  }

  function render() {
    var h = '';
    state.milestones.forEach(function (m, i) {
      var col = i + 1;
      h += '<section class="mhead" style="grid-column:' + col + ';grid-row:1">' +
        '<div class="mid">' + esc(m.id) + '</div><h2>' + esc(m.name) + '</h2>' +
        '<div class="range">' + esc(m.range) + ' · ' + (m.dn ? esc(m.dn) + ' ' : '') + m.days + '일</div>' +
        (m.split ? '<div class="split">하루 = ' + esc(m.split) + '</div>' : '') +
        '<p class="q">' + esc(m.q) + '</p>' + (m.note ? '<p class="mnote">' + esc(m.note) + '</p>' : '') + '</section>';
      LANES.forEach(function (L, j) {
        var cards = state.cards.filter(function (c) { return c.m === m.id && c.l === L.k; });
        var sum = sumOf(m.id, L.k), pct = m.days ? sum / m.days : 0;
        var lv = pct > 1 ? 'over' : pct > 0.85 ? 'tight' : 'ok';   // 85% 넘으면 노랑, 100% 넘으면 빨강
        var sel = selected ? byId(selected) : null;
        var showHere = sel && !(sel.m === m.id && sel.l === L.k);
        h += '<div class="cell lane-' + L.k + '" data-m="' + m.id + '" data-l="' + L.k + '" style="grid-column:' + col + ';grid-row:' + (j + 2) + '">' +
          '<div class="lhead"><span class="lname">' + L.name + '</span>' +
          (showHere ? '<button type="button" class="here">여기로</button>' : '') +
          '<span class="load ' + lv + '"><b>' + fmt(sum) + '</b> / ' + m.days + '일</span></div>' +
          '<div class="meter ' + lv + '"><i style="width:' + Math.min(100, pct * 100).toFixed(1) + '%"></i></div>' +
          '<ul class="cards">' + cards.map(cardHTML).join('') + '</ul></div>';
      });
    });
    board.innerHTML = h;
    updateControls();
    showState();
  }

  function setStatus(t, isErr) { statusEl.textContent = t; statusEl.classList.toggle('err', !!isErr); }
  function updateControls() {
    saveBtn.disabled = !dirty || busy;
    discardBtn.disabled = !dirty || busy;
    copyBtn.disabled = !state;
  }
  /** 평소 상태 글 (저장 안 한 변경 수 / 마지막 저장) */
  function showState() {
    if (dirty) setStatus('저장 안 한 변경 ' + moved.size + '개');
    else if (state.savedAt) setStatus('마지막 저장 ' + state.savedAt);
    else setStatus('처음 그림 그대로입니다');
  }

  // 카드를 옮긴다: beforeId 앞에, 없으면 그 칸의 맨 끝에
  function moveCard(id, m, l, beforeId) {
    var arr = state.cards, i = arr.findIndex(function (c) { return c.id === id; });
    if (i < 0) return;
    var c = arr.splice(i, 1)[0];
    c.m = m; c.l = l;
    var at = -1;
    if (beforeId && beforeId !== id) at = arr.findIndex(function (x) { return x.id === beforeId; });
    if (at < 0) {
      var last = -1;
      arr.forEach(function (x, k) { if (x.m === m && x.l === l) last = k; });
      at = last >= 0 ? last + 1 : arr.length;
    }
    arr.splice(at, 0, c);
    moved.add(id); dirty = true; selected = null;
    render();
  }

  // ── 끌어서 옮기기 ──
  var dragId = null, mark = document.createElement('li');
  mark.className = 'drop-mark';
  function beforeCard(ul, y) {
    var items = ul.querySelectorAll('.card:not(.dragging)');
    for (var i = 0; i < items.length; i++) {
      var r = items[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return items[i];
    }
    return null;
  }
  function clearTargets() { board.querySelectorAll('.cell.over-target').forEach(function (x) { x.classList.remove('over-target'); }); }
  board.addEventListener('dragstart', function (e) {
    var c = e.target.closest && e.target.closest('.card');
    if (!c) return;
    dragId = c.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {}
    c.classList.add('dragging');
  });
  board.addEventListener('dragend', function () {
    dragId = null; mark.remove(); clearTargets();
    board.querySelectorAll('.dragging').forEach(function (x) { x.classList.remove('dragging'); });
  });
  board.addEventListener('dragover', function (e) {
    if (!dragId) return;
    var cell = e.target.closest && e.target.closest('.cell');
    if (!cell) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var ul = cell.querySelector('.cards'), before = beforeCard(ul, e.clientY);
    if (before) ul.insertBefore(mark, before); else ul.appendChild(mark);
    if (!cell.classList.contains('over-target')) { clearTargets(); cell.classList.add('over-target'); }
  });
  board.addEventListener('drop', function (e) {
    if (!dragId) return;
    var cell = e.target.closest && e.target.closest('.cell');
    if (!cell) return;
    e.preventDefault();
    var next = mark.nextElementSibling;
    while (next && !(next.classList.contains('card') && !next.classList.contains('dragging'))) next = next.nextElementSibling;
    var id = dragId;
    dragId = null; mark.remove(); clearTargets();
    moveCard(id, cell.dataset.m, cell.dataset.l, next ? next.dataset.id : null);
  });

  // ── 누르기: 날 수 고치기 / 카드 고르기 / 여기로 옮기기 ──
  board.addEventListener('click', function (e) {
    var d = e.target.closest('button.d');
    if (d) { editDays(d); return; }
    var here = e.target.closest('button.here');
    if (here && selected) { var cell = here.closest('.cell'); moveCard(selected, cell.dataset.m, cell.dataset.l, null); return; }
    var card = e.target.closest('.card');
    if (card) { selected = selected === card.dataset.id ? null : card.dataset.id; render(); }
  });
  board.addEventListener('keydown', function (e) {
    var card = e.target.closest && e.target.closest('.card');
    if (card && (e.key === 'Enter' || e.key === ' ') && e.target === card) {
      e.preventDefault(); selected = selected === card.dataset.id ? null : card.dataset.id; render();
    }
  });

  function editDays(btn) {
    var c = byId(btn.dataset.id);
    if (!c) return;
    var inp = document.createElement('input');
    inp.type = 'number'; inp.min = '0'; inp.step = '0.5'; inp.value = c.d; inp.className = 'd-in';
    inp.id = 'days-' + c.id; inp.setAttribute('aria-label', c.t + ' 날 수');
    btn.replaceWith(inp); inp.focus(); inp.select();
    var done = false;
    function commit(ok) {
      if (done) return; done = true;
      if (ok) {
        var v = parseFloat(inp.value);
        // 날 수를 손으로 고치면 더 이상 Claude 어림이 아니다 → 점선 테두리를 뗀다
        if (isFinite(v) && v >= 0 && v !== c.d) { c.d = v; delete c.est; moved.add(c.id); dirty = true; }
      }
      render();
    }
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') commit(true); if (ev.key === 'Escape') commit(false); });
    inp.addEventListener('blur', function () { commit(true); });
  }

  // ── 단추들 ──
  saveBtn.addEventListener('click', save);
  discardBtn.addEventListener('click', load);   // 서버의 판을 다시 받는다 — 다른 곳에서 고친 판도 이걸로 불러온다

  function asText() {
    var out = [];
    state.milestones.forEach(function (m) {
      out.push(m.id + ' ' + m.name + ' (' + m.range + ', ' + m.days + '일)');
      LANES.forEach(function (L) {
        out.push('  ' + L.name + ' ' + fmt(sumOf(m.id, L.k)) + '/' + m.days);
        state.cards.filter(function (c) { return c.m === m.id && c.l === L.k; }).forEach(function (c) {
          out.push('    - ' + c.t + ' (' + fmt(c.d) + (c.est ? ' 어림' : '') + ')');
        });
      });
    });
    return out.join('\n');
  }
  copyBtn.addEventListener('click', function () {
    var t = asText(), box = document.getElementById('textout');
    function show() { box.value = t; box.hidden = false; box.focus(); box.select(); setStatus('아래 글을 선택해 두었습니다. 복사해서 대화창에 붙여 넣으세요'); }
    try {
      navigator.clipboard.writeText(t).then(function () { setStatus('글로 복사했습니다. 대화창에 붙여 넣으면 됩니다'); }, show);
    } catch (_) { show(); }
  });

  // 저장 안 한 변경이 있는데 판을 떠나려 하면 브라우저가 한 번 묻는다
  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  load();
})();
