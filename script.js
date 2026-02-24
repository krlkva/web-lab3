let gameBoard = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
];
let prevGameBoard = [];
let leaderboardList = [];
let gameScore = 0;
let prevGameScore = 0;
let tileFont = 2.25;
let tileFontRate = 0.125;
let maxTileValue = 2048;
let userName = 'user';
let gameIsFinished = false;
let isBoardPaused = false;
let baseSpeed = 100;
let animationSpeed = 100;

const markers = [0.25, 0.5, 0.75, 1, 2, 3, 5, 10];

// ===== DOM ЭЛЕМЕНТЫ =====
const mainContainer = document.getElementById('main-container');
const settings = mainContainer.querySelector('.settings');
const scores = mainContainer.querySelector('.scores');
const [elemScore, elemBest] = scores.querySelectorAll('.scores__value');
const board = mainContainer.querySelector('.gameboard');
const controls = mainContainer.querySelector('.controls');
const controlsBtns = controls.querySelectorAll('.controls__arrow');
const speedControlWrapper = mainContainer.querySelector('.speed-wrapper');
const speedControl = speedControlWrapper.querySelector('.speed-control');
const speedControlSlider = speedControl.querySelector('.speed-control__slider');
const speedControlInput = speedControlSlider.querySelector('input');
const speedControlValue = document.getElementById('speed-control');
const leaderboardWrapper = mainContainer.querySelector('.leaderboard-wrapper');
const leaderboardListElement = leaderboardWrapper.querySelector('.leaderboard__list');
const victoryWrapper = mainContainer.querySelector('.victory-wrapper');
const victoryScreen = mainContainer.querySelector('.victory');
const victoryScore = victoryScreen.querySelector('h3');
const victoryRecord = victoryScreen.querySelector('.victory__title-record');
const victoryBest = victoryScreen.querySelector('.victory__title-best');
const victorySave = victoryScreen.querySelector('.victory__title-save');
const victoryGif = victoryScreen.querySelector('.victory__gif');
const victoryForm = victoryScreen.querySelector('form');
const victorySaveConfirm = victoryScreen.querySelector('.victory__title-confirm');
const victorySubmitName = victoryScreen.querySelector('#player-name');
const victorySubmitBtn = victoryScreen.querySelector('.save-btn');
const victoryReset = victoryScreen.querySelector('#restart-game');
const undo = document.getElementById('undo-move');
const reset = document.getElementById('new-game');
const leaderboardBtn = document.getElementById('show-leaders');
const speedControlBtn = document.getElementById('speed-control');

// ===== СОЗДАНИЕ ПОЛЯ =====
function createGameBoard() {
    board.innerHTML = '';
    
    for (let i = 0; i < 16; i++) {
        let wrapper = document.createElement('div');
        wrapper.classList.add('gameboard__tile-wrapper');
        
        let tile = document.createElement('div');
        tile.classList.add('gameboard__tile');
        tile.setAttribute('data-value', '0');
        
        wrapper.appendChild(tile);
        board.appendChild(wrapper);
    }
}

createGameBoard();
const visualTiles = board.querySelectorAll('.gameboard__tile');

// ===== ФУНКЦИИ =====
function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match) => map[match]);
}

function updateScore(newAmount) {
    gameScore = Math.max(0, gameScore + newAmount);
    elemScore.textContent = gameScore;
    localStorage.setItem('game-score', JSON.stringify(gameScore));
    updateBestScore();
}

function updateBestScore() {
    if (leaderboardList.length > 0) {
        let bestScore = [...leaderboardList].sort(compareScore)[0].score;
        elemBest.textContent = gameScore > bestScore ? gameScore : bestScore;
    } else {
        elemBest.textContent = gameScore;
    }
}

