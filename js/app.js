import { addTodo, deleteTodo, getTodos, subscribe, toggleComplete, updateTodo } from './todos.js'
import { guessCategory } from './categorize.js'
import { initTheme, toggleTheme } from './theme.js'

const CATEGORY_LABELS = { work: '업무', personal: '개인', study: '공부' }

const listEl = document.querySelector('#todo-list')
const formEl = document.querySelector('#todo-form')
const inputEl = document.querySelector('#todo-input')
const categorySelectEl = document.querySelector('#todo-category')
const filterRowEl = document.querySelector('#filter-row')
const progressFillEl = document.querySelector('#progress-fill')
const progressTextEl = document.querySelector('#progress-text')
const progressByCategoryEl = document.querySelector('#progress-by-category')
const themeToggleEl = document.querySelector('#theme-toggle')

let currentFilter = 'all'
let categoryTouched = false

formEl.addEventListener('submit', (e) => {
  e.preventDefault()
  addTodo(inputEl.value, categorySelectEl.value)
  inputEl.value = ''
  categoryTouched = false
  inputEl.focus()
})

// Auto-suggest a category from the title as the user types, unless they've
// picked one manually for this entry — a manual choice always wins.
inputEl.addEventListener('input', () => {
  if (categoryTouched) return
  const guessed = guessCategory(inputEl.value)
  if (guessed) categorySelectEl.value = guessed
})

categorySelectEl.addEventListener('change', () => {
  categoryTouched = true
})

function syncThemeToggle(theme) {
  themeToggleEl.textContent = theme === 'dark' ? '☀️' : '🌙'
}

themeToggleEl.addEventListener('click', () => {
  syncThemeToggle(toggleTheme())
})

filterRowEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]')
  if (!btn) return

  currentFilter = btn.dataset.filter
  for (const el of filterRowEl.querySelectorAll('.filter-btn')) {
    el.classList.toggle('active', el === btn)
  }
  render()
})

listEl.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-id]')
  if (!li) return
  const id = li.dataset.id

  if (e.target.matches('[data-action="toggle"]')) {
    toggleComplete(id)
  } else if (e.target.matches('[data-action="delete"]')) {
    if (confirm('이 할일을 삭제할까요?')) deleteTodo(id)
  } else if (e.target.matches('[data-action="edit"]')) {
    startEdit(li, id)
  }
})

listEl.addEventListener('dblclick', (e) => {
  const titleEl = e.target.closest('[data-role="title"]')
  if (!titleEl) return
  const li = titleEl.closest('li[data-id]')
  startEdit(li, li.dataset.id)
})

function startEdit(li, id) {
  const titleEl = li.querySelector('[data-role="title"]')
  const catEl = li.querySelector('[data-role="category-tag"]')
  if (!titleEl || !catEl) return // already editing this item

  const todo = getTodos().find((t) => t.id === id)
  if (!todo) return

  let done = false

  const editInput = document.createElement('input')
  editInput.type = 'text'
  editInput.className = 'edit-input'
  editInput.value = todo.title

  const editSelect = document.createElement('select')
  editSelect.className = 'edit-select'
  for (const [value, label] of Object.entries(CATEGORY_LABELS)) {
    const opt = document.createElement('option')
    opt.value = value
    opt.textContent = label
    opt.selected = value === todo.category
    editSelect.appendChild(opt)
  }

  titleEl.replaceWith(editInput)
  catEl.replaceWith(editSelect)
  editInput.focus()
  editInput.select()

  function commit() {
    if (done) return
    done = true
    updateTodo(id, { title: editInput.value, category: editSelect.value })
  }

  function cancel() {
    if (done) return
    done = true
    render()
  }

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  })

  // focusout bubbles, so this fires when focus leaves either edit-input or
  // edit-select; relatedTarget lets us skip the commit while focus just
  // moves from one to the other within the same edit group.
  li.addEventListener('focusout', (e) => {
    if (li.contains(e.relatedTarget)) return
    commit()
  })
}

function renderItem(todo) {
  const li = document.createElement('li')
  li.dataset.id = todo.id
  li.className = todo.completed ? 'todo-item completed' : 'todo-item'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = todo.completed
  checkbox.dataset.action = 'toggle'

  const title = document.createElement('span')
  title.dataset.role = 'title'
  title.className = 'todo-title'
  title.textContent = todo.title

  const catTag = document.createElement('span')
  catTag.dataset.role = 'category-tag'
  catTag.className = `cat-tag cat-${todo.category}`
  catTag.textContent = CATEGORY_LABELS[todo.category]

  const editBtn = document.createElement('button')
  editBtn.type = 'button'
  editBtn.dataset.action = 'edit'
  editBtn.textContent = '✎'
  editBtn.setAttribute('aria-label', '수정')

  const deleteBtn = document.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.dataset.action = 'delete'
  deleteBtn.textContent = '🗑'
  deleteBtn.setAttribute('aria-label', '삭제')

  li.append(checkbox, title, catTag, editBtn, deleteBtn)
  return li
}

function updateProgress() {
  const all = getTodos()
  const total = all.length
  const completed = all.filter((t) => t.completed).length

  if (total === 0) {
    progressFillEl.style.width = '0%'
    progressTextEl.textContent = '할일 없음'
    progressByCategoryEl.textContent = ''
    return
  }

  const pct = Math.round((completed / total) * 100)
  progressFillEl.style.width = `${pct}%`
  progressTextEl.textContent = `${pct}% (${completed}/${total})`

  progressByCategoryEl.textContent = Object.keys(CATEGORY_LABELS)
    .map((cat) => {
      const items = all.filter((t) => t.category === cat)
      const done = items.filter((t) => t.completed).length
      return `${CATEGORY_LABELS[cat]} ${done}/${items.length}`
    })
    .join('   ')
}

function render() {
  const all = getTodos()
  const filtered = currentFilter === 'all' ? all : all.filter((t) => t.category === currentFilter)
  const sorted = [...filtered].sort((a, b) => Number(a.completed) - Number(b.completed))

  listEl.innerHTML = ''
  if (sorted.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty-state'
    empty.textContent =
      all.length === 0
        ? '아직 할일이 없습니다. 위에서 추가해보세요.'
        : `${CATEGORY_LABELS[currentFilter] ?? '이 카테고리'}에 해당하는 할일이 없습니다.`
    listEl.appendChild(empty)
  } else {
    for (const todo of sorted) {
      listEl.appendChild(renderItem(todo))
    }
  }

  updateProgress()
}

syncThemeToggle(initTheme())
subscribe(render)
render()
