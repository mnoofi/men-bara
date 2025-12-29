// ===== بيانات السوالف =====
const data = {
  foodDrink: [
    "بيتزا","كشري","برجر","شاورما","محشي","مكرونة","أرز","فراخ",
    "تفاح","موز","مانجا","برتقال","بطيخ",
    "شاي","قهوة","نسكافيه","بيبسي","كولا"
  ],
  places: [
    "مستشفى","عيادة","عيادة بيطرية","مستشفى أمراض عقلية",
    "حديقة حيوانات","سيرك","سينما","مسرح",
    "فيلا","قصر","سجن","قسم شرطة",
    "كافيه","قهوة بلدي","جيم"
  ],
  jobs: [
    "دكتور","ممرض","ممرضة","مهندس","مدرس","محاسب",
    "مبرمج","هاكر","صياد سمك","جلاد","سجّان",
    "يوتيوبر","تيكتوكر","ممثل"
  ],
  animals: ["كلب","قطة","أسد","نمر","فيل","قرد"],
  cars: ["BMW","Mercedes","Toyota","Tesla","Ferrari"],
  cartoon: ["Tom & Jerry","SpongeBob","Naruto","Ben 10"],
  games: ["FIFA","PUBG","GTA","Among Us"]
};

// ===== متغيرات =====
let players = [];
let roles = [];
let index = 0;
let allWords = [];
let hints = [];
let gamePhase = "roles";

// ===== التحكم في الشاشات =====
function selectMode(mode) {
  document.getElementById("modeSelect").classList.add("hidden");

  if (mode === "offline") {
    document.getElementById("setup").classList.remove("hidden");
  } else {
    document.getElementById("onlineMenu").classList.remove("hidden");
  }
}

function backToMode() {
  hideAll();
  document.getElementById("modeSelect").classList.remove("hidden");
}

function hideAll() {
  document.getElementById("modeSelect").classList.add("hidden");
  document.getElementById("onlineMenu").classList.add("hidden");
  document.getElementById("setup").classList.add("hidden");
  document.getElementById("game").classList.add("hidden");
}

// ===== بدء اللعبة (Offline) =====
function startGame() {
  players = document.getElementById("names").value
    .split("\n")
    .map(n => n.trim())
    .filter(n => n);

  const checked = document.querySelectorAll("input[type=checkbox]:checked");

  if (players.length < 4) {
    alert("لازم على الأقل 4 لاعبين");
    return;
  }
  if (checked.length === 0) {
    alert("اختار سالفة واحدة على الأقل");
    return;
  }

  let words = [];
  checked.forEach(c => words.push(...data[c.value]));
  allWords = words;

  const secretWord = words[Math.floor(Math.random() * words.length)];
  const imposter = Math.floor(Math.random() * players.length);

  roles = players.map((p, i) =>
    i === imposter
      ? "❌ انت برا السالفة<br>حاول تعرف الكلمة"
      : "✅ انت جوا السالفة<br><b>الكلمة:</b> " + secretWord
  );

  hints = [];
  while (hints.length < 6) {
    let w = allWords[Math.floor(Math.random() * allWords.length)];
    if (!hints.includes(w) && w !== secretWord) hints.push(w);
  }

  hideAll();
  document.getElementById("game").classList.remove("hidden");
  index = 0;
  gamePhase = "roles";
  showTurn();
}

function showTurn() {
  document.getElementById("turnText").innerText =
    "📱 ادي الموبايل لـ " + players[index];
  document.getElementById("roleText").innerHTML = "";
}

// ===== زر التالي =====
function next() {
  const roleText = document.getElementById("roleText");

  if (gamePhase === "roles") {
    if (roleText.innerHTML === "") {
      roleText.innerHTML = roles[index];
    } else {
      index++;
      if (index >= players.length) {
        gamePhase = "hints";
        showHints();
      } else {
        showTurn();
      }
    }
  }
}

function showHints() {
  document.getElementById("turnText").innerText = "🧠 خمن الكلمة";
  document.getElementById("roleText").innerHTML = `
    <p>كلمات قريبة من السالفة 👇</p>
    <ul>${hints.map(h => `<li>${h}</li>`).join("")}</ul>
    <button onclick="backToMode()">🔄 بدء دور جديد</button>
  `;
}
