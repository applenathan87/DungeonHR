# design/gdd/ — 현재 상태

> **2026-09-12: 게임 컨셉 문서 v1 + 시스템 인덱스 v1 완성** — [game-concept.md](game-concept.md) · [systems-index.md](systems-index.md). `/design-system`이 읽는 상위 정본 두 개.
> 시스템별 GDD(여덟 칸 표준)는 아직 없다. **M01~M04에 나눠 쓴다** — 곧 만들 부분의 GDD만 쓰고 바로 그 부분을 만든다(2026-09-30 결정). 일정의 정본 = [production/milestones/README.md](../../production/milestones/README.md).
> 2026-10-01: 두 문서의 지어낸 말과 어려운 말을 쉬운 말로 바꿨다. 바꾼 말의 표는 game-concept.md 맨 아래에 있다.

## 지금 어디를 봐야 하나

- **게임 컨셉 정본** → [game-concept.md](game-concept.md) — 한 줄 소개·정체성·핵심 판타지·후크·플레이어 경험·되풀이되는 플레이·필라와 안티필라·레퍼런스·타깃·기술·리스크·데모 범위·다음 단계
- **상세 기획(컨셉 단계 문서)** → [design/concept/](../concept/_index.md) — mvp-design(3일 구조·판정·단서·도구·카드·콘텐츠), interview_idea(덱빌딩), night-part(밤 파트), build-roadmap(구현 순서 초안). 컨셉 문서와 어긋나면 game-concept.md가 우선. 이 문서들에는 옛 표기(가젯, 물성 등)가 남아 있다.
- **옛 컨셉(폐기)** → [_archive/README.md](_archive/README.md) — 1세대 PvP · 2세대 헥사, 둘 다 죽음.

## 다음 작업

1. ~~`systems-index.md` 작성~~ → 완료 (2026-09-12). 시스템 12개, 데모에 필요한 것 10개. 설계 순서 = 케이스 데이터 → 지침 → 판정 → 책상 위 물건 다루기 → 하루 구조·결산 → 승진·경제 → 면접 → 면접 시간표 퍼즐 → 밤 파트 → 미니게임.
2. 시스템별 GDD — `/design-system [시스템]`으로 여덟 칸을 쓴다: 개요(Overview) · 플레이어가 느낄 것(Player Fantasy) · 상세 규칙(Detailed Rules) · 공식(Formulas) · 예외 상황(Edge Cases) · 다른 시스템과의 관계(Dependencies) · 조절값(Tuning Knobs) · 통과 기준(Acceptance Criteria). 순서와 범위는 [systems-index.md](systems-index.md). 질문은 글로 주고받고, 전문 에이전트는 값이 필요한 칸에만 쓴다.
3. 각 GDD는 새 세션에서 `/design-review [파일] --depth lean`으로 검토한다. 앞의 7개가 끝나면 `/review-all-gdds`.
