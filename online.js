/******** FIREBASE ********/
firebase.initializeApp({
  apiKey: "AIzaSyCQj1MwIbqNdUnfCgQZiwGZETW1YjivvRQ",
  authDomain: "men-bara.firebaseapp.com",
  databaseURL: "https://men-bara-default-rtdb.firebaseio.com",
  projectId: "men-bara"
});

const db = firebase.database();
const auth = firebase.auth();   // موجود مرة واحدة بس


/******** STATE ********/
let online = {
  id: "",
  name: "",
  roomId: "",
  isHost: false
};


/******** GOOGLE LOGIN (التعديل هنا فقط) ********/

function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithRedirect(provider);
}

auth.getRedirectResult()
  .then((result) => {
    if (result.user) {

      const user = result.user;

      online = {
        id: user.uid,
        name: user.displayName,
        roomId: "",
        isHost: false
      };

      hideAllOnline();
      document.getElementById("online-menu").classList.remove("hidden");
    }
  })
  .catch((error) => {
    console.error("Redirect Login Error:", error);
  });


/******** WORDS ********/
const onlineWords = [
  "كشري","برجر","شاورما","قهوة","بيبسي","مهرج","حديقة حيوانات","مستشفى الأمراض العقلية","ميكروباص","توكتوك","أوبر","سينما","كافيه","دكتور","كنبة","لمبة","فستان","ولاعة","مقص","طائر حمام","دورة مياه","تواليت","عيادة بيطرية","لبوس","كلوت بناتي","بوكسر","سليب أبيض","بيضة","فرخة","محل مشويات","جزمة حريمي","كرة سلة","سرير","دبانة","شمعة","أولويز","سويت","طعمية","نادي","بسكوت","بطاطس","قاعة أفراح","صياد سمك","قبطان","حلاق","مهندس","رائد فضاء","عامل بناء"
];


/******** HELPERS ********/
function uid(){
  return "u_" + Math.random().toString(36).slice(2,9);
}

function hideAllOnline(){
  document.querySelectorAll(
    "#online-login,#online-menu,#online-lobby,#online-role,#online-chat,#online-vote,#online-result"
  ).forEach(c=>c.classList.add("hidden"));
}


/******** NAV ********/
function goOnline(){
  document.querySelectorAll(".card").forEach(c=>c.classList.add("hidden"));
  document.getElementById("online-login").classList.remove("hidden");
}

function goHome(){
  document.querySelectorAll(".card").forEach(c=>c.classList.add("hidden"));
  document.getElementById("home").classList.remove("hidden");
}


/******** LOGIN ********/
function onlineLogin(){
  const input=document.getElementById("online-name");
  if(!input.value.trim()) return alert("اكتب اسمك");

  online={
    id:uid(),
    name:input.value.trim(),
    roomId:"",
    isHost:false
  };

  hideAllOnline();
  document.getElementById("online-menu").classList.remove("hidden");
}


/******** ROOM ********/
function createRoom(){
  online.roomId=Math.floor(100000+Math.random()*900000).toString();
  online.isHost=true;

  db.ref("rooms/"+online.roomId).set({
    host:online.id,
    phase:"lobby",
    players:{[online.id]:{name:online.name}},
    votes:{}
  });

  listenRoom();
  hideAllOnline();
  document.getElementById("online-lobby").classList.remove("hidden");
  document.getElementById("room-code").innerText=online.roomId;
}

function joinRoom(){
  const code=document.getElementById("join-code").value.trim();
  if(code.length!==6) return alert("كود غير صحيح");

  online.roomId=code;

  db.ref("rooms/"+code+"/players/"+online.id)
    .set({name:online.name});

  listenRoom();
  hideAllOnline();
  document.getElementById("online-lobby").classList.remove("hidden");
  document.getElementById("room-code").innerText=code;
}


/******** LISTEN ********/
function listenRoom(){
  const ref=db.ref("rooms/"+online.roomId);
  ref.off();

  ref.on("value",snap=>{
    const r=snap.val();
    if(!r) return;

    if(r.phase==="lobby"){
      document.getElementById("lobby-text").innerText=
        online.isHost?"أنت الهوست – اضغط بدء الراوند":"في انتظار الهوست";
      document.getElementById("start-round-btn")
        .classList.toggle("hidden",!online.isHost);
    }

    if(r.phase==="role") showRole(r);
    if(r.phase==="chat") showChat(r);
    if(r.phase==="vote") showVote(r);
    if(r.phase==="result") showResult(r);
  });
}


