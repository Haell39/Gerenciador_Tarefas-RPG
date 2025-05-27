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

  const newTaskInput = document.getElementById("new-task-input");
  const addTaskBtn = document.getElementById("add-task-btn");
  const pendingTasksList = document.getElementById("pending-tasks-list");
  const completedTasksList = document.getElementById("completed-tasks-list");
  const resetGameBtn = document.getElementById("reset-game-btn");

  // Configurações do Jogo
  const XP_PER_TASK = 25;
  const INITIAL_XP_FOR_NEXT_LEVEL = 100;
  const XP_LEVEL_MULTIPLIER = 50; // Adicional de XP por nível

  // Estado do Jogo
  let character = {
    class: null,
    level: 1,
    xp: 0,
    xpToNextLevel: INITIAL_XP_FOR_NEXT_LEVEL,
  };
  let tasks = []; // Formato: {id: Date.now(), text: "...", completed: false}
  let nextTaskId = 1;

  // principais funções

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
      if (savedTasks) {
        tasks = JSON.parse(savedTasks);
      }
      if (savedNextTaskId) {
        nextTaskId = parseInt(savedNextTaskId, 10);
      }
      return true; // Jogo carregado
    }
    return false; // Nenhum jogo salvo
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
    xpBarFill.style.width = `${Math.min(xpPercentage, 100)}%`; // Garante que não passe de 100%

    // animação pra quando subir de nível
    if (xpPercentage >= 100) {
      setTimeout(() => {
        xpBarFill.style.transition = "none"; // Remove transição para resetar
        xpBarFill.style.width = "0%";
        setTimeout(() => {
          // Adiciona transição de volta após um pequeno delay
          xpBarFill.style.transition = "width 0.5s ease-in-out";
          const newXpPercentage =
            (character.xp / character.xpToNextLevel) * 100;
          xpBarFill.style.width = `${newXpPercentage}%`;
        }, 50);
      }, 600); // tem que ser maior que a transição da barra
    }
  }

  function renderTasks() {
    pendingTasksList.innerHTML = "";
    completedTasksList.innerHTML = "";

    tasks.forEach((task) => {
      const listItem = document.createElement("li");
      listItem.dataset.taskId = task.id;

      const taskText = document.createElement("span");
      taskText.classList.add("task-text");
      taskText.textContent = task.text;
      listItem.appendChild(taskText);

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-btn");
      deleteBtn.textContent = "Excluir";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      if (task.completed) {
        taskText.style.textDecoration = "line-through";
        taskText.style.color = "#888";
        listItem.appendChild(deleteBtn); // Botão de excluir para tarefas completas
        completedTasksList.appendChild(listItem);
      } else {
        const completeBtn = document.createElement("button");
        completeBtn.classList.add("complete-btn");
        completeBtn.textContent = "Concluir Missão";
        completeBtn.addEventListener("click", () => completeTask(task.id));
        listItem.appendChild(completeBtn);
        listItem.appendChild(deleteBtn); // Botão de excluir para tarefas pendentes
        pendingTasksList.appendChild(listItem);
      }
    });
    saveGame();
  }

  function addTask() {
    const taskText = newTaskInput.value.trim();
    if (taskText === "") {
      alert("A descrição da missão não pode estar vazia!");
      return;
    }

    tasks.push({ id: nextTaskId++, text: taskText, completed: false });
    newTaskInput.value = ""; // Limpa o input
    renderTasks();
    updateStatusDisplay(); // Atualiza para salvar
  }

  function completeTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      task.completed = true;
      character.xp += XP_PER_TASK;
      checkLevelUp();
      renderTasks();
      updateStatusDisplay();
      // Mensagem de feedback
      const feedback = document.createElement("p");
      feedback.textContent = `Missão "${task.text}" concluída! +${XP_PER_TASK} XP!`;
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
      if (confirm(`Tem certeza que deseja excluir a missão "${task.text}"?`)) {
        tasks.splice(taskIndex, 1);
        renderTasks();
        updateStatusDisplay(); // Salva o estado
      }
    }
  }

  function checkLevelUp() {
    let leveledUp = false;
    while (character.xp >= character.xpToNextLevel) {
      character.level++;
      character.xp -= character.xpToNextLevel;
      character.xpToNextLevel = calculateXpForNextLevel(character.level);
      leveledUp = true;
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
    }
  }

  function selectClass(chosenClass) {
    character.class = chosenClass;
    character.level = 1;
    character.xp = 0;
    character.xpToNextLevel = INITIAL_XP_FOR_NEXT_LEVEL;

    classSelectionScreen.classList.remove("active");
    mainAppScreen.classList.add("active");

    updateStatusDisplay();
    renderTasks(); // Já aqui é pra quando tiver tarefas de um jogo anterior e o user resetar
    saveGame();
  }

  function resetGame() {
    if (
      confirm(
        "Tem certeza que deseja recomeçar sua aventura? Todo o progresso será perdido!"
      )
    ) {
      localStorage.removeItem("rpgTodoCharacter");
      localStorage.removeItem("rpgTodoTasks");
      localStorage.removeItem("rpgTodoNextTaskId");

      // reseta variáveis para o estado inicial
      character = {
        class: null,
        level: 1,
        xp: 0,
        xpToNextLevel: INITIAL_XP_FOR_NEXT_LEVEL,
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

  //  Inicialização e Event Listeners
  classButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectClass(button.dataset.class);
    });
  });

  addTaskBtn.addEventListener("click", addTask);
  newTaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  resetGameBtn.addEventListener("click", resetGame);

  // aq carrega o jogo ou ent mostra a parte de seleção de class
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
