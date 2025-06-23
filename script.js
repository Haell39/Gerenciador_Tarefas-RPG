document.addEventListener("DOMContentLoaded", () => {
  // Elementos da UI
  const classSelectionScreen = document.getElementById(
    "class-selection-screen"
  );
  const mainAppScreen = document.getElementById("main-app-screen");
  const classButtons = document.querySelectorAll(".class-button");

  const charClassDisplay = document.getElementById("char-class");
  const charLevelDisplay = document.getElementById("char-level");
  const charXpDisplay = document.getElementById("char-xp");
  const charXpNextDisplay = document.getElementById("char-xp-next");
  const xpBarFill = document.getElementById("xp-bar-fill");
  const classPerkDisplay = document.getElementById("class-perk-display"); // Novo elemento para exibir bônus da classe

  const newTaskInput = document.getElementById("new-task-input");
  const taskDifficultySelect = document.getElementById("task-difficulty");
  const addTaskBtn = document.getElementById("add-task-btn");
  const pendingTasksList = document.getElementById("pending-tasks-list");
  const completedTasksList = document.getElementById("completed-tasks-list");
  const resetGameBtn = document.getElementById("reset-game-btn");

  // Modal de Missão Bônus
  const bonusTaskModal = document.getElementById("bonus-task-modal");
  const modalLevelDisplay = document.getElementById("modal-level");
  const bonusTaskInput = document.getElementById("bonus-task-input");
  const addBonusTaskBtn = document.getElementById("add-bonus-task-btn");
  const cancelBonusTaskBtn = document.getElementById("cancel-bonus-task-btn");

  // Custom Confirm Modal
  const customConfirmModal = document.getElementById("custom-confirm-modal");
  const customConfirmMessage = document.getElementById(
    "custom-confirm-message"
  );
  const customConfirmYes = document.getElementById("custom-confirm-yes");
  const customConfirmNo = document.getElementById("custom-confirm-no");
  let confirmCallback = null; // Callback para o custom confirm

  // Custom Alert Modal
  const customAlertModal = document.getElementById("custom-alert-modal");
  const customAlertMessage = document.getElementById("custom-alert-message");
  const customAlertOk = document.getElementById("custom-alert-ok");

  // Funções de Modal Customizado
  function showCustomAlert(message) {
    customAlertMessage.textContent = message;
    customAlertModal.classList.add("active");
  }

  function hideCustomAlert() {
    customAlertModal.classList.remove("active");
  }

  function showCustomConfirm(message, callback) {
    customConfirmMessage.textContent = message;
    confirmCallback = callback;
    customConfirmModal.classList.add("active");
  }

  function hideCustomConfirm() {
    customConfirmModal.classList.remove("active");
    confirmCallback = null;
  }

  customAlertOk.addEventListener("click", hideCustomAlert);

  customConfirmYes.addEventListener("click", () => {
    if (confirmCallback) confirmCallback(true);
    hideCustomConfirm();
  });

  customConfirmNo.addEventListener("click", () => {
    if (confirmCallback) confirmCallback(false);
    hideCustomConfirm();
  });

  // Configurações do Jogo
  const MAGE_XP_REWARDS = {
    facil: 20,
    normal: 30,
    dificil: 50,
  };
  const WARRIOR_XP_PER_TASK = 30;
  const ARCHER_XP_PER_TASK = 20;
  const ARCHER_BONUS_XP_PER_CYCLE = 15; // Bônus para Arqueiro a cada 3 tarefas
  const MAGE_BONUS_XP_PER_CYCLE = 25; // Bônus para Mago a cada 2 tarefas difíceis
  const BONUS_TASK_XP = 100; // XP para missões bônus

  const TASK_LIMITS_BY_CLASS = {
    Guerreiro: 5,
    Mago: 5,
    Arqueiro: 8,
  };

  const INITIAL_XP_FOR_NEXT_LEVEL = 100;
  const XP_LEVEL_MULTIPLIER = 50;
  const MAX_LEVEL = 20; // Nível máximo para evolução de classe

  const CLASS_EVOLUTIONS = {
    Guerreiro: "Warlord",
    Mago: "Archmage",
    Arqueiro: "Assassin",
  };

  // Estado do Jogo
  let character = {
    class: null,
    level: 1,
    xp: 0,
    xpToNextLevel: INITIAL_XP_FOR_NEXT_LEVEL,
    completedArcherTasks: 0, // Contador para o bônus do Arqueiro
    completedMageDifficultTasks: 0, // Contador para o bônus do Mago
    bonusTasksClaimed: { 5: false, 10: false, 15: false, 20: false }, // Para controlar missões bônus por nível
  };
  let tasks = []; // Formato: {id: Date.now(), text: "...", completed: false, difficulty: "normal", xpReward: 30, isBonusTask: false}
  let nextTaskId = 1;

  // Funções de Gerenciamento do Jogo

  function saveGame() {
    localStorage.setItem("rpgTodoCharacter", JSON.stringify(character));
    localStorage.setItem("rpgTodoTasks", JSON.stringify(tasks));
    localStorage.setItem("rpgTodoNextTaskId", nextTaskId.toString());
  }

  function loadGame() {
    const savedCharacter = localStorage.getItem("rpgTodoCharacter");
    const savedTasks = localStorage.getItem("rpgTodoTasks");
    const savedNextTaskId = localStorage.getItem("rpgTodoNextTaskId");

    if (savedCharacter) {
      character = JSON.parse(savedCharacter);

      // Migração de dados: Garante que novas propriedades existam em jogos salvos antigos
      character.completedArcherTasks =
        character.completedArcherTasks !== undefined
          ? character.completedArcherTasks
          : 0;
      character.completedMageDifficultTasks =
        character.completedMageDifficultTasks !== undefined
          ? character.completedMageDifficultTasks
          : 0;
      character.bonusTasksClaimed =
        character.bonusTasksClaimed !== undefined
          ? character.bonusTasksClaimed
          : { 5: false, 10: false, 15: false, 20: false };

      if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        // Garante que tarefas antigas tenham 'xpReward' e 'isBonusTask' para compatibilidade
        tasks.forEach((task) => {
          if (task.xpReward === undefined) {
            if (character.class === "Mago" && task.difficulty) {
              task.xpReward =
                MAGE_XP_REWARDS[task.difficulty] || MAGE_XP_REWARDS.normal;
            } else if (character.class === "Guerreiro") {
              task.xpReward = WARRIOR_XP_PER_TASK;
            } else if (character.class === "Arqueiro") {
              task.xpReward = ARCHER_XP_PER_TASK;
            } else {
              task.xpReward = MAGE_XP_REWARDS.normal; // Padrão
            }
          }
          task.isBonusTask =
            task.isBonusTask !== undefined ? task.isBonusTask : false;
        });
      }
      if (savedNextTaskId) {
        nextTaskId = parseInt(savedNextTaskId, 10);
      }
      return true;
    }
    return false;
  }

  function calculateXpForNextLevel(level) {
    return INITIAL_XP_FOR_NEXT_LEVEL + (level - 1) * XP_LEVEL_MULTIPLIER;
  }

  function updateStatusDisplay() {
    charClassDisplay.textContent = character.class || "N/A";
    charLevelDisplay.textContent = character.level;
    charXpDisplay.textContent = character.xp;
    charXpNextDisplay.textContent = character.xpToNextLevel;

    const xpPercentage = (character.xp / character.xpToNextLevel) * 100;
    xpBarFill.style.width = `${Math.min(xpPercentage, 100)}%`;

    // Animação para quando subir de nível
    if (xpPercentage >= 100) {
      setTimeout(() => {
        xpBarFill.style.transition = "none";
        xpBarFill.style.width = "0%";
        setTimeout(() => {
          xpBarFill.style.transition = "width 0.5s ease-in-out";
          const newXpPercentage =
            (character.xp / character.xpToNextLevel) * 100;
          xpBarFill.style.width = `${newXpPercentage}%`;
        }, 50);
      }, 600);
    }
    updateClassPerkDisplay(); // Atualiza a exibição de bônus da classe
  }

  function updateClassPerkDisplay() {
    let perkText = "";
    if (character.class === "Guerreiro") {
      perkText = `<strong>Guerreiro:</strong> Você pode
        <span style="color: #d63031; font-weight: bold;">cancelar missões sem penalidade</span>.
        Seja implacável!`;
    } else if (character.class === "Arqueiro") {
      perkText = `<strong>Arqueiro:</strong> Ganhe
        <span style="color: green; font-weight: bold;">+${ARCHER_BONUS_XP_PER_CYCLE} XP de bônus</span>
        a cada <span style="font-weight: bold;">3 missões concluídas</span>!
        Concluídas este ciclo: ${character.completedArcherTasks % 3}/3`;
    } else if (character.class === "Mago") {
      perkText = `<strong>Mago:</strong> Ganhe
        <span style="color: green; font-weight: bold;">+${MAGE_BONUS_XP_PER_CYCLE} XP de bônus</span>
        a cada <span style="font-weight: bold;">2 missões difíceis concluídas</span>!
        Concluídas este ciclo: ${character.completedMageDifficultTasks % 2}/2`;
    }
    classPerkDisplay.innerHTML = perkText;
  }

  function renderTasks() {
    pendingTasksList.innerHTML = "";
    completedTasksList.innerHTML = "";

    if (character.class === "Mago") {
      taskDifficultySelect.style.display = "inline-block";
    } else {
      taskDifficultySelect.style.display = "none";
    }

    tasks.forEach((task) => {
      const listItem = document.createElement("li");
      listItem.dataset.taskId = task.id;

      const taskContent = document.createElement("div");
      taskContent.classList.add("task-content");

      const taskText = document.createElement("span");
      taskText.classList.add("task-text");
      taskText.textContent = task.text;
      taskContent.appendChild(taskText);

      const taskDetails = document.createElement("span");
      taskDetails.classList.add("task-details");

      let detailText = ` (+${task.xpReward} XP)`;

      if (task.isBonusTask) {
        detailText = " ✨ Missão Bônus" + detailText;
        taskDetails.style.color = "#8a2be2"; // Roxo para missões bônus
      } else if (character.class === "Mago" && task.difficulty) {
        detailText =
          ` (${
            task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)
          })` + detailText;
        switch (task.difficulty) {
          case "facil":
            taskDetails.style.color = "green";
            break;
          case "dificil":
            taskDetails.style.color = "red";
            break;
          default:
            taskDetails.style.color = "orange";
            break;
        }
      } else {
        taskDetails.style.color = "#007bff";
      }
      taskDetails.textContent = detailText;
      taskContent.appendChild(taskDetails);
      listItem.appendChild(taskContent);

      const actionsContainer = document.createElement("div");
      actionsContainer.classList.add("task-actions");

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-btn");
      deleteBtn.textContent = "Excluir";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      if (task.completed) {
        taskText.style.textDecoration = "line-through";
        taskText.style.color = "#888";
        taskDetails.style.textDecoration = "line-through";
        taskDetails.style.color = "#888";
        actionsContainer.appendChild(deleteBtn);
        listItem.appendChild(actionsContainer);
        completedTasksList.appendChild(listItem);
      } else {
        const completeBtn = document.createElement("button");
        completeBtn.classList.add("complete-btn");
        completeBtn.textContent = "Concluir Missão";
        completeBtn.addEventListener("click", () => completeTask(task.id));
        actionsContainer.appendChild(completeBtn);
        actionsContainer.appendChild(deleteBtn);
        listItem.appendChild(actionsContainer);
        pendingTasksList.appendChild(listItem);
      }
    });
    saveGame();
  }

  function addTask(isBonus = false, bonusText = "") {
    const taskText = isBonus ? bonusText.trim() : newTaskInput.value.trim();
    if (taskText === "") {
      showCustomAlert("A descrição da missão não pode estar vazia!");
      return;
    }

    const pendingTasks = tasks.filter(
      (task) => !task.completed && !task.isBonusTask
    ).length;
    const taskLimit = TASK_LIMITS_BY_CLASS[character.class];

    if (!isBonus && pendingTasks >= taskLimit) {
      showCustomAlert(
        `Como ${character.class}, você pode ter no máximo ${taskLimit} missões pendentes. Conclua algumas antes de adicionar mais!`
      );
      return;
    }

    let xpRewardForTask;
    let taskDifficulty = "normal";

    if (isBonus) {
      xpRewardForTask = BONUS_TASK_XP;
    } else if (character.class === "Mago") {
      taskDifficulty = taskDifficultySelect.value;
      xpRewardForTask = MAGE_XP_REWARDS[taskDifficulty];
    } else if (character.class === "Guerreiro") {
      xpRewardForTask = WARRIOR_XP_PER_TASK;
    } else if (character.class === "Arqueiro") {
      xpRewardForTask = ARCHER_XP_PER_TASK;
    } else {
      xpRewardForTask = MAGE_XP_REWARDS.normal;
    }

    tasks.push({
      id: nextTaskId++,
      text: taskText,
      completed: false,
      difficulty: taskDifficulty,
      xpReward: xpRewardForTask,
      isBonusTask: isBonus,
    });
    if (!isBonus) {
      newTaskInput.value = "";
      taskDifficultySelect.value = "normal";
    }
    renderTasks();
    updateStatusDisplay();
  }

  function completeTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      task.completed = true;
      let xpGained = task.xpReward;

      // Bônus específicos da classe
      if (character.class === "Arqueiro" && !task.isBonusTask) {
        // Bônus de Arqueiro
        character.completedArcherTasks++;
        if (character.completedArcherTasks % 3 === 0) {
          xpGained += ARCHER_BONUS_XP_PER_CYCLE;
          showCustomAlert(
            `Bônus de Arqueiro! +${ARCHER_BONUS_XP_PER_CYCLE} XP por 3 missões concluídas!`
          );
        }
      } else if (
        character.class === "Mago" &&
        task.difficulty === "dificil" &&
        !task.isBonusTask
      ) {
        // Bônus de Mago
        character.completedMageDifficultTasks++;
        if (character.completedMageDifficultTasks % 2 === 0) {
          xpGained += MAGE_BONUS_XP_PER_CYCLE;
          showCustomAlert(
            `Bônus de Mago! +${MAGE_BONUS_XP_PER_CYCLE} XP por 2 missões difíceis concluídas!`
          );
        }
      }

      character.xp += xpGained;
      checkLevelUp();
      renderTasks();
      updateStatusDisplay();
      // Mensagem de feedback
      const feedback = document.createElement("p");
      feedback.textContent = `Missão "${task.text}" concluída! +${xpGained} XP!`;
      feedback.style.color = "green";
      feedback.style.textAlign = "center";
      mainAppScreen.insertBefore(
        feedback,
        document.getElementById("task-manager")
      );
      setTimeout(() => feedback.remove(), 3000);
    }
  }

  function deleteTask(taskId) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex > -1) {
      const task = tasks[taskIndex];
      showCustomConfirm(
        `Tem certeza que deseja excluir a missão "${task.text}"?`,
        (response) => {
          if (response) {
            tasks.splice(taskIndex, 1);
            renderTasks();
            updateStatusDisplay();
            // Para Guerreiro, a "vontade" de cancelar é a ausência de penalidade
            if (character.class === "Guerreiro") {
              showCustomAlert(
                "Missão cancelada! Guerreiros não temem desistir de missões impossíveis!"
              );
            }
          }
        }
      );
    }
  }

  function checkLevelUp() {
    let leveledUp = false;
    while (character.xp >= character.xpToNextLevel) {
      character.level++;
      character.xp -= character.xpToNextLevel;
      character.xpToNextLevel = calculateXpForNextLevel(character.level);
      leveledUp = true;

      // Resetar contadores de bônus de classe ao subir de nível
      character.completedArcherTasks = 0;
      character.completedMageDifficultTasks = 0;
    }

    if (leveledUp) {
      // Mensagem de feedback para level up
      const levelUpMsg = document.createElement("p");
      levelUpMsg.innerHTML = `✨🎉 <strong>LEVEL UP!</strong> 🎉✨<br>Você alcançou o Nível ${character.level} de ${character.class}!`;
      levelUpMsg.style.color = "#d35400";
      levelUpMsg.style.fontWeight = "bold";
      levelUpMsg.style.textAlign = "center";
      levelUpMsg.style.fontSize = "1.2em";
      mainAppScreen.insertBefore(
        levelUpMsg,
        document.getElementById("character-status").nextSibling
      );
      setTimeout(() => levelUpMsg.remove(), 5000);

      // Adiciona um pequeno efeito visual no status
      const statusBox = document.getElementById("character-status");
      statusBox.style.transition =
        "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out";
      statusBox.style.transform = "scale(1.05)";
      statusBox.style.boxShadow = "0 0 15px #f1c40f";
      setTimeout(() => {
        statusBox.style.transform = "scale(1)";
        statusBox.style.boxShadow = "none";
      }, 600);

      // Checar evolução de classe no nível máximo
      if (
        character.level === MAX_LEVEL &&
        character.class !== CLASS_EVOLUTIONS[character.class]
      ) {
        showCustomAlert(
          `Parabéns! Sua classe evoluiu para ${
            CLASS_EVOLUTIONS[character.class]
          }!`
        );
        character.class = CLASS_EVOLUTIONS[character.class];
      }

      // Checar recompensas a cada 5 níveis
      if (
        character.level % 5 === 0 &&
        character.level <= MAX_LEVEL &&
        !character.bonusTasksClaimed[character.level]
      ) {
        showBonusTaskModal(character.level);
      }
    }
  }

  function showBonusTaskModal(level) {
    modalLevelDisplay.textContent = level;
    bonusTaskInput.value = ""; // Limpa o input
    bonusTaskModal.classList.add("active");
  }

  function hideBonusTaskModal() {
    bonusTaskModal.classList.remove("active");
  }

  function handleAddBonusTask() {
    const bonusText = bonusTaskInput.value;
    if (bonusText.trim() === "") {
      showCustomAlert("Por favor, descreva sua Missão Bônus.");
      return;
    }
    addTask(true, bonusText); // Adiciona a tarefa como bônus
    character.bonusTasksClaimed[character.level] = true; // Marca como reclamada
    saveGame(); // Salva o jogo após adicionar e reclamar
    hideBonusTaskModal();
    showCustomAlert(
      `Missão Bônus "${bonusText}" adicionada! Prepare-se para a aventura extra!`
    );
  }

  function handleCancelBonusTask() {
    showCustomConfirm(
      "Tem certeza que deseja cancelar a Missão Bônus? Você pode perdê-la para sempre!",
      (response) => {
        if (response) {
          hideBonusTaskModal();
          showCustomAlert("Missão Bônus cancelada. A oportunidade se foi...");
          // Opcional: character.bonusTasksClaimed[character.level] = true; se você quiser que cancelar signifique perder a chance.
          // Atualmente, ao cancelar, a chance continua ativa para o nível atual.
          // Se o usuário fechar e reabrir o modal, ele ainda poderá adicionar a missão b/c bonusTasksClaimed[level] is still false.
        }
      }
    );
  }

  function selectClass(chosenClass) {
    character.class = chosenClass;
    character.level = 1;
    character.xp = 0;
    character.xpToNextLevel = INITIAL_XP_FOR_NEXT_LEVEL;
    character.completedArcherTasks = 0;
    character.completedMageDifficultTasks = 0;
    character.bonusTasksClaimed = { 5: false, 10: false, 15: false, 20: false }; // Reinicia ao selecionar nova classe

    tasks = []; // Limpa tarefas ao selecionar nova classe para evitar inconsistências
    nextTaskId = 1;

    classSelectionScreen.classList.remove("active");
    mainAppScreen.classList.add("active");

    updateStatusDisplay();
    renderTasks();
    saveGame();
  }

  function resetGame() {
    showCustomConfirm(
      "Tem certeza que deseja recomeçar sua aventura? Todo o progresso será perdido!",
      (response) => {
        if (response) {
          localStorage.removeItem("rpgTodoCharacter");
          localStorage.removeItem("rpgTodoTasks");
          localStorage.removeItem("rpgTodoNextTaskId");

          // reseta variáveis para o estado inicial
          character = {
            class: null,
            level: 1,
            xp: 0,
            xpToNextLevel: INITIAL_XP_FOR_NEXT_LEVEL,
            completedArcherTasks: 0,
            completedMageDifficultTasks: 0,
            bonusTasksClaimed: { 5: false, 10: false, 15: false, 20: false },
          };
          tasks = [];
          nextTaskId = 1;

          mainAppScreen.classList.remove("active");
          classSelectionScreen.classList.add("active");

          // limpa as listas na UI
          pendingTasksList.innerHTML = "";
          completedTasksList.innerHTML = "";
          updateStatusDisplay(); // Atualiza a UI para o estado resetado
        }
      }
    );
  }

  // Event Listeners
  classButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectClass(button.dataset.class);
    });
  });

  addTaskBtn.addEventListener("click", () => addTask()); // Chama addTask sem argumentos para tarefas normais
  newTaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  addBonusTaskBtn.addEventListener("click", handleAddBonusTask);
  cancelBonusTaskBtn.addEventListener("click", handleCancelBonusTask);

  resetGameBtn.addEventListener("click", resetGame);

  // Carrega o jogo ou mostra a parte de seleção de classe
  if (loadGame() && character.class) {
    classSelectionScreen.classList.remove("active");
    mainAppScreen.classList.add("active");
    updateStatusDisplay();
    renderTasks();
  } else {
    classSelectionScreen.classList.add("active");
    mainAppScreen.classList.remove("active");
  }
});
