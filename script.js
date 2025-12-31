let players = [];
let scores = {};
let outPlayers = [];
let currentIndex = 0;
let secretWord = "";

const words = [
 "كشري","برجر","شاورما","قهوة","بيبسي","مهرج","حديقة حيوانات","مستشفى الأمراض العقلية","ميكروباص","توكتوك","أوبر","سينما","كافيه","دكتور","كنبة","لمبة","فستان","ولاعة","مقص","طائر حمام","دورة مياه","تواليت","عيادة بيطرية","لبوس","كلوت بناتي","بوكسر","سليب أبيض","بيضة","فرخة","محل مشويات","جزمة حريمي","كرة سلة","سرير","دبانة","شمعة","أولويز","سويت","طعمية","نادي","بسكوت","بطاطس","قاعة أفراح"
];

function qs(id){ return document.getElementById(id); }
function hideAllCards(){
  document.querySelectorAll(".card").forEach(c=>c.classList.add("hidden"));
}

function offlineGoHome(){
  hideAllCards();
  qs("home").classList.remove("hidden");
}

/* ========= SETUP ========= */

function offlineStart(){
  players=[];
  scores={};
  qs("playersInputs").innerHTML="";
  for(let i=0;i<4;i++) offlineAddPlayer();
  hideAllCards();
  qs("setup").classList.remove("hidden");
}

function offlineAddPlayer(){
  if(qs("playersInputs").children.length>=8){
    alert("أقصى عدد 8 لاعبين");
    return;
  }
  const i=document.createElement("input");
  i.placeholder="اسم اللاعب";
  qs("playersInputs").appendChild(i);
}

function offlineStartGame(){
  players=[];
  scores={};

  document.querySelectorAll("#playersInputs input").forEach(i=>{
    if(i.value.trim()){
      players.push(i.value.trim());
      scores[i.value.trim()]=0;
    }
  });

  if(players.length<4){
    alert("أقل عدد 4 لاعبين");
    return;
  }

  const outCount=parseInt(qs("outCount").value);
  secretWord = words[Math.floor(Math.random()*words.length)];
  outPlayers=[...players].sort(()=>0.5-Math.random()).slice(0,outCount);
  currentIndex=0;
  offlineShowPass();
}

/* ========= GAME ========= */

function offlineShowPass(){
  hideAllCards();
  qs("passText").innerText="📱 مرر الموبايل لـ "+players[currentIndex];
  qs("pass").classList.remove("hidden");
}

function offlineShowRole(){
  hideAllCards();
  const name=players[currentIndex];
  qs("roleText").innerText =
    outPlayers.includes(name)
    ? "❌ أنت برا السالفة"
    : "✅ الكلمة: "+secretWord;
  qs("role").classList.remove("hidden");
}

function offlineNextPlayer(){
  currentIndex++;
  if(currentIndex>=players.length){
    hideAllCards();
    qs("reveal").classList.remove("hidden");
  }else{
    offlineShowPass();
  }
}

/* ========= REVEAL ========= */

function offlineReveal(){
  hideAllCards();
  qs("outNames").innerText="🕵️ برا السالفة: "+outPlayers.join(" و ");
  qs("outResult").classList.remove("hidden");
}

/* ========= GUESS ========= */

function offlineStartGuess(){
  hideAllCards();
  const arr=[secretWord];
  while(arr.length<8){
    const w=words[Math.floor(Math.random()*words.length)];
    if(!arr.includes(w)) arr.push(w);
  }
  arr.sort(()=>Math.random()-0.5);

  const div=qs("choices");
  div.innerHTML="";
  arr.forEach(w=>{
    const b=document.createElement("button");
    b.innerText=w;
    b.onclick=()=>offlineCheckGuess(w);
    div.appendChild(b);
  });
  qs("guess").classList.remove("hidden");
}

function offlineCheckGuess(w){
  outPlayers.forEach(p=>{
    scores[p]+= (w===secretWord?1:-1);
  });
  offlineShowScore();
}

/* ========= SCORE ========= */

function offlineShowScore(){
  hideAllCards();
  const ul=qs("scoreList");
  ul.innerHTML="";
  for(let p in scores){
    ul.innerHTML+=`<li>${p}: ${scores[p]}</li>`;
  }
  qs("score").classList.remove("hidden");
}

function offlineNewRound(){
  const outCount=outPlayers.length;
  secretWord = words[Math.floor(Math.random()*words.length)];
  outPlayers=[...players].sort(()=>0.5-Math.random()).slice(0,outCount);
  currentIndex=0;
  offlineShowPass();
}

function offlineEditPlayers(){
  hideAllCards();
  qs("setup").classList.remove("hidden");
}