function updateBoardMove(direction) {
    if (isBoardPaused || gameIsFinished) return;
    
    isBoardPaused = true;
    if (speedControlInput) speedControlInput.disabled = true;
    
    let movedTiles = collectMovedTiles(direction);
    if (movedTiles.length === 0) {
        isBoardPaused = false;
        if (speedControlInput) speedControlInput.disabled = false;
        return;
    }
    
    updateBoardSnap(movedTiles);
}

// ===== АНИМАЦИЯ ДВИЖЕНИЯ =====
async function animateMovement(moves) {
    if (moves.length === 0) return;
    
    return new Promise(resolve => {
        let flyingTiles = [];
        
        for (let move of moves) {
            let fromRow = move[0][0];
            let fromCol = move[0][1];
            let toRow = move[1][0];
            let toCol = move[1][1];
            
            let fromIndex = fromRow * 4 + fromCol;
            let toIndex = toRow * 4 + toCol;
            
            let originalTile = visualTiles[fromIndex];
            let value = gameBoard[fromRow][fromCol];
            
            if (value === 0) continue;
            
            let flyingTile = document.createElement('div');
            flyingTile.className = 'flying-tile';
            flyingTile.textContent = value;
            flyingTile.setAttribute('data-value', value);
            
            let fromTileRect = originalTile.getBoundingClientRect();
            let toTileRect = visualTiles[toIndex].getBoundingClientRect();
            
            flyingTile.style.position = 'fixed';
            flyingTile.style.width = fromTileRect.width + 'px';
            flyingTile.style.height = fromTileRect.height + 'px';
            flyingTile.style.left = fromTileRect.left + 'px';
            flyingTile.style.top = fromTileRect.top + 'px';
            flyingTile.style.zIndex = '1000';
            flyingTile.style.transition = `all ${animationSpeed}ms ease-in-out`;
            flyingTile.style.pointerEvents = 'none';
            flyingTile.style.display = 'flex';
            flyingTile.style.alignItems = 'center';
            flyingTile.style.justifyContent = 'center';
            flyingTile.style.fontSize = window.getComputedStyle(originalTile).fontSize;
            flyingTile.style.fontWeight = 'bold';
            
            document.body.appendChild(flyingTile);
            
            flyingTiles.push({
                element: flyingTile,
                toRect: toTileRect
            });
        }
        
        requestAnimationFrame(() => {
            flyingTiles.forEach(tile => {
                tile.element.style.left = tile.toRect.left + 'px';
                tile.element.style.top = tile.toRect.top + 'px';
            });
        });
        
        setTimeout(() => {
            flyingTiles.forEach(tile => tile.element.remove());
            resolve();
        }, animationSpeed);
    });
}

function animateTile(type, tile) {
    switch (type) {
        case 'appeared':
            tile.animate(
                [
                    { transform: 'scale(0)', opacity: 0 },
                    { transform: 'scale(1)', opacity: 1 }
                ],
                { duration: animationSpeed, iterations: 1 }
            );
            break;
            
        case 'combined':
            tile.animate(
                [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.2)' },
                    { transform: 'scale(1)' }
                ],
                { duration: animationSpeed, iterations: 1 }
            );
            break;
    }
}

async function updateBoardSnap(movedTiles) {
    prevGameBoard = JSON.parse(JSON.stringify(gameBoard));
    prevGameScore = gameScore;
    
    await animateMovement(movedTiles);
    
    for (let tile of movedTiles) {
        let oldTile = gameBoard[tile[0][0]][tile[0][1]];
        let newTile = gameBoard[tile[1][0]][tile[1][1]];
        
        if (oldTile != newTile) {
            gameBoard[tile[0][0]][tile[0][1]] = 0;
            gameBoard[tile[1][0]][tile[1][1]] = oldTile;
        } else {
            gameBoard[tile[0][0]][tile[0][1]] = 0;
            gameBoard[tile[1][0]][tile[1][1]] = oldTile * 2;
            updateScore(oldTile * 2);
            
            let visualTile = visualTiles[tile[1][0] * 4 + tile[1][1]];
            animateTile('combined', visualTile);
            visualTile.classList.add('active-tile-combined');
        }
    }
    
    updateBoardVisual();
    updateBoardAdd();
}

