'use strict';
/*
 * todo.md 파서 테스트 — Node 내장 node:test 사용 (의존성 0)
 * 실행: node --test tools/desk/test/todo.test.js
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const todo = require('../todo');

const D = '2026-09-13';

/** 손으로 고친 흔적이 잔뜩 있는 파일 */
const MESSY = [
  '﻿# 할 일',
  '',
  '> 안내문. 앱이 모르는 줄.',
  '<!-- 주석도 남아야 한다 -->',
  '',
  '## 할 일',
  '- [ ] [M00-01] 출근부: 이어가기',
  '- [/] [M00-02] 마일스톤 읽기',
  '  > 진행: 파서만 남음 · 2026-09-12',
  '  참고: 이 줄은 메모가 아니라 그냥 이어지는 줄',
  '- [?] 뭔지 모르는 상태',
  '- [>] 스트림덱 설정',
  '  > 보류: 장비 도착 후 · 2026-09-11',
  '- [ ] 콜로소 강의듣기',
  '  - [ ] 들여쓴 하위 항목은 이어지는 줄로 보존',
  '',
  '아무 문장이나 적어 둠',
  '',
  '## 완료',
  '- [x] 고블린 모델링 (2026-09-09)',
  '- [-] 테스트 UI',
  '  > 취소: 필요 없음 · 2026-09-10',
  '',
].join('\r\n');

test('손 안 댄 파일은 BOM 만 빼고 바이트 그대로 (CRLF 유지)', () => {
  const doc = todo.parse(MESSY);
  assert.equal(todo.serialize(doc), MESSY.replace(/^﻿/, ''));
});

test('상태·id·메모·이어지는 줄을 읽는다', () => {
  const t = todo.tasksOf(todo.parse(MESSY));
  assert.deepEqual(t.map((x) => x.status), ['open', 'doing', 'unknown', 'hold', 'open', 'done', 'cancelled']);
  assert.equal(t[0].id, 'M00-01');
  assert.equal(t[1].note, '파서만 남음');
  assert.equal(t[1].noteDate, '2026-09-12');
  assert.deepEqual(t[1].extra, ['  참고: 이 줄은 메모가 아니라 그냥 이어지는 줄']);
  assert.equal(t[2].marker, '?');
  assert.equal(t[4].extra.length, 1); // 들여쓴 하위 항목
  assert.equal(t[5].text, '고블린 모델링'); // ver01 날짜 꼬리표 분리
  assert.equal(t[5].noteDate, '2026-09-09');
  assert.equal(t[5].section, '완료');
  assert.equal(t[0].section, '할 일');
});

test('split: 진행 중 → 열림 → 모름 → 보류 순, 완료·취소는 done 으로', () => {
  const { open, done } = todo.split(todo.parse(MESSY));
  assert.deepEqual(open.map((x) => x.status), ['doing', 'open', 'open', 'unknown', 'hold']);
  assert.deepEqual(done.map((x) => x.status), ['done', 'cancelled']);
  assert.equal(open[0].note, '파서만 남음');
});

test('완료 처리: 완료 절 맨 위로 옮기고 메모 줄에 날짜, 나머지 줄은 그대로', () => {
  const doc = todo.parse(MESSY);
  const b = todo.findTask(doc, '[M00-02] 마일스톤 읽기');
  todo.setStatus(doc, b, 'done', '', D);
  const out = todo.serialize(doc);
  const lines = out.split('\r\n');
  const i = lines.indexOf('## 완료');
  assert.equal(lines[i + 1], '- [x] [M00-02] 마일스톤 읽기');
  assert.equal(lines[i + 2], `  > 완료: ${D}`);
  assert.equal(lines[i + 3], '  참고: 이 줄은 메모가 아니라 그냥 이어지는 줄'); // extra 보존
  assert.ok(!lines.slice(0, i).some((l) => l.includes('M00-02')), '할 일 절에서는 사라져야');
  assert.ok(out.includes('<!-- 주석도 남아야 한다 -->'));
  assert.ok(out.includes('- [?] 뭔지 모르는 상태'));
  assert.ok(out.includes('아무 문장이나 적어 둠'));
});

