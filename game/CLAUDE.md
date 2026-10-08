# game/ — 유니티 프로젝트

> 2026-10-08 Unity Hub로 만듦. Unity **6000.5.1f1** + URP(Universal 3D 템플릿). 처음엔 6000.0.78f1로 만들어졌다가 같은 날 Hub에서 6000.5.1f1로 올렸다. 엔진 버전 정본 = [docs/engine-reference/unity/VERSION.md](../docs/engine-reference/unity/VERSION.md).

## 지금 여기서 하는 일 (M03 전까지)

- **게임 기능 코드는 쓰지 않는다.** 룩 확인용 씬만 둔다 — 로고, 면접실 소품을 고정 카메라와 촛불 아래에서 보는 용도 (M01 LookTest 씬, M02 룸 룩 테스트).
- 게임 기능 코드는 M03부터. 시작하기 전에 [technical-preferences.md](../.claude/docs/technical-preferences.md)·[coding-standards.md](../.claude/docs/coding-standards.md)를 정리하고 다시 불러오게 건다 (옛 컨셉 잔재 정리).
- 7월 프로토타입(`_archive/unity-prototype/`)은 구조·데이터 참고만 하고 다시 쓴다.

## 코드 작업 방식 — 이해하며 만들기 (2026-07-02 결정)

- 한 번에 한 걸음. 늘 "왜 이렇게 하는지 / 어떻게 동작하는지"를 같이 설명한다.
- 이해 기준 = 디렉터 수준: 무엇을 하는지, 왜 이 방식인지 설명할 수 있으면 통과. 엔진 밑바닥까지 파지 않는다.
- "그냥 해줘"로 쌓지 않는다. 맡길 때도 설명과 함께.

## 엔진 지식 주의

- Claude의 학습 지식은 Unity 2022 LTS 수준이다. Unity 6 API(Input System 기본, UI Toolkit 런타임, URP 변경점 등)는 [docs/engine-reference/unity/](../docs/engine-reference/unity/)와 공식 문서(6000.x)를 먼저 확인한다.
- 유니티 6.5부터 에디터 로그는 프로젝트 안 `Logs/Editor.log`에 쌓인다.

## 파일과 git

- 블렌더·페인터 원본은 `artwork/`, 게임에 들어가는 FBX와 텍스처는 여기 `Assets/` 아래로 내보내 커밋한다 ([artwork/README.md](../artwork/README.md)).
- `.meta` 파일은 늘 짝 파일과 같이 커밋한다 (지우면 연결이 끊긴다).
- 커밋에서 빠지는 것(Library·Temp·Logs·UserSettings·.csproj·.sln·.slnx, Addressables 빌드 결과)은 루트 `.gitignore`에 있다.
- 이 폴더는 옵시디언 검색에서 제외된다 (루트 CLAUDE.md).
