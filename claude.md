# Lumiq — AI 피부 타입 분석 & 스킨케어 루틴 추천 웹앱

## 프로젝트 개요

**Lumiq**는 사용자의 피부 고민(텍스트 + 사진)을 AI로 분석해 피부 타입을 진단하고, 맞춤형 스킨케어 루틴을 추천하는 웹앱입니다.
수행평가 프로젝트 (2026학년도 1학기)

---

## 기술 스택

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Routing:** React Router DOM v6
- **Backend:** Supabase (Auth + PostgreSQL)
- **AI:** Groq API
  - 텍스트 진단: `llama-3.3-70b-versatile`
  - 이미지 진단: `meta-llama/llama-4-scout-17b-16e-instruct`
- **배포:** Vercel

---

## 프로젝트 구조

```
lumiq/
├── public/
│   └── logo.png              # 앱 로고 이미지
├── src/
│   ├── lib/
│   │   ├── supabase.ts       # Supabase 클라이언트
│   │   └── groq.ts           # Groq AI API + 반복진단 로직
│   ├── types/
│   │   └── index.ts          # 전체 타입 정의
│   ├── components/
│   │   ├── Layout.tsx        # 반응형 래퍼 컴포넌트
│   │   ├── TabBar.tsx        # 하단 탭 네비게이션
│   │   ├── LumiqLogo.tsx     # 로고 컴포넌트 (xs/sm/md/lg)
│   │   ├── Toast.tsx         # 전역 토스트 알림
│   │   ├── Skeleton.tsx      # 로딩 스켈레톤 UI
│   │   └── PageTransition.tsx# 페이지 전환 애니메이션
│   ├── pages/
│   │   ├── SplashPage.tsx    # 스플래시 화면
│   │   ├── LoginPage.tsx     # 로그인 / 회원가입
│   │   ├── AuthCallbackPage.tsx # 메일 인증 콜백
│   │   ├── OnboardingPage.tsx# 3단계 온보딩
│   │   ├── HomePage.tsx      # 홈 (streak / 주간리포트 / 루틴 / 진단)
│   │   ├── DiagnosisPage.tsx # 피부 진단 입력 (텍스트 + 사진)
│   │   ├── ResultPage.tsx    # 진단 결과 (탭: 결과/루틴/시술)
│   │   ├── RoutinePage.tsx   # 루틴 체크리스트
│   │   ├── HistoryPage.tsx   # 진단 히스토리 캘린더
│   │   └── MyPage.tsx        # 마이페이지 (프로필/회원탈퇴)
│   ├── App.tsx               # 라우팅 + 스플래시 + 토스트
│   ├── main.tsx
│   └── index.css             # 세이지 그린 컬러 시스템 + 공통 클래스
├── .env                      # 환경변수 (gitignore)
└── vite.config.ts
```

---

## 환경변수 (.env)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GROQ_API_KEY=...
```

---

## Supabase DB 스키마

```sql
-- 사용자 프로필
user_profiles (id, user_id, nickname, skin_type, skin_concerns[], created_at)

-- 피부 진단 결과
skin_diagnoses (id, user_id, skin_type, reason, concerns, ai_result jsonb, created_at)

-- 루틴
routines (id, user_id, diagnosis_id, steps jsonb, created_at)

-- 루틴 체크
routine_checks (id, user_id, routine_id, step_index, checked_at, is_done)
-- unique constraint: (routine_id, checked_at, step_index)
```

모든 테이블에 RLS 활성화 — 본인 데이터만 접근 가능

---

## 컬러 시스템 (세이지 그린)

| 변수 | 색상 | 용도 |
|------|------|------|
| Primary | `#3D8B60` | 버튼, 강조 |
| Primary Dark | `#2D7A52` | 호버 |
| Primary Light | `#7BB898` | 아이콘, 보조 |
| Surface | `#F7F9F8` | 페이지 배경 |
| Border | `#E4EDE8` | 구분선 |
| Text | `#1A2E24` | 본문 |

그라디언트는 사용하지 않습니다. 모든 배경은 단색입니다.

---

## 공통 CSS 클래스

- `.btn-primary` — 세이지 그린 주요 버튼 (height: 52px)
- `.btn-secondary` — 연한 그린 보조 버튼
- `.input-field` — 테두리 없는 연초록 배경 입력창
- `.select-btn` / `.select-btn.selected` — 선택 버튼
- `.progress-bar` / `.progress-fill` — 진행 바
- `.fade-in` / `.fade-in-delay-1~4` — 페이드인 애니메이션

---

## 라우팅 구조

```
/login          — 로그인/회원가입 (비로그인 전용)
/auth/callback  — 메일 인증 콜백
/onboarding     — 온보딩 (로그인 필요)
/               — 홈 (로그인 필요)
/diagnosis      — 피부 진단 (로그인 필요)
/result         — 진단 결과 (로그인 필요, location.state 필요)
/routine        — 루틴 (로그인 필요)
/history        — 히스토리 (로그인 필요)
/my             — 마이페이지 (로그인 필요)
```

TabBar는 `/login`, `/result`, `/onboarding`, `/auth/callback`, `/my` 에서 숨김

---

## 주요 로직

### AI 진단 흐름
1. 최근 5회 진단 히스토리 조회
2. 동일 피부 타입 3회 이상이면 반복 진단으로 판단
3. 반복 진단 시 피부과 시술 추천 프롬프트 추가
4. 이미지 있으면 Vision 모델, 없으면 텍스트 모델 사용
5. JSON 파싱 실패 시 정규식으로 fallback 파싱

### 루틴 체크
- `step_index` 기반 upsert (`onConflict: 'routine_id,checked_at,step_index'`)
- 낙관적 업데이트 — 체크 즉시 UI 반영, 실패 시 롤백

### Streak 계산
- 어제부터 역산하여 연속 달성일 카운트
- 하루 전체 루틴 달성 기준 (전체 step 완료)

---

## 코딩 컨벤션

- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 타입: `types/index.ts`에 중앙 관리
- 인라인 스타일은 Tailwind로 불가능한 경우에만 사용
- 그라디언트 절대 사용 금지
- 모든 비동기 함수는 try/catch로 에러 처리
- toast로 사용자 피드백 제공

---

## 주의사항

- `.env` 파일은 절대 커밋하지 않는다
- Groq API는 CORS 문제 없이 브라우저에서 직접 호출 가능
- `Session` 타입은 반드시 `import type`으로 가져올 것
- `maybeSingle()` 사용 — `single()`은 데이터 없을 때 에러 발생
- 피부과 시술 추천은 반복 진단(3회↑) 시에만 표시