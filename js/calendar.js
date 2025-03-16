// File: /buchanan-west-church/js/calendar.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, set, push, remove, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGVaj3VzgIxcW9tKCu89cw5pzRXD3K2ds",
  authDomain: "buchanan-church.firebaseapp.com",
  databaseURL: "https://buchanan-church-default-rtdb.firebaseio.com",
  projectId: "buchanan-church",
  storageBucket: "buchanan-church.firebasestorage.app",
  messagingSenderId: "34786104922",
  appId: "1:34786104922:web:19141b0700439990f9aa63",
  measurementId: "G-19Q79P18T7"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const calendarBody = document.getElementById("calendarBody");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const eventForm = document.getElementById("eventForm");
const selectedDateDisplay = document.getElementById("selectedDate");
const eventTitleInput = document.getElementById("eventTitle");
const saveEventBtn = document.getElementById("saveEvent");
const closeFormBtn = document.getElementById("closeForm");

let currentDate = new Date();
let selectedDate = null;
let selectedEventKey = null;
let events = {};
let isAuthenticated = false;

const USER_CREDENTIALS = {
  name: "admin",
  password: "church123"
};

function promptLogin(callback) {
  const name = prompt("Enter name:");
  const password = prompt("Enter password:");
  if (name === USER_CREDENTIALS.name && password === USER_CREDENTIALS.password) {
    isAuthenticated = true;
    document.getElementById("logoutBtn").style.display = "inline-block";
    callback();
  } else {
    alert("Invalid credentials. Access denied.");
  }
}

function logout() {
  isAuthenticated = false;
  document.getElementById("logoutBtn").style.display = "none";
  alert("You have been logged out.");
}

function loadEvents(callback) {
  onValue(ref(db, "events"), (snapshot) => {
    events = snapshot.val() || {};
    callback();
  });
}

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthYear.textContent = `${date.toLocaleString("default", { month: "long" })} ${year}`;
  calendarBody.innerHTML = "";

  let row = document.createElement("tr");
  for (let i = 0; i < firstDay; i++) {
    row.appendChild(document.createElement("td"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    if (row.children.length === 7) {
      calendarBody.appendChild(row);
      row = document.createElement("tr");
    }

    const cell = document.createElement("td");
    cell.textContent = day;
    const key = `${year}-${month}-${day}`;

    if (events[key]) {
      Object.entries(events[key]).forEach(([eventKey, title]) => {
        const eventDiv = document.createElement("div");
        eventDiv.className = "event";
        eventDiv.textContent = title;
        eventDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!isAuthenticated) {
            promptLogin(() => handleEventAction(key, eventKey, title));
          } else {
            handleEventAction(key, eventKey, title);
          }
        });
        cell.appendChild(eventDiv);
      });
    }

    cell.addEventListener("click", () => {
      if (!isAuthenticated) {
        promptLogin(() => openEventForm(key));
      } else {
        openEventForm(key);
      }
    });

    row.appendChild(cell);
  }

  if (row.children.length > 0) {
    calendarBody.appendChild(row);
  }
}

function handleEventAction(dateKey, eventKey, title) {
  const action = prompt("Type 'edit' to edit or 'delete' to delete this event.", "edit/delete");
  if (action === "delete") {
    remove(ref(db, `events/${dateKey}/${eventKey}`));
  } else if (action === "edit") {
    selectedDate = dateKey;
    selectedEventKey = eventKey;
    eventTitleInput.value = title;
    selectedDateDisplay.textContent = `Editing Event: ${formatDateKey(dateKey)}`;
    eventForm.style.display = "block";
  }
}

function openEventForm(dateKey) {
  selectedDate = dateKey;
  selectedEventKey = null;
  selectedDateDisplay.textContent = `Selected Date: ${formatDateKey(dateKey)}`;
  eventTitleInput.value = "";
  eventForm.style.display = "block";
}

function closeEventForm() {
  eventForm.style.display = "none";
  selectedEventKey = null;
}

function saveEvent() {
  if (!isAuthenticated) {
    promptLogin(() => saveEvent());
    return;
  }

  const title = eventTitleInput.value.trim();
  if (title) {
    const eventRef = ref(db, `events/${selectedDate}`);
    if (selectedEventKey) {
      update(ref(db, `events/${selectedDate}/${selectedEventKey}`), title);
    } else {
      const newEventRef = push(eventRef);
      set(newEventRef, title);
    }
  }
  closeEventForm();
}

function formatDateKey(key) {
  const [year, month, day] = key.split("-");
  return `${parseInt(month) + 1}/${day}/${year}`;
}

prevMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

nextMonthBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

saveEventBtn.addEventListener("click", saveEvent);
closeFormBtn.addEventListener("click", closeEventForm);

document.body.insertAdjacentHTML("beforeend", '<button id="logoutBtn" style="display:none;position:fixed;bottom:10px;right:10px;padding:8px 12px;font-weight:bold;">Logout</button>');
document.getElementById("logoutBtn").addEventListener("click", logout);

loadEvents(() => renderCalendar(currentDate));
