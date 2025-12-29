/******** FIREBASE ********/
const firebaseConfig = {
  apiKey: "AIzaSyCQj1MwIbqNdUnfCgQZiwGZETW1YjivvRQ",
  authDomain: "men-bara.firebaseapp.com",
  databaseURL: "https://men-bara-default-rtdb.firebaseio.com",
  projectId: "men-bara"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/******** ONLINE STATE ********/
let onlineState = {
  id: "",
  name: "",
  roomId: "",
  isHost: false
};

/******** HELPERS ********/
function onlineUid(){
  return "u_" + Math.random().toString(36).slice(2,9);
}

/******** نخفي كروت الأونلاين فقط ********/
function hideAllOnlineCards(){
  document.querySelectorAll(
    "#onlineLogin,#onlineMenu,#onlineLobby,#onlineRole,#onlineChat"
  ).forEach(c => c.classList.add("hidden"));
}

/******** NAVIGATION ********/
function goOnline(){
  hideAllOnlineCards();
  document.getElementById("onlineLogin").classList.remove("hidden");
}

function goHome(){
  hideAllOnlineCards();
  document.getElementById("home").classList.remove("hidden");
}

/******** LOGIN ********/
function onlineLogin(){
  const input = document.getElementById("onlineName");
  if(!input.value.trim()) return alert("اكتب اسمك");

  onlineState.name = input.value.trim();
  onlineState.id = onlineUid();

  hideAllOnlineCards();
  document.getElementById("onlineMenu").classList.remove("hidden");
}

/******** CREATE ROOM ********/
function createRoom(){
  onlineState.roomId = Math.floor(100000 + Math.random()*900000).toString();
  onlineState.isHost = true;

  db.ref("rooms/" + onlineState.roomId).set({
    host: onlineState.id,
    phase: "lobby",
    word: "",
    outId: "",
    players: {
      [onlineState.id]: {
        name: onlineState.name,
        role: "",
        ready: false
      }
    }
  });

  listenRoomOnline();

  hideAllOnlineCards();
  document.getElementById("onlineLobby").classList.remove("hidden");
  document.getElementById("roomCode").innerText = onlineState.roomId;
}

/******** JOIN ROOM ********/
function joinRoom(){
  const code = document.getElementById("joinCode").value.trim();
  if(!code || code.length !== 6){
    alert("كود الغرفة 6 أرقام");
    return;
  }

  onlineState.roomId = code;
  onlineState.isHost = false;

  db.ref("rooms/" + code + "/players/" + onlineState.id).set({
    name: onlineState.name,
    role: "",
    ready: false
  });

  listenRoomOnline();

  hideAllOnlineCards();
  document.getElementById("onlineLobby").classList.remove("hidden");
  document.getElementById("roomCode").innerText = code;
}

/******** LISTEN ROOM ********/
function listenRoomOnline(){
  db.ref("rooms/" + onlineState.roomId).on("value", snap => {
    const room = snap.val();
    if(!room) return;

    const startBtn = document.getElementById("startRoundBtn");
    const lobbyText = document.getElementById("lobbyText");

    if(room.phase === "lobby"){
      if(onlineState.isHost){
        startBtn.classList.remove("hidden");
        lobbyText.innerText = "إنت الهوست – اضغط بدء الراوند";
      }else{
        startBtn.classList.add("hidden");
        lobbyText.innerText = "في انتظار الهوست...";
      }
    }

    if(room.phase === "role"){
      showOnlineRole(room);
    }

    if(room.phase === "chat"){
      listenOnlineChat(room);
    }
  });
}

/******** START ROUND (HOST) ********/
function startRound(){
  if(!onlineState.isHost) return;

  db.ref("rooms/" + onlineState.roomId).once("value").then(snap => {
    const room = snap.val();
    const ids = Object.keys(room.players);

    if(ids.length < 4){
      alert("لازم 4 لاعبين على الأقل");
      return;
    }

    const outId = ids[Math.floor(Math.random()*ids.length)];
    const word = "ميكروباص"; // مؤقتًا

    const updates = {
      phase: "role",
      word: word,
      outId: outId
    };

    ids.forEach(id=>{
      updates["players/"+id+"/role"] =
        id === outId ? "out" : "in";
      updates["players/"+id+"/ready"] = false;
    });

    db.ref("rooms/" + onlineState.roomId).update(updates);
  });
}

/******** SHOW ROLE ********/
function showOnlineRole(room){
  hideAllOnlineCards();
  document.getElementById("onlineRole").classList.remove("hidden");

  const myRole = room.players[onlineState.id].role;
  const roleText = document.getElementById("onlineRoleText");

  roleText.innerText =
    myRole === "out"
      ? "❌ إنت برا السالفة"
      : "✅ إنت جوا السالفة\nالكلمة: " + room.word;

  // كل لاعب يضغط Ready
  if(!document.getElementById("readyBtn")){
    const btn = document.createElement("button");
    btn.id = "readyBtn";
    btn.innerText = "✅ جاهز";
    btn.onclick = markReady;
    document.getElementById("onlineRole").appendChild(btn);
  }
}

/******** READY ********/
function markReady(){
  db.ref(
    "rooms/" + onlineState.roomId +
    "/players/" + onlineState.id + "/ready"
  ).set(true);

  if(onlineState.isHost){
    checkAllReady();
  }
}

function checkAllReady(){
  db.ref("rooms/" + onlineState.roomId).once("value").then(snap=>{
    const room = snap.val();
    const allReady = Object.values(room.players)
      .every(p => p.ready);

    if(allReady){
      startOnlineChat();
    }
  });
}

/******** START CHAT ********/
function startOnlineChat(){
  db.ref("rooms/" + onlineState.roomId).once("value").then(snap=>{
    const room = snap.val();
    const ids = Object.keys(room.players)
      .sort(()=>Math.random()-0.5);

    db.ref("rooms/" + onlineState.roomId + "/round").set({
      order: ids,
      turn: 0,
      lap: 1,
      messages: {}
    });

    db.ref("rooms/" + onlineState.roomId + "/phase").set("chat");
  });
}

/******** CHAT ********/
function listenOnlineChat(room){
  hideAllOnlineCards();
  document.getElementById("onlineChat").classList.remove("hidden");

  const r = room.round;
  const currentId = r.order[r.turn];

  const turnText = document.getElementById("turnText");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const messagesDiv = document.getElementById("chatMessages");

  turnText.innerText =
    currentId === onlineState.id
      ? "دورك ✍️ اكتب كلمة واحدة"
      : "دور: " + room.players[currentId].name;

  input.classList.toggle("hidden", currentId !== onlineState.id);
  sendBtn.classList.toggle("hidden", currentId !== onlineState.id);

  messagesDiv.innerHTML="";
  Object.values(r.messages || {}).forEach(m=>{
    const p=document.createElement("p");
    p.innerText = m.name + ": " + m.word;
    messagesDiv.appendChild(p);
  });
}

/******** SEND WORD ********/
function sendWord(){
  const input = document.getElementById("chatInput");
  const w = input.value.trim();

  if(!/^[\u0600-\u06FF]+$/.test(w)){
    alert("كلمة عربية واحدة فقط");
    return;
  }

  const roomRef = db.ref("rooms/" + onlineState.roomId);

  roomRef.once("value").then(snap=>{
    const r = snap.val().round;

    roomRef.child("round/messages").push({
      name: onlineState.name,
      word: w
    });

    let nextTurn = r.turn + 1;
    let nextLap = r.lap;

    if(nextTurn >= r.order.length){
      nextTurn = 0;
      nextLap++;
    }

    if(nextLap > 2){
      alert("خلصت لفتين – التصويت جاي");
      return;
    }

    roomRef.child("round").update({
      turn: nextTurn,
      lap: nextLap
    });

    input.value="";
  });
}
