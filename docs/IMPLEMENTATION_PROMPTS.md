# Simple Todo — Claude Code 구현 프롬프트 (5단계, 순수 JavaScript)

`docs/PRD.md`를 기반으로 Claude Code에서 순서대로 실행할 5개 프롬프트. 프레임워크·빌드 도구 없이 `index.html` + `css/` + `js/`(ES 모듈)만 사용한다. 각 단계는 앞 단계의 결과물 위에서 이어진다.

> 5단계 전부 완료됨 (아래는 재실행하거나 다른 프로젝트에 참고할 때를 위한 기록).

---

## 1단계 — 프로젝트 초기화 ✅ 완료

```
docs/PRD.md를 읽고 이 프로젝트의 요구사항을 파악해줘.

이 폴더(project/simple-todo)에 프레임워크·빌드 도구 없이 순수 HTML/CSS/JavaScript로 프로젝트를 초기화해줘.

요구사항:
1. index.html — <div id="app"></div>와 <script type="module" src="js/app.js"> 포함
2. css/style.css — 기본 리셋 + 시스템 폰트 정도의 최소 스타일
3. js/app.js — 진입점 (지금은 빈 화면에 "Simple Todo" 텍스트만 표시)
4. 로컬에서 정적 서버(예: npx serve)로 열었을 때 정상 표시되는지 확인
   (ES 모듈은 file://로 직접 열면 CORS 정책 때문에 동작하지 않으므로 반드시 http:// 서버로 확인)

완료 후 폴더 구조를 요약해서 알려줘.
```

**결과**: `index.html`, `css/style.css`, `js/app.js`. `npx serve`로 정적 서빙, 빌드 단계 없음.

---

## 2단계 — 데이터 모델 & localStorage 저장소 레이어 ✅ 완료

```
docs/PRD.md의 "4. 데이터 & 저장" 섹션 기준으로 데이터 레이어를 구현해줘.

1. js/storage.js
   - loadTodos() — localStorage에서 읽기, 키 'simple-todo:v1', JSON 파싱 실패 시 빈 배열로 안전하게 폴백
   - saveTodos(todos) — localStorage에 쓰기

2. js/todos.js
   - 모듈 최상단에서 loadTodos()로 초기 상태 로드 (let todos = loadTodos())
   - getTodos() — 현재 배열 반환
   - subscribe(fn) — 상태 변경 콜백 등록 (구독 해제 함수 반환), UI 재렌더링에 사용할 pub-sub 패턴
   - addTodo(title, category) — 빈 문자열(trim 후 공백)은 무시, id는 crypto.randomUUID()
   - updateTodo(id, patch), deleteTodo(id), toggleComplete(id)
   - 위 4개 함수는 모두 내부적으로 todos 배열을 갱신한 뒤 saveTodos()로 저장하고 구독자에게 알림

이 단계는 UI 없이 로직만 구현한다. 브라우저 콘솔에서 dynamic import로 함수를 직접 호출해서 동작을 확인하고, 확인 후 임시로 추가한 코드는 남기지 마라.
```

**결과**: `js/storage.js`, `js/todos.js`. `app.js`는 아직 데이터 레이어를 사용하지 않음 (3단계에서 연결).

---

## 3단계 — 핵심 CRUD UI (DOM 직접 조작) ✅ 완료

