# DDworld — 「마왕성 인사팀」(가제)

1인 인디 게임. **다크판타지 코미디 HR 시뮬** — 악당을 뽑는 인사팀이라 판단축이 비틀린다(직무 JD에 따라 거짓말·잔인함이 장점, "알고 보니 착함"이 위험 신호).
Papers, Please식 심문·판단 + 책상 위 물건(도장·이력서·질문카드·촛불·돋보기)을 직접 만지는 다이어제틱 데스크. PC(Steam) · 솔로 개발 · 싱글플레이.

## 정본 (내용은 여기서 설명하지 않는다 — 링크만)

- **게임 컨셉 정본**: [design/gdd/game-concept.md](design/gdd/game-concept.md) (2026-09-12 v1 — 피치·후크·필라·코어 루프·MVP 정의) · 상세 기획: [design/concept/mvp-design.md](design/concept/mvp-design.md) · 컨셉 원문: [concept-demon-hr.md](design/concept/concept-demon-hr.md) · 인덱스: [design/concept/_index.md](design/concept/_index.md) · 화면 목업: [design/concept/refs/면접화면-목업.png](design/concept/refs/면접화면-목업.png). 어긋나면 game-concept.md가 우선.
- **비주얼 방향** (아트 정본 재작성 전까지 이 두 줄이 기준): 캐릭터·환경·소품 전부 **로우폴리 3D — 블렌더 + Substance Painter(핸드페인트풍 텍스처)**. 복셀풍(블로키) 캐릭터 룩은 2026-09-12 폐기 (MagicaVoxel은 2026-08-18 폐기). 톤 = 촛불 켜진 마왕성 사무실, 따뜻+어두운 대비, "귀여운데 사악한". 카메라 = 고정 데스크 클로즈업. 애니 = 면접 리액션 2종(긴장/안도) + 이펙트 수준. 코지 미니어처·틸트시프트 톤은 미승계. [ADR-002](docs/architecture/ADR-002-visual-style-low-poly-3d.md)·아트바이블·에셋 체크리스트의 "복셀풍" 표기는 STALE — M02 룩 테스트 결정 뒤 아트 정본 재작성 때 갱신.
- **폐기 컨셉(참조 금지)**: [design/gdd/_archive/README.md](design/gdd/_archive/README.md) — **PvP·고스트·매칭·판돈·심리전 / 헥사·영토 확장·내 군대·400명 전투·소모전·permadeath·오토배틀러** 키워드가 나오면 옛 맥락이다. ADR-001·003도 Superseded.

## 지금 — 어디서 무엇을

- **마일스톤 정본 = [production/milestones/README.md](production/milestones/README.md)** (2026-09-30에 새로 짬 · 새 시즌 Day 1 = 2026-10-01 · 데모 마감 가정 2027-04-15 · 7개). 지금 = **[M01 기초](production/milestones/M01-foundation.md)** (10/1-10/28: 스컬핑 연습·면접실 구도 + GDD 규칙 쪽 — 하루와 레벨·지침·판정·승진·경제·면접) ← **지금 여기**
- 순서 = **기획과 제작을 번갈아 한다** — 곧 만들 부분의 GDD만 쓰고 바로 그 부분을 만든다 (2026-09-30 결정 — 9/12의 "GDD v1 전부 → 제작"을 대신한다). **하루에 아트·기획·코드 세 가지 작업을 섞는다**: 아트(강의 → 면접실 → 몬스터) · 기획(GDD → 케이스) · 코드(M03부터). `game/`은 M01에 Unity Hub로 만들되 **M03 전까지 게임 기능 코드 없음**(룩 확인용 씬만). 7월 프로토타입 코드는 구조·데이터 참고만 하고 다시 쓴다. [build-roadmap.md](design/concept/build-roadmap.md)의 0~9단계는 마일스톤에 합쳐졌다 — 확인하기로 한 세 가지(분위기·도장·"오?")만 이어받는다. 마일스톤 끝의 질문에는 실제 게임을 주변 사람에게 시켜 보고 답한다.
- **데모 범위 변경 (2026-09-30 · 10-02)**: 영문 제외 · 사운드 진행 방식 미정 · **데모는 날(3일)이 아니라 레벨로 센다 — 사원 Lv1-3(서류) → 대리 Lv1-3(면접), 보통 1시간 안팎, 휴식하기 자동 저장**. 흐름의 정본 = [design/gdd/game-flow.md](design/gdd/game-flow.md) · GDD는 규칙 쪽 먼저, 숫자 쪽과 검토는 그 코드 직전(game-flow 7번). game-concept·systems-index·마일스톤은 10/3에 맞췄다. mvp-design.md 등 `design/concept/`에 남은 "데모 3일"·"영문 동시"·"GDD v1 → game/"은 옛 내용 — M01 "옛 문서 고치기"에서 고친다.
- 작업 기록 = 출근부([tools/desk](tools/desk/README.md), 데이터 `production/desk/`) 한 곳 · 세션 상태 = `production/session-state/active.md` · 2026-09-12 폴더 재정비 기록 = [production/reorg-2026-09.md](production/reorg-2026-09.md)

## 일하는 법

- **Question → Options → Decision → Draft → Approval.** Write/Edit 전 승인("May I write this to …?"), 다중 파일 변경은 changeset 전체 승인, 사용자 지시 없이 commit 금지.
- **코드 작업(game/) = 이해하며 만들기**: 한 번에 한 걸음, 항상 "왜/어떻게"를 설명, 이해 기준 = 디렉터 수준(뭘 하는지·왜 이 방식인지 설명할 수 있으면 통과 — 엔진 밑바닥까지 파지 않는다). "그냥 해줘"로 쌓지 않는다 — 이해가 곧 디렉팅 능력(2026-07-02 결정). 분담은 유연하되 맡길 때도 설명과 함께. 프로덕션 기준(GDD 8섹션·테스트 게이트·태스크 ID)의 적용 범위는 game/ 착수 때 정한다.
- **기획 문서**: `design/concept/` = 날것(표준 미적용) · `design/gdd/` = 8섹션 표준(`/design-system`) · 기술 결정 = `docs/architecture/` ADR.
- **참고 전용(요청 시만 읽기)**: `CONTEST/`, 읽기 볼트 `C:\Reading`. 가져온 결론은 [design/research/takeaways.md](design/research/takeaways.md)에 한 줄.
- **이 저장소 = 옵시디언 볼트.** 검색 제외: `game/`, `_archive/unity-prototype/`, `image/`, `.claude/`, `production/session-logs/`.

## 기술

- Unity **6000.5.1f1**(Unity 6.5) + URP · C# · Blender 로우폴리 단일 파이프라인 · UI Toolkit · Addressables · Git(trunk-based)
- ⚠ [technical-preferences.md](.claude/docs/technical-preferences.md)·[coding-standards.md](.claude/docs/coding-standards.md)는 **자동으로 불러오지 않는다** (2026-10-01 — 세션마다 실리는 양을 줄이려고 뺐다). 코드 작업이나 에이전트를 고를 때처럼 필요할 때만 읽는다. 템플릿 시절 파일이라 쿼터뷰·카드 드래그·RPS·틱 전투·덱 셔플 등 **옛 컨셉 잔재는 무시**하고, 네이밍·금지 패턴·허용 라이브러리·스페셜리스트 라우팅만 유효하다. M03 코드 착수 전에 정리한 뒤 다시 자동으로 불러오게 건다. GDD 8섹션 표준은 design/CLAUDE.md에 있다.

@docs/engine-reference/unity/VERSION.md

## 지도

@.claude/docs/directory-structure.md
