# Session State — active

> 재시작 시 자동 복구용(SessionStart 훅이 읽음). 최신 상태만 유지.
> **Last Updated**: 2026-09-13 (오늘 = 출근부 작업만, 컨텍스트 클리어 후 재시작)

## ⭐ 오늘 (2026-09-13) — 출근부 ver02 작업, 클리어 후 여기서 시작

- **범위 (GPT 검토 반영, 순서 변경)**: **⓪ todo 파서 재작성 ✅ 완료(2026-09-13 — `tools/desk/todo.js` 신설, 단위 테스트 12개 `node --test tools/desk/test/todo.test.js`, 임시 폴더 스모크 22항목 통과, 미커밋)** → **M00-01 이어가기 ← 다음** → M00-03 퇴근 보고 3칸 → (남으면) M00-02 마일스톤 읽기·게이지·완료 동기화. 창 하나, "커밋 푸시" = 전부. ⓪에서 API `todos`가 문장 배열 → Task 객체 배열(`{id,status,marker,text,note,noteDate}`)로 바뀌었고 `/api/todos`에 `action:'status'`(+`status`,`note`)가 생겼다. 상태를 바꾸는 버튼·퇴근 폼은 아직 없음(M00-01·03에서).
- **스펙 정본** = [tools/desk/brief-gpt-2026-09-13.md](../../tools/desk/brief-gpt-2026-09-13.md) **맨 끝 "GPT 답변 요약 + 결정" 절이 §6보다 우선.** 핵심 결정(2026-09-13): 상태 5개 `[ ] [/] [>] [x] [-]` + 메모는 **다음 줄** `  > 진행: … · 날짜`(← 화살표 방식 폐기) · 퇴근 폼 [완료|진행 중|보류] 기본 진행 중, 메모 전부 선택 · 자동 체크는 이어가기 **1개만** · 마일스톤 완료는 **앱이 쓴다**(todo `[M00-NN]` 완료 → 파일 `[x]`, git add 범위에 milestones 추가) · 데브로그 picked/done은 ID 우선 · 주간 회고 문항은 "막힌 것·다음 주 3가지" 둘(더 나은 형식 탐색 중). 브리프·이 파일은 아직 미커밋.
- **진행 순서**: ① `tools/desk/server.js`(todo 읽기/쓰기, clockout)와 `public/app.js`(renderTodos·renderPickPanel·renderClockOutForm)를 읽고 "왜/어떻게" 설명 → 승인 → 수정 ② 테스트 = `DESK_DATA_DIR` 임시 폴더 + `--no-git` ③ 실제 서버는 `출근.bat`로 재시작 ④ 출근부 켜서 오늘 출근 찍기(오늘 할 일: M00-01 · M00-05 옵시디언 · M00-06 맥북 링크) ⑤ 끝나면 M00 백로그 체크 + "다음에 할 것" 초안.
- **PM 루틴**: 세션 시작에 오늘 3개 추천 + 이유 / 세션 끝에 다음 할 것 초안 + 백로그 갱신. 결정 사항: 상태 5개(취소 포함), 기본값 진행 중, 이월 2회면 쪼개기, 퍼센트 없음.

## 이전 시작점 (2026-09-12 기록)

