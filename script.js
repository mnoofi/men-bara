let players=[];
let scores={};
let outPlayers=[];
let current=0;
let secretWord="";

const words=[
 "كشري","برجر","شاورما","قهوة","بيبسي",
 "فستان","فستان سهرة","جيبة",
 "ملهى ليلي","سينما","كافيه",
 "توكتوك","ميكروباص","أوبر",
 "شاكوش","مقص","ولاعة"
];

function rnd(){return words[Math.floor(Math.random()*words.length)];}
function qs(id){return document.getElementById(id);}
function hideAll(){document.querySelectorAll(".card").forEach(c=>c.classList.add("hidden"));}

function goHome(){
  hideAll();
  qs("home").classList.remove("hidden");
}

function goOffline(){
  players=[];
  scores={};
  qs("playersInputs").innerHTML="";
  for(let i=0;i<4;i++) addPlayer();
  hideAll();
  qs("setup").classList.remove("hidden");
}

function addPlayer(){
  if(qs("playersInputs").children.length>=8) return;
  const i=document.createElement("input");
  i.placeholder="اسم اللاعب";
  qs("playersInputs").appendChild(i);
}

function startGame(){
  players=[];
  scores={};
  document.querySelectorAll("#playersInputs input").forEach(i=>{
    if(i.value.trim()){
      players.push(i.value.trim());
      scores[i.value.trim()]=0;
    }
  });
  if(players.length<4) return alert("أقل عدد 4 لاعبين");

  const outCount=parseInt(qs("outCount").value);
  secretWord=rnd();
  outPlayers=[...players].sort(()=>0.5-Math.random()).slice(0,outCount);
  current=0;
  showPass();
}

function showPass(){
  hideAll();
  qs("passText").innerText="📱 مرر الموبايل لـ "+players[current];
  qs("pass").classList.remove("hidden");
}

function showRole(){
  hideAll();
  const name=players[current];
  qs("roleText").innerText=
    outPlayers.includes(name)
    ? "❌ أنت برا السالفة"
    : "✅ الكلمة: "+secretWord;
  qs("role").classList.remove("hidden");
}

function nextPlayer(){
  current++;
  if(current>=players.length){
    hideAll();
    qs("reveal").classList.remove("hidden");
  }else showPass();
}

function revealOut(){
  hideAll();
  qs("outNames").innerText="برا السالفة: "+outPlayers.join(" و ");
  qs("outResult").classList.remove("hidden");
}

function startGuess(){
  hideAll();
  const arr=[secretWord];
  while(arr.length<8){
    const w=rnd();
    if(!arr.includes(w)) arr.push(w);
  }
  arr.sort(()=>Math.random()-0.5);
  const div=qs("choices");
  div.innerHTML="";
  arr.forEach(w=>{
    const b=document.createElement("button");
    b.innerText=w;
    b.onclick=()=>checkGuess(w);
    div.appendChild(b);
  });
  qs("guess").classList.remove("hidden");
}

function checkGuess(w){
  outPlayers.forEach(p=>{
    scores[p]+= w===secretWord ? 1 : -1;
  });
  showScore();
}

function showScore(){
  hideAll();
  const ul=qs("scoreList");
  ul.innerHTML="";
  for(let p in scores){
    ul.innerHTML+=`<li>${p}: ${scores[p]}</li>`;
  }
  qs("score").classList.remove("hidden");
}

function newRound(){
  const outCount=outPlayers.length;
  secretWord=rnd();
  outPlayers=[...players].sort(()=>0.5-Math.random()).slice(0,outCount);
  current=0;
  showPass();
}

function editPlayers(){
  hideAll();
  qs("setup").classList.remove("hidden");
}
