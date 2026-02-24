let gameBoard = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
];
let gameScore = 0;

const mainContainer = document.getElementById('main-container');
const scores = mainContainer.querySelector('.scores');
const [elemScore, elemBest] = scores.querySelectorAll('.scores__value');
const board = mainContainer.querySelector('.gameboard');

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

function updateScore(newAmount) {
    gameScore = Math.max(0, gameScore + newAmount);
    elemScore.textContent = gameScore;
}

function getRandomInteger(max) {
    return Math.floor(Math.random() * max);
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

function addNewRandomTile() {
    let freeTiles = getFreeTiles();
    if (freeTiles.length === 0) return false;
    
    let randomIndex = getRandomInteger(freeTiles.length);
    let [row, col] = freeTiles[randomIndex];
    let tileValue = Math.random() < 0.9 ? 2 : 4;
    
    gameBoard[row][col] = tileValue;
    return true;
}

function updateBoardVisual() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let index = i * 4 + j;
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
        }
    }
}

// Добавляем переменные для отмены
let prevGameBoard = [];
let prevGameScore = 0;
const undo = document.getElementById('undo-move');

function updateBoardMove(direction) {
    if (isBoardPaused || gameIsFinished) return;
    
    prevGameBoard = JSON.parse(JSON.stringify(gameBoard));
    prevGameScore = gameScore;
    
    let movedTiles = collectMovedTiles(direction);
    if (movedTiles.length === 0) return;
    
    // Обновляем поле
    for (let tile of movedTiles) {
        let oldTile = gameBoard[tile[0][0]][tile[0][1]];
        let newTile = gameBoard[tile[1][0]][tile[1][1]];
        
        if (oldTile != newTile) {
            gameBoard[tile[0][0]][tile[0][1]] = 0;
            gameBoard[tile[1][0]][tile[1][1]] = oldTile;
        } else {
            gameBoard[tile[0][0]][tile[0][1]] = 0;
            gameBoard[tile[1][0]][tile[1][1]] = oldTile * 2;
        }
    }
    
    updateBoardVisual();
    addNewRandomTile();
    updateBoardVisual();
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

function undoMove() {
    if (prevGameBoard.length === 0) return;
    
    gameBoard = JSON.parse(JSON.stringify(prevGameBoard));
    gameScore = prevGameScore;
    updateBoardVisual();
    elemScore.textContent = gameScore;
    prevGameBoard = [];
}

undo.addEventListener('click', undoMove);

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

function startNewGame() {
    gameBoard = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    gameScore = 0;
    updateScore(0);
    
    for (let i = 0; i < 2; i++) {
        addNewRandomTile();
    }
    
    updateBoardVisual();
}

setTimeout(() => {
    startNewGame();
}, 100);
