'use strict';
/*
 * 마일스톤 판 파일(production/milestones/board.json) 읽기·쓰기·검사 (2026-10-02)
 *
 * 판 = { savedAt, milestones: [...], cards: [...] }
 *   마일스톤: { id, name, range, days, dn?(날 수 앞 말), split?(하루 시간 나누기), q(끝날 때 질문), note? }
 *   카드:     { id, m(마일스톤 id), l(갈래 a=아트 p=기획 c=코드), t(이름), d(날 수), est?(Claude 어림), from?(당겨 온 곳), n?(회색 설명) }
 * 파일은 마일스톤·카드 하나를 한 줄에 적는다 — git 에서 바뀐 카드만 한 줄로 보이고, 손이나 Claude 가 고치기 쉽다.
 */
const crypto = require('crypto');

const LANES = ['a', 'p', 'c'];

/** 판 → 파일 글. 맨 위 칸은 한 줄씩, 배열 칸(milestones·cards)은 항목 하나를 한 줄에 */
function serialize(board) {
  const keys = Object.keys(board);
  const lines = ['{'];
  keys.forEach((k, i) => {
    const v = board[k];
    const comma = i < keys.length - 1 ? ',' : '';
    if (Array.isArray(v) && v.length) {
      lines.push(`  ${JSON.stringify(k)}: [`);
      v.forEach((item, j) => lines.push(`    ${JSON.stringify(item)}${j < v.length - 1 ? ',' : ''}`));
      lines.push(`  ]${comma}`);
    } else {
      lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)}${comma}`);
    }
  });
  lines.push('}');
  return lines.join('\n') + '\n';
}

/** 파일 글 → 판. milestones·cards 가 없으면 오류 */
function parse(text) {
  const board = JSON.parse(text);
  if (!board || !Array.isArray(board.milestones) || !Array.isArray(board.cards)) {
    throw new Error('판 파일에 milestones·cards 가 없습니다');
  }
  return board;
}

/** 파일 글의 지문 — 화면이 불러온 뒤 다른 곳(손·Claude·맥북에서 pull)에서 파일이 바뀌었는지 알아보는 데 쓴다 */
const version = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);

/** 화면이 보낸 카드 목록 검사. 판 화면은 카드를 옮기고 날 수만 고치므로, 카드가 생기거나 사라지면 거절한다 */
function checkCards(cards, board) {
  if (!Array.isArray(cards)) throw new Error('카드 목록이 없습니다');
  const ms = new Set(board.milestones.map((m) => m.id));
  const seen = new Set();
  for (const c of cards) {
    if (!c || typeof c.id !== 'string' || !c.id) throw new Error('id 가 없는 카드가 있습니다');
    if (seen.has(c.id)) throw new Error('같은 id 가 두 번 나옵니다: ' + c.id);
    seen.add(c.id);
    if (!ms.has(c.m)) throw new Error(`${c.id}: 없는 마일스톤 ${c.m}`);
    if (!LANES.includes(c.l)) throw new Error(`${c.id}: 없는 갈래 ${c.l}`);
    if (typeof c.t !== 'string' || !c.t.trim()) throw new Error(`${c.id}: 이름이 비어 있습니다`);
    if (typeof c.d !== 'number' || !Number.isFinite(c.d) || c.d < 0) throw new Error(`${c.id}: 날 수가 잘못됐습니다`);
  }
  const before = board.cards.map((c) => c.id);
  if (before.length !== seen.size || before.some((id) => !seen.has(id))) {
    throw new Error('카드가 생기거나 사라졌습니다. 판을 다시 불러오세요');
  }
}

/** 카드만 바꾼 새 판. 마일스톤 같은 다른 칸은 파일에 있던 그대로 둔다 */
function withCards(board, cards, savedAt) {
  checkCards(cards, board);
  return Object.assign({}, board, { savedAt, cards });
}

module.exports = { LANES, serialize, parse, version, checkCards, withCards };
