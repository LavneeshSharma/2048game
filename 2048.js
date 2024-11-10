let board;
      let score = 0;
      let rows = 4;
      let columns = 4;
      let currentTheme = 'light';
      let previousBoard;
      let previousScore;
      let undoAvailable = false;
      let leaderboard = [];
      window.onload = function() {
        setGame();
        setupThemeSystem();
        setupSwipeControls();
        setupUndoButton();
        loadLeaderboard();
        updateLeaderboardDisplay();
      }

      function setupThemeSystem() {
        const themeToggle = document.getElementById('themeToggle');
        document.body.classList.add('light-theme');
        
        themeToggle.addEventListener('change', () => {
          if (themeToggle.checked) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            currentTheme = 'dark';
          } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            currentTheme = 'light';
          }
          updateAllTiles();
        });
      }

      function updateAllTiles() {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < columns; c++) {
            let tile = document.getElementById(r.toString() + "-" + c.toString());
            let num = board[r][c];
            updateTile(tile, num);
          }
        }
      }

      function setGame() {
        board = Array.from({ length: rows }, () => Array(columns).fill(0));
        score = 0;
        updateScore();
        const boardElement = document.getElementById("board");
        boardElement.innerHTML = '';
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < columns; c++) {
            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            let num = board[r][c];
            updateTile(tile, num);
            boardElement.append(tile);
          }
        }
        setTwo();
        setTwo();
        resetUndo();
      }

      function updateTile(tile, num) {
        tile.innerText = "";
        tile.classList.value = ""; 
        tile.classList.add("tile");
        if (num > 0) {
          tile.innerText = num.toString();
          tile.classList.add(num <= 4096 ? `x${num}` : "x8192");
        }
      }

      function updateScore() {
        document.getElementById("score").innerText = score;
      }

      document.addEventListener('keyup', handleInput);
      function handleInput(e) {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) {
          saveBoardState();
          processMove(e.code);
        }
      }

      function setupSwipeControls() {
        let startX, startY;
        document.addEventListener("touchstart", (e) => {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        });
        document.addEventListener("touchend", (e) => {
          let deltaX = e.changedTouches[0].clientX - startX;
          let deltaY = e.changedTouches[0].clientY - startY;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            saveBoardState();
            processMove(deltaX > 0 ? "ArrowRight" : "ArrowLeft");
          } else {
            saveBoardState();
            processMove(deltaY > 0 ? "ArrowDown" : "ArrowUp");
          }
          enableUndo();
        });
      }

      function processMove(direction) {
        let moved = false;
        if (direction === "ArrowLeft") moved = slideLeft();
        else if (direction === "ArrowRight") moved = slideRight();
        else if (direction === "ArrowUp") moved = slideUp();
        else if (direction === "ArrowDown") moved = slideDown();

        if (moved) {
          setTwo();
          const gameState = checkGameState();
          if (gameState !== "continue") {
            endGame(gameState);
          }
          enableUndo();
        }
        updateScore();
      }

      function filterZero(row) {
        return row.filter(num => num !== 0);
      }

      function slide(row) {
        row = filterZero(row);
        for (let i = 0; i < row.length - 1; i++) {
          if (row[i] === row[i + 1]) {
            row[i] *= 2;
            row[i + 1] = 0;
            score += row[i];
          }
        }
        row = filterZero(row);
        while (row.length < columns) {
          row.push(0);
        }
        return row;
      }

      function slideLeft() {
        let moved = false;
        for (let r = 0; r < rows; r++) {
          let row = board[r];
          let originalRow = [...row];
          row = slide(row);
          board[r] = row;
          if (!moved && !arraysEqual(originalRow, row)) {
            moved = true;
          }
          updateRow(r);
        }
        return moved;
      }

      function slideRight() {
        let moved = false;
        for (let r = 0; r < rows; r++) {
          let row = board[r];
          let originalRow = [...row];
          row.reverse();
          row = slide(row);
          row.reverse();
          board[r] = row;
          if (!moved && !arraysEqual(originalRow, row)) {
            moved = true;
          }
          updateRow(r);
        }
        return moved;
      }

      function slideUp() {
        let moved = false;
        for (let c = 0; c < columns; c++) {
          let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
          let originalRow = [...row];
          row = slide(row);
          for (let r = 0; r < rows; r++) {
            board[r][c] = row[r];
          }
          if (!moved && !arraysEqual(originalRow, row)) {
            moved = true;
          }
          updateColumn(c);
        }
        return moved;
      }

      function slideDown() {
        let moved = false;
        for (let c = 0; c < columns; c++) {
          let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
          let originalRow = [...row];
          row.reverse();
          row = slide(row);
          row.reverse();
          for (let r = 0; r < rows; r++) {
            board[r][c] = row[r];
          }
          if (!moved && !arraysEqual(originalRow, row)) {
            moved = true;
          }
          updateColumn(c);
        }
        return moved;
      }

      function arraysEqual(a, b) {
        return a.every((val, index) => val === b[index]);
      }

      function updateRow(r) {
        for (let c = 0; c < columns; c++) {
          updateTile(document.getElementById(r + "-" + c), board[r][c]);
        }
      }

      function updateColumn(c) {
        for (let r = 0; r < rows; r++) {
          updateTile(document.getElementById(r + "-" + c), board[r][c]);
        }
      }

      function setTwo() {
        if (!hasEmptyTile()) return;
        let found = false;
        while (!found) {
          let r = Math.floor(Math.random() * rows);
          let c = Math.floor(Math.random() * columns);
          if (board[r][c] === 0) {
            board[r][c] = 2;
            updateTile(document.getElementById(r + "-" + c), 2);
            found = true;
          }
        }
      }

      function hasEmptyTile() {
        return board.some(row => row.includes(0));
      }

      function checkGameState() {
        if (board.flat().includes(2048)) return "win";
        if (hasEmptyTile()) return "continue";
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < columns; c++) {
            if (c < columns - 1 && board[r][c] === board[r][c + 1]) return "continue";
            if (r < rows - 1 && board[r][c] === board[r + 1][c]) return "continue";
          }
        }
        return "lose";
      }
    function endGame(gameState) {
        document.removeEventListener('keyup', handleInput);
        showNameInputDialog(gameState);
      }

      function showNameInputDialog(gameState) {
        const dialogOverlay = document.createElement('div');
        dialogOverlay.className = 'dialog-overlay show';
        
        const nameInputDialog = document.createElement('div');
        nameInputDialog.className = 'name-input-dialog';
        
        const message = document.createElement('p');
        message.textContent = gameState === "win" ? "Congratulations! You've reached 2048!" : "Game over. No more moves available.";
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Enter your name';
        
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit Score';
        submitButton.addEventListener('click', () => {
          const playerName = nameInput.value.trim();
          if (playerName) {
            updateLeaderboard(playerName, score);
            document.body.removeChild(dialogOverlay);
            showLeaderboardDialog();
          }
        });
        
        nameInputDialog.appendChild(message);
        nameInputDialog.appendChild(nameInput);
        nameInputDialog.appendChild(submitButton);
        dialogOverlay.appendChild(nameInputDialog);
        
        if (currentTheme === 'dark') {
          nameInputDialog.classList.add('dark-theme');
        }
        
        document.body.appendChild(dialogOverlay);
      }
  
      function updateLeaderboard(playerName, playerScore) {
        leaderboard.push({ name: playerName, score: playerScore });
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 3); // Keep only top 3 scores
        saveLeaderboard();
        updateLeaderboardDisplay();
      }
  
      function saveLeaderboard() {
        localStorage.setItem('2048-leaderboard', JSON.stringify(leaderboard));
      }
  
      function loadLeaderboard() {
        const savedLeaderboard = localStorage.getItem('2048-leaderboard');
        if (savedLeaderboard) {
          leaderboard = JSON.parse(savedLeaderboard);
        }
      }
  
      function updateLeaderboardDisplay() {
        const leaderboardList = document.getElementById('leaderboard-list');
        const leaderboardDialogList = document.getElementById('leaderboard-dialog-list');
      
        leaderboardList.innerHTML = '';
        leaderboardDialogList.innerHTML = '';
      
        leaderboard.forEach((entry, index) => {
          const li = document.createElement('li');
          const dialogLi = document.createElement('li');
      
          switch (index) {
            case 0:
              li.innerHTML = `<span style="color: gold; font-weight: bold;">🥇</span> ${entry.name}: ${entry.score}`;
              dialogLi.innerHTML = `<span style="color: gold; font-weight: bold;">🥇 Gold</span> ${entry.name}: ${entry.score}`;
                break;
            case 1:
              li.innerHTML = `<span style="color: silver; font-weight: bold;">🥈</span> ${entry.name}: ${entry.score}`;
              dialogLi.innerHTML = `<span style="color: silver; font-weight: bold;">🥈 Silver</span> ${entry.name}: ${entry.score}`;
              break;
              case 2:
                li.innerHTML = `<span style="color: #cd7f32; font-weight: bold;">🥉</span> ${entry.name}: ${entry.score}`;
                dialogLi.innerHTML = `<span style="color: #cd7f32; font-weight: bold;">🥉 Bronze</span> ${entry.name}: ${entry.score}`;
                break;
              default:
                li.textContent = `${entry.name}: ${entry.score}`;
                dialogLi.textContent = `${entry.name}: ${entry.score}`;
                break;
              }
              
              // Append to leaderboard lists
              leaderboardList.appendChild(li);
              leaderboardDialogList.appendChild(dialogLi);
              });
              }
              
              function showLeaderboardDialog() {
                if (window.innerWidth <= 768) {
                  showMobileLeaderboard();
                } else {
                  const dialogOverlay = document.createElement('div');
                  dialogOverlay.className = 'dialog-overlay show';
                  
                  const dialogBox = document.createElement('div');
                  dialogBox.className = 'dialog-box show';
                  
                  const title = document.createElement('h2');
                  title.textContent = 'Global Leaderboard';
                  
                  const leaderboardList = document.createElement('ol');
                  leaderboard.forEach((entry, index) => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="rank">${index + 1}</span> ${entry.name}: ${entry.score}`;
                    leaderboardList.appendChild(li);
                  });
                  const closeButton = document.createElement('button');
                  closeButton.textContent = 'Close';
                  closeButton.addEventListener('click', () => {
                    document.body.removeChild(dialogOverlay);
                  });
                  
                  dialogBox.appendChild(title);
                  dialogBox.appendChild(leaderboardList);
                  dialogBox.appendChild(closeButton);
                  dialogOverlay.appendChild(dialogBox);
                  
                  if (currentTheme === 'dark') {
                    dialogBox.classList.add('dark-theme');
                  }
                  
                  document.body.appendChild(dialogOverlay);
                }
                
                undoButton.addEventListener('click', handleUndo);
                
                undoButton.addEventListener('touchstart', (e) => {
                  touchStartTime = Date.now();
                });
          
                undoButton.addEventListener('touchend', (e) => {
                  const touchEndTime = Date.now();
                  const touchDuration = touchEndTime - touchStartTime;
                  
                  if (touchDuration < 200) { // Consider it a tap if the touch duration is less than 200ms
                    handleUndo(e);
                  }
                });
              }
              function setupUndoButton() {
                const undoButton = document.getElementById('undo-button');
                let touchStartTime;
                
                function handleUndo(e) {
                  e.preventDefault(); // Prevent default behavior for both click and touch events
                  if (!undoAvailable) return; // Exit early if undo is not available
                  undo();
                }
          
                undoButton.addEventListener('click', handleUndo);
                
                undoButton.addEventListener('touchstart', (e) => {
                  touchStartTime = Date.now();
                });
          
                undoButton.addEventListener('touchend', (e) => {
                  const touchEndTime = Date.now();
                  const touchDuration = touchEndTime - touchStartTime;
                  
                  if (touchDuration < 200) { // Consider it a tap if the touch duration is less than 200ms
                    handleUndo(e);
                  }
                });
              }
          
              function addUndoButtonFeedback() {
                const undoButton = document.getElementById('undo-button');
                
                function addActiveClass() {
                  undoButton.classList.add('active');
                  setTimeout(() => {
                    undoButton.classList.remove('active');
                  }, 200);
                }
          
                undoButton.addEventListener('mousedown', addActiveClass);
                undoButton.addEventListener('touchstart', addActiveClass);
              }
          
              
              function saveBoardState() {
                previousBoard = board.map(row => [...row]);
                previousScore = score;
              }
              
              function undo() {
                if (undoAvailable) {
                  board = previousBoard.map(row => [...row]);
                  score = previousScore;
                  updateAllTiles();
                  updateScore();
                  resetUndo();
                }
              }
              
              function enableUndo() {
                if (!undoAvailable) {
                  undoAvailable = true;
                  document.getElementById('undo-button').disabled = false;
                }
              }
              
              function resetUndo() {
                undoAvailable = false;
                document.getElementById('undo-button').disabled = true;
              }
              
              document.addEventListener('DOMContentLoaded', () => {
                const newGameButton = document.getElementById("new-game");
                if (newGameButton) {
                  newGameButton.addEventListener("click", () => {
                    setGame();
                    document.addEventListener('keyup', handleInput);
                  });
                }
              });
              