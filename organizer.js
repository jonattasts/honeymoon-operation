import {
  collection,
  getDocs,
  doc,
  setDoc,
  runTransaction,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firestore } from "./firebase.js";

/* ELEMENTOS */
const playersList = document.getElementById("playersList");
const lastNumbersContainer = document.getElementById("lastNumbersContainer");
const rankingList = document.getElementById("organizerRankingList");
const drawBtn = document.getElementById("drawNumberBtn");
const updateBtn = document.getElementById("updateOrganizerBtn");
const resetBtn = document.getElementById("resetGameBtn");
let isProcessing = false;

// Garantindo que o botão inicie visível para permitir a carga mesmo sem jogadores
if (updateBtn) {
  updateBtn.style.display = "block";
}

/* LOADER (reaproveitando classe loader do CSS) */
function createLoader(action) {
  const loader = document.createElement("div");
  loader.className = action === "update" ? "loader primary" : "loader";
  return loader;
}

/* ESTADO LOCAL */
let lastNumbers = [];
let players = [];
let winner = null;

/* MÉTODO DE CONTROLE DE INTERFACE */
function checkGameStatus() {
  const isGameOver = winner !== null;
  const hasPlayers = players.length > 0; // 🔥 NOVA REGRA: Verifica se há jogadores
  drawBtn.style.fontSize = "16px";

  // Se houver um vencedor, o botão de sorteio permanece desativado permanentemente
  if (isGameOver) {
    drawBtn.disabled = true;
    drawBtn.textContent = "Sorteio encerrado";
  }
  // 🔥 NOVA REGRA: Se não houver jogadores, o botão fica desativado
  else if (!hasPlayers) {
    drawBtn.disabled = true;
    drawBtn.textContent = "Aguardando jogadores...";
    drawBtn.style.fontSize = "12px";
  } else {
    // Se não houver vencedor, houver jogadores e não estivermos processando, habilitamos
    if (!isProcessing) {
      drawBtn.disabled = false;
      drawBtn.textContent = "Sortear";
    }
  }
}

/* FUNÇÃO PARA RENDERIZAR JOGADORES */
function renderPlayers() {
  playersList.innerHTML = "";

  // Verifica se há jogadores para renderizar
  if (players.length === 0) {
    playersList.innerHTML =
      "<span class='empty-message'>Aguardando jogadores...</span>";
    return;
  }

  players.forEach((p) => {
    const playersContent = document.createElement("div");
    playersContent.className = "player-content";
    playersContent.textContent = p.name;

    const playerIcon = document.createElement("span");
    playerIcon.className = "player-icon";
    playerIcon.textContent = "🕹️";

    playersContent.appendChild(playerIcon);
    playersList.appendChild(playersContent);
  });

  scrollToBottom(playersList);
}

/* FUNÇÃO PARA RENDERIZAR ÚLTIMOS NÚMEROS */
function renderLastNumbers() {
  lastNumbersContainer.innerHTML = "";
  lastNumbersContainer.className = "numbers-row small";

  if (lastNumbers.length === 0) {
    lastNumbersContainer.innerHTML = "<span class='empty-message'>-</span>";
    return;
  }

  lastNumbers.forEach((num) => {
    const numberCircle = document.createElement("div");
    numberCircle.className = "number-circle small";
    numberCircle.textContent = num < 10 ? `0${num}` : num;
    lastNumbersContainer.appendChild(numberCircle);
  });

  scrollToBottom(lastNumbersContainer);
}