test('되돌리기: 완료 절의 항목을 열면 할 일 절 맨 위로, ver01 꼬리표는 새 형식으로', () => {
  const doc = todo.parse(MESSY);
  const b = todo.findTask(doc, '고블린 모델링');
  todo.setStatus(doc, b, 'open', '', D);
  const lines = todo.serialize(doc).split('\r\n');
  const i = lines.indexOf('## 할 일');
  assert.equal(lines[i + 1], '- [ ] 고블린 모델링');
  assert.ok(!lines.some((l) => l.includes('(2026-09-09)')));
  assert.equal(b.noteDate, null);
});

test('진행 중·보류는 제자리에서 상태와 메모만 바뀐다', () => {
  const doc = todo.parse(MESSY);
  const b = todo.findTask(doc, '[M00-01] 출근부: 이어가기');
  todo.setStatus(doc, b, 'doing', '서버 쪽 끝', D);
  const lines = todo.serialize(doc).split('\r\n');
  const i = lines.indexOf('## 할 일');
  assert.equal(lines[i + 1], '- [/] [M00-01] 출근부: 이어가기');
  assert.equal(lines[i + 2], `  > 진행: 서버 쪽 끝 · ${D}`);
  todo.setStatus(doc, b, 'hold', '10월에', D);
  assert.ok(todo.serialize(doc).includes(`- [>] [M00-01] 출근부: 이어가기\r\n  > 보류: 10월에 · ${D}`));
});

test('추가는 할 일 절 마지막 할 일 뒤에, 삭제는 블록만', () => {
  const doc = todo.parse(MESSY);
  todo.addTask(doc, '새 항목');
  let lines = todo.serialize(doc).split('\r\n');
  const k = lines.indexOf('- [ ] 콜로소 강의듣기');
  assert.equal(lines[k + 1], '  - [ ] 들여쓴 하위 항목은 이어지는 줄로 보존');
  assert.equal(lines[k + 2], '- [ ] 새 항목');
  assert.equal(lines[k + 3], ''); // 절 끝의 빈 줄은 그 뒤에 남는다
  todo.removeTask(doc, todo.findTask(doc, '새 항목'));
  lines = todo.serialize(doc).split('\r\n');
  assert.ok(!lines.includes('- [ ] 새 항목'));
});

test('절 제목이 없으면 만들어서 넣는다', () => {
  const doc = todo.parse('- [ ] 하나\n');
  todo.setStatus(doc, todo.findTask(doc, '하나'), 'done', '', D);
  assert.equal(todo.serialize(doc), `## 완료\n- [x] 하나\n  > 완료: ${D}\n`);
  const doc2 = todo.parse('');
  todo.addTask(doc2, '둘');
  assert.equal(todo.serialize(doc2), '## 할 일\n- [ ] 둘\n');
  const doc3 = todo.parse('# 제목\n');
  todo.addTask(doc3, '셋');
  assert.equal(todo.serialize(doc3), '# 제목\n\n## 할 일\n- [ ] 셋\n');
});

test('빈 줄로 나뉜 목록에서 옮겨도 빈 줄이 겹치지 않는다', () => {
  const src = ['## 할 일', '', '- [ ] a', '', '- [ ] b', '', '## 완료', ''].join('\n');
  const doc = todo.parse(src);
  todo.setStatus(doc, todo.findTask(doc, 'a'), 'done', '', D);
  assert.equal(todo.serialize(doc), ['## 할 일', '', '- [ ] b', '', '## 완료', '- [x] a', `  > 완료: ${D}`, ''].join('\n'));
});

test('findTask: 본문 정확 일치 우선, 없으면 id 로', () => {
  const doc = todo.parse(MESSY);
  assert.equal(todo.findTask(doc, '[M00-02] 마일스톤 읽기 (문장이 바뀜)').id, 'M00-02');
  assert.equal(todo.findTask(doc, '없는 것'), null);
  assert.ok(todo.sameTask('[M00-02] a', '[M00-02] b'));
  assert.ok(!todo.sameTask('a', 'b'));
  assert.equal(todo.taskId('[M01-03] x'), 'M01-03');
  assert.equal(todo.taskId('x'), null);
});

