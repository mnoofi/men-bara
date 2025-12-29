/******** FIREBASE ********/
const firebaseConfig = {
  apiKey: "AIzaSyCQj1MwIbqNdUnfCgQZiwGZETW1YjivvRQ",
  authDomain: "men-bara.firebaseapp.com",
  databaseURL: "https://men-bara-default-rtdb.firebaseio.com",
  projectId: "men-bara",
  storageBucket: "men-bara.appspot.com",
  messagingSenderId: "515671114088",
  appId: "1:515671114088:web:36903b3030668d47ce96dd"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/******** ONLINE STATE ********/
let online = {
  id: "",
  name: "",
  roomId: "",
  isHost: false
};

/******** HELPERS ********/
function uid() {
  return "u_" + Math.random().toString(36).slice(2, 9);
}

function hideAllOnline() {
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );
}

/******** NAVIGATION ********/
function goOnline() {
  hideAllOnline();
  document.getElementById("onlineLogin").classList.remove("hidden");
}

function goHome() {
  hideAllOnline();
  document.getElementById("home").classList.remove("hidden");
}

/******** LOGIN ********/
function onlineLogin() {
  const n = document.getElementById("onlineName").value.trim();
  if (!n) return alert("اكتب اسمك");

  online.name = n;
  online.id = uid();

  hideAllOnline();
  document.getElementById("onlineMenu").classList.remove("hidden");
}

/******** CREATE ROOM ********/
function createRoom() {
  online.roomId = Math.floor(100000 + Math.random() * 900000).toString();
  online.isHost = true;

  db.ref("rooms/" + online.roomId).set({
    host: online.id,
    status: "lobby",
    word: "",
    outId: "",
    players: {
      [online.id]: {
        name: online.name,
        role: ""
      }
    }
  });

  listenRoom();

  hideAllOnline();
  document.getElementById("onlineLobby").classList.remove("hidden");
  document.getElementById("roomCode").innerText = online.roomId;
}

/******** JOIN ROOM ********/
function joinRoom() {
  const code = document.getElementById("joinCode").value.trim();
  if (!code || code.length !== 6) {
    return alert("كود الغرفة لازم يكون 6 أرقام");
  }

  online.roomId = code;
  online.isHost = false;

  db.ref("rooms/" + code + "/players/" + online.id).set({
    name: online.name,
    role: ""
  });

  listenRoom();

  hideAllOnline();
  document.getElementById("onlineLobby").classList.remove("hidden");
  document.getElementById("roomCode").innerText = code;
}

/******** LISTEN ROOM ********/
function listenRoom() {
  db.ref("rooms/" + online.roomId).on("value", snap => {
    const room = snap.val();
    if (!room) return;

    const startBtn = document.getElementById("startRoundBtn");
    const lobbyText = document.getElementById("lobbyText");

    if (online.isHost && room.status === "lobby") {
      startBtn.classList.remove("hidden");
      lobbyText.innerText = "إنت الهوست – اضغط بدء الراوند";
    } else {
      startBtn.classList.add("hidden");
      lobbyText.innerText = "في انتظار الهوست يبدأ الراوند...";
    }

    if (room.status === "playing") {
      showRole(room);
    }

    if (room.status === "chat") {
      listenChat(room);
    }

    if (room.status === "vote") {
      alert("🗳️ انتهى الكلام – نبدأ التصويت");
      // هنا هنكمّل vote بعدين
    }
  });
}

/******** START ROUND (HOST ONLY) ********/
function startRound() {
  if (!online.isHost) return;

  db.ref("rooms/" + online.roomId).once("value").then(snap => {
    const room = snap.val();
    const playerIds = Object.keys(room.players);

    if (playerIds.length < 3) {
      alert("لازم 3 لاعبين على الأقل");
      return;
    }

    const outId =
      playerIds[Math.floor(Math.random() * playerIds.length)];

    const word = "ميكروباص"; // مؤقتًا

    const updates = {};
    playerIds.forEach(id => {
      updates["players/" + id + "/role"] =
        id === outId ? "out" : "in";
    });

    updates["status"] = "playing";
    updates["word"] = word;
    updates["outId"] = outId;

    db.ref("rooms/" + online.roomId).update(updates);
  });
}

/******** SHOW ROLE ********/
function showRole(room) {
  hideAllOnline();

  const myRole = room.players[online.id].role;
  const roleDiv = document.getElementById("onlinerole");
  const roleText = document.getElementById("onlineroleText");

  roleDiv.classList.remove("hidden");

  if (myRole === "out") {
    roleText.innerText = "❌ إنت برا السالفة";
  } else {
    roleText.innerText = "✅ إنت جوا السالفة\nالكلمة: " + room.word;
  }

  // بعد ثانيتين نبدأ الكلام (الهوست بس)
  setTimeout(() => {
    startChatPhase();
  }, 2000);
}

/******** START CHAT PHASE ********/
function startChatPhase() {
  if (!online.isHost) return;

  db.ref("rooms/" + online.roomId).once("value").then(snap => {
    const room = snap.val();
    const ids = Object.keys(room.players);

    const order = ids.sort(() => Math.random() - 0.5);

    db.ref("rooms/" + online.roomId + "/round").set({
      order: order,
      turnIndex: 0,
      lap: 1,
      messages: {}
    });

    db.ref("rooms/" + online.roomId + "/status").set("chat");
  });
}

/******** CHAT LISTENER ********/
function listenChat(room) {
  hideAllOnline();
  document.getElementById("onlineChat").classList.remove("hidden");

  const round = room.round;
  const order = round.order;
  const currentId = order[round.turnIndex];

  const turnText = document.getElementById("turnText");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const messagesDiv = document.getElementById("chatMessages");

  turnText.innerText =
    currentId === online.id
      ? "دورك ✍️ اكتب كلمة واحدة"
      : "دور: " + room.players[currentId].name;

  if (currentId === online.id) {
    input.classList.remove("hidden");
    sendBtn.classList.remove("hidden");
  } else {
    input.classList.add("hidden");
    sendBtn.classList.add("hidden");
  }

  messagesDiv.innerHTML = "";
  Object.values(round.messages || {}).forEach(m => {
    const p = document.createElement("p");
    p.innerText = m.name + ": " + m.word;
    messagesDiv.appendChild(p);
  });
}

/******** SEND WORD ********/
function sendWord() {
  const input = document.getElementById("chatInput");
  const word = input.value.trim();

  if (!/^[\u0600-\u06FF]+$/.test(word)) {
    alert("اكتب كلمة عربية واحدة فقط");
    return;
  }

  const roomRef = db.ref("rooms/" + online.roomId);

  roomRef.once("value").then(snap => {
    const room = snap.val();
    const round = room.round;
    const order = round.order;

    roomRef.child("round/messages").push({
      name: online.name,
      word: word
    });

    let nextIndex = round.turnIndex + 1;
    let nextLap = round.lap;

    if (nextIndex >= order.length) {
      nextIndex = 0;
      nextLap++;
    }

    if (nextLap > 2) {
      roomRef.child("status").set("vote");
      return;
    }

    roomRef.child("round").update({
      turnIndex: nextIndex,
      lap: nextLap
    });

    input.value = "";
  });
}