/* FUNÇÃO PARA RENDERIZAR CLASSIFICAÇÃO */
function renderRanking() {
  rankingList.innerHTML = "";

  // 1. Cabeçalho
  const header = document.createElement("div");
  header.className = "ranking-header";
  header.innerHTML = `
    <div class="indexLabel">#</div>
    <div class="nameLabel">Nome</div>
    <div class="numberLabel">Números</div>
    <div class="scoreLabel">Pontos</div>
  `;
  rankingList.appendChild(header);

  const rankingColumn = document.createElement("div");
  rankingColumn.className = "ranking-column";
  rankingList.appendChild(rankingColumn);

  // Se não houver jogadores, exibe estado vazio no ranking
  if (players.length === 0) {
    rankingColumn.innerHTML =
      "<div style='grid-column: span 4; padding: 20px; text-align: center; color: #7a7a7a;'>Nenhum dado disponível</div>";
    return;
  }

  // 2. Preparar dados para ordenação (calculando pontos em tempo real)
  const playersWithProgress = players.map((player) => {
    const table = player.tableNumbers || [];
    const hits = table.filter(
      (num) => num !== null && lastNumbers.includes(num)
    );
    return {
      ...player,
      currentHits: hits,
      points: hits.length,
    };
  });

  // 3. Ordenar por quem tem mais acertos
  playersWithProgress.sort((a, b) => {
    const isAWinner = winner && a.name === winner;
    const isBWinner = winner && b.name === winner;
    if (isAWinner) return -1;
    if (isBWinner) return 1;
    return b.points - a.points;
  });

  playersWithProgress.forEach((player, idx) => {
    const isActualWinner = winner && winner === player.name;
    const rowColor = isActualWinner ? "#18ab40" : "#5a6b7b";
    const fontWeight = isActualWinner ? "700" : "400";

    const rankIndex = document.createElement("div");
    rankIndex.className = "rank-index";
    rankIndex.style.color = rowColor;
    rankIndex.style.fontWeight = fontWeight;
    rankIndex.textContent = isActualWinner ? "🏆" : `${idx + 1}`;

    const name = document.createElement("div");
    name.textContent = player.name;
    name.className = "ranking-player-name";
    name.style.color = rowColor;
    name.style.fontWeight = fontWeight;

    const numbers = document.createElement("div");
    numbers.className = "ranking-player-numbers";
    numbers.style.color = rowColor;

    // REMOÇÃO DE SCROLL PARA EXIBIÇÃO TOTAL
    numbers.style.overflowY = "visible";
    numbers.style.height = "auto";

    if (player.currentHits.length > 0) {
      player.currentHits.forEach((n) => {
        const circle = document.createElement("div");
        circle.className = "number-circle tiny";
        if (player.winningNumbers?.includes(n)) {
          circle.classList.add("winner");

          circle.style.fontWeight = fontWeight;
        }
        circle.textContent = n < 10 ? `0${n}` : n;
        numbers.appendChild(circle);
      });
    } else {
      numbers.textContent = "-";
    }

    const points = document.createElement("div");
    points.className = "ranking-player-points";
    points.style.color = rowColor;
    points.style.fontWeight = fontWeight;
    points.textContent = player.points;

    rankingColumn.appendChild(rankIndex);
    rankingColumn.appendChild(name);
    rankingColumn.appendChild(numbers);
    rankingColumn.appendChild(points);
  });

  rankingColumn.scrollTop = 0;
}

/* FUNÇÃO PARA BUSCAR DADOS DO FIRESTORE */
async function fetchData() {
  const drawSnap = await getDocs(collection(firestore, "drawResults"));
  if (!drawSnap.empty) {
    const data = drawSnap.docs[0].data();
    lastNumbers = data.lastNumbers || [];
    winner = data.winner || null;
  } else {
    lastNumbers = [];
    winner = null;
  }

  const playersSnap = await getDocs(collection(firestore, "players"));
  players = playersSnap.docs.map((d) => ({ idDoc: d.id, ...d.data() }));

  renderAll();
  checkGameStatus();
}

/* RENDERIZA TUDO */
function renderAll() {
  renderPlayers();
  renderLastNumbers();
  renderRanking();
}

/* FUNÇÃO PARA ATUALIZAR DADOS APÓS SORTEIO */
async function updateAfterDraw(newNumber) {
  const batchUpdates = players.map(async (player) => {
    if (!player.tableNumbers.includes(newNumber)) return;

    const playerRef = doc(firestore, "players", player.idDoc);

    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(playerRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const table = data.tableNumbers || [];
      const currentWinning = data.winningNumbers || [];

      if (currentWinning.includes(newNumber)) return;

      const rows = [table.slice(0, 6), table.slice(6, 12), table.slice(12, 18)];
      const rowIndex = rows.findIndex((row) => row.includes(newNumber));
      const targetRow = rows[rowIndex];

      const validNumbersInRow = targetRow.filter((n) => n !== null);
      const isRowComplete = validNumbersInRow.every(
        (n) => n === newNumber || lastNumbers.includes(n)
      );

      if (isRowComplete) {
        const newWinningSet = new Set([
          ...currentWinning,
          ...validNumbersInRow,
        ]);
        const updated = Array.from(newWinningSet);

        transaction.update(playerRef, { winningNumbers: updated });
        player.winningNumbers = updated;

        const drawSnap = await getDocs(collection(firestore, "drawResults"));
        if (!drawSnap.empty) {
          const drawDocRef = drawSnap.docs[0].ref;
          transaction.update(drawDocRef, { winner: player.name });
          winner = player.name;
        }
      }
    });
  });

  await Promise.all(batchUpdates);
  checkGameStatus();
}

