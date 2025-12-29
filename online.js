/******** FIREBASE ********/
firebase.initializeApp({
  apiKey: "AIzaSyCQj1MwIbqNdUnfCgQZiwGZETW1YjivvRQ",
  authDomain: "men-bara.firebaseapp.com",
  databaseURL: "https://men-bara-default-rtdb.firebaseio.com",
  projectId: "men-bara"
});
const db = firebase.database();

/******** STATE ********/
let online = { id:"", name:"", roomId:"", isHost:false };

const words=[
 "كشري","برجر","شاورما","قهوة","بيبسي",
 "ميكروباص","توكتوك","أوبر","سينما","كافيه",
 "كنبة","لمبة","فستان","ولاعة","مقص"
];

/******** HELPERS ********/
function uid(){ return "u_"+Math.random().toString(36).slice(2,9); }
function hideAllOnline(){
  document.querySelectorAll(
    "#onlineLoginCard,#onlineMenu,#onlineLobby,#onlineRole,#onlineChat,#onlineVote,#onlineResult"
  ).forEach(c=>c.classList.add("hidden"));
}

/******** NAV ********/
function goOnline(){
  hideAllOnline();
  document.getElementById("onlineLoginCard").classList.remove("hidden");
}
function goHome(){
  hideAllOnline();
  document.getElementById("home").classList.remove("hidden");
}

/******** LOGIN ********/
function onlineLogin(){
  if(!onlineName.value.trim()) return alert("اكتب اسمك");
  online={id:uid(),name:onlineName.value.trim(),roomId:"",isHost:false};
  hideAllOnline();
  onlineMenu.classList.remove("hidden");
}

/******** ROOM ********/
function createRoom(){
  online.roomId=Math.floor(100000+Math.random()*900000).toString();
  online.isHost=true;

  db.ref("rooms/"+online.roomId).set({
    host:online.id,
    phase:"lobby",
    players:{[online.id]:{name:online.name}},
  });

  listenRoom();
  hideAllOnline();
  onlineLobby.classList.remove("hidden");
  roomCode.innerText=online.roomId;
}

function joinRoom(){
  const code=joinCode.value.trim();
  if(code.length!==6) return alert("كود غلط");

  online.roomId=code;
  db.ref("rooms/"+code+"/players/"+online.id)
    .set({name:online.name});

  listenRoom();
  hideAllOnline();
  onlineLobby.classList.remove("hidden");
  roomCode.innerText=code;
}

/******** LISTEN ********/
function listenRoom(){
  db.ref("rooms/"+online.roomId).on("value",snap=>{
    const r=snap.val(); if(!r) return;

    if(r.phase==="lobby"){
      lobbyText.innerText=online.isHost?"إنت الهوست – اضغط بدء الراوند":"في انتظار الهوست";
      startRoundBtn.classList.toggle("hidden",!online.isHost);
    }
    if(r.phase==="role") showRole(r);
    if(r.phase==="chat") showChat(r);
    if(r.phase==="vote") showVote(r);
    if(r.phase==="result") showResult(r);
  });
}

/******** START ********/
function startRound(){
  if(!online.isHost) return;

  db.ref("rooms/"+online.roomId).once("value").then(s=>{
    const ids=Object.keys(s.val().players);
    if(ids.length<4) return alert("أقل عدد 4");

    const outId=ids[Math.floor(Math.random()*ids.length)];
    const word=words[Math.floor(Math.random()*words.length)];

    const up={phase:"role",outId,word};
    ids.forEach(id=>up["players/"+id+"/role"]=id===outId?"out":"in");
    db.ref("rooms/"+online.roomId).update(up);
  });
}

/******** ROLE ********/
function showRole(r){
  hideAllOnline();
  onlineRole.classList.remove("hidden");
  onlineRoleText.innerText=
    r.players[online.id].role==="out"
    ?"❌ إنت برا السالفة"
    :"✅ الكلمة: "+r.word;

  if(online.isHost){
    setTimeout(()=>startChat(),2000);
  }
}

/******** CHAT ********/
function startChat(){
  db.ref("rooms/"+online.roomId).once("value").then(s=>{
    const ids=Object.keys(s.val().players).sort(()=>Math.random()-0.5);
    db.ref("rooms/"+online.roomId+"/round")
      .set({order:ids,turn:0,lap:1,messages:{}});
    db.ref("rooms/"+online.roomId+"/phase").set("chat");
  });
}

function showChat(r){
  hideAllOnline();
  onlineChat.classList.remove("hidden");

  const rd=r.round;
  const cur=rd.order[rd.turn];

  turnText.innerText=cur===online.id?"دورك":"دور "+r.players[cur].name;
  chatInput.classList.toggle("hidden",cur!==online.id);
  sendBtn.classList.toggle("hidden",cur!==online.id);

  chatMessages.innerHTML="";
  Object.values(rd.messages||{}).forEach(m=>{
    chatMessages.innerHTML+=`<p>${m.name}: ${m.word}</p>`;
  });
}

function sendWord(){
  const w=chatInput.value.trim();
  if(!/^[\u0600-\u06FF]+$/.test(w)) return;

  const ref=db.ref("rooms/"+online.roomId);
  ref.once("value").then(s=>{
    const r=s.val().round;
    if(r.order[r.turn]!==online.id) return;

    ref.child("round/messages").push({name:online.name,word:w});

    let t=r.turn+1,l=r.lap;
    if(t>=r.order.length){t=0;l++;}
    if(l>2) return ref.child("phase").set("vote");

    ref.child("round").update({turn:t,lap:l});
    chatInput.value="";
  });
}

/******** VOTE ********/
function showVote(r){
  hideAllOnline();
  onlineVote.classList.remove("hidden");
  voteList.innerHTML="";

  Object.entries(r.players).forEach(([id,p])=>{
    if(id===online.id) return;
    const b=document.createElement("button");
    b.innerText=p.name;
    b.onclick=()=>{voteList.querySelectorAll("button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");b.dataset.id=id;};
    voteList.appendChild(b);
  });
}

function submitVote(){
  const b=document.querySelector("#voteList .selected");
  if(!b) return alert("اختار لاعب");
  db.ref("rooms/"+online.roomId+"/votes/"+online.id).set(b.dataset.id);

  db.ref("rooms/"+online.roomId+"/phase").set("result");
}

/******** RESULT ********/
function showResult(r){
  hideAllOnline();
  onlineResult.classList.remove("hidden");
  voteResultText.innerText="🕵️ برا السالفة كان: "+r.players[r.outId].name;
}
