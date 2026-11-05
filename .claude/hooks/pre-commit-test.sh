#!/usr/bin/env bash
# PreToolUse(Bash) 훅: git commit 전에 `bun run test`가 통과해야만 커밋을 허용한다.
# 실패 시 exit 2로 도구 호출을 차단하고, 테스트 출력은 stderr로 Claude에게 전달한다.

cmd=$(jq -r '.tool_input.command // empty')

# git commit 명령이 아니면 통과 (git commit-tree 등은 제외)
if ! echo "$cmd" | grep -Eq '(^|[;&|[:space:]])git[[:space:]]+(-[^[:space:]]+[[:space:]]+)*commit([[:space:]]|$)'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

output=$(bun run test 2>&1)
status=$?

if [ $status -ne 0 ]; then
  {
    echo "🚫 커밋 차단: bun run test 실패. 테스트를 모두 통과시킨 뒤 다시 커밋하세요."
    echo "$output" | tail -n 60
  } >&2
  exit 2
fi

# 통과 시 사용자 화면에 요약 한 줄 표시 (vitest의 "Tests  40 passed (40)" 줄)
summary=$(echo "$output" | grep -E '^[[:space:]]*Tests[[:space:]]' | sed -E 's/^[[:space:]]+//' | head -n 1)
jq -n --arg msg "✅ 커밋 전 테스트 통과: ${summary:-bun run test}" '{systemMessage: $msg}'
exit 0
