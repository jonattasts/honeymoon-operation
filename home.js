import {
  collection,
  addDoc,
  getDocs,
  doc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firestore } from "./firebase.js";
import { showScreen, showToast, savePlayerToStorage } from "./app.js";

import { loadPlayerScreen } from "./player.js";
import { loadOrganizerScreen } from "./organizer.js";

/* ELEMENTOS */
const nameInput = document.getElementById("nameInput");
const enterBtn = document.getElementById("enterBtn");
// Seleciona o loader que já existe no seu HTML
const fullScreenLoader = document.querySelector(".full-screen-loader");

/* ELEMENTOS PARA MODO ORGANIZADOR */
const passwordInput = document.getElementById("passwordInput");
const backBtn = document.getElementById("backBtn");
const pixInfo = document.getElementById("pixInfo");
const formTitle = document.getElementById("formTitle");

let isPasswordMode = false; // Controla se estamos na tela de senha

// Adicionando o spinner visual dentro do loader de tela cheia existente
const innerSpinner = document.createElement("div");
innerSpinner.className = "loader";
innerSpinner.style.color = "#2b78d6";
fullScreenLoader.appendChild(innerSpinner);

/* 🚀 LÓGICA DE PERSISTÊNCIA (AUTO-LOGIN) COM DELAY DE 2s */
async function initSession() {
  // Desabilita o botão logo no início da validação
  enterBtn.disabled = true;

  const playerStorage = JSON.parse(localStorage.getItem("player"));

  // Garante que o loading de entrada dure pelo menos 2 segundos
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let screenToLoad = "home"; // Tela padrão inicial

  if (playerStorage && playerStorage.name) {
    try {
      // Verifica se é o Organizador salvo
      if (playerStorage.name === "Organizador") {
        const organizerExists = await checkOrganizerExists();
        if (organizerExists) {
          await loadOrganizerScreen();
          screenToLoad = "organizer";
        }
      } else {
        // Verifica se é um Jogador comum salvo
        const playerDoc = await findPlayerByName(playerStorage.name);
        if (playerDoc) {
          // Atualiza o storage com dados frescos do banco (ex: nova cartela)
          savePlayerToStorage(playerDoc);
          await loadPlayerScreen();
          screenToLoad = "player";
        } else {
          // Jogador não existe mais no banco (foi excluído)
          localStorage.removeItem("player");
        }
      }
    } catch (error) {
      console.error("Erro na validação de sessão:", error);
    }
  }

  // Finaliza o loading e exibe a tela correta
  hideInitialLoading();
  showScreen(screenToLoad);

  // 🛡️ SÓ HABILITA O BOTÃO SE A TELA CARREGADA FOR A HOME (ERRO OU AUSÊNCIA DE SESSÃO)
  if (screenToLoad === "home") {
    checkInputs();
  }
}

function hideInitialLoading() {
  if (fullScreenLoader) {
    fullScreenLoader.classList.add("loader-hidden");
    // Remove do DOM após a transição do CSS
    setTimeout(() => (fullScreenLoader.style.display = "none"), 500);
  }
}

/* FUNÇÃO PARA ALTERNAR MODO SENHA */
function togglePasswordMode(active) {
  isPasswordMode = active;
  if (active) {
    // Esconde elementos de jogador
    nameInput.style.display = "none";
    if (pixInfo) pixInfo.style.display = "none";

    // Mostra elementos de senha com animação
    passwordInput.style.display = "block";
    passwordInput.classList.add("fade-in");
    backBtn.style.display = "block";
    backBtn.classList.add("fade-in");

    passwordInput.value = "";
    enterBtn.disabled = true;
    enterBtn.classList.remove("enabled");
  } else {
    // Volta ao normal
    nameInput.style.display = "block";
    if (pixInfo) pixInfo.style.display = "block";
    passwordInput.style.display = "none";
    passwordInput.classList.remove("fade-in");
    backBtn.style.display = "none";
    backBtn.classList.remove("fade-in");
    checkInputs();
  }
}

/* VALIDAÇÃO DE INPUTS */
function checkInputs() {
  if (isPasswordMode) {
    const filled = passwordInput.value.length >= 6;
    enterBtn.disabled = !filled;
    enterBtn.classList.toggle("enabled", filled);
  } else {
    const filled = nameInput.value.trim().length > 0;
    enterBtn.disabled = !filled;
    enterBtn.classList.toggle("enabled", filled);
  }
}

/* 🔢 ID SEQUENCIAL (JOGADORES) */
async function getNextUserId() {
  const ref = doc(firestore, "counters", "players");

  return runTransaction(firestore, async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists()) {
      tx.set(ref, { currentId: 1 });
      return 1;
    }

    const next = snap.data().currentId + 1;
    tx.update(ref, { currentId: next });
    return next;
  });
}

