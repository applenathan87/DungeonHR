# design/gdd/ — 현재 상태

> **2026-09-12: 게임 컨셉 문서 v1 + 시스템 인덱스 v1 완성** — [game-concept.md](game-concept.md) · [systems-index.md](systems-index.md). `/design-system`이 읽는 상위 정본 두 개.
> **2026-10-01 - 10-03: 전체 흐름 문서** — [game-flow.md](game-flow.md). 데모를 출근부터 엔딩까지 따라가며 빈 곳을 찾고, 데모를 날(3일)이 아니라 레벨(사원 Lv1-3 → 대리 Lv1-3)로 세기로 했고, GDD 쓰는 순서를 확정했다.
> **game-concept · systems-index · game-flow는 GDD가 아니라 그 위의 문서다** — 여덟 칸 표준과 `/design-review`의 대상이 아니다. 역할: game-concept = 무엇을 만드는가 · systems-index = 어떤 시스템이 있는가 · game-flow = 어떻게 흘러가는가.
> 시스템별 GDD(여덟 칸 표준)는 아직 없다(0/10). **M01-M04에 나눠 쓴다** — 곧 만들 부분의 GDD만 쓰고 바로 그 부분을 만든다(2026-09-30 결정). 일정의 정본 = [production/milestones/README.md](../../production/milestones/README.md).
> 2026-10-01: 두 문서의 지어낸 말과 어려운 말을 쉬운 말로 바꿨다. 바꾼 말의 표는 game-concept.md 맨 아래에 있다.

## 지금 어디를 봐야 하나

- **게임 컨셉 정본** → [game-concept.md](game-concept.md) — 한 줄 소개·정체성·핵심 판타지·후크·플레이어 경험·되풀이되는 플레이·필라와 안티필라·레퍼런스·타깃·기술·리스크·데모 범위·다음 단계
- **전체 흐름** → [game-flow.md](game-flow.md) — 레벨 표, 하루의 스텝, 시간과 케이스 분량, 안 정한 것(A·B 목록과 맡을 GDD), GDD 쓰는 순서
- **상세 기획(컨셉 단계 문서)** → [design/concept/](../concept/_index.md) — mvp-design(3일 구조·판정·단서·도구·카드·콘텐츠), interview_idea(덱빌딩), night-part(밤 파트), build-roadmap(구현 순서 초안). 컨셉 문서와 어긋나면 game-concept.md가 우선. 이 문서들에는 옛 표기(가젯, 물성, 데모 3일 등)가 남아 있다.
- **옛 컨셉(폐기)** → [_archive/README.md](_archive/README.md) — 1세대 PvP · 2세대 헥사, 둘 다 죽음.

## 다음 작업

1. ~~`systems-index.md` 작성~~ → 완료 (2026-09-12). 시스템 12개, 데모에 필요한 것 10개. 설계 순서 (2026-10-02 확정, game-flow 7번) = 하루와 레벨 → 지침 → 판정 → 승진·경제 → 1차 면접(M01) → 책상 위 물건 다루기 → 케이스 데이터 양식(M02) → 면접 시간표 퍼즐 · 밤 파트 · 미니게임(M04).
2. 시스템별 GDD — `/design-system [시스템]`으로 여덟 칸을 쓴다: 개요(Overview) · 플레이어가 느낄 것(Player Fantasy) · 상세 규칙(Detailed Rules) · 공식(Formulas) · 예외 상황(Edge Cases) · 다른 시스템과의 관계(Dependencies) · 조절값(Tuning Knobs) · 통과 기준(Acceptance Criteria). **앞의 넷(규칙 쪽)을 먼저 쓰고, 뒤의 넷(숫자 쪽: 공식·예외 상황·조절값·통과 기준)은 그 부분의 코드 직전에 채운다.** 1번 개요는 다섯 줄로 쓴다([design/CLAUDE.md](../CLAUDE.md)). 순서와 범위는 [systems-index.md](systems-index.md). 질문은 글로 주고받고, 전문 에이전트는 값이 필요한 칸에만 쓴다.
3. 각 GDD는 숫자 쪽을 채운 뒤 새 세션에서 `/design-review [파일] --depth lean`으로 검토한다(M03·M04 첫 주). GDD끼리 어긋난 곳은 M04에 `/review-all-gdds`.
