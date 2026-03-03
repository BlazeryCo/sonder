import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://sonderbase111-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = "TestSonder";
let currentChat = null;

// Загрузка чатов
function loadChats() {
  const chatRef = ref(db, `Accounts/${currentUser}/ChatWith`);
  onValue(chatRef, snapshot => {
    const data = snapshot.val();
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = "";

    if (data) {
      Object.keys(data).forEach(user => {
        const div = document.createElement("div");
        div.innerText = user + "\n" + (data[user].LastMessage || "");
        div.onclick = () => openChat(user);
        chatList.appendChild(div);
      });
    }
  });
}

// Открытие чата
function openChat(user) {
  currentChat = user;
  document.getElementById("chatWith").innerText = user;
  loadMessages();
  listenTyping();
}

// Загрузка сообщений
function loadMessages() {
  const msgRef = ref(db, `Accounts/${currentUser}/ChatWith/${currentChat}`);
  onValue(msgRef, snapshot => {
    const data = snapshot.val();
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";

    if (data && data.MessagesCount !== undefined) {
      for (let i = 0; i < data.MessagesCount; i++) {
        const msg = data[i];
        if (!msg) continue;

        const div = document.createElement("div");
        div.classList.add("message");
        div.classList.add(msg.from === currentUser ? "me" : "other");
        div.innerText = msg.text;
        messagesDiv.appendChild(div);
      }
    }
  });
}

// Отправка сообщения
window.sendMessage = async function() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  const chatPath = `Accounts/${currentUser}/ChatWith/${currentChat}`;
  const snapshot = await get(ref(db, chatPath));
  let data = snapshot.val() || {};
  let count = data.MessagesCount || 0;

  const updates = {};
  updates[`${chatPath}/${count}`] = {
    from: currentUser,
    text: text
  };
  updates[`${chatPath}/MessagesCount`] = count + 1;
  updates[`${chatPath}/LastMessage`] = text;

  await update(ref(db), updates);

  input.value = "";
};

// Печатает...
function listenTyping() {
  const typingRef = ref(db, `Accounts/${currentUser}/TextingFrom/${currentChat}`);
  onValue(typingRef, snapshot => {
    const val = snapshot.val();
    document.getElementById("typingIndicator").innerText =
      val === "T" ? "печатает..." : "";
  });
}

loadChats();