function updateBoardAdd() {
    addNewRandomTile();
    if (speedControlInput) speedControlInput.disabled = false;
    
    setTimeout(() => {
        updateBoardVisual();
        
        // Проверяем, закончилась ли игра после добавления новой плитки
        if (!gameIsFinished) {
            checkGameOver();
        }
        
        if (!gameIsFinished) {
            isBoardPaused = false;
        }
    }, animationSpeed);
}

// Новая функция для проверки окончания игры
function checkGameOver() {
    if (getFreeTiles().length === 0 && !areMovesAvailable()) {
        finishGame();
        return true;
    }
    return false;
}

function undoMove() {
    if (prevGameBoard.length === 0 || gameIsFinished || isBoardPaused) return;
    
    gameBoard = JSON.parse(JSON.stringify(prevGameBoard));
    gameScore = prevGameScore;
    updateBoardVisual();
    elemScore.textContent = gameScore;
    updateBestScore();
    prevGameBoard = [];
    prevGameScore = 0;
    
    if (speedControlInput) speedControlInput.disabled = false;
}

function collectMovedTiles(direction) {
    direction = direction.toLowerCase();
    switch (direction) {
        case 'up': return moveBoardUp();
        case 'down': return moveBoardDown();
        case 'left': return moveBoardLeft();
        case 'right': return moveBoardRight();
        default: return [];
    }
}

function moveTileList(tiles) {
    let movedTiles = [];
    let gameBoardWidth = document.querySelector('.gameboard').offsetWidth;
    let tileWidth = document.querySelector('.gameboard__tile').offsetWidth;
    let ratio = (gameBoardWidth / tileWidth - 4) / 10;
    
    for (let k = 0; k < 4; k++) {
        if (tiles[k] === 0) {
            for (let l = k + 1; l < 4; l++) {
                if (tiles[l] !== 0) {
                    tiles[k] = tiles[l];
                    tiles[l] = 0;
                    movedTiles.push([l, k, (l - k + (ratio * 2 * (l - k)))]);
                    break;
                }
            }
        }

        if (tiles[k] !== 0) {
            for (let l = k + 1; l < 4; l++) {
                if (tiles[l] === 0) continue;
                if (tiles[l] === tiles[k]) {
                    tiles[k] = tiles[l] * 2;
                    tiles[l] = 0;
                    movedTiles.push([l, k, (l - k + (ratio * 2 * (l - k)))]);
                }
                break;
            }
        }
    }
    
    return movedTiles;
}

function moveBoardUp() {
    let movedTiles = [];
    for (let j = 0; j < 4; j++) {
        let column = [];
        for (let k = 0; k < 4; k++) column.push(gameBoard[k][j]);
        let movedColumnTiles = moveTileList(column);
        
        for (let k = 0; k < movedColumnTiles.length; k++) {
            movedTiles.push([
                [movedColumnTiles[k][0], j],
                [movedColumnTiles[k][1], j],
                '0%, ' + (-movedColumnTiles[k][2]) * 100 + '%'
            ]);
        }
    }
    return movedTiles;
}

function moveBoardDown() {
    let movedTiles = [];
    for (let j = 0; j < 4; j++) {
        let column = [];
        for (let k = 3; k >= 0; k--) column.push(gameBoard[k][j]);
        let movedColumnTiles = moveTileList(column);
        
        for (let k = 0; k < movedColumnTiles.length; k++) {
            movedTiles.push([
                [3 - movedColumnTiles[k][0], j],
                [3 - movedColumnTiles[k][1], j],
                '0%, ' + (movedColumnTiles[k][2]) * 100 + '%'
            ]);
        }
    }
    return movedTiles;
}

