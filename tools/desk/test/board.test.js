'use strict';
/*
 * 마일스톤 판 파일 테스트 — 실행: node --test tools/desk/test/board.test.js
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const board = require('../board');

const sample = () => ({
  savedAt: null,
  milestones: [{ id: 'M01', name: '기초', days: 23 }, { id: 'M02', name: '룸', days: 30 }],
  cards: [
    { id: 'a01', m: 'M01', l: 'a', t: '블렌더 강의 ③', d: 1, n: '설명' },
    { id: 'p01', m: 'M01', l: 'p', t: '살펴보기', d: 1 },
    { id: 'c01', m: 'M02', l: 'c', t: '촛불', d: 4, est: true },
  ],
});

test('serialize: 카드 하나가 한 줄, 되읽으면 같은 판', () => {
  const b = sample();
  const text = board.serialize(b);
  const lines = text.split('\n');
  assert.ok(lines.includes('    {"id":"a01","m":"M01","l":"a","t":"블렌더 강의 ③","d":1,"n":"설명"},'));
  assert.ok(lines.includes('    {"id":"c01","m":"M02","l":"c","t":"촛불","d":4,"est":true}'));
  assert.ok(text.endsWith('}\n'));
  assert.deepEqual(board.parse(text), b);
});

test('parse: milestones·cards 가 없으면 오류', () => {
  assert.throws(() => board.parse('{"cards":[]}'), /milestones/);
  assert.throws(() => board.parse('not json'));
});

test('version: 글이 같으면 같고, 한 글자라도 다르면 다르다', () => {
  const t = board.serialize(sample());
  assert.equal(board.version(t), board.version(t));
  assert.notEqual(board.version(t), board.version(t.replace('"d":4', '"d":5')));
});

test('withCards: 옮기고 날 수를 고친 카드는 받고, 마일스톤은 그대로', () => {
  const b = sample();
  const cards = b.cards.map((c) => ({ ...c }));
  cards[0].m = 'M02'; cards[0].d = 2.5;
  cards.reverse(); // 순서 바꾸기도 된다
  const next = board.withCards(b, cards, '2026-10-02 15:00');
  assert.equal(next.savedAt, '2026-10-02 15:00');
  assert.deepEqual(next.milestones, b.milestones);
  assert.equal(next.cards[2].m, 'M02');
  assert.deepEqual(Object.keys(next), ['savedAt', 'milestones', 'cards']); // 칸 순서 유지
});

test('withCards: 잘못된 카드는 거절', () => {
  const b = sample();
  const bad = (fn) => { const cards = b.cards.map((c) => ({ ...c })); fn(cards); return () => board.withCards(b, cards, 'x'); };
  assert.throws(bad((cs) => { cs[0].m = 'M09'; }), /없는 마일스톤/);
  assert.throws(bad((cs) => { cs[0].l = 'x'; }), /없는 갈래/);
  assert.throws(bad((cs) => { cs[0].d = -1; }), /날 수/);
  assert.throws(bad((cs) => { cs[0].d = '3'; }), /날 수/);
  assert.throws(bad((cs) => { cs[1].id = 'a01'; }), /두 번/);
  assert.throws(bad((cs) => { cs.pop(); }), /사라졌습니다/);
  assert.throws(bad((cs) => { cs[2].id = 'c99'; }), /사라졌습니다/);
});
