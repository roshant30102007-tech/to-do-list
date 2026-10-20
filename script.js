// ========== 1. SETUP ==========
const STORAGE_KEY = 'daily-tasks-v1';

const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority');
const listEl = document.getElementById('task-list');
const emptyEl = document.getElementById('empty');
const countEl = document.getElementById('count');
const clearBtn = document.getElementById('clear-done');
const filterBtns = document.querySelectorAll('.filter');

let tasks = loadTasks();
let currentFilter = 'all';

// ========== 2. LOCAL STORAGE ==========
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];   // storage blocked or data corrupted: start fresh
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.warn('Could not save tasks:', error);
  }
}

// ========== 3. TASK ACTIONS (add, toggle, remove, clear) ==========
function addTask(text, priority) {
  tasks.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    priority,
    done: false
  });
  update();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  update();
}

function removeTask(id, itemEl) {
  // play the slide-out animation, then delete the data
  itemEl.classList.add('removing');
  const finish = () => {
    tasks = tasks.filter(t => t.id !== id);
    update();
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else itemEl.addEventListener('animationend', finish, { once: true });
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.done);
  update();
}

// ========== 4. RENDERING ==========
function visibleTasks() {
  if (currentFilter === 'active') return tasks.filter(t => !t.done);
  if (currentFilter === 'done') return tasks.filter(t => t.done);
  return tasks;
}

function createItem(task) {
  const li = document.createElement('li');
  li.className = 'task' + (task.done ? ' done' : '');

  const label = document.createElement('label');
  label.className = 'check';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = task.done;
  box.setAttribute('aria-label', `Mark "${task.text}" as completed`);
  box.addEventListener('change', () => toggleTask(task.id));
  label.append(box, document.createElement('span'));

  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = task.text;           // textContent keeps user input safe

  const tag = document.createElement('span');
  tag.className = 'tag ' + task.priority;
  tag.title = task.priority + ' priority';

  const del = document.createElement('button');
  del.className = 'delete';
  del.innerHTML = '&times;';
  del.setAttribute('aria-label', `Delete "${task.text}"`);
  del.addEventListener('click', () => removeTask(task.id, li));

  li.append(label, text, tag, del);
  return li;
}

function renderList() {
  listEl.replaceChildren(...visibleTasks().map(createItem));

  const messages = {
    all: 'Nothing here yet. Add your first task above.',
    active: 'Nothing left to do. Enjoy the free time.',
    done: 'No completed tasks yet.'
  };
  emptyEl.textContent = messages[currentFilter];
  emptyEl.hidden = visibleTasks().length > 0;
}

function renderProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const left = total - done;

  document.getElementById('progress-label').textContent =
    total === 0 ? 'No tasks yet'
    : left === 0 ? 'All done. Nice work!'
    : `${done} of ${total} done`;
  document.getElementById('progress-percent').textContent = percent + '%';

  const fill = document.getElementById('bar-fill');
  fill.style.width = percent + '%';
  fill.classList.toggle('complete', total > 0 && left === 0);
  document.getElementById('bar').setAttribute('aria-valuenow', percent);

  countEl.textContent = `${left} ${left === 1 ? 'task' : 'tasks'} left`;
  clearBtn.disabled = done === 0;
}

function update() {
  saveTasks();
  renderList();
  renderProgress();
}

// ========== 5. EVENTS ==========
form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTask(text, prioritySelect.value);
  form.reset();
  prioritySelect.value = 'medium';
  input.focus();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle('active', b === btn));
    renderList();
  });
});

clearBtn.addEventListener('click', clearCompleted);

// ========== 6. GREETING & DATE ==========
function setGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = greeting + '. What\'s the plan?';
  document.getElementById('today-date').textContent =
    new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

setGreeting();
update();