function moveBoardLeft() {
    let movedTiles = [];
    for (let i = 0; i < 4; i++) {
        let row = [];
        for (let k = 0; k < 4; k++) row.push(gameBoard[i][k]);
        let movedRowTiles = moveTileList(row);
        
        for (let k = 0; k < movedRowTiles.length; k++) {
            movedTiles.push([
                [i, movedRowTiles[k][0]],
                [i, movedRowTiles[k][1]],
                (-movedRowTiles[k][2]) * 100 + '%, 0%'
            ]);
        }
    }
    return movedTiles;
}

function moveBoardRight() {
    let movedTiles = [];
    for (let i = 0; i < 4; i++) {
        let row = [];
        for (let k = 3; k >= 0; k--) row.push(gameBoard[i][k]);
        let movedRowTiles = moveTileList(row);
        
        for (let k = 0; k < movedRowTiles.length; k++) {
            movedTiles.push([
                [i, 3 - movedRowTiles[k][0]],
                [i, 3 - movedRowTiles[k][1]],
                (movedRowTiles[k][2]) * 100 + '%, 0%'
            ]);
        }
    }
    return movedTiles;
}

function areMovesAvailable() {
    // Проверяем, есть ли возможные ходы
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (gameBoard[i][j] === 0) continue;
            
            // Проверяем соседние клетки
            if (j < 3 && gameBoard[i][j] === gameBoard[i][j + 1]) return true;
            if (i < 3 && gameBoard[i][j] === gameBoard[i + 1][j]) return true;
        }
    }
    return false;
}

function getRandomInteger(max) {
    return Math.floor(Math.random() * max);
}

function addNewRandomTile() {
    let freeTiles = getFreeTiles();
    if (freeTiles.length === 0) {
        return false;
    }
    
    let randomIndex = getRandomInteger(freeTiles.length);
    let [row, col] = freeTiles[randomIndex];
    let tileValue = Math.random() < 0.9 ? 2 : 4;
    
    gameBoard[row][col] = tileValue;
    
    let tileIndex = row * 4 + col;
    if (tileIndex < visualTiles.length) {
        animateTile('appeared', visualTiles[tileIndex]);
    }
    
    return true;
}

function getFreeTiles() {
    let freeTiles = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (gameBoard[i][j] === 0) {
                freeTiles.push([i, j]);
            }
        }
    }
    return freeTiles;
}

function finishGame() {
    console.log('Game finished!');
    
    // Скрываем все элементы victory screen сначала
    victoryGif.style.display = 'none';
    victoryBest.style.display = 'none';
    victoryRecord.style.display = 'none';
    victorySave.style.display = 'none';
    victorySaveConfirm.style.display = 'none';
    victoryForm.style.display = 'none';
    
    isBoardPaused = true;
    gameIsFinished = true;
    
    if (gameScore == null) gameScore = 0;
    victoryScore.textContent = 'You scored ' + gameScore + ' points.';
    
    // Проверяем, является ли результат рекордным
    if (isNewRecord(gameScore)) {
        victoryForm.style.display = 'flex';
        victorySave.style.display = 'block';
        
        // Проверяем абсолютный рекорд
        if (leaderboardList.length === 0 || gameScore > [...leaderboardList].sort(compareScore)[0].score) {
            victoryGif.style.display = 'block';
            victoryBest.style.display = 'block';
            victoryBest.textContent = 'Absolute record!';
        } else {
            victoryRecord.style.display = 'block';
        }
    }
    
    victorySubmitName.value = userName;
    victoryWrapper.classList.remove('hidden');
    document.body.classList.add('stop-scrolling');
    
    // Очищаем сохранения
    localStorage.removeItem('game-board');
    localStorage.removeItem('game-score');
}

