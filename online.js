/******** ONLINE STATE ********/
let online = {
  name: "",
  id: "",
  roomId: "",
  isHost: false
};

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
  if (!n) return alert("اكتب اسمك");

  online.name = n;
  online.id = uid();

  hideAll();
  document.getElementById("onlineMenu").classList.remove("hidden");
}

/******** ROOMS (FAKE مؤقتًا) ********/
function createRoom() {
  online.roomId = Math.floor(100000 + Math.random() * 900000).toString();
  online.isHost = true;

  hideAll();
  document.getElementById("onlineLobby").classList.remove("hidden");
  document.getElementById("roomCode").innerText = online.roomId;
}

function joinRoom() {
  const code = document.getElementById("joinCode").value.trim();
  if (!code || code.length !== 6) {
    return alert("كود الغرفة 6 أرقام");
  }

  online.roomId = code;
  online.isHost = false;

  hideAll();
  document.getElementById("onlineLobby").classList.remove("hidden");
  document.getElementById("roomCode").innerText = online.roomId;
}

/******** UTILS ********/
function hideAll() {
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );
}
