// File: /buchanan-west-church/js/sermons.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref as dbRef, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

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
const storage = getStorage(app);

const USER_CREDENTIALS = {
  name: "admin",
  password: "church123"
};

let isAuthenticated = false;
let currentUploadTask = null;

const uploadSection = document.getElementById("sermonUpload");
const uploadBtn = document.getElementById("uploadBtn");
const sermonFile = document.getElementById("sermonFile");
const sermonDesc = document.getElementById("sermonDesc");
const sermonList = document.getElementById("sermonList");

const progressBar = document.createElement("progress");
progressBar.value = 0;
progressBar.max = 100;
progressBar.style.display = "none";
progressBar.style.width = "100%";
progressBar.style.marginTop = "10px";
uploadSection.appendChild(progressBar);

const timeRemainingText = document.createElement("p");
timeRemainingText.style.marginTop = "5px";
timeRemainingText.style.display = "none";
uploadSection.appendChild(timeRemainingText);

const cancelBtn = document.createElement("button");
cancelBtn.textContent = "Cancel Upload";
cancelBtn.style.display = "none";
cancelBtn.style.marginTop = "10px";
uploadSection.appendChild(cancelBtn);

cancelBtn.addEventListener("click", () => {
  if (currentUploadTask) {
    currentUploadTask.cancel();
    progressBar.style.display = "none";
    timeRemainingText.style.display = "none";
    cancelBtn.style.display = "none";
    alert("Upload canceled.");
  }
});

function promptLogin(callback) {
  const name = prompt("Enter name:");
  const password = prompt("Enter password:");
  if (name === USER_CREDENTIALS.name && password === USER_CREDENTIALS.password) {
    isAuthenticated = true;
    uploadSection.style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline-block";
    callback();
  } else {
    alert("Invalid credentials.");
  }
}

function logout() {
  isAuthenticated = false;
  uploadSection.style.display = "none";
  document.getElementById("logoutBtn").style.display = "none";
  alert("Logged out.");
}

function displaySermons() {
  onValue(dbRef(db, "sermons"), (snapshot) => {
    const data = snapshot.val();
    sermonList.innerHTML = "";
    if (data) {
      const entries = Object.entries(data);
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      entries.forEach(([key, sermon]) => {
        const item = document.createElement("div");
        item.className = "sermon-item";

        const desc = document.createElement("p");
        desc.textContent = sermon.description;

        let media;
        if (sermon.url.includes("video")) {
          media = document.createElement("video");
          media.controls = true;
          media.src = sermon.url;
        } else {
          media = document.createElement("audio");
          media.controls = true;
          media.src = sermon.url;
        }

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.onclick = () => {
          if (!isAuthenticated) {
            promptLogin(() => {});
            return;
          }
          sermonDesc.value = sermon.description;
          sermonFile.value = "";
          uploadSection.scrollIntoView({ behavior: "smooth" });
          uploadBtn.onclick = () => {
            const newDesc = sermonDesc.value.trim();
            if (newDesc) {
              update(dbRef(db, `sermons/${key}`), { description: newDesc });
              alert("Description updated.");
              sermonDesc.value = "";
            }
          };
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => {
          if (!isAuthenticated) {
            promptLogin(() => {});
            return;
          }
          if (confirm("Delete this sermon?")) {
            remove(dbRef(db, `sermons/${key}`));
            const filePath = decodeURIComponent(sermon.url.split("/").slice(-1)[0].split("?")[0]);
            deleteObject(storageRef(storage, `sermons/${filePath}`)).catch(() => {});
          }
        };

        item.appendChild(desc);
        item.appendChild(media);
        item.appendChild(editBtn);
        item.appendChild(deleteBtn);
        sermonList.appendChild(item);
      });
    }
  });
}

uploadBtn.addEventListener("click", () => {
  if (!isAuthenticated) {
    promptLogin(() => {});
    return;
  }

  const file = sermonFile.files[0];
  const description = sermonDesc.value.trim();
  if (!file || !description) {
    alert("Please select a file and enter a description.");
    return;
  }

  const fileRef = storageRef(storage, `sermons/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(fileRef, file);
  currentUploadTask = uploadTask;

  progressBar.style.display = "block";
  timeRemainingText.style.display = "block";
  cancelBtn.style.display = "inline-block";

  const startTime = Date.now();

  uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      progressBar.value = progress;

      const elapsedTime = (Date.now() - startTime) / 1000;
      const estimatedTotalTime = (elapsedTime / progress) * 100;
      const timeLeft = estimatedTotalTime - elapsedTime;

      timeRemainingText.textContent = `Estimated time remaining: ${Math.max(1, Math.round(timeLeft))} seconds`;
    },
    (error) => {
      progressBar.style.display = "none";
      timeRemainingText.style.display = "none";
      cancelBtn.style.display = "none";
      alert("Upload failed or canceled: " + error);
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((url) => {
        const sermonData = {
          url: url,
          description: description,
          timestamp: Date.now()
        };
        const newSermonRef = push(dbRef(db, "sermons"));
        set(newSermonRef, sermonData);
        sermonFile.value = "";
        sermonDesc.value = "";
        progressBar.style.display = "none";
        timeRemainingText.style.display = "none";
        cancelBtn.style.display = "none";
        progressBar.value = 0;
        currentUploadTask = null;
        alert("Sermon uploaded successfully.");
      });
    }
  );
});

document.body.insertAdjacentHTML("beforeend", '<button id="logoutBtn" style="display:none;position:fixed;bottom:10px;right:10px;padding:8px 12px;font-weight:bold;">Logout</button>');
document.getElementById("logoutBtn").addEventListener("click", logout);

promptLogin(() => {});
displaySermons();
