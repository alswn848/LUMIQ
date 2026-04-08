<div align="center">

<br />

# 🌿 LUMIQ

### AI가 분석하는 나만의 피부 진단 & 스킨케어 루틴 앱

<br />

![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br />

</div>

---

## 💡 소개

**LUMIQ**은 피부 고민 텍스트와 사진을 AI로 분석해 피부 타입을 진단하고, 나에게 딱 맞는 스킨케어 루틴을 만들어주는 웹 앱입니다.

매일 루틴을 체크하고, 연속 달성일과 주간 달성률을 확인하며 꾸준한 피부 관리 습관을 만들어보세요.

<br />

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🔬 **AI 피부 진단** | 텍스트 + 사진으로 8가지 피부 타입 정밀 분석 |
| 📋 **맞춤 루틴 생성** | 진단 결과 기반 5단계 스킨케어 루틴 자동 생성 |
| ✅ **루틴 체크** | 오늘의 루틴 완료 체크 및 진행률 확인 |
| 🔥 **연속 달성** | 연속 달성일 · 주간 달성률 통계 |
| 📅 **진단 히스토리** | 캘린더 형태로 과거 진단 기록 열람 |
| 🏥 **피부과 시술 추천** | 동일 피부 타입 3회 이상 반복 진단 시 시술 추천 |

<br />

## 🛠 기술 스택

```
Frontend  │ React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router v7
Backend   │ Supabase (PostgreSQL + Auth)
AI        │ Groq API (Llama 4 Scout · Llama 3.3 70B)
```

<br />

## 🚀 시작하기

### 1. 클론 & 설치

```bash
git clone https://github.com/alswn848/LUMIQ.git
cd LUMIQ
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

<br />

## 🗄 데이터베이스 구성

Supabase에서 아래 테이블을 생성해주세요.

```sql
-- 사용자 프로필
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id),
  nickname text,
  skin_type text,
  skin_concerns text[],
  created_at timestamptz default now()
);

-- 피부 진단 결과
create table skin_diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  skin_type text,
  reason text,
  concerns text,
  ai_result jsonb,
  created_at timestamptz default now()
);

-- 스킨케어 루틴
create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  diagnosis_id uuid references skin_diagnoses(id),
  steps jsonb,
  created_at timestamptz default now()
);

-- 루틴 체크 기록
create table routine_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  routine_id uuid references routines(id),
  step_index integer,
  checked_at date,
  is_done boolean,
  unique (routine_id, checked_at, step_index)
);
```

<br />

## 📁 프로젝트 구조

```
src/
├── components/       # 공통 UI 컴포넌트
│   ├── TabBar
│   ├── Toast
│   ├── Layout
│   ├── ScrollToTop
│   └── Skeleton
├── lib/              # 외부 서비스 연동
│   ├── supabase.ts
│   ├── groq.ts
│   └── skinColors.ts
├── pages/            # 페이지 컴포넌트
│   ├── LoginPage
│   ├── OnboardingPage
│   ├── HomePage
│   ├── DiagnosisPage
│   ├── ResultPage
│   ├── RoutinePage
│   ├── HistoryPage
│   └── Mypage
└── types/            # TypeScript 타입 정의
```

<br />

## 📄 라이선스

MIT License © 2026 alswn848
