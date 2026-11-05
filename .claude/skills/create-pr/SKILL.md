---
name: create-pr
description: 현재 브랜치의 변경사항을 분석해 PR 템플릿에 맞춰 GitHub Pull Request를 생성한다. 프로젝트 성격(해외 오픈소스 → 영문, 한국 프로젝트 → 한국어)에 따라 템플릿 언어를 자동 선택한다. "PR 만들어줘", "PR 생성", "풀리퀘스트 올려줘", "create pr", "open a pull request", "/create-pr" 같은 요청이나, 작업을 마치고 리뷰를 위해 변경사항을 올리려는 맥락이면 명시적으로 PR이라고 말하지 않아도 이 스킬을 사용한다.
context: fork
allowed-tools: Bash, Read, Glob, Grep
---

# create-pr

현재 브랜치의 변경사항을 분석해 PR 템플릿을 채우고 `gh pr create`로 Pull Request를 만든다.
이 스킬은 `context: fork`로 실행되므로 서브 에이전트가 독립된 컨텍스트에서 수행한다. 그래서 대화 히스토리에 의존하지 말고, **git 상태와 diff만으로** PR 내용을 완성해야 한다. 작업이 끝나면 PR URL과 사용된 템플릿 언어를 짧게 보고한다.

## 템플릿

| 언어 | 파일 | 사용 조건 |
|------|------|-----------|
| 한국어 | `references/template-ko.md` | 한국 프로젝트 |
| 영어 | `references/template-en.md` | 해외 오픈소스 프로젝트 |

## 절차

### 1. 사전 확인
다음을 병렬로 실행한다.
- `git status`, `git branch --show-current`
- `git remote -v` — 원격 저장소 확인
- `gh auth status` — 인증 확인. 실패하면 `gh auth login` 안내 후 종료한다.
- 기본 브랜치: `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

중단해야 하는 경우 (이유를 알리고 종료):
- 현재 브랜치가 기본 브랜치다. PR의 head가 될 수 없으므로 작업 브랜치를 먼저 만들도록 안내한다.
- 기본 브랜치 대비 커밋이 없다.
- 커밋하지 않은 변경이 남아 있다. 임의로 커밋하지 말고 `/commit`으로 먼저 커밋하도록 안내한다. (PR에 포함되지 않을 변경이 있다는 사실을 사용자가 알아야 하기 때문이다.)

### 2. 변경사항 분석
기본 브랜치를 `<base>`라 할 때:
- `git log <base>..HEAD --format='%h %s%n%b'` — PR에 포함될 커밋들
- `git diff <base>...HEAD --stat` 로 범위를 파악한 뒤 `git diff <base>...HEAD`로 실제 내용 확인 (diff가 크면 핵심 파일 위주로 읽는다)

커밋 메시지만 요약하지 말고 diff를 직접 읽어서 "무엇이, 왜" 바뀌었는지 이해한다. 리뷰어가 가장 알고 싶은 것은 변경의 의도와 확인 방법이기 때문이다.

### 3. 템플릿 언어 결정
아래 신호를 위에서부터 확인하고, 처음으로 명확한 결론이 나는 신호를 따른다.

1. **저장소에 자체 PR 템플릿이 있는가** — `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`, `docs/pull_request_template.md`. 있으면 프로젝트 규칙이 최우선이므로 그 템플릿을 쓰고 `references/`는 쓰지 않는다.
2. **사용자가 언어를 지정했는가** — 호출 인자에 "영문으로", "in English", "한국어로" 등이 있으면 그대로 따른다.
3. **프로젝트 성격**
   - 한국어 신호: README/CONTRIBUTING이 한국어로 쓰임, 최근 커밋·PR 제목이 한국어(`git log -10`, `gh pr list --state all -L 10`), 한국 조직/사용자 소유, CLAUDE.md·AGENTS.md가 한국어
   - 영어 신호: 위 항목들이 영어, 다국적 기여자가 있는 공개 오픈소스 프로젝트(CONTRIBUTING, CODE_OF_CONDUCT, 다수 외부 기여자)
4. **판단이 어려우면 한국어**를 쓴다. (이 스킬을 쓰는 팀의 기본 언어이기 때문이다.) 이 경우 보고에 "언어를 추정했다"고 밝혀서 사용자가 바로잡을 수 있게 한다.

한국어/영어 신호가 섞여 있으면 **PR을 읽을 리뷰어의 언어**를 기준으로 삼는다. 최근 머지된 PR들이 어떤 언어인지가 가장 믿을 만한 단서다.

### 4. PR 작성
선택한 템플릿 파일을 Read로 읽고, 구조(섹션 제목과 순서)는 유지한 채 내용을 채운다.

- **제목**: 70자 이내. 커밋 컨벤션이 있으면 맞춘다. 한국 프로젝트는 `<type>: <요약>`(예: `feat: 컴포넌트 카드에 복사 버튼 추가`), 영문 프로젝트는 최근 PR 제목 스타일(`feat: add copy button to component card`)을 따른다. 템플릿 언어와 제목 언어를 일치시킨다.
- **본문**: 실제 변경에서 확인된 사실만 적는다. 실행하지 않은 테스트를 "통과"로 체크하거나, diff에 없는 변경을 쓰지 않는다. 확인하지 못한 항목은 체크하지 않은 채 둔다.
- 해당 없는 섹션은 지우지 말고 "해당 없음" / "N/A"로 둔다. 구조가 일정해야 리뷰어가 훑기 쉽다.
- 관련 이슈가 커밋/브랜치명에서 드러나면 연결한다 (`Closes #123`). 추측으로 이슈 번호를 만들지 않는다.
- 스크린샷이 필요한 UI 변경이면 스크린샷 섹션에 "첨부 필요"라고 남기고, 사용자에게 추가하라고 보고한다.
- 시스템 지시에 PR attribution 줄이 있으면 본문 맨 끝에 추가한다.

### 5. 푸시 및 PR 생성
- 원격에 브랜치가 없거나 뒤처져 있으면 `git push -u origin <branch>`로 푸시한다. force push는 하지 않는다.
- 본문은 HEREDOC 또는 임시 파일(`--body-file`)로 전달해 줄바꿈과 백틱이 깨지지 않게 한다.
- `gh pr create --base <base> --head <branch> --title "..." --body-file <file>`
- 사용자가 요청했을 때만 `--draft`, `--reviewer`, `--label`을 붙인다.
- 이미 같은 브랜치의 열린 PR이 있으면(`gh pr view`로 확인) 새로 만들지 말고 URL을 알린 뒤 본문을 갱신할지 물어본다.

### 6. 보고
마지막 응답에 다음만 간결하게 담는다.
- PR URL
- 사용한 템플릿(한국어/영어)과 그 선택 근거 한 줄
- 사용자가 직접 해야 할 일 (스크린샷 첨부, 미확인 테스트 항목 등)

## 주의
- `.env`, 키, 토큰 등 비밀 정보가 diff에 보이면 PR을 만들지 말고 사용자에게 알린다.
- merge, 기존 PR 닫기, 브랜치 삭제는 하지 않는다. 요청 범위는 PR 생성까지다.
