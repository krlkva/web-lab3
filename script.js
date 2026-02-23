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
