const firebaseConfig = {
  apiKey: "AIzaSyCQj1MwIbqNdUnfCgQZiwGZETW1YjivvRQ",
  authDomain: "men-bara.firebaseapp.com",
  databaseURL: "https://men-bara-default-rtdb.firebaseio.com",
  projectId: "men-bara"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let online={id:"",name:"",roomId:"",isHost:false};

function uid(){return "u_"+Math.random().toString(36).slice(2,9);}
function hideAllOnline(){document.querySelectorAll(".card").forEach(c=>c.classList.add("hidden"));}

function goOnline(){
  hideAllOnline();
  document.getElementById("onlineLogin").classList.remove("hidden");
}

function goHome(){
  hideAllOnline();
  document.getElementById("home").classList.remove("hidden");
}

function onlineLogin(){
  online.name=onlineName.value.trim();
  if(!online.name) return;
  online.id=uid();
  hideAllOnline();
  onlineMenu.classList.remove("hidden");
}

function createRoom(){
  online.roomId=Math.floor(100000+Math.random()*900000).toString();
  online.isHost=true;

  db.ref("rooms/"+online.roomId).set({
    host:online.id,
    status:"lobby",
    players:{[online.id]:{name:online.name,role:""}}
  });

  listenRoom();
  hideAllOnline();
  onlineLobby.classList.remove("hidden");
  roomCode.innerText=online.roomId;
}

function joinRoom(){
  online.roomId=joinCode.value.trim();
  online.isHost=false;

  db.ref("rooms/"+online.roomId+"/players/"+online.id)
    .set({name:online.name,role:""});

  listenRoom();
  hideAllOnline();
  onlineLobby.classList.remove("hidden");
  roomCode.innerText=online.roomId;
}

function listenRoom(){
  db.ref("rooms/"+online.roomId).on("value",snap=>{
    const room=snap.val(); if(!room) return;

    if(online.isHost && room.status==="lobby")
      startRoundBtn.classList.remove("hidden");

    if(room.status==="playing") showRole(room);
    if(room.status==="chat") listenChat(room);
  });
}

function startRound(){
  if(!online.isHost) return;
  db.ref("rooms/"+online.roomId).once("value").then(s=>{
    const ids=Object.keys(s.val().players);
    const outId=ids[Math.floor(Math.random()*ids.length)];
    const updates={status:"playing",word:"ميكروباص",outId};
    ids.forEach(id=>{
      updates["players/"+id+"/role"]=id===outId?"out":"in";
    });
    db.ref("rooms/"+online.roomId).update(updates);
  });
}

function showRole(room){
  hideAllOnline();
  onlineRole.classList.remove("hidden");
  onlineRoleText.innerText=
    room.players[online.id].role==="out"
    ?"❌ إنت برا السالفة"
    :"✅ الكلمة: "+room.word;

  if(online.isHost){
    setTimeout(()=>startChat(),2000);
  }
}

function startChat(){
  db.ref("rooms/"+online.roomId).once("value").then(s=>{
    const ids=Object.keys(s.val().players).sort(()=>Math.random()-0.5);
    db.ref("rooms/"+online.roomId+"/round")
      .set({order:ids,turn:0,lap:1,messages:{}});
    db.ref("rooms/"+online.roomId+"/status").set("chat");
  });
}

function listenChat(room){
  hideAllOnline();
  onlineChat.classList.remove("hidden");
  const r=room.round;
  const currentId=r.order[r.turn];

  turnText.innerText=
    currentId===online.id?"دورك":"دور "+room.players[currentId].name;

  chatInput.classList.toggle("hidden",currentId!==online.id);
  sendBtn.classList.toggle("hidden",currentId!==online.id);

  chatMessages.innerHTML="";
  Object.values(r.messages||{}).forEach(m=>{
    chatMessages.innerHTML+=`<p>${m.name}: ${m.word}</p>`;
  });
}

function sendWord(){
  const w=chatInput.value.trim();
  if(!/^[\u0600-\u06FF]+$/.test(w)) return;

  const ref=db.ref("rooms/"+online.roomId);
  ref.once("value").then(s=>{
    const r=s.val().round;
    ref.child("round/messages").push({name:online.name,word:w});

    let t=r.turn+1,l=r.lap;
    if(t>=r.order.length){t=0;l++;}
    if(l>2) return ref.child("status").set("vote");

    ref.child("round").update({turn:t,lap:l});
    chatInput.value="";
  });
}
