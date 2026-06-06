import { testDictionary, realDictionary } from './dictionary.js';

const dictionary = realDictionary;

const secretWord = dictionary[Math.floor(Math.random() * dictionary.length)].toLowerCase();
const wordLength = secretWord.length;

const state = {
  secret: secretWord,
  grid: Array(5)
    .fill()
    .map(() => Array(wordLength).fill('')),
  currentRow: 0,
  currentCol: 0,
};

const keyStates = {};

let gameOver = false;

function drawGrid(container) {
  const grid = document.createElement('div');
  grid.className = 'grid';

  grid.style.setProperty('--word-length', wordLength);

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < wordLength; j++) {
      drawBox(grid, i, j);
    }
  }

  container.appendChild(grid);
}

function updateGrid() {
  for (let i = 0; i < state.grid.length; i++) {
    for (let j = 0; j < state.grid[i].length; j++) {
      const box = document.getElementById(`box${i}${j}`);
      if (box) {
        box.textContent = state.grid[i][j] ? state.grid[i][j] : '';
      }
    }
  }
}

function drawBox(container, row, col, letter = '') {
  const box = document.createElement('div');
  box.className = 'box';
  box.textContent = letter;
  box.id = `box${row}${col}`;

  container.appendChild(box);
  return box;
}

function drawKeyboard() {
  const keyboardContainer = document.getElementById('keyboard');
  keyboardContainer.innerHTML = ''; 
  keyboardContainer.className = 'keyboard-container';

  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
  ];

  rows.forEach(row => {
    const rowElement = document.createElement('div');
    rowElement.className = 'keyboard-row';

    row.forEach(key => {
      const button = document.createElement('button');
      button.className = 'keyboard-button';
      button.textContent = key === 'Backspace' ? '←' : key;
      button.id = `key-${key.toLowerCase()}`;

      if (key === 'Enter' || key === 'Backspace') {
        button.classList.add('wide-button');
      }

      const keyLower = key.toLowerCase();
      if (keyStates[keyLower]) {
        button.classList.add(`key-${keyStates[keyLower]}`);
      }

      button.onclick = () => {
        handleInput(key);
      };

      rowElement.appendChild(button);
    });

    keyboardContainer.appendChild(rowElement);
  });
}

function handleInput(key) {
  if (gameOver) return;

  if (key === 'Enter') {
    if (state.currentCol === wordLength) {
      const word = getCurrentWord();
      if (isWordValid(word)) {
        revealWord(word);
        state.currentRow++;
        state.currentCol = 0;
      } else {
        showMessage('No existe ese piloto');

        for (let i = 0; i < wordLength; i++) {
          const box = document.getElementById(`box${state.currentRow}${i}`);
          if (box) {
            box.classList.add('shake');
            
            // Removemos la clase cuando termine la animación (250ms) 
            // para que pueda volver a sacudirse el próximo intento
            setTimeout(() => {
              box.classList.remove('shake');
            }, 250);
          }
        }
      }
    }
  } else if (key === 'Backspace') {
    removeLetter();
  } else if (isLetter(key)) {
    addLetter(key);
  }

  updateGrid();
}

function registerKeyboardEvents() {
  document.body.onkeydown = (e) => {
    handleInput(e.key);
  };
}

function getCurrentWord() {
  return state.grid[state.currentRow].reduce((prev, curr) => prev + curr).toLowerCase();
}

function isWordValid(word) {
  return dictionary.map(w => w.toLowerCase()).includes(word.toLowerCase());
}

function getNumOfOccurrencesInWord(word, letter) {
  let result = 0;
  for (let i = 0; i < word.length; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

function getPositionOfOccurrence(word, letter, position) {
  let result = 0;
  for (let i = 0; i <= position; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

function updateKeyStatus(letter, status) {
  const currentStatus = keyStates[letter];
  if (currentStatus === 'right') return;
  if (currentStatus === 'wrong' && status === 'empty') return;

  keyStates[letter] = status;
}

function revealWord(guess) {
  const row = state.currentRow;
  const animation_duration = 500;

  const isWinner = state.secret === guess;
  const isGameOver = (row === 4) && !isWinner;

  for (let i = 0; i < wordLength; i++) {
    const box = document.getElementById(`box${row}${i}`);
    
    const letter = state.grid[row][i].toLowerCase(); 
    
    const numOfOccurrencesSecret = getNumOfOccurrencesInWord(state.secret, letter);
    const numOfOccurrencesGuess = getNumOfOccurrencesInWord(guess, letter);
    const letterPosition = getPositionOfOccurrence(guess, letter, i);

    setTimeout(() => {
      if (
        numOfOccurrencesGuess > numOfOccurrencesSecret &&
        letterPosition > numOfOccurrencesSecret
      ) {
        box.classList.add('empty');
        updateKeyStatus(letter, 'empty');
      } else {
        if (letter === state.secret[i]) {
          box.classList.add('right');
          updateKeyStatus(letter, 'right');
        } else if (state.secret.includes(letter)) {
          box.classList.add('wrong');
          updateKeyStatus(letter, 'wrong');
        } else {
          box.classList.add('empty');
          updateKeyStatus(letter, 'empty');
        }
      }
      
      if (i === wordLength - 1) {
        drawKeyboard();

        setTimeout(() => {
          if (isWinner) {
            gameOver = true;
            showMessage('¡Ganaste! Adivinaste el piloto', true);
          } else if (isGameOver) {
            gameOver = true;  
            showMessage(`¡Perdiste! El piloto era: ${state.secret.toUpperCase()}`);
          }
        }, 100);
      }
      
    }, ((i + 1) * animation_duration) / 3);

    box.classList.add('animated');
    box.style.animationDelay = `${(i * animation_duration) / 3}ms`;
  }
}

function showMessage(message, isSuccess = false) {
  const messageElement = document.getElementById('game-message');
  messageElement.textContent = message;
  
  if (isSuccess) {
    messageElement.classList.add('success');
  } else {
    messageElement.classList.remove('success');
  }
  
if (gameOver) return;

  setTimeout(() => {
    if (!gameOver) {
    messageElement.textContent = '';
    }
  }, 2000);
}

function isLetter(key) {
  return key.length === 1 && key.match(/[a-zñ]/i);
}

function addLetter(letter) {
  if (state.currentCol === wordLength) return;
  state.grid[state.currentRow][state.currentCol] = letter;
  state.currentCol++;
}

function removeLetter() {
  if (state.currentCol === 0) return;
  state.grid[state.currentRow][state.currentCol - 1] = '';
  state.currentCol--;
}

function startup() {
  const game = document.getElementById('game');
  drawGrid(game);
  drawKeyboard();
  registerKeyboardEvents();
}

startup();
