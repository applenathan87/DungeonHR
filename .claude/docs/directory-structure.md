# Directory Structure

> 2026-09-12 재정비 기준. 이동·삭제 내역과 이유 = [production/reorg-2026-09.md](../../production/reorg-2026-09.md)

```text
/
├── CLAUDE.md                    # Master configuration (일하는 법 · 정본 링크 · 지금 어디)
├── .claude/                     # Agent definitions, skills, hooks, rules, docs
├── game/                        # ⭐ 유니티 프로젝트 (Unity 6000.5.1f1 + URP) — 2026-10-08 Unity Hub로 생성 (규칙 = game/CLAUDE.md). M03 전까지 LookTest 씬만, 게임플레이 코드 없음
│                                #   Hub: Location=C:\DungeonHR, Project name=game. 미리 만들어 두지 않는다 (Hub가 거부). 생성 직후 game/CLAUDE.md 추가
├── artwork/                     # 아트 원본 작업 파일 (2026-09-30) — room/ · characters/ · logo/(게임 로고, 2026-10-07) · _study/(강의 연습, gitignored). .blend 커밋, .spp·블렌더 백업 제외. 규칙 = artwork/README.md
├── design/                      # 기획 = 볼트의 심장
│   ├── concept/                 # 현행 기획 정본 (concept-demon-hr · mvp-design · interview_idea … · build-roadmap(구현 순서 초안) · refs/ 목업) ← 옛 ideation/
│   ├── gdd/                     # 정식 GDD (8섹션 표준) — M01~M04에 나눠 쓴다 (곧 만들 부분의 GDD만). _archive/README = 죽은 컨셉 연혁
│   ├── art/                     # 아트 바이블(STALE, 재작성 대기) · visual-polish
│   └── research/                # notes/(기획 이론 노트) · takeaways.md(읽기 볼트 결론) · ref-games/(레퍼런스 게임 조사 ← 옛 REF_GAME/)
├── docs/                        # 기술 문서 — architecture/(ADR) · pipeline/(블렌더 로우폴리 가이드, 블렌더→유니티, art-courses = 강의·자료 링크 목록) · onboarding-brief · WORKFLOW-GUIDE
│   └── engine-reference/        # Curated engine API snapshots (version-pinned)
├── production/                  # 기록·PM
│   ├── desk/                    # 출근부 데이터 (todo.md = 오늘 할 일(당긴 것 ≤3 + 잡무) · devlog/YYYY-MM-DD.md) — 유일한 작업 기록
│   ├── milestones/              # 마일스톤 파일 (README = 전체 그림·규칙 · M01 기초 … M07 제출, 2026-09-30에 새로 짬) — 한 번에 하나만 진행, 할 일 목록 = 하루 이틀 크기 항목. 자세한 목록은 각 주제 문서(시스템 인덱스·에셋 체크리스트)
│   ├── session-state/           # Session state (active.md)
│   ├── session-logs/            # Session audit trail (gitignored)
│   └── reorg-2026-09.md         # 2026-09 폴더 재정비 기록
├── tools/desk/                  # 출근부 앱 (의존성 0, 출근.bat 더블클릭)
├── _archive/                    # 참고 전용 보관소 (README = 인덱스)
│   ├── unity-prototype/         # 2026-07 그레이박스 프로토 (MawangHR S1~S3a) — 캐시 삭제됨, 열면 Unity가 재생성
│   └── mawang-hr-proto-brief.md # 그 프로토의 작업 명령서
├── CONTEST/                     # 공모전 캘린더·목표 (참고 전용 — 자동 참조 X)
└── image/                       # 아트 무드보드 (gitignored)
```

- **삭제된 것** (2026-09-12, git 히스토리에 보존 — 삭제 직전 트리 = 커밋 86ac21f): `production/devlog/`(옛 Day 01~29), `Origin/journal/`, `src/`, `.github/`, `docs/registry/`, `docs/architecture/tr-registry.yaml`, `prototypes/`(→ _archive), `ideation/`(→ design/concept), `REF_GAME/`(→ design/research/ref-games).
- **`Origin/` 트랙 해체** (같은 날 저녁): roadmap → `design/concept/build-roadmap.md`, 블렌더 가이드 → `docs/pipeline/`, 80lv 읽기 목록 3개 → 읽기 볼트 `C:\Reading\아티클\읽기목록\`, 작업 방식 원칙 → 루트 CLAUDE.md "일하는 법". Origin/CLAUDE.md 삭제.
- **`.claude/` 템플릿 문서·스킬이 말하는 `src/`·`tests/`·`assets/`는 이 저장소에 없다** — 코드는 전부 `game/`(유니티 프로젝트) 안. 그 스킬들은 GDD·ADR이 생긴 뒤 필요할 때만 쓴다.
- 아티클·일반 공부 자료는 저장소 밖 읽기 볼트 `C:\Reading`.