test('알 수 없는 상태는 바꿀 수 없다', () => {
  const doc = todo.parse(MESSY);
  assert.throws(() => todo.setStatus(doc, todo.findTask(doc, '뭔지 모르는 상태'), 'weird', '', D));
});

// ── 출근 화면 고르기 목록 (pickList) ──
const PICK_SRC = [
  '## 할 일',
  '- [ ] [M00-02] 마일스톤 읽기',
  '- [/] 고블린 텍스처',
  '  > 진행: 절반 · 2026-09-11',
  '- [ ] 콜로소 강의',
  '- [>] 스트림덱',
  '  > 보류: 장비 · 2026-09-10',
  '- [/] 오크 리깅',
  '  > 진행: 팔만 · 2026-09-12',
  '- [?] 모르는 것',
  '- [ ] 새 항목',
  '## 완료',
  '- [x] 끝난 것',
  '  > 완료: 2026-09-12',
  '',
].join('\n');
const pickOf = (lastNext) => { const { open, done } = todo.split(todo.parse(PICK_SRC)); return todo.pickList([...open, ...done], lastNext); };

test('pickList: 진행 중 → 어제의 다음(적은 순서) → 열림 → 모름, 보류는 따로', () => {
  const p = pickOf(['새 항목', '[M00-02] 마일스톤 (문장 바뀜)']);
  assert.deepEqual(p.items.map((t) => t.text), ['고블린 텍스처', '오크 리깅', '새 항목', '[M00-02] 마일스톤 읽기', '콜로소 강의', '모르는 것']);
  assert.deepEqual(p.items.map((t) => t.reason), [null, null, 'next', 'next', null, null]);
  assert.deepEqual(p.hold.map((t) => t.text), ['스트림덱']);
  assert.deepEqual(p.unmatched, []);
});

test('pickList: 미리 체크 = 어제의 다음 첫 줄 → 없으면 메모 날짜 최신 진행 중 → 없으면 없음', () => {
  assert.equal(pickOf(['콜로소 강의', '새 항목']).preselect, '콜로소 강의');
  assert.equal(pickOf(['끝난 것', '새 항목']).preselect, '새 항목'); // 완료된 줄은 건너뛴다
  assert.equal(pickOf([]).preselect, '오크 리깅'); // 진행 중 둘 중 메모 날짜가 최근인 것
  const { open } = todo.split(todo.parse('## 할 일\n- [ ] 하나\n- [ ] 둘\n'));
  assert.equal(todo.pickList(open, []).preselect, null);
});

test('pickList: 어제 줄이 목록에 없으면 unmatched, 완료와 같은 줄은 unmatched 아님', () => {
  const p = pickOf(['없는 줄', '끝난 것']);
  assert.deepEqual(p.unmatched, ['없는 줄']);
  assert.equal(p.preselect, '오크 리깅');
});

test('dayReport: 고른 항목을 완료·진행 중·예정으로, 순서 유지, id 로도 찾는다', () => {
  const { open, done } = todo.split(todo.parse(PICK_SRC));
  const tasks = [...open, ...done];
  const r = todo.dayReport(['[M00-02] 문장이 바뀜', '고블린 텍스처', '콜로소 강의', '끝난 것', '목록에 없는 것'], tasks, ['콜로소 강의']);
  assert.deepEqual(r.done.map((x) => x.text), ['콜로소 강의', '끝난 것']);       // 데브로그 done 또는 todo 완료
  assert.deepEqual(r.doing.map((x) => [x.text, x.note]), [['고블린 텍스처', '절반']]);
  assert.deepEqual(r.planned.map((x) => x.text), ['[M00-02] 마일스톤 읽기', '목록에 없는 것']); // 열림·없는 것 = 예정
  assert.deepEqual(todo.dayReport([], tasks), { done: [], doing: [], planned: [] });
});

test('TEMPLATE 은 그 자체로 왕복된다', () => {
  assert.equal(todo.serialize(todo.parse(todo.TEMPLATE)), todo.TEMPLATE);
});