**2026-09-12 저장소 폴더 재정비 완료** — 내역 = [production/reorg-2026-09.md](../reorg-2026-09.md).
요약: ideation → `design/concept`, REF_GAME → `design/research/ref-games`, 프로토 → `_archive/unity-prototype`(캐시 삭제), 옛 데브로그·Origin/journal·src·.github·registry 삭제, 유니티 프로젝트 자리 = 최상위 `game/`(아직 없음), 작업 기록은 출근부 한 곳. 같은 날 저녁: 루트 CLAUDE.md를 "일하는 법" 중심 36줄로 개편, **Origin 트랙 해체**(로드맵만 `design/concept/build-roadmap.md`로), 순서 = **GDD v1 → game/** (병행 안 함).

**✅ 2026-09-12 저녁: `design/gdd/game-concept.md` v1 완성 (12섹션 전부, 사용자 묶음별 승인). 이어서 `design/gdd/systems-index.md` v1 완성(시스템 12개, MVP 10개, 1차 7개 → 2차 3개 분할). 다음 = 10월 1일 `/design-system` 1번(케이스 데이터·파이프라인, 지침과 같이) — **새 세션에서 시작.** 추가 결정: 지침은 날짜별 풀(없는 날도 있음), 재도전 없이 다음 날로, 게임오버 패턴 있음(누적형), 함께 들기 유지.** 아트 결정: 복셀풍 캐릭터 룩 폐기, 전부 로우폴리 3D + 블렌더 + Substance Painter (루트 CLAUDE.md 반영, ADR-002·아트바이블은 GDD v1 후). 데모 밤 파트 = 일급 정산·까마귀 상점·인물 1명 이벤트(신문은 본편).
(작성 경과) 묶음별 작성 (1묶음 피치·정체성·판타지·후크 완료 → 2묶음 MDA·동기 완료 → 3묶음 코어 루프 완료 → 4묶음 필라(A안 4개: 마왕성의 상식 → 우리 회사 → 물건 → 승진)·안티필라·레퍼런스·타깃 완료 → 5묶음 남음. 새 결정: 하루 근무 시간 있음(케이스 타이머 없음, 다 처리하면 추가 점수 — mvp-design "실시간 타이머 없음" 갱신 필요) → 4묶음 필라·레퍼런스·타깃 → 5묶음 기술·리스크·MVP). 그다음 `systems-index.md`. 새 결정: 지침 누적 방식(당일 지침이 하루 하나씩 쌓임), 비교작에 Contraband Police, 목표 = 인사팀장, 면접 덱빌딩·리듬/QTE·스케줄링 퍼즐로 "읽기만 하는 게임" 아님, 데모 영문 동시 목표. 코미디의 바탕 = 세계관의 비꼼(마왕성에도 HR·취업난), 판단의 본질 = JD 적합(선악 아님). 밤 파트 = 미니맵 UI 허브(포셔노믹스식 지도·아이콘 클릭, 3D 모델링 없음) + 상점·바·인물 이벤트·관계 서브스토리(→ 카드)·뇌물 청탁, 데모 포함(깊이 미정). 성주 엔딩 = 내부 전용 히든. 포셔노믹스 관계·밤 조사 = 백그라운드 에이전트 진행 중(보고서 → 스크래치패드).

**PM 구조 (2026-09-12 저녁 결정)**: 마일스톤 파일 `production/milestones/`(한 번에 하나 active, 백로그 = 세션 단위) → 아침에 최대 3개를 `production/desk/todo.md`로 당김(이어가기 1 + 마일스톤 1 + 여유 1) → 세부 목록은 도메인 문서(시스템 인덱스·에셋 체크리스트). 열린 질문은 GDD Open Questions, 결정은 결정 원장. 현재 active = [M00 준비](../milestones/M00-prep.md), 다음 = [M01 GDD v1](../milestones/M01-gdd-v1.md). Claude의 PM 루틴: 세션 시작에 오늘 3개 추천 + 이유, 세션 끝에 "다음에 할 것" 초안과 백로그 체크 갱신, 주 1회 회고. 자리 잡으면 루트 CLAUDE.md 일하는 법에 3줄로.

다음에 할 일 (우선순위):

1. **출근부 ver02 첫 묶음** — [tools/desk/ROADMAP.md](../../tools/desk/ROADMAP.md) "첫 묶음" 1번부터 (퇴근 보고 3칸 → 커밋 요약 → 다음 할 일 이어가기 → …).
2. **10월 1일 새 시즌** (`tools/desk/desk.config.json` seasonStart → 2026-10-01) — 첫 마일스톤 = **GDD v1 확정**: `design/concept/`의 mvp-design·interview_idea를 `/design-system`으로 `design/gdd/`에 승격. 마일스톤·주간 계획 파일 형식은 그때 확정 (ROADMAP 두 번째 묶음).
3. **game/ 착수 (GDD v1 뒤)** — Unity Hub로 `game/` 생성 (Location `C:\DungeonHR`, Project name `game`) + `game/CLAUDE.md` → 구현 순서 초안 [design/concept/build-roadmap.md](../../design/concept/build-roadmap.md).

창 여러 개 사용 규칙: 창마다 담당 폴더, 커밋은 자기 파일만(뺀 것은 알림).

## 현재 코어 = 「마왕성 인사팀」(가제)

DDworld 코어를 **2026-07-03에 전환**했다: (2세대 PvE 헥사 오토배틀러) → **「마왕성 인사팀」** (Papers, Please식 악당 면접 + 다이어제틱 데스크). 후크 = **판단축 반전**(악당을 뽑기에 거짓말·잔인함이 장점).

- 현행 기준: [design/concept/concept-demon-hr.md](../../design/concept/concept-demon-hr.md) + [design/concept/mvp-design.md](../../design/concept/mvp-design.md) · 인덱스 [_index.md](../../design/concept/_index.md)
- 구현 순서 초안: [design/concept/build-roadmap.md](../../design/concept/build-roadmap.md) (GDD v1 뒤 마일스톤으로 재작성) · 옛 프로토(참고 전용): [_archive/unity-prototype/README.md](../../_archive/unity-prototype/README.md)
- 옛 컨셉(폐기) 인덱스: [design/gdd/_archive/README.md](../../design/gdd/_archive/README.md)

## 프로토 상태 (2026-07-14 기준 — 2026-09-12 아카이브됨)

- 프로토 S1~S2e + **S3a(밤 파트: 내 방 기숙사·석간 신문·월급 정산·까마귀 상점)** 완료. 밤 파트 레퍼런스 조사 5종 = `design/research/ref-games/`.
- **S3b(면접 뎁스: 던지기 톤 + 긴장 온도계)는 구현 롤백** (구현 8c2c10e → 롤백 e9e542f) — "코드보다 기획 확정이 먼저" 방침. 그 재기획이 아래 트랙으로 이어짐.
- **2026-08-18 아트 방향 변경**: 캐릭터 제작 = **복셀(MagicaVoxel) → 복셀풍 로우폴리(블렌더)** — 네모네모 룩은 유지, 복셀 단위 제작만 폐기. ADR-002·현행 문서 일괄 반영 완료. 에셋 전수 체크리스트 = [design/concept/asset-checklist.md](../../design/concept/asset-checklist.md) 신설 (사운드 = Artlist 사용자 선정 방침).

## 기획 트랙: 면접 덱빌딩 (2026-07-15~16 대화, 이후 변동 없음)

**기준 문서 = [design/concept/interview_idea.md](../../design/concept/interview_idea.md) (Draft v0.3)** — S3b 재기획(게이지)을 흡수. 형제 = [interview-depth.md](../../design/concept/interview-depth.md)(아이디어 카탈로그), 레퍼런스 = [ref-games/potionomics.md](../../design/research/ref-games/potionomics.md)(포셔노믹스 흥정 조사, 7/15).

**확정된 것 (상세 = interview_idea.md):**
- 목적 = 준비 전략(덱세팅) + 면접 내 콤보 / 스코프 = 씨앗 프로토 선적용
- 카드 2계열: 질문 카드(대사 필요, 소수 정예) + 화법·기술 카드(시스템 효과, 확장 가능 — 씨앗 3종: 차 대접·책상 내려치기·침묵)
- **아침 로드아웃 폐기 → 뽑기형 덱빌딩**: 상점 매매(구매+반값 되팔기) · 덱 정원제(중복 = 확률 조형) · 면접 중 뽑기(시작 4장+사용당 1장). 안전장치 = 기본 질문 상시 비품 + 결정타 2경로 저작 규칙 + 덱 오염 금지
- **붕괴**: 게이지 한계 초과 = 면접 강제 종료 + 그 건 실패 판정 (붕괴 = 그냥 실패, 단서 아님)
- **카드 효과 = 범위 랜덤** (카드에 범위 표기, 문턱은 확정 — 블랙잭 구조). 발끈 규칙은 붕괴+경고 연출로 대체
- 용어 1차 정리 완료 (은어 → 우리말. "덱 오염"은 유지 결정)

**미결 게이트 (interview_idea.md §6):**
1. 게이지의 의미·방향 (차오르는 긴장 vs 깎이는 멘탈/HP) — **사용자 고민 중**
2. 아래쪽 극단 처리 (안전 vs 양쪽 붕괴) — **사용자 고민 중**
3. 위 확정 시 → **용어 일가 일괄 개명** (tell·hot/cold·온도계 — 후보 논의됨: 꼬리/낌새/기색/꼬투리, 고긴장/저긴장 등)
4. 시나리오 시연(슬라임 '말랑' 1판, 대화 기록)에서 발견한 3건 = §6-8~10 **보류** (수확 방식 A/B · 기본 질문 재사용 · 게이지 개인차)

**기획 트랙 다음 할 것 (우선순위순) — GDD v1 마일스톤에서 소화:**
1. **§6-1·2 결정** (게이지 그림) → 용어 개명 + 보류 3건 처리 → 씨앗 스펙 확정
2. **열린 질문 #11 (공문/JD 로테이션)** — 덱빌딩(#11이 덱 가치를 날마다 재정의)과 맞물리므로 동시 결정 권장
3. 이월 항목 (7/4 기록분, 소화 여부 미확인): 플레이 검증 리스트·S4 튜닝+REPORT·사이드 옵션(OrbFx·텍스트 존 규약·블렌더 머그·종족색) — 아카이브된 프로토 README와 대조 필요

## 미결 디자인 메모

- mvp-design §15: #11(공문 로테이션) · #6 보류 도장 · #7 스탯 패널 · #9 드래그 재배치 · #10 마킹 강제 · #4 승진 미달 처리
- interview_idea.md §6 = 면접 덱빌딩 미결 전체 목록 (1~10)
- 곡면 텍스트 정책 (7/5 논의, 문서 미반영) — 수정구·블렌더 가이드에 "텍스트 존 규칙" 섹션 추가할 것
