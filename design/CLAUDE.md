# Design Directory

When authoring or editing files in this directory, follow these standards.

## Concept Docs (`design/concept/`)

현행 기획 정본 — GDD 승격 전 단계 (옛 `ideation/`, 2026-09-12 이동). 인덱스 = `design/concept/_index.md`.
8섹션 표준과 `/design-review`는 **적용하지 않는다** — 날것의 아이디어를 쌓는 곳.
확정된 시스템만 `/design-system`으로 `design/gdd/`에 승격한다.

## Research (`design/research/`)

`notes/` 기획 이론 노트 · `takeaways.md` 읽기 볼트(C:\Reading)에서 가져온 결론 한 줄씩 · `ref-games/` 레퍼런스 게임 조사 (옛 `REF_GAME/`).

## GDD Files (`design/gdd/`)

Every GDD must include all **8 required sections** in this order:
1. Overview — one-paragraph summary
2. Player Fantasy — intended feeling and experience
3. Detailed Rules — unambiguous mechanics
4. Formulas — all math defined with variables
5. Edge Cases — unusual situations handled
6. Dependencies — other systems listed
7. Tuning Knobs — configurable values identified
8. Acceptance Criteria — testable success conditions

**1번 개요는 한 문단 대신 다섯 줄로 쓴다** (2026-10-03). `/design-system` 스킬의 "한 문단" 안내보다 이것이 먼저다. 한눈에 보는 지도는 미리 만들지 않고, 필요할 때 GDD들의 이 다섯 줄을 모아 만든다(견본 = `design/gdd/gdd-map.canvas`).
- **무엇** — 이 시스템이 무엇인가, 한 줄
- **하는 일** — 플레이어가 여기서 하는 일, 한 줄 (플레이어가 직접 보지 않는 시스템이면 그렇다고 적는다)
- **핵심 규칙** — 가장 중요한 규칙 세 줄
- **이어짐** — 기대는 시스템과 기대어 오는 시스템
- **어디까지** — 룰북·밸런스·검토 중 어디까지 썼나, 남은 쪽은 어느 마일스톤에 하나

**File naming:** `[system-slug].md` (e.g. `movement-system.md`, `combat-system.md`)

**Systems index:** `design/gdd/systems-index.md` — update when adding a new GDD.

**Design order:** Foundation → Core → Feature → Presentation → Polish

**Validation:** Run `/design-review [path]` after authoring any GDD.
Run `/review-all-gdds` after completing a set of related GDDs.

## Quick Specs (`design/quick-specs/`)

Lightweight specs for tuning changes, minor mechanics, or balance adjustments.
Use `/quick-design` to author.

## UX Specs (`design/ux/`)

- Per-screen specs: `design/ux/[screen-name].md`
- HUD design: `design/ux/hud.md`
- Interaction pattern library: `design/ux/interaction-patterns.md`
- Accessibility requirements: `design/ux/accessibility-requirements.md`

Use `/ux-design` to author. Validate with `/ux-review` before passing to `/team-ui`.