/* GERA NÚMERO ALEATÓRIO NÃO SORTEADO */
function generateRandomNumber() {
  let num;
  do {
    num = Math.floor(Math.random() * 100) + 1;
  } while (lastNumbers.includes(num));
  return num;
}

/* AÇÕES DOS BOTÕES */
async function handleUpdateClick() {
  if (isProcessing) return;

  // Bloqueia AMBOS os botões
  toggleAllButtons(true, "update");

  await fetchData();

  toggleAllButtons(false);
}

async function handleDrawClick() {
  // Impede a execução se não houver jogadores além do vencedor ou processamento
  if (isProcessing || winner !== null || players.length === 0) return;

  try {
    // Bloqueia AMBOS os botões
    toggleAllButtons(true, "draw");

    const newNum = generateRandomNumber();
    const drawSnap = await getDocs(collection(firestore, "drawResults"));

    if (!drawSnap.empty) {
      const docRef = drawSnap.docs[0].ref;
      await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists()) {
          tx.set(docRef, { lastNumbers: [newNum], winner: null });
        } else {
          const data = snap.data();
          const existing = data.lastNumbers || [];
          if (!existing.includes(newNum)) {
            tx.update(docRef, { lastNumbers: [...existing, newNum] });
          }
        }
      });
    } else {
      const drawRef = doc(collection(firestore, "drawResults"));
      await setDoc(drawRef, { lastNumbers: [newNum], winner: null });
    }

    await updateAfterDraw(newNum);
    await fetchData();
  } catch (error) {
    console.error("Erro durante o sorteio:", error);
  } finally {
    isProcessing = false;
    toggleAllButtons(false);
    checkGameStatus();
  }
}

async function handleResetClick() {
  const confirmReset = confirm(
    "TEM CERTEZA? Isso excluirá todos os jogadores, sorteios e o organizador atual."
  );

  if (confirmReset) {
    resetBtn.disabled = true;
    resetBtn.textContent = "";
    resetBtn.appendChild(createLoader("sort"));

    await clearAllCollections();

    localStorage.removeItem("player");
    localStorage.removeItem("markedNumbers");
    window.location.reload();
  }
}

/* FUNÇÃO UNIFICADA PARA BLOQUEIO DE BOTÕES */
function toggleAllButtons(disable, activeAction = null) {
  if (disable) {
    isProcessing = true;

    drawBtn.disabled = true;
    if (activeAction === "draw") {
      drawBtn.textContent = "";
      drawBtn.appendChild(createLoader("sort"));
    }

    updateBtn.disabled = true;
    if (activeAction === "update") {
      updateBtn.textContent = "";
      updateBtn.appendChild(createLoader("update"));
    }
  } else {
    isProcessing = false;

    updateBtn.disabled = false;
    updateBtn.textContent = "Atualizar";

    checkGameStatus();
  }
}

function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

/**
 * 💣 FUNÇÃO PARA LIMPAR TODO O BANCO DE DADOS
 * Esta função percorre as coleções principais e deleta todos os documentos.
 */
async function clearAllCollections() {
  const collectionsToClear = [
    "players",
    "organizers",
    "drawResults",
    "counters",
  ];
  const batch = writeBatch(firestore);
  let totalDeleted = 0;

  try {
    for (const collectionName of collectionsToClear) {
      const querySnapshot = await getDocs(
        collection(firestore, collectionName)
      );

      querySnapshot.forEach((document) => {
        const docRef = doc(firestore, collectionName, document.id);
        batch.delete(docRef);
        totalDeleted++;
      });
    }

    if (totalDeleted > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Erro ao limpar coleções:", error);
  }
}

/* INICIALIZAÇÃO */
export async function loadOrganizerScreen() {
  await fetchData();
}

/* EVENTOS */
updateBtn.addEventListener("click", handleUpdateClick);
drawBtn.addEventListener("click", handleDrawClick);
resetBtn.addEventListener("click", handleResetClick);
