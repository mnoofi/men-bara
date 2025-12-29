/******** FIREBASE ********/
firebase.initializeApp({
  apiKey: "AIzaSyCQj1MwIbqNdUnfCgQZiwGZETW1YjivvRQ",
  authDomain: "men-bara.firebaseapp.com",
  databaseURL: "https://men-bara-default-rtdb.firebaseio.com",
  projectId: "men-bara"
});
const db = firebase.database();

/******** STATE ********/
let online = {
  id: "",
  name: "",
  roomId: "",
  isHost: false
};

/******** WORDS (ONLINE ONLY) ********/
/* مهم جدًا: اسم مختلف عن الأوفلاين */
const onlineWords = [
  "كشري","برجر","شاورما","قهوة","بيبسي",
  "ميكروباص","توكتوك","أوبر","سينما","كافيه",
  "كنبة","لمبة","فستان","ولاعة","مقص"
];

/******** HELPERS ********/
function uid() {
  return "u_" + Math.random().toString(36).slice(2, 9);
}

function hideAllOnline() {
  document.querySelectorAll(
    "#online-login,#online-menu,#online-lobby,#online-role,#online-chat,#online-vote,#online-result"
  ).forEach(el => el.classList.add("hidden"));
}

/******** NAV ********/
function goOnline() {
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );
  document.getElementById("online-login").classList.remove("hidden");
}

function goHome() {
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );
  document.getElementById("home").classList.remove("hidden");
}

/******** LOGIN ********/
function onlineLogin() {
  const input = document.getElementById("online-name");
  if (!input.value.trim()) return alert("اكتب اسمك");

  online = {
    id: uid(),
    name: input.value.trim(),
    roomId: "",
    isHost: false
  };

  hideAllOnline();
  document.getElementById("online-menu").classList.remove("hidden");
}

/******** ROOM ********/
function createRoom() {
  online.roomId = Math.floor(100000 + Math.random() * 900000).toString();
  online.isHost = true;

  db.ref("rooms/" + online.roomId).set({
    host: online.id,
    phase: "lobby",
    players: {
      [online.id]: { name: online.name }
    }
  });

  listenRoom();

  hideAllOnline();
  document.getElementById("online-lobby").classList.remove("hidden");
  document.getElementById("room-code").innerText = online.roomId;
}

function joinRoom() {
  const code = document.getElementById("join-code").value.trim();
  if (code.length !== 6) return alert("كود غير صحيح");

  online.roomId = code;

  db.ref("rooms/" + code + "/players/" + online.id)
    .set({ name: online.name });

  listenRoom();

  hideAllOnline();
  document.getElementById("online-lobby").classList.remove("hidden");
  document.getElementById("room-code").innerText = code;
}

/******** LISTEN ********/
function listenRoom() {
  if (!online.roomId) return;

  const ref = db.ref("rooms/" + online.roomId);
  ref.off(); // مهم عشان ميكررش listeners

  ref.on("value", snap => {
    const r = snap.val();
    if (!r) return;

    if (r.phase === "lobby") {
      document.getElementById("lobby-text").innerText =
        online.isHost
          ? "أنت الهوست – اضغط بدء الراوند"
          : "في انتظار الهوست";

      document
        .getElementById("start-round-btn")
        .classList.toggle("hidden", !online.isHost);
    }

    if (r.phase === "role") showRole(r);
    if (r.phase === "chat") showChat(r);
    if (r.phase === "vote") showVote(r);
    if (r.phase === "result") showResult(r);
  });
}

/******** START ROUND ********/
function startRound() {
  if (!online.isHost) return;

  db.ref("rooms/" + online.roomId).once("value").then(snap => {
    const data = snap.val();
    if (!data || !data.players) return;

    const ids = Object.keys(data.players);
    if (ids.length < 4) return alert("أقل عدد 4 لاعبين");

    const outId = ids[Math.floor(Math.random() * ids.length)];
    const word =
      onlineWords[Math.floor(Math.random() * onlineWords.length)];

    const update = { phase: "role", outId, word };
    ids.forEach(id => {
      update["players/" + id + "/role"] =
        id === outId ? "out" : "in";
    });

    db.ref("rooms/" + online.roomId).update(update);
  });
}

/******** ROLE ********/
function showRole(r) {
  hideAllOnline();
  document.getElementById("online-role").classList.remove("hidden");

  document.getElementById("online-role-text").innerText =
    r.players[online.id].role === "out"
      ? "❌ أنت برا السالفة"
      : "✅ الكلمة: " + r.word;

  if (online.isHost) setTimeout(startChat, 2000);
}

/******** CHAT ********/
function startChat() {
  db.ref("rooms/" + online.roomId).once("value").then(snap => {
    const ids = Object.keys(snap.val().players)
      .sort(() => Math.random() - 0.5);

    db.ref("rooms/" + online.roomId + "/round").set({
      order: ids,
      turn: 0,
      lap: 1,
      messages: {}
    });

    db.ref("rooms/" + online.roomId + "/phase").set("chat");
  });
}

function showChat(r) {
  hideAllOnline();
  document.getElementById("online-chat").classList.remove("hidden");

  const rd = r.round;
  const current = rd.order[rd.turn];

  document.getElementById("turn-text").innerText =
    current === online.id
      ? "دورك"
      : "دور " + r.players[current].name;

  document.getElementById("chat-input")
    .classList.toggle("hidden", current !== online.id);

  document.getElementById("send-btn")
    .classList.toggle("hidden", current !== online.id);

  const box = document.getElementById("chat-messages");
  box.innerHTML = "";

  Object.values(rd.messages || {}).forEach(m => {
    box.innerHTML += `<p>${m.name}: ${m.word}</p>`;
  });
}

function sendWord() {
  const input = document.getElementById("chat-input");
  const w = input.value.trim();
  if (!/^[\u0600-\u06FF]+$/.test(w)) return;

  const ref = db.ref("rooms/" + online.roomId);

  ref.once("value").then(snap => {
    const r = snap.val().round;
    if (r.order[r.turn] !== online.id) return;

    ref.child("round/messages").push({
      name: online.name,
      word: w
    });

    let t = r.turn + 1;
    let l = r.lap;

    if (t >= r.order.length) {
      t = 0;
      l++;
    }

    if (l > 2) {
      ref.child("phase").set("vote");
      return;
    }

    ref.child("round").update({ turn: t, lap: l });
    input.value = "";
  });
}

/******** VOTE ********/
function showVote(r) {
  hideAllOnline();
  document.getElementById("online-vote").classList.remove("hidden");

  const list = document.getElementById("vote-list");
  list.innerHTML = "";

  Object.entries(r.players).forEach(([id, p]) => {
    if (id === online.id) return;

    const b = document.createElement("button");
    b.innerText = p.name;
    b.onclick = () => {
      list.querySelectorAll("button")
        .forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
      b.dataset.id = id;
    };
    list.appendChild(b);
  });
}

function submitVote() {
  const selected =
    document.querySelector("#vote-list .selected");
  if (!selected) return alert("اختار لاعب");

  db.ref("rooms/" + online.roomId + "/votes/" + online.id)
    .set(selected.dataset.id);

  db.ref("rooms/" + online.roomId + "/phase")
    .set("result");
}

/******** RESULT ********/
function showResult(r) {
  hideAllOnline();
  document.getElementById("online-result").classList.remove("hidden");

  document.getElementById("vote-result-text").innerText =
    "🕵️ برا السالفة كان: " +
    r.players[r.outId].name;
}