function startNewGame() {
    console.log('Starting new game');
    gameIsFinished = false;
    isBoardPaused = false;
    victoryWrapper.classList.add('hidden');
    document.body.classList.remove('stop-scrolling');
    
    gameBoard = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    
    prevGameBoard = [];
    prevGameScore = 0;
    gameScore = 0;
    
    updateScore(0);
    
    // Добавляем 2 стартовые плитки
    for (let i = 0; i < 2; i++) {
        addNewRandomTile();
    }
    
    updateBoardVisual();
}

function resetActiveTiles() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            visualTiles[i * 4 + j].classList.remove('active-tile-combined');
        }
    }
}

function updateBoardVisual() {
    // Обновляем состояние кнопки отмены
    if (undo) {
        if (prevGameBoard.length === 0) {
            undo.disabled = true;
        } else {
            undo.disabled = false;
        }
    }
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let index = i * 4 + j;
            if (index >= visualTiles.length) continue;
            
            let tile = visualTiles[index];
            let value = gameBoard[i][j];
            
            tile.setAttribute('data-value', value);
            
            if (value !== 0) {
                tile.textContent = value;
                tile.classList.add('active-tile');
            } else {
                tile.textContent = '';
                tile.classList.remove('active-tile');
            }
            
            let tileVisual = Math.max(1, tileFont - tileFontRate * value.toString().length);
            tile.style.fontSize = tileVisual + 'rem';
        }
    }
    
    if (!gameIsFinished) {
        localStorage.setItem('game-board', JSON.stringify(gameBoard));
    }
}

function compareScore(a, b) {
    return b.score - a.score;
}

function isNewRecord(newScore) {
    if (leaderboardList.length < 10) return true;
    leaderboardList.sort(compareScore);
    return leaderboardList[leaderboardList.length - 1].score < newScore;
}

function addToLeaderboard(newName, newScore, newDate) {
    if (!isNewRecord(newScore)) return;
    
    if (leaderboardList.length >= 10) {
        leaderboardList.sort(compareScore);
        leaderboardList.pop();
    }
    
    leaderboardList.push({
        name: sanitize(newName) || 'user',
        date: newDate,
        score: newScore
    });
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboardList));
    populateLeaderboard();
}

function populateLeaderboard() {
    if (!leaderboardListElement) return;
    
    leaderboardListElement.innerHTML = '';
    leaderboardList.sort(compareScore);
    
    for (let entry of leaderboardList) {
        let li = document.createElement('li');
        li.innerHTML = `<span>${entry.name}</span> <span>${entry.score}</span> <span>${entry.date}</span>`;
        leaderboardListElement.appendChild(li);
    }
    
    for (let i = leaderboardList.length; i < 10; i++) {
        let li = document.createElement('li');
        li.innerHTML = `<span>...</span> <span>0</span> <span>YYYY-MM-DD</span>`;
        leaderboardListElement.appendChild(li);
    }
}

function disableAllButtons(exception) {
    let buttons = document.querySelectorAll('button');
    let exceptions = exception ? exception.querySelectorAll('button') : [];
    
    for (let btn of buttons) {
        if (![...exceptions].includes(btn)) {
            btn.tabIndex = '-1';
        }
    }
}

function enableAllButtons() {
    let buttons = document.querySelectorAll('button');
    for (let btn of buttons) btn.tabIndex = '0';
}

function openLeaderboard() {
    disableAllButtons(leaderboardWrapper);
    leaderboardWrapper.classList.remove('hidden');
    document.body.classList.add('stop-scrolling');
}

function closeLeaderboard() {
    enableAllButtons();
    leaderboardWrapper.classList.add('hidden');
    document.body.classList.remove('stop-scrolling');
}

function openSpeedControl() {
    disableAllButtons(speedControlWrapper);
    speedControlWrapper.classList.remove('hidden');
    document.body.classList.add('stop-scrolling');
}

