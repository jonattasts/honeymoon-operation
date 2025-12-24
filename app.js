/* 🧭 SPA */
const screens = {
  home: document.getElementById("home"),
  player: document.getElementById("player"),
  organizer: document.getElementById("organizer"),
};

export function showScreen(screen) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[screen].classList.add("active");
}

/* 🔔 TOAST GLOBAL */
const toast = document.getElementById("toast");

export function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

/* 💾 STORAGE */
export function savePlayerToStorage(player) {
  localStorage.setItem("player", JSON.stringify(player));
}

export function getPlayerFromStorage() {
  const data = localStorage.getItem("player");
  return data ? JSON.parse(data) : null;
}
