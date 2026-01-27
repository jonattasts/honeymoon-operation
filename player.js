import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firestore } from "./firebase.js";
import { findPlayerByName } from "./home.js";

/* ELEMENTOS */
const lastNumbersContainer = document.getElementById("lastNumbers");
const playerTableContainer = document.getElementById("playerTable");
const playerName = document.getElementById("playerName");
const updateBtn = document.getElementById("updateBtn");
const loader = document.querySelector(".loader");

/* NOVOS ELEMENTOS DE CONTROLE */
const playerGameContent = document.getElementById("playerGameContent");
const winnerMessage = document.getElementById("winnerMessage");
const gameOverMessage = document.getElementById("gameOverMessage");
const winnerNameDisplay = document.getElementById("winnerNameDisplay");
const loserNameDisplay = document.getElementById("loserNameDisplay");

let isProcessing = false;

/* INIT */
export async function loadPlayerScreen() {
  // Garante que as mensagens de fim de jogo estejam escondidas ao iniciar
  if (winnerMessage) winnerMessage.classList.add("hidden");
  if (gameOverMessage) gameOverMessage.classList.add("hidden");

  startLoading();

  // Renderiza o nome no cabeçalho "Boa sorte, [Nome] 🍀🤩"
  renderPlayerName();

  const drawData = await fetchDrawResults();
  const calledNumbers = drawData.lastNumbers || [];
  const serverWinner = drawData.winner || null;

  const playerStorage = JSON.parse(localStorage.getItem("player")) || {};

  // ✅ EXIBE O CONTEÚDO DO JOGO (Mantendo os títulos do HTML)
  if (playerGameContent) playerGameContent.classList.remove("hidden");

  if (calledNumbers.length === 0) {
    renderLastNumbersEmptyState();
  } else {
    renderLastNumbers(calledNumbers);
    renderPlayerTable(calledNumbers);
  }

  // 🎯 VERIFICAÇÃO DE VENCEDOR NA KEY SEPARADA
  if (serverWinner) {
    localStorage.setItem("gameWinner", serverWinner);

    handleFinalDisplay(serverWinner, playerStorage.name);
    return;
  } else {
    // setTimeout(() => {
      localStorage.removeItem("gameWinner");
      stopLoading();
    // }, 200);
  }
}

/* UI — CONTROLE DE EXIBIÇÃO FINAL */
function handleFinalDisplay(winnerName, currentPlayerName) {
  const firstName = currentPlayerName
    ? currentPlayerName.trim().split(/\s+/)[0]
    : "Jogador";

  setTimeout(() => {
    if (playerGameContent) playerGameContent.classList.add("hidden");
    if (updateBtn) updateBtn.classList.add("hidden");

    stopLoading();

    if (winnerName === currentPlayerName) {
      if (winnerNameDisplay) winnerNameDisplay.textContent = firstName;
      if (winnerMessage) winnerMessage.classList.remove("hidden");
    } else {
      if (loserNameDisplay) loserNameDisplay.textContent = firstName;
      if (gameOverMessage) gameOverMessage.classList.remove("hidden");
    }
  }, 2000);
}

/* 🔥 FIRESTORE */
async function fetchDrawResults() {
  try {
    const snap = await getDocs(collection(firestore, "drawResults"));
    if (snap.empty) return { lastNumbers: [], winner: null };
    return snap.docs[0].data();
  } catch (e) {
    console.error("Erro ao buscar resultados:", e);
    return { lastNumbers: [], winner: null };
  }
}

/* UI — ESTADO VAZIO */
function renderLastNumbersEmptyState() {
  if (!lastNumbersContainer) return;
  lastNumbersContainer.classList.remove("numbers-row");
  lastNumbersContainer.innerHTML = `
    <span class="empty-message">
      O sorteio ainda não começou. Aguarde um pouco! 🤩
    </span>
  `;
  renderPlayerTable([]);
}

/* UI — ÚLTIMOS NÚMEROS */
function renderLastNumbers(numbers) {
  if (!lastNumbersContainer) return;
  lastNumbersContainer.innerHTML = "";
  lastNumbersContainer.className = "numbers-row";

  numbers.forEach((number) => {
    const div = document.createElement("div");
    div.className = "number-circle";
    div.textContent = formatNumber(number);
    lastNumbersContainer.appendChild(div);
  });

  scrollToBottom(lastNumbersContainer);
}

/* UI — CARTELA DO JOGADOR */
async function renderPlayerTable(calledNumbers) {
  const playerStorage = JSON.parse(localStorage.getItem("player"));
  if (!playerStorage) return;

  const player = await findPlayerByName(playerStorage.name);

  if (!playerTableContainer) return;

  if (!player || !player.tableNumbers) {
    playerTableContainer.innerHTML =
      "<span class='empty-message'>Cartela não encontrada. 🥲</span>";
    return;
  }

  playerTableContainer.innerHTML = "";
  playerTableContainer.className = "numbers-row";

  const table = player.tableNumbers;
  const lastCalled =
    calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;

  const rows = [table.slice(0, 6), table.slice(6, 12), table.slice(12, 18)];
  const winningRowsIndices = [];

  rows.forEach((row, index) => {
    const validNumbers = row.filter((n) => n !== null);
    const isWinner =
      validNumbers.length > 0 &&
      validNumbers.every((n) => calledNumbers.includes(n));
    if (isWinner) winningRowsIndices.push(index);
  });

  table.forEach((number, index) => {
    const numberCircle = document.createElement("div");
    const rowIndex = Math.floor(index / 6);

    if (number === null) {
      const img = document.createElement("img");
      img.src = "./assets/monograma.jpeg";
      img.className = "number-circle-empty";
      numberCircle.appendChild(img);
    } else {
      numberCircle.className = "number-circle";
      numberCircle.textContent = formatNumber(number);

      if (calledNumbers.includes(number)) {
        numberCircle.classList.add("called");

        if (winningRowsIndices.includes(rowIndex)) {
          numberCircle.classList.add("winner");
          numberCircle.classList.add("animate-point");
        } else if (number === lastCalled && isProcessing) {
          numberCircle.classList.add("animate-point");
          setTimeout(() => {
            numberCircle.classList.remove("animate-point");
            isProcessing = false;
          }, 1500);
        }
      }
    }
    playerTableContainer.appendChild(numberCircle);
  });
}

/* UI - NOME DO JOGADOR */
function renderPlayerName() {
  const player = JSON.parse(localStorage.getItem("player"));
  if (!player || !player.name || !playerName) return;

  const firstName = player.name.trim().split(/\s+/)[0];
  playerName.textContent = firstName;
}

/* 🔄 LOADING - REFATORADO PARA O BOTÃO */
function startLoading() {
  if (!loader || !updateBtn) return;

  updateBtn.disabled = true;
  updateBtn.textContent = ""; // Remove o texto original

  loader.classList.remove("hidden");
  updateBtn.appendChild(loader); // Insere o loader dentro do botão
}

async function stopLoading() {
  if (!loader || !updateBtn) return;

  // Delay suave para o feedback visual
  await new Promise((r) => setTimeout(r, 800));

  loader.classList.add("hidden");
  // Opcional: mover loader de volta para o body se necessário para outras telas
  document.body.appendChild(loader);

  const drawData = await fetchDrawResults();

  if (!drawData.winner) {
    updateBtn.textContent = "Atualizar";
    updateBtn.disabled = false;
  }
}

function formatNumber(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

async function handleUpdateClick() {
  isProcessing = true;
  await loadPlayerScreen();
}

function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

if (updateBtn) updateBtn.addEventListener("click", handleUpdateClick);
