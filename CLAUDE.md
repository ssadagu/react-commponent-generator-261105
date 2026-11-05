# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

패키지 매니저/런타임은 **Bun**이다 (`bun.lock`).

```bash
bun install
bun run dev          # API 서버(3002) + Vite(5173) 동시 실행 (concurrently)
bun run server       # API 서버만 (bun --watch server/index.ts)
bun run build        # tsc -b && vite build
bun run lint         # eslint .
bun run test         # vitest run (전체)
bun run test:watch   # vitest watch
bunx vitest run src/utils/validatePrompt.test.ts          # 단일 파일
bunx vitest run -t "테스트 이름 일부"                      # 이름으로 필터
```

## Architecture

프롬프트 → AI가 React 컴포넌트 코드 생성 → react-live로 미리보기. 두 프로세스로 구성된다.

- **프론트엔드 (`src/`)**: Vite + React 19. `/api` 요청은 `vite.config.ts`의 proxy가 `localhost:3002`로 전달한다.
  - `hooks/useComponentGenerator.ts`가 `/api/generate` 호출과 생성 목록 상태를 담당한다.
  - `hooks/usePersistentState.ts`는 localStorage 동기화 훅이다. 저장값은 `revive` 콜백으로 검증·복원한다(예: `createdAt` → `Date`). 키는 `rcg:` 접두사.
  - `components/LivePreview.tsx`는 react-live로 코드를 런타임 렌더링한다.
- **API 서버 (`server/index.ts`)**: `Bun.serve` 단일 파일 프록시. `/api/config`(서버 env 키 보유 여부), `/api/generate`(Anthropic/Google 호출) 제공.
  - API 키 우선순위: 클라이언트가 보낸 키 → 서버 `.env`(`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`).
  - Google은 `GOOGLE_MODELS` 순서대로 `withModelFallback`(`server/fallback.ts`)으로 폴백한다.
  - 테스트 가능하도록 순수 로직은 `server/generator.ts`(`stripCodeFences`, `ensureRenderCall`)와 `fallback.ts`로 분리되어 있다. `Bun.serve` 부수효과가 있는 `index.ts`에는 로직을 넣지 말고 분리한 뒤 테스트한다.
- **생성 코드 계약**: `SYSTEM_PROMPT`가 모델에게 "import 금지, 인라인 스타일만, 순수 JS(TS 문법 금지), 마지막에 `render(<Comp />)` 호출"을 강제한다. react-live가 `noInline`이라 `render(...)`가 없으면 미리보기가 그려지지 않으며, 서버가 `ensureRenderCall`로 누락 시 자동 주입한다. 시스템 프롬프트와 이 후처리는 함께 수정해야 한다.

## Testing

- Vitest + jsdom + Testing Library. 설정은 `vite.config.ts`의 `test` 블록, 셋업은 `src/test/setup.ts`.
- 테스트는 `src/**/*.test.{ts,tsx}`와 `server/**/*.test.ts`에 소스와 같은 위치로 둔다.
- TDD는 `.claude/rules/tdd.md`를 따른다 (비즈니스 로직·유틸·API·버그 수정은 RED부터).
