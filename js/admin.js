// File: js/admin.js

import {
    getFirestore, collection, addDoc, deleteDoc, doc, getDocs
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyApi6lVmv7PaXJc9pJW9BpaOVqTEccoWsQ",
    authDomain: "bucananchurchadmin.firebaseapp.com",
    projectId: "bucananchurchadmin",
    storageBucket: "bucananchurchadmin.firebasestorage.app",
    messagingSenderId: "300936840591",
    appId: "1:300936840591:web:8d6946bfe6822fa83577fa",
    measurementId: "G-STS6Q128C9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Handle adding event
const eventForm = document.getElementById("event-form");
eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("event-title").value;
    const date = document.getElementById("event-date").value;
    const desc = document.getElementById("event-desc").value;
    const image = document.getElementById("event-image").value;

    await addDoc(collection(db, "events"), {
        title, date, desc, image
    });

    eventForm.reset();
    alert("Event added!");
    loadEvents();
});

// Display events
async function loadEvents() {
    const list = document.getElementById("events-list");
    list.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "events"));
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.innerHTML = `
        <strong>${data.title}</strong> (${data.date})<br>
        ${data.desc}<br>
        ${data.image ? `<img src="${data.image}" style="max-width:100%;height:auto;">` : ""}
        <button onclick="deleteEvent('${docSnap.id}')">Delete</button>
        <hr>
      `;
        list.appendChild(div);
    });
}

window.deleteEvent = async function (id) {
    await deleteDoc(doc(db, "events", id));
    loadEvents();
};

// Sermon logic
const sermonForm = document.getElementById("sermon-form");
sermonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("sermon-date").value;
    const title = document.getElementById("sermon-title").value;
    const passage = document.getElementById("sermon-passage").value;
    const embed = document.getElementById("sermon-embed").value;

    await addDoc(collection(db, "sermons"), {
        date, title, passage, embed
    });

    sermonForm.reset();
    alert("Sermon added!");
    loadSermons();
});

async function loadSermons() {
    const list = document.getElementById("sermons-list");
    list.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "sermons"));
    querySnapshot.forEach((docSnap) => {
        const s = docSnap.data();
        const div = document.createElement("div");
        div.innerHTML = `
        <strong>${s.date} - ${s.title}</strong><br>
        <em>${s.passage}</em><br>
        ${s.embed}<br>
        <button onclick="deleteSermon('${docSnap.id}')">Delete</button>
        <hr>
      `;
        list.appendChild(div);
    });
}

window.deleteSermon = async function (id) {
    await deleteDoc(doc(db, "sermons", id));
    loadSermons();
};

// Calendar logic
const calendarForm = document.getElementById("calendar-form");
calendarForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("calendar-date").value;
    const text = document.getElementById("calendar-text").value;

    await addDoc(collection(db, "calendar"), {
        date, text
    });

    calendarForm.reset();
    alert("Calendar entry added!");
    loadCalendar();
});

async function loadCalendar() {
    const list = document.getElementById("calendar-list");
    list.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "calendar"));
    querySnapshot.forEach((docSnap) => {
        const c = docSnap.data();
        const div = document.createElement("div");
        div.innerHTML = `
        <strong>${c.date}</strong><br>
        ${c.text}<br>
        <button onclick="deleteCalendar('${docSnap.id}')">Delete</button>
        <hr>
      `;
        list.appendChild(div);
    });
}

window.deleteCalendar = async function (id) {
    await deleteDoc(doc(db, "calendar", id));
    loadCalendar();
};

// Auto load data
loadEvents();
loadSermons();
loadCalendar();
