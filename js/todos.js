import { loadTodos, saveTodos } from './storage.js'

let todos = loadTodos()
const listeners = []

function notify() {
  saveTodos(todos)
  listeners.forEach((fn) => fn(todos))
}

export function getTodos() {
  return todos
}

export function subscribe(fn) {
  listeners.push(fn)
  return () => {
    const i = listeners.indexOf(fn)
    if (i !== -1) listeners.splice(i, 1)
  }
}

export function addTodo(title, category) {
  const trimmed = title.trim()
  if (!trimmed) return

  const now = new Date().toISOString()
  todos = [
    ...todos,
    {
      id: crypto.randomUUID(),
      title: trimmed,
      category,
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
  ]
  notify()
}

export function updateTodo(id, patch) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, ...patch, updatedAt: new Date().toISOString() } : todo,
  )
  notify()
}

export function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id)
  notify()
}

export function toggleComplete(id) {
  todos = todos.map((todo) =>
    todo.id === id
      ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
      : todo,
  )
  notify()
}
