/*
  Men Bara El Salfa
  Developed by:Mohamed Serag
  © 2025 All Rights Reserved
*/

const data = {
  foodDrink: [
    // أكل
    "بيتزا","كشري","برجر","شاورما","ملوخية",
    "محشي","مكرونة","أرز","فراخ","سمك",

    // فواكه
    "تفاح","موز","مانجا","برتقال","عنب",
    "بطيخ","فراولة","أناناس","كيوي",

    // خضار
    "بطاطس","طماطم","خيار","بصل","جزر",
    "كوسة","باذنجان","فلفل",

    // مشروبات
    "شاي","قهوة","نسكافيه","عصير",
    "بيبسي","كولا","ليمون"
  ],

  animals: [
    "كلب","قطة","أسد","نمر",
    "فيل","حصان","زرافة","قرد"
  ],

  cars: [
    "BMW","Mercedes","Toyota",
    "Tesla","Hyundai","Kia","Ferrari"
  ],

  cartoon: [
    "Tom & Jerry","SpongeBob",
    "Naruto","One Piece","Ben 10","Dora"
  ],

  games: [
    "FIFA","PUBG","Minecraft",
    "GTA","Call of Duty","Among Us"
  ],

  jobs: [
    "دكتور","مهندس","مدرس","محاسب",
    "مبرمج","طيار","صيدلي","محامي","مصمم"
  ]
};

let players = [];
let roles = [];
let index = 0;
let allWords = [];

function startGame() {
  players = document
    .getElementById("names")
    .value
    .split("\n")
    .map(n => n.trim())
    .filter(n => n !== "");

  const checked = document.querySelectorAll("input[type=checkbox]:checked");

  if (players.length < 3) {
    alert("لازم على الأقل 3 لاعبين");
    return;
  }

  if (checked.length === 0) {
    alert("اختار سالفة واحدة على الأقل");
    return;
  }

  let words = [];
  checked.forEach(c => {
    words = words.concat(data[c.value]);
  });

  allWords = words;

  const secretWord = words[Math.floor(Math.random() * words.length)];
  const imposter = Math.floor(Math.random() * players.length);

  roles = players.map((p, i) =>
    i === imposter
      ? "❌ انت برا السالفة<br>حاول تعرف الكلمة من كلامهم"
      : "✅ انت جوا السالفة<br><b>الكلمة:</b> " + secretWord
  );

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  index = 0;
  showTurn();
}

function showTurn() {
  document.getElementById("turnText").innerText =
    "📱 ادي الموبايل لـ " + players[index];
  document.getElementById("roleText").innerHTML = "";
}

function next() {
  const roleText = document.getElementById("roleText");

  if (roleText.innerHTML === "") {
    roleText.innerHTML = roles[index];
  } else {
    index++;
    if (index >= players.length) {
      document.getElementById("turnText").innerText = "🧠 خمن الكلمة";
      showHints();
      return;
    }
    showTurn();
  }
}

function showHints() {
  let hints = [];
  while (hints.length < 5) {
    let w = allWords[Math.floor(Math.random() * allWords.length)];
    if (!hints.includes(w)) hints.push(w);
  }

  document.getElementById("roleText").innerHTML = `
    <p>كلمات قريبة من السالفة 👇</p>
    <ul>
      ${hints.map(h => `<li>${h}</li>`).join("")}
    </ul>
    <button onclick="resetGame()">🔄 بدء دور جديد</button>
  `;
}

function resetGame() {
  document.getElementById("game").classList.add("hidden");
  document.getElementById("setup").classList.remove("hidden");
  document.getElementById("names").value = "";
  index = 0;
}
