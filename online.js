/******** FIREBASE ********/
const firebaseConfig = {
  apiKey: "AIzaSyCQj1MwIbqNdUnfCgQZiwGZETW1YjivvRQ",
  authDomain: "men-bara.firebaseapp.com",
  databaseURL: "https://men-bara-default-rtdb.firebaseio.com",
  projectId: "men-bara"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/******** STATE ********/
let onlineState = { id:"", name:"", roomId:"", isHost:false };

const words = [
  "كشري","برجر","شاورما","قهوة","بيبسي",
  "ميكروباص","توكتوك","أوبر","سينما","كافيه",
  "فستان","جيبة","ملهى","شاكوش","ولاعة"
];

/******** HELPERS ********/
function uid(){ return "u_"+Math.random().toString(36).slice(2,9); }
function hideAllOnline(){
  document.querySelectorAll(
    "#onlineLogin,#onlineMenu,#onlineLobby,#onlineRole,#onlineChat,#onlineVote,#onlineResult"
  ).forEach(c=>c.classList.add("hidden"));
}

/******** NAV ********/
function goOnline(){
  hideAllOnline();
  onlineLogin.classList.remove("hidden");
}
function goHome(){
  hideAllOnline();
  home.classList.remove("hidden");
}

/******** LOGIN ********/
function onlineLogin(){
  if(!onlineName.value.trim()) return alert("اكتب اسمك");
  onlineState={id:uid(),name:onlineName.value.trim(),roomId:"",isHost:false};
  hideAllOnline();
  onlineMenu.classList.remove("hidden");
}

/******** ROOM ********/
function createRoom(){
  onlineState.roomId=Math.floor(100000+Math.random()*900000).toString();
  onlineState.isHost=true;

  db.ref("rooms/"+onlineState.roomId).set({
    host:onlineState.id,
    phase:"lobby",
    word:"",
    outId:"",
    players:{[onlineState.id]:{name:onlineState.name,score:0}}
  });

  listenRoom();
  hideAllOnline();
  onlineLobby.classList.remove("hidden");
  roomCode.innerText=onlineState.roomId;
}

function joinRoom(){
  const code=joinCode.value.trim();
  if(code.length!==6) return alert("كود غلط");
  onlineState.roomId=code;

  db.ref("rooms/"+code+"/players/"+onlineState.id)
    .set({name:onlineState.name,score:0});

  listenRoom();
  hideAllOnline();
  onlineLobby.classList.remove("hidden");
  roomCode.innerText=code;
}

/******** LISTEN ********/
function listenRoom(){
  db.ref("rooms/"+onlineState.roomId).on("value",snap=>{
    const r=snap.val(); if(!r) return;

    if(r.phase==="lobby"){
      lobbyText.innerText=onlineState.isHost
        ?"إنت الهوست – اضغط بدء الراوند"
        :"في انتظار الهوست";
      startRoundBtn.classList.toggle("hidden",!onlineState.isHost);
    }

    if(r.phase==="role") showRole(r);
    if(r.phase==="chat") showChat(r);
    if(r.phase==="vote") showVote(r);
    if(r.phase==="result") showResult(r);
  });
}

/******** START ********/
function startRound(){
  if(!onlineState.isHost) return;

  db.ref("rooms/"+onlineState.roomId).once("value").then(s=>{
    const ids=Object.keys(s.val().players);
    if(ids.length<4) return alert("أقل عدد 4");

    const outId=ids[Math.floor(Math.random()*ids.length)];
    const word=words[Math.floor(Math.random()*words.length)];

    const up={phase:"role",outId,word};
    ids.forEach(id=>up["players/"+id+"/role"]=id===outId?"out":"in");
    db.ref("rooms/"+onlineState.roomId).update(up);
  });
}

/******** ROLE ********/
function showRole(r){
  hideAllOnline();
  onlineRole.classList.remove("hidden");
  onlineRoleText.innerText=
    r.players[onlineState.id].role==="out"
    ?"❌ إنت برا السالفة"
    :"✅ الكلمة: "+r.word;

  if(onlineState.isHost){
    setTimeout(()=>startChat(),2000);
  }
}

/******** CHAT ********/
function startChat(){
  db.ref("rooms/"+onlineState.roomId).once("value").then(s=>{
    const ids=Object.keys(s.val().players).sort(()=>Math.random()-0.5);
    db.ref("rooms/"+onlineState.roomId+"/round")
      .set({order:ids,turn:0,lap:1,messages:{}});
    db.ref("rooms/"+onlineState.roomId+"/phase").set("chat");
  });
}

function showChat(r){
  hideAllOnline();
  onlineChat.classList.remove("hidden");

  const round=r.round;
  const cur=round.order[round.turn];

  turnText.innerText=
    cur===onlineState.id?"دورك":"دور "+r.players[cur].name;

  chatInput.classList.toggle("hidden",cur!==onlineState.id);
  sendBtn.classList.toggle("hidden",cur!==onlineState.id);

  chatMessages.innerHTML="";
  Object.values(round.messages||{}).forEach(m=>{
    chatMessages.innerHTML+=`<p>${m.name}: ${m.word}</p>`;
  });
}

function sendWord(){
  const w=chatInput.value.trim();
  if(!/^[\u0600-\u06FF]+$/.test(w)) return;

  const ref=db.ref("rooms/"+onlineState.roomId);
  ref.once("value").then(s=>{
    const r=s.val().round;
    if(r.order[r.turn]!==onlineState.id) return;

    ref.child("round/messages").push({name:onlineState.name,word:w});

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
    if(id===onlineState.id) return;
    const b=document.createElement("button");
    b.innerText=p.name;
    b.onclick=()=>{
      document.querySelectorAll("#voteList button").forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
      b.dataset.id=id;
    };
    voteList.appendChild(b);
  });
}

function submitVote(){
  const b=document.querySelector("#voteList .selected");
  if(!b) return alert("اختار لاعب");
  db.ref("rooms/"+onlineState.roomId+"/votes/"+onlineState.id)
    .set(b.dataset.id);
}

/******** RESULT ********/
function showResult(r){
  hideAllOnline();
  onlineResult.classList.remove("hidden");
  voteResultText.innerText="🕵️ برا السالفة كان: "+r.players[r.outId].name;
}
