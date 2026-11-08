# 이음(IEUM) 웹 — React + TypeScript + Vite

IEUM MVP 화면 디자인(S01~S15, S07-2, T01~T04)을 실행 가능한 React 프로젝트로 옮긴 것입니다.
디자인(레이아웃·색·폰트·간격·카드·버튼·아이콘·모션)과 화면별 인터랙션은 원본 그대로 두었습니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 타입 검사 + 빌드
npm run format     # Prettier
```

Node 18 이상 권장.

## 화면 ↔ 경로

| 코드 | 화면 | 경로 | 파일 |
|---|---|---|---|
| S01 | 처음 화면 | `/` | `pages/auth/Landing` |
| S02 | 로그인 | `/login` | `pages/auth/Login` |
| S03 | 회원 가입 | `/signup` | `pages/auth/Signup` |
| S04 | 약관 전문 | `/terms` | `pages/auth/Terms` |
| S05 | 이음 홈(3D 마을) | `/home` | `pages/learner/Home` |
| S06 | 학습 영역 | `/areas` | `pages/learner/Areas` |
| S07 | 학습 단위 | `/unit` | `pages/learner/Unit` |
| S07-2 | 학습 단위·영상 | `/unit/video?level=` | `pages/learner/UnitVideo` |
| S08 | 시나리오 연습 | `/scenario` | `pages/learner/Scenario` |
| S09 | 감정 읽기 | `/emotion` | `pages/learner/Emotion` |
| S10 | 내 학습 기록 | `/collection` | `pages/learner/Collection` |
| S11 | 이음상담소 | `/talk` | `pages/learner/Talk` |
| S12 | 내 쪽지함 | `/messages` | `pages/learner/Messages` |
| S13 | 도움 받을 수 있는 곳 | `/help` | `pages/learner/ExternalHelp` |
| S14 | 내 정보 | `/profile` | `pages/learner/Profile` |
| S15 | 알림 | `/notifications` | `pages/learner/Notifications` |
| T01 | 이음쌤 홈 | `/teacher` | `pages/teacher/Teacher` |
| T02 | 쪽지 모아 보기 | `/teacher/messages` | `pages/teacher/TeacherMessages` |
| T03 | 신호 대응 기록 | `/teacher/signal` | `pages/teacher/TeacherSignal` |
| T04 | 강의 자료 올리기 | `/teacher/upload` | `pages/teacher/TeacherUpload` |

경로 상수는 `src/routes.ts`의 `ROUTES`, 라우터는 `src/router.tsx`(react-router 데이터 라우터 + 화면별 loader).
없는 경로는 `/`로 보냅니다.

## 폴더 구조

```
src/
  main.tsx, App.tsx, router.tsx, routes.ts
  assets/            index.ts(이미지 키 → 파일) + images/{brand,gems,village,banners,units,scenarios,emotion,collection,areas}
  components/        Header · SideNav · TeacherNav · Gem  (+ 각자 .css)
  pages/<auth|learner|teacher>/<Page>/<Page>.tsx + <Page>.css
  pages/learner/Home/villageEngine.ts   3D 마을 DOM 엔진(원본 로직 그대로)
  lib/               A.tsx(내부 링크=Link) · PageStyle.tsx · css.ts
  styles/            base.css · ie.css(디자인 시스템 공용 스타일, 원본 그대로)
  api/               types · client · session · services/* · mock/*
```

## 스타일

- `styles/ie.css` — 디자인 시스템 공용(`ie-*` 클래스). `main.tsx`에서 한 번 불러옵니다.
- 화면별 CSS(`<Page>.css`) — 같은 선택자를 화면마다 다르게 덮어쓰는 부분이 있어 `PageStyle`이 해당 화면이 떠 있는 동안만 `<style>`로 붙입니다. (화면 사이 스타일 새어 나감 방지)

## 백엔드 연결 (나중에 교체)

화면은 서버를 직접 부르지 않고 `src/api/services/*`만 호출합니다.

| 서비스 | 하는 일 |
|---|---|
| `authService` | login · signup · requestGuardianConsent · sendEmailCode |
| `contentService` | 학습 영역 · 단위 · 영상 · 시나리오 · 감정 · 약관 목록 |
| `recordService` | 학습 기록 조회, 시나리오 회고·감정 읽기·단위 완료 저장 |
| `messageService` | 쪽지 목록, 상담소 쪽지 보내기, 추가 쪽지 |
| `notificationService` | 알림 목록 · 읽음 처리 |
| `profileService` | 내 정보 · 비밀번호 · 탈퇴 · 알림 설정 |
| `teacherService` | 학습자 · 쪽지 · 신호 목록, 답장, 메모, 신호 대응 기록, 자료 게시 |

- 기본값은 **목업**(`src/api/mock/*`). `.env.example`을 `.env.local`로 복사해 `VITE_USE_MOCK=false`로 바꾸면 각 서비스의 `http()`가 `VITE_API_BASE_URL`(기본 `/api`)을 호출합니다.
- 각 서비스 함수 위 주석에 가정한 엔드포인트가 적혀 있습니다. 실제 API에 맞게 경로·응답 모양만 고치면 됩니다. 응답 타입은 `api/types.ts`.
- 목록 데이터는 라우트 `loader`에서 받아 화면 props로 들어갑니다(`router.tsx`의 loaders 표).
- 로그인한 닉네임은 `api/session.ts`에서 읽어 헤더 아바타·홈 인사말에 씁니다.

## 원본과 달라진 점 (의도적인 최소 수정)

1. **Signup** — 원본 `renderVals`에서 `gRel`이 빠져 있던 잠재 버그를 `gRel: s.gRel`로 채움.
2. **Landing** — 중괄호 하나짜리 핸들러 `{toLogin}`을 표현식으로 정규화.
3. **Home** — 3D 마을 엔진은 원본 DOM 코드라 `villageEngine.ts`에 분리하고 `// @ts-nocheck`.
4. **Landing / Login / Signup** — 디자인 캔버스 전용 초기화 훅(localStorage)이 남아 있음. 필요 없으면 삭제.
5. **Main(디자인 시스템 보드)**, **TeacherZone(캔버스 배경)** 은 화면이 아니라 제외.

## 알려진 한계

- 헤더 배지(안 읽은 알림 수, "이음상담소 1" 등)는 원본처럼 정적 값입니다. 서버 값으로 바꾸려면 Header에 prop을 연결하세요.
- T04 자료 올리기의 파일 업로드는 원본처럼 시뮬레이션이고, 게시 시 `publishMaterials`만 호출합니다.
- 웹폰트는 Noto Sans KR / Noto Serif KR(Google Fonts, `index.html`). 오프라인 환경이면 폰트 파일을 직접 호스팅하세요.
- 큰 이미지: `collection-scene`(약 2.2MB), 마을 프레임(각 250~330KB). 배포 전 압축/WebP 변환을 권장합니다.
