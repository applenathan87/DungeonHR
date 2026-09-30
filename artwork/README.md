# artwork — 아트 원본 작업 파일

> 2026-09-30 결정. 블렌더·Substance Painter 작업 파일을 두는 곳이다.
> 아트 **문서**는 `design/art/`, 무드보드는 `image/`, 게임에 들어가는 결과물은 `game/Assets/` 아래다.

## 폴더

| 폴더 | 무엇을 두나 |
|---|---|
| `room/` | 면접실 — 블록아웃, 책상, 소품 |
| `characters/` | 몬스터 — 고블린부터 |
| `_study/` | 강의 따라 하기 연습 파일. **커밋하지 않는다** (새로 클론하면 없는 폴더라 직접 만든다) |

## 규칙

- **커밋하는 것**: 블렌더 파일(`.blend`).
- **커밋하지 않는 것** (`.gitignore`에 등록): Substance Painter 프로젝트(`.spp` — 용량이 크다), 블렌더 자동 백업(`.blend1` 등), `_study/` 전체.
- **내보내기**: 게임에 들어가는 FBX와 텍스처 이미지는 `game/Assets/` 아래로 내보내고 거기서 커밋한다. 이 폴더에는 원본만 둔다.
- **백업**: 커밋하지 않는 파일의 백업 방법은 첫 `.spp` 파일이 생길 때 정한다 (M01).
- **큰 파일**: GitHub는 100MB가 넘는 파일을 받지 않는다. 스컬핑한 `.blend`가 50MB를 넘기 시작하면 그때 처리 방법을 정한다.
- 블렌더 버전·단위·FBX 익스포트 설정은 [docs/pipeline/](../docs/pipeline/blender-to-unity.md)에 적는다 (M01 백로그 02).
- 강의·자료 링크 목록 = [docs/pipeline/art-courses.md](../docs/pipeline/art-courses.md).
