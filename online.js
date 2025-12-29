/******** ONLINE STATE ********/
let online = {
  name: "",
  id: "",
  roomId: "",
  isHost: false
};

/******** ROUND STATE ********/
let roundStarted = false;

/******** HELPERS ********/
function uid() {
  return "u_" + Math.random().toString(36).slice(2, 9);
}

/******** NAVIGATION ********/
function goOnline() {
  hideAll();
  document.getElementById("onlineLogin").classList.remove("hidden");
}

function backToMain() {
  hideAll();
  document.getElementById("start").classList.remove("hidden");
}

/******** LOGIN ********/
function onlineLogin() {
  const n = document.getElementById("onlineName").value.trim();
  if (!n) {
    alert("اكتب اسمك");
    return;
  }

  online.name = n;
  online.id = uid();

  hideAll();
  document.getElementById("onlineMenu").classList.remove("hidden");
}

/******** CREATE ROOM (HOST) ********/
function createRoom() {
  online.roomId = Math.floor(100000 + Math.random() * 900000).toString();
  online.isHost = true;
  roundStarted = false;

  hideAll();
  document.getElementById("onlineLobby").classList.remove("hidden");
  document.getElementById("roomCode").innerText = online.roomId;

  updateLobbyUI();
}

/******** JOIN ROOM (PLAYER) ********/
function joinRoom() {
  const code = document.getElementById("joinCode").value.trim();
  if (!code || code.length !== 6) {
    alert("كود الغرفة لازم يكون 6 أرقام");
    return;
  }

  online.roomId = code;
  online.isHost = false;
  roundStarted = false;

  hideAll();
  document.getElementById("onlineLobby").classList.remove("hidden");
  document.getElementById("roomCode").innerText = online.roomId;

  updateLobbyUI();
}

/******** LOBBY UI ********/
function updateLobbyUI() {
  const startBtn = document.getElementById("startRoundBtn");
  const lobbyText = document.getElementById("lobbyText");

  if (online.isHost) {
    startBtn.classList.remove("hidden");
    lobbyText.innerText =
      "إنت الهوست – اضغط بدء الراوند لما الكل يبقى جاهز";
  } else {
    startBtn.classList.add("hidden");
    lobbyText.innerText =
      "في انتظار الهوست يبدأ الراوند...";
  }
}

/******** START ROUND (HOST ONLY) ********/
function startRound() {
  if (!online.isHost) return;

  roundStarted = true;

  alert("🎮 الراوند بدأ!");

  // هنا بعد كده:
  // - توزيع الأدوار Online
  // - مين برا السالفة
  // - نقل اللاعبين لمرحلة اللعب
}

/******** UTILS ********/
function hideAll() {
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );
}
