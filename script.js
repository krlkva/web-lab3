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
