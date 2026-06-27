const API = "/api/tasks";

const listEl = document.getElementById("ticket-list");
const emptyState = document.getElementById("empty-state");
const formEl = document.getElementById("intake-form");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const formError = document.getElementById("form-error");
const countOpenEl = document.getElementById("count-open");
const countDoneEl = document.getElementById("count-done");
const template = document.getElementById("ticket-template");

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  // DELETE on /api/tasks/{id} returns a small message, not a Task
  if (res.status === 204) return null;
  return res.json();
}

function formatId(id) {
  return String(id).padStart(4, "0");
}

function renderTickets(tasks) {
  listEl.innerHTML = "";

  const sorted = [...tasks].sort((a, b) => a.id - b.id);

  countOpenEl.textContent = sorted.filter((t) => !t.completed).length;
  countDoneEl.textContent = sorted.filter((t) => t.completed).length;

  emptyState.hidden = sorted.length !== 0;

  for (const task of sorted) {
    listEl.appendChild(buildTicket(task));
  }
}

function buildTicket(task) {
  const node = template.content.firstElementChild.cloneNode(true);

  node.dataset.id = task.id;
  node.classList.toggle("ticket--done", task.completed);

  node.querySelector(".ticket__id").textContent = formatId(task.id);

  const titleField = node.querySelector(".ticket__title-input");
  const descField = node.querySelector(".ticket__desc-input");
  titleField.value = task.title;
  descField.value = task.description || "";
  descField.placeholder = "No notes";

  const stamp = node.querySelector(".ticket__stamp");
  stamp.hidden = !task.completed;

  const punchBtn = node.querySelector(".btn--punch");
  const punchLabel = punchBtn.querySelector(".btn--punch__label");
  punchLabel.textContent = task.completed ? "Reopen" : "Mark done";

  const saveBtn = node.querySelector(".btn--save");
  const voidBtn = node.querySelector(".btn--void");

  let dirty = false;
  const markDirty = () => {
    if (!dirty) {
      dirty = true;
      saveBtn.hidden = false;
      node.classList.add("ticket--editing");
    }
  };
  titleField.addEventListener("input", markDirty);
  descField.addEventListener("input", markDirty);

  saveBtn.addEventListener("click", async () => {
    const newTitle = titleField.value.trim();
    if (!newTitle) {
      titleField.focus();
      return;
    }
    try {
      await api(`${API}/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: newTitle, description: descField.value.trim() || null }),
      });
      dirty = false;
      saveBtn.hidden = true;
      node.classList.remove("ticket--editing");
      await refresh();
    } catch (err) {
      showError(err.message);
    }
  });

  punchBtn.addEventListener("click", async () => {
    try {
      await api(`${API}/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !task.completed }),
      });
      await refresh();
    } catch (err) {
      showError(err.message);
    }
  });

  voidBtn.addEventListener("click", async () => {
    const ok = window.confirm(`Void ticket #${formatId(task.id)}? This can't be undone.`);
    if (!ok) return;
    try {
      await api(`${API}/${task.id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      showError(err.message);
    }
  });

  return node;
}

function showError(message) {
  formError.textContent = message;
  if (message) {
    setTimeout(() => {
      if (formError.textContent === message) formError.textContent = "";
    }, 4000);
  }
}

async function refresh() {
  try {
    const tasks = await api(API);
    renderTickets(tasks);
  } catch (err) {
    showError(err.message);
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (!title) {
    showError("Give the ticket a title before issuing it.");
    return;
  }

  try {
    await api(API, {
      method: "POST",
      body: JSON.stringify({ title, description: description || null }),
    });
    titleInput.value = "";
    descInput.value = "";
    titleInput.focus();
    showError("");
    await refresh();
  } catch (err) {
    showError(err.message);
  }
});

refresh();