```
2단계에서 만든 js/todos.js를 js/app.js에 연결해서 PRD "3.1 할일 추가/수정/삭제"와 "3.2 완료 체크" 기능의 UI를 구현해줘.

프레임워크 없이 순수 DOM API(document.createElement, addEventListener 등)로 작성한다.

1. index.html에 필요한 뼈대 요소 추가 (입력창 + 추가 버튼, 목록을 렌더링할 <ul id="todo-list">)
2. js/app.js
   - todos.subscribe(render)로 상태가 바뀔 때마다 자동 재렌더링되게 연결
   - render() 함수: getTodos()를 순회하며 각 항목을 <li>로 그려서 #todo-list에 반영 (매번 innerHTML을 통째로 다시 그려도 된다, 지금 규모에선 충분)
   - 각 <li>는 체크박스, 할일 텍스트, 수정/삭제 버튼을 포함
     - 체크박스 클릭 → toggleComplete(id), 완료 항목은 CSS로 취소선 + 흐리게
     - 더블클릭 또는 수정 버튼 → 텍스트를 <input>으로 교체하는 인라인 편집 모드, Enter/blur로 updateTodo 저장, Esc로 취소
     - 삭제 버튼 → deleteTodo(id) 즉시 실행 (되돌리기 없음, confirm() 정도만)
   - 입력창 + 추가 버튼 → addTodo(title, category) 호출 (카테고리는 이 단계에서는 'work' 고정으로 넘겨도 됨, 4단계에서 선택 UI 추가)
   - 완료된 항목은 배열 정렬 시 하단으로 가도록 render()에서 처리

이 단계에서는 카테고리 선택 UI와 진행률은 아직 만들지 않는다 (다음 단계).

완료 후 정적 서버로 실행해서 추가/수정/삭제/완료체크가 실제로 동작하는지, 새로고침해도 데이터가 유지되는지 확인해줘.
```

---

## 4단계 — 카테고리 분류 + 필터 + 진행률 표시 ✅ 완료

```
PRD "3.3 카테고리 분류"와 "3.4 진행률 보기", "6. 화면 구성"을 기준으로 아래를 구현해줘.

1. 입력창 옆에 카테고리 <select> 추가 (업무/개인/공부, 기본값 업무) → addTodo 호출 시 선택값 전달
2. 각 <li>에 카테고리 색상 태그(span) 표시 — 업무/개인/공부 각각 다른 색상 클래스
3. 필터 버튼 4개(전체/업무/개인/공부) 추가
   - js/app.js에 현재 선택된 필터를 담는 지역 변수(let currentFilter = 'all') 두고, render()에서 getTodos()를 필터링해서 그리기
4. 진행률 표시 영역 추가 (상단)
   - 전체 진행률(완료/전체 %)을 프로그레스 바 요소 + 텍스트로 표시
   - 카테고리별 진행률(예: 업무 2/5, 개인 1/3, 공부 3/4)도 함께 표시
   - 할일이 0개일 때는 "할일 없음" 상태 표시
   - 이 계산도 render() 안에서 매번 getTodos() 기준으로 다시 계산 (별도 상태 저장 안 함)
5. 인라인 편집 UI에서 카테고리도 함께 수정 가능하게 연결

완료 후 브라우저에서 카테고리별로 추가하고, 필터를 전환하고, 진행률 숫자가 실제 완료 상태와 일치하는지 확인해줘.
```

---

## 5단계 — UI 다듬기 & 최종 검증 ✅ 완료

```
PRD "6. 화면 구성" 레이아웃(상단 진행률 → 입력줄 → 카테고리 필터 → 목록 순서)과 "7. 비기능 요구사항", "8. 성공 기준"을 기준으로 마무리 작업을 해줘.

1. css/style.css로 전체 레이아웃/여백/타이포그래피 정리 (단일 화면, 최대 폭 제한, 중앙 정렬)
2. 빈 상태(할일 0개), 카테고리별 0개 필터 결과 등 엣지케이스 UI 확인 및 처리
3. 할일 20개 정도를 넣었을 때 추가/삭제/토글 반응이 끊김 없이 동작하는지 확인 (매번 전체 재렌더링이라 이 규모에선 문제 없을 것, 느리면 render() 최적화)
4. 아래 성공 기준을 실제로 브라우저에서 검증:
   - 할일을 추가→체크→카테고리 분류까지 이 화면 하나로 끝낼 수 있는가
   - 새로고침 후에도 오늘 입력한 할일이 그대로 남아있는가
   - 진행률 숫자만 보고 오늘 얼마나 했는지 바로 파악되는가
5. 발견된 버그나 어색한 인터랙션이 있으면 수정

검증은 실제로 정적 서버를 띄우고 브라우저에서 조작해보면서 진행하고, 마지막에 확인한 내용을 요약해줘.
```
