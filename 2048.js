let board;
let score = 0;
let rows = 4;
let columns = 4;
let currentTheme = 'light';

window.onload = function() {
    setGame();
    setupThemeSystem();
    setupSwipeControls();
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
            processMove(deltaX > 0 ? "ArrowRight" : "ArrowLeft");
        } else {
            processMove(deltaY > 0 ? "ArrowDown" : "ArrowUp");
        }
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
    showDialog(gameState);
}

function showDialog(gameState) {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    const dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box';    
    const message = document.createElement('p');
    message.textContent = gameState === "win" ? "Congratulations! You've reached 2048!" : "Game over. No more moves available.";
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(dialogOverlay);
    });
    
    const newGameButton = document.createElement('button');
    newGameButton.textContent = 'New Game';
    newGameButton.addEventListener('click', () => {
        document.body.removeChild(dialogOverlay);
        setGame();
        document.addEventListener('keyup', handleInput);
    });
    
    dialogBox.appendChild(message);
    dialogBox.appendChild(closeButton);
    dialogBox.appendChild(newGameButton);
    dialogOverlay.appendChild(dialogBox);
    if (currentTheme === 'dark') {
        dialogBox.classList.add('dark-theme');
    } else {
        dialogBox.classList.add('light-theme');
    }
    
    document.body.appendChild(dialogOverlay);
    setTimeout(() => {
        dialogBox.style.opacity = '1';
        dialogBox.style.transform = 'scale(1)';
    }, 10);
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