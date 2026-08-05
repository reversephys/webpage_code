# 프로젝트 가이드 (CLAUDE.md)

이 파일은 Claude가 이슈를 처리하고 PR을 만들 때 따르는 규칙입니다.
저장소 최상단(root)에 있으면 GitHub Action이 자동으로 참고합니다.

## 프로젝트 개요

- ReversePhys 연구실 웹사이트. 공개 페이지(소개·연구·성과·공지·블로그)와
  로그인 기반 내부 페이지(멤버·프로필·내부 블로그)를 함께 제공합니다.
- 기술 스택: **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4**,
  백엔드는 **PocketBase**(`backend/`에 바이너리와 마이그레이션 포함).
- 배포는 Docker + Caddy (`Dockerfile`, `docker-compose.yml`, `Caddyfile`).

### 디렉터리 구조

- `app/` — App Router 라우트. 각 폴더가 하나의 페이지(`about`, `blog`, `projects`,
  `notice`, `member`, `staff`, `profile`, `login`, `achievements`, `skills`)이고
  `app/api/`는 라우트 핸들러입니다.
- `components/` — 재사용 UI 컴포넌트.
- `lib/` — 데이터 접근 계층. PocketBase 클라이언트(`pocketbase.ts`)와
  도메인별 조회 함수(`blog.ts`, `projects.ts`, `staff.ts`, `auth.ts` 등)가 있습니다.
  **데이터 조회 로직은 컴포넌트가 아니라 `lib/`에 둡니다.**
- `backend/` — PocketBase 실행 파일·데이터·마이그레이션. **직접 수정하지 않습니다.**
- `public/`, `logo/` — 정적 자산.

### 접근 권한

내부 공개 콘텐츠(내부 블로그 등)는 `permission_group >= 3` 인 사용자에게만 노출됩니다.
권한이 걸린 데이터를 다룰 때는 기존 `lib/auth.ts` / `lib/auth-server.ts` 패턴을 따르세요.

## 코드 스타일

- TypeScript strict. `any` 대신 정확한 타입을 쓰고, 타입은 사용하는 파일 근처에 둡니다.
- 컴포넌트는 함수형 + 기본 서버 컴포넌트. 클라이언트 상태가 필요할 때만 `"use client"`.
- 스타일은 Tailwind 유틸리티 클래스. 조건부 클래스는 이미 있는 `clsx` / `tailwind-merge`
  (`lib/utils.ts`)를 사용합니다.
- 새 라이브러리를 추가하기보다 `package.json`에 이미 있는 것(framer-motion,
  lucide-react, react-markdown, remark-gfm 등)을 먼저 활용합니다.
- 린트는 `eslint-config-next` 기준(`eslint.config.mjs`). 새 포맷터를 도입하지 않습니다.
- 커밋 메시지는 Conventional Commits — `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

## 브랜치 · PR 규칙

- 브랜치 이름: `issue-<번호>` (또는 `fix/<설명>`)
- PR은 항상 `main` 을 대상으로 생성
- PR 본문에 `Closes #<이슈번호>` 를 포함해 이슈 자동 종료
- PR 제목·본문은 한국어로 작성하고, 무엇을 왜 바꿨는지 요약

## 테스트 · 검증

이 저장소에는 테스트 러너가 없습니다. 변경 후 아래로 검증하세요.

```bash
npx tsc --noEmit   # 타입 체크 — 반드시 통과해야 함
npm run lint       # ESLint — 아래 주의사항 참고
```

주의사항 두 가지가 있습니다.

- **`npm run lint`는 현재 exit 0이 아닙니다.** `main` 기준으로 이미 21개의
  에러(주로 `lib/`, `app/`의 `@typescript-eslint/no-explicit-any`)와 25개의
  경고가 남아 있습니다. 변경 후 **새 에러가 늘지 않았는지만** 확인하고,
  이슈와 무관한 기존 에러는 고치지 마세요.
- **`npm run build`는 PocketBase 서버가 떠 있어야 성공합니다.** 빌드 중
  페이지가 데이터를 가져오기 때문이며, Dockerfile도 빌드 전에 PocketBase를
  띄웁니다. 서버가 없는 환경(CI 등)에서는 실행하지 마세요. 로컬에서 돌리려면
  `backend/pocketbase.exe serve` 를 먼저 실행합니다.

## 하지 말아야 할 것

- `main` 브랜치에 직접 push 금지 (항상 PR 경유)
- 시크릿·환경변수 파일(`.env` 등) 생성/노출 금지
- `backend/pb_data/`, `node_modules/`, `.next/`, `tsconfig.tsbuildinfo` 등
  생성물·데이터 디렉터리 수정 금지
- `package-lock.json`을 이유 없이 재생성하지 않기 (의존성을 실제로 바꿀 때만)
- 대규모 리팩터링은 이슈에 명시적으로 요청된 경우에만