function closeSpeedControl() {
    enableAllButtons();
    speedControlWrapper.classList.add('hidden');
    document.body.classList.remove('stop-scrolling');
    isBoardPaused = false;
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
if (undo) {
    undo.addEventListener('click', undoMove);
}

if (reset) {
    reset.addEventListener('click', () => {
        if (confirm('Are you absolutely sure you want to start a new game?') === true) {
            startNewGame();
        }
    });
}

if (speedControlBtn) {
    speedControlBtn.addEventListener('click', openSpeedControl);
}

if (speedControlInput) {
    speedControlInput.addEventListener('change', (event) => {
        animationSpeed = baseSpeed * (1 / markers[event.target.value]);
        localStorage.setItem('game-speed', animationSpeed);
        speedControlBtn.textContent = 'x' + markers[event.target.value];
    });
}

if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', openLeaderboard);
}

for (let btn of controlsBtns) {
    btn.addEventListener('click', () => updateBoardMove(btn.dataset.direction));
}

document.addEventListener('keydown', (e) => {
    if (e.key.startsWith('Arrow') && !gameIsFinished && !isBoardPaused && 
        victoryWrapper.classList.contains('hidden') && 
        leaderboardWrapper.classList.contains('hidden') && 
        speedControlWrapper.classList.contains('hidden')) {
        e.preventDefault();
        updateBoardMove(e.key.slice(5));
    }
});

// Закрытие модалок
if (speedControlWrapper) {
    let closeBtn = speedControlWrapper.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSpeedControl);
    }
    
    speedControlWrapper.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup')) {
            closeSpeedControl();
        }
    });
}

if (leaderboardWrapper) {
    let closeBtn = leaderboardWrapper.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLeaderboard);
    }
    
    leaderboardWrapper.addEventListener('click', (e) => {
        if (e.target.classList.contains('popup')) closeLeaderboard();
    });
}

if (victoryForm) {
    victoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addToLeaderboard(victorySubmitName.value, gameScore, new Date().toISOString().slice(0, 10));
        victoryForm.style.display = 'none';
        victorySave.style.display = 'none';
        victoryRecord.style.display = 'none';
        victoryGif.style.display = 'none';
        victoryBest.style.display = 'none';
        victorySaveConfirm.style.display = 'block';
        userName = sanitize(victorySubmitName.value);
        localStorage.setItem('user-name', userName);
    });
}

if (victoryReset) {
    victoryReset.addEventListener('click', () => {
        victoryWrapper.classList.add('hidden');
        startNewGame();
    });
}

if (victoryScreen) {
    let closeBtn = victoryScreen.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            victoryWrapper.classList.add('hidden');
            document.body.classList.remove('stop-scrolling');
            enableAllButtons();
        });
    }
}

// ===== ЗАГРУЗКА СОХРАНЕНИЙ =====
if (localStorage.getItem('leaderboard')) {
    leaderboardList = JSON.parse(localStorage.getItem('leaderboard'));
    updateBestScore();
}

if (localStorage.getItem('game-speed')) {
    animationSpeed = JSON.parse(localStorage.getItem('game-speed'));
    let speed = Math.round(baseSpeed * 100 / animationSpeed) / 100;
    let ind = markers.indexOf(Number(speed));
    if (ind >= 0 && speedControlInput) {
        speedControlInput.value = ind;
        speedControlBtn.textContent = 'x' + markers[ind];
    }
}

if (localStorage.getItem('user-name')) {
    userName = localStorage.getItem('user-name');
}

populateLeaderboard();

// Адаптация шрифта
let x = window.matchMedia('(max-width: 512px)');
x.addEventListener('change', () => {
    if (x.matches) {
        tileFont = 2;
        tileFontRate = 0.25;
    } else {
        tileFont = 2.25;
        tileFontRate = 0.125;
    }
    updateBoardVisual();
});

if (x.matches) {
    tileFont = 2;
    tileFontRate = 0.25;
} else {
    tileFont = 2.25;
    tileFontRate = 0.125;
}

// ===== ЗАПУСК ИГРЫ =====
setTimeout(() => {
    startNewGame();
}, 100);
