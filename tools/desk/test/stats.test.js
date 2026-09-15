'use strict';
/*
 * 기간 집계 테스트 — 실행: node --test tools/desk/test/stats.test.js
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const stats = require('../stats');

const day = (date, hours, pomodoros, did = [], memo = [], status = 'closed') => ({ date, day: 1, hours, pomodoros, status, summary: 't', sessions: [], did, memo, next: [] });

test('isoWeek: 월요일 시작, 연말·연초 경계', () => {
  assert.deepEqual(stats.isoWeek('2026-09-15'), { key: '2026-W38', start: '2026-09-14', end: '2026-09-20' });
  assert.deepEqual(stats.isoWeek('2026-09-14'), { key: '2026-W38', start: '2026-09-14', end: '2026-09-20' });
  assert.deepEqual(stats.isoWeek('2026-09-20'), { key: '2026-W38', start: '2026-09-14', end: '2026-09-20' });
  assert.equal(stats.isoWeek('2026-01-01').key, '2026-W01'); // 2026-01-01 목요일 → 1주
  assert.equal(stats.isoWeek('2027-01-01').key, '2026-W53'); // 2027-01-01 금요일 → 2026년 53주
  assert.equal(stats.isoWeek('2024-12-30').key, '2025-W01'); // 월요일, 2025년 1주 시작
});

test('dayRow: 완료·진행·결정 추출, 집중 시간 = 뽀모도로 × 집중 분', () => {
  const r = stats.dayRow(day('2026-09-15', 6.2, 5, ['[완료] 케이스 데이터', '[진행] 관계도 GDD — 조건 정리', 'ver01 줄'], ['결정: 판정은 조건식', '그냥 메모']), 50);
  assert.deepEqual(r.done, ['케이스 데이터', 'ver01 줄']);
  assert.deepEqual(r.doing, ['관계도 GDD — 조건 정리']);
  assert.deepEqual(r.decisions, ['판정은 조건식']);
  assert.equal(r.focusHours, 4.2); // 5 × 50분 = 250분
  assert.equal(r.dow, 2);          // 화요일
});

test('aggregate: 주 묶음(최신순), 합계, 비율, 마지막 날 진행 중', () => {
  const days = [
    day('2026-09-14', 5, 4, ['[완료] a'], ['결정: x']),
    day('2026-09-15', 6, 5, ['[완료] b', '[진행] c']),
    day('2026-09-21', 3, 0, ['[완료] d']),                 // 다음 주
    day('2026-09-10', 2, 1, [], [], 'closed'),              // 전 주
  ];
  const { weeks, months } = stats.aggregate(days, 50);
  assert.deepEqual(weeks.map((w) => w.key), ['2026-W39', '2026-W38', '2026-W37']);
  const w38 = weeks[1];
  assert.equal(w38.workDays, 2);
  assert.equal(w38.hours, 11);
  assert.equal(w38.focusHours, 7.5);
  assert.equal(Math.round(w38.focusRatio * 100), 68);
  assert.equal(w38.pomodoros, 9);
  assert.deepEqual(w38.done, ['a', 'b']);
  assert.deepEqual(w38.doing, ['c']);
  assert.deepEqual(w38.decisions, ['x']);
  assert.deepEqual(w38.days.map((d) => d.date), ['2026-09-14', '2026-09-15']);
  // 월
  assert.deepEqual(months.map((m) => m.key), ['2026-09']);
  assert.equal(months[0].workDays, 4);
  assert.equal(months[0].hours, 16);
  assert.equal(months[0].end, '2026-09-30');
  assert.deepEqual(months[0].weeks.map((w) => w.key), ['2026-W37', '2026-W38', '2026-W39']); // 오래된 순
});

test('aggregate: 달에 걸친 주는 그달 날짜만 합산', () => {
  const days = [day('2026-09-30', 4, 2), day('2026-10-01', 3, 1), day('2026-10-02', 2, 0)]; // 같은 주(W40)
  const { weeks, months } = stats.aggregate(days, 50);
  assert.equal(weeks.length, 1);
  assert.equal(weeks[0].hours, 9);
  assert.equal(months.length, 2);
  assert.equal(months[0].key, '2026-10');
  assert.equal(months[0].weeks[0].hours, 5);   // 10월 몫만
  assert.equal(months[1].weeks[0].hours, 4);   // 9월 몫만
});

test('aggregate: 빈 입력·시간 0 → 비율 0', () => {
  assert.deepEqual(stats.aggregate([]), { weeks: [], months: [] });
  const { weeks } = stats.aggregate([day('2026-09-15', 0, 0)]);
  assert.equal(weeks[0].focusRatio, 0);
});