/* 🔍 BUSCA JOGADOR POR NOME (case-insensitive) */
export async function findPlayerByName(normalizedName) {
  const snap = await getDocs(collection(firestore, "players"));

  return snap.docs
    .map((d) => ({ idDoc: d.id, ...d.data() }))
    .find((p) => p.name === normalizedName);
}

/* 🔢 BUSCA CARTELAS EXISTENTES */
async function fetchExistingTables() {
  const snap = await getDocs(collection(firestore, "players"));
  return snap.docs.map((d) => d.data().tableNumbers).filter(Boolean);
}

/* 🎲 GERA CARTELA ÚNICA */
function generateUniqueTable(existingTables) {
  const TOTAL = 18;
  const NULLS = 3;

  let table;

  do {
    const numbers = shuffle(Array.from({ length: 100 }, (_, i) => i + 1)).slice(
      0,
      TOTAL - NULLS
    );

    const slots = shuffle([...Array(TOTAL).keys()]);
    const nullPositions = slots.slice(0, NULLS);

    table = Array(TOTAL).fill(null);
    let idx = 0;

    for (let i = 0; i < TOTAL; i++) {
      if (!nullPositions.includes(i)) {
        table[i] = numbers[idx++];
      }
    }
  } while (
    existingTables.some((t) => JSON.stringify(t) === JSON.stringify(table))
  );

  return table;
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/* 👤 ENTRA OU CRIA JOGADOR */
async function enterOrCreatePlayer(name) {
  const existingPlayer = await findPlayerByName(name);

  if (existingPlayer) {
    savePlayerToStorage(existingPlayer);
    await loadPlayerScreen();
    showScreen("player");
    return;
  }

  // ➕ CRIA NOVO
  const id = await getNextUserId();
  const existingTables = await fetchExistingTables();
  const tableNumbers = generateUniqueTable(existingTables);

  const player = {
    id,
    name,
    tableNumbers,
    winningNumbers: [],
  };

  await addDoc(collection(firestore, "players"), player);
  savePlayerToStorage(player);
  await loadPlayerScreen();
  showScreen("player");
}

/* 🧠 ORGANIZADOR */
async function handleOrganizerLogin(name) {
  const exists = await checkOrganizerExists();

  if (!exists) {
    const id = await getNextUserId();
    const organizer = {
      id,
      name,
      createdAt: new Date(),
    };
    await addDoc(collection(firestore, "organizers"), organizer);
  }

  savePlayerToStorage({ name: "Organizador", isOrganizer: true });
  await loadOrganizerScreen();
  showScreen("organizer");
}

/* 🔍 VERIFICA ORGANIZADOR */
async function checkOrganizerExists() {
  const snap = await getDocs(collection(firestore, "organizers"));
  return !snap.empty;
}

function formatName(rawName) {
  const lowercaseWords = ["da", "de", "do", "dos", "das", "e"];

  return rawName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => {
      const lower = word.toLocaleLowerCase("pt-BR");
      if (lowercaseWords.includes(lower)) return lower;
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}

async function handleEnterClick() {
  const rawName = nameInput.value.trim();
  if (!rawName) return;

  const name = formatName(rawName);

  // 🔐 SE FOR ORGANIZADOR E NÃO ESTIVER NO MODO SENHA
  if (name.toLowerCase() === "organizador" && !isPasswordMode) {
    togglePasswordMode(true);
    return;
  }

  // 🔐 VALIDAÇÃO DA SENHA SE ESTIVER NO MODO SENHA
  if (isPasswordMode) {
    if (passwordInput.value !== "eles se amam") {
      showToast("Senha do organizador incorreta!");
      return;
    }
  }

  // 🔄 ESTADO DE CARREGAMENTO NO BOTÃO
  const originalText = enterBtn.textContent;
  enterBtn.disabled = true;
  enterBtn.textContent = "";

  const btnLoader = document.createElement("div");
  btnLoader.className = "loader";
  btnLoader.style.width = "20px";
  btnLoader.style.height = "20px";
  btnLoader.style.borderWidth = "2px";
  enterBtn.appendChild(btnLoader);

  try {
    // Delay de 2 segundos solicitado
    await new Promise((r) => setTimeout(r, 2000));

    if (name.toLowerCase() === "organizador") {
      await handleOrganizerLogin(name);
      return;
    }

    const organizerExists = await checkOrganizerExists();
    if (!organizerExists) {
      showToast(
        "O evento ainda não está disponível, aguarde o organizador entrar!"
      );
      enterBtn.innerHTML = "Entrar"; // Restaura o texto original
      enterBtn.disabled = false;
      return;
    }

    await enterOrCreatePlayer(name);
  } catch (error) {
    console.error("Erro ao entrar:", error);
    enterBtn.innerHTML = "Entrar";
    enterBtn.disabled = false;
  }
}

/* EVENTOS */

nameInput.addEventListener("input", checkInputs);
passwordInput.addEventListener("input", checkInputs);
enterBtn.addEventListener("click", handleEnterClick);
backBtn.addEventListener("click", () => togglePasswordMode(false));

// Inicia a verificação de sessão
initSession();