/******** START ROUND ********/
function startRound(){
  if(!online.isHost) return;

  db.ref("rooms/"+online.roomId).once("value").then(s=>{
    const ids=Object.keys(s.val().players);
    if(ids.length<4 || ids.length>8){
      alert("عدد اللاعبين من 4 إلى 8");
      return;
    }

    const outId=ids[Math.floor(Math.random()*ids.length)];
    const word=onlineWords[Math.floor(Math.random()*onlineWords.length)];

    const up={phase:"role",outId,word,votes:{},round:null};
    ids.forEach(id=>{
      up["players/"+id+"/role"]=id===outId?"out":"in";
    });

    db.ref("rooms/"+online.roomId).update(up);
  });
}


/******** ROLE ********/
function showRole(r){
  hideAllOnline();
  document.getElementById("online-role").classList.remove("hidden");

  document.getElementById("online-role-text").innerText=
    r.players[online.id].role==="out"
    ?"❌ أنت برا السالفة"
    :"✅ الكلمة: "+r.word;

  if(online.isHost) setTimeout(startChat,2000);
}


/******** CHAT ********/
function startChat(){
  db.ref("rooms/"+online.roomId).once("value").then(s=>{
    const ids=Object.keys(s.val().players).sort(()=>Math.random()-0.5);

    db.ref("rooms/"+online.roomId+"/round").set({
      order:ids,turn:0,lap:1,messages:{}
    });

    db.ref("rooms/"+online.roomId+"/phase").set("chat");
  });
}

function showChat(r){
  hideAllOnline();
  document.getElementById("online-chat").classList.remove("hidden");

  const rd=r.round;
  const cur=rd.order[rd.turn];

  document.getElementById("turn-text").innerText=
    cur===online.id?"دورك":"دور "+r.players[cur].name;

  document.getElementById("chat-input")
    .classList.toggle("hidden",cur!==online.id);
  document.getElementById("send-btn")
    .classList.toggle("hidden",cur!==online.id);

  const box=document.getElementById("chat-messages");
  box.innerHTML="";
  Object.values(rd.messages||{}).forEach(m=>{
    box.innerHTML+=`<p>${m.name}: ${m.word}</p>`;
  });
}

function sendWord(){
  const input=document.getElementById("chat-input");
  const w=input.value.trim();
  if(!/^[\u0600-\u06FF]+$/.test(w)) return;

  const ref=db.ref("rooms/"+online.roomId);
  ref.once("value").then(s=>{
    const r=s.val().round;
    if(r.order[r.turn]!==online.id) return;

    ref.child("round/messages").push({name:online.name,word:w});

    let t=r.turn+1,l=r.lap;
    if(t>=r.order.length){t=0;l++;}
    if(l>2){ref.child("phase").set("vote");return;}

    ref.child("round").update({turn:t,lap:l});
    input.value="";
  });
}


/******** VOTE ********/
function showVote(r) {
  hideAllOnline();
  document.getElementById("online-vote").classList.remove("hidden");

  const list = document.getElementById("vote-list");
  const status = document.getElementById("vote-status");
  const progress = document.getElementById("vote-progress");

  list.innerHTML = "";
  progress.innerHTML = "";

  const votes = r.votes || {};
  const totalPlayers = Object.keys(r.players).length;

  status.innerText =
    `🗳️ تم التصويت: ${Object.keys(votes).length} / ${totalPlayers}`;

  Object.entries(r.players).forEach(([id, p]) => {
    const div = document.createElement("div");
    div.innerText = votes[id]
      ? `✅ ${p.name} صوّت`
      : `⏳ ${p.name} لسه`;
    progress.appendChild(div);
  });

  if (votes[online.id]) {
    const note = document.createElement("p");
    note.innerText = "✅ انت صوّت خلاص، في انتظار الباقي...";
    list.appendChild(note);
    return;
  }

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

  if (Object.keys(votes).length === totalPlayers) {
    db.ref("rooms/" + online.roomId + "/phase").set("result");
  }
}

function submitVote() {
  const selected =
    document.querySelector("#vote-list .selected");

  if (!selected) return alert("اختار لاعب");

  const voteRef =
    db.ref("rooms/" + online.roomId + "/votes/" + online.id);

  voteRef.once("value").then(snap => {
    if (snap.exists()) {
      alert("إنت صوّت قبل كده");
      return;
    }

    voteRef.set(selected.dataset.id);
  });
}


/******** RESULT ********/
function showResult(r){
  hideAllOnline();
  document.getElementById("online-result").classList.remove("hidden");

  document.getElementById("vote-result-text").innerText=
    "🕵️ برا السالفة كان: "+r.players[r.outId].name;

  document.getElementById("next-round-btn")
    .classList.toggle("hidden",!online.isHost);
}


/******** NEXT ROUND ********/
function startNextRound(){
  startRound();
}
