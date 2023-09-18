
const puzzleContainer = document.getElementById("puzzle-container");
const solveButton = document.getElementById("solve-button");
const startButton = document.getElementById("start-button");
const hintButton = document.getElementById("hint-button");
const hintImage = document.getElementById("hint-image");
const resetButton = document.getElementById("reset-button");

let tiles = [];
let gameStarted = false;

// Initial state
const initialState = [1, 2, 3, 4, 5, 6, 7, 8, ""];
let currentState = [...initialState];
let hintVisible = false; 


resetButton.addEventListener("click", () => {
    window.location.reload(); 
});

hintButton.addEventListener("click", () => {
    hintVisible = !hintVisible; 

    if (hintVisible) {
        hintImage.style.display = "block"; 
    } else {
        hintImage.style.display = "none"; 
    }
});


window.onload = () => {
   
    const image = new Image();
    image.src = "images/full.jpg";
    image.onload = () => {
        
        puzzleContainer.style.backgroundImage = `url('${image.src}')`;
    };
    resetButton.style.display = "none";
};

startButton.addEventListener("click", () => {
    if (!gameStarted) {
       
        createPuzzleBoard();

       
        puzzleContainer.style.display = "grid";


       
        shufflePuzzle();

        document.getElementById("hint-button").style.display = "block";
        document.getElementById("reset-button").style.display = "block";

        gameStarted = true;


    }
    else {
        
        shufflePuzzle();
    }
});

solveButton.addEventListener("click", () => {
    if (gameStarted) {
        solvePuzzle();
    }
});


function createPuzzleBoard() {
    puzzleContainer.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        const img = document.createElement("img");
        img.src = currentState[i] !== "" ? `images/${currentState[i]}.jpg` : "images/black.jpg";
        tile.appendChild(img);
        tile.addEventListener("click", () => moveTile(i));
        puzzleContainer.appendChild(tile);
        tiles.push(tile);
    }
}

function shufflePuzzle() {
    tiles = [];
    do {
        currentState = initialState.slice(); 
        for (let i = currentState.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentState[i], currentState[j]] = [currentState[j], currentState[i]];
        }
    } while (!isSolvable(currentState));
    createPuzzleBoard();
}

function isSolvable(state) {
    let inversionCount = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = i + 1; j < 9; j++) {
            if (state[i] > state[j] && state[i] !== "" && state[j] !== "") {
                inversionCount++;
            }
        }
    }
    return inversionCount % 2 === 0;
}

function canMoveTile(index) {
    const emptyIndex = currentState.indexOf("");
    const rowDiff = Math.abs(Math.floor(index / 3) - Math.floor(emptyIndex / 3));
    const colDiff = Math.abs(index % 3 - emptyIndex % 3);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}


function showCustomAlert(title) {
    Swal.fire({
        title: title,
        icon: 'success',
        timer: 1300, 
        showConfirmButton: false,
        customClass: {
            popup: 'custom-sweetalert' 
        }
    });
}

// Move operation
function moveTile(index) {
    if (canMoveTile(index)) {
        const emptyIndex = currentState.indexOf("");
        currentState[emptyIndex] = currentState[index];
        currentState[index] = "";
        createPuzzleBoard();

        if (JSON.stringify(currentState) === JSON.stringify(initialState)) {
            showCustomAlert('Well Done! Puzzle Solved.');
            setTimeout(() => {
                location.reload(); 
            }, 300); 
            return;
        }
    }
}

function solvePuzzle() {
    const goalState = [1, 2, 3, 4, 5, 6, 7, 8, ""];

    const openList = new PriorityQueue();

    openList.enqueue({
        state: currentState,
        g: 0,
        h: calculateHeuristic(currentState),
        parent: null
    }, 0 + calculateHeuristic(currentState));

    const closedList = new Set();

    while (!openList.isEmpty()) {
        const current = openList.dequeue();

        if (JSON.stringify(current.state) === JSON.stringify(goalState)) {
            reconstructPath(current);
            return;
        }

        closedList.add(JSON.stringify(current.state));

        const neighbors = getNeighbors(current.state);
        for (const neighbor of neighbors) {
            if (!closedList.has(JSON.stringify(neighbor))) {
                openList.enqueue({
                    state: neighbor,
                    g: current.g + 1,
                    h: calculateHeuristic(neighbor),
                    parent: current,
                }, current.g + 1 + calculateHeuristic(neighbor));
            }
        }
    }
}


// Calculate the heuristic value (Manhattan distance)
function calculateHeuristic(state) {
    let h = 0;
    for (let i = 0; i < state.length; i++) {
        if (state[i] !== "") {
            const goalIndex = initialState.indexOf(state[i]);
            const goalRow = Math.floor(goalIndex / 3);
            const goalCol = goalIndex % 3;
            const currentRow = Math.floor(i / 3);
            const currentCol = i % 3;
            h += Math.abs(goalRow - currentRow) + Math.abs(goalCol - currentCol);
        }
    }
    return h;
}

function getNeighbors(state) {
    const neighbors = [];
    const emptyIndex = state.indexOf("");
    const row = Math.floor(emptyIndex / 3);
    const col = emptyIndex % 3;

    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 },  // Right
    ];

    for (const dir of directions) {
        const newRow = row + dir.dy;
        const newCol = col + dir.dx;
        if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
            const neighborState = [...state];
            const newIndex = newRow * 3 + newCol;
            neighborState[emptyIndex] = state[newIndex];
            neighborState[newIndex] = "";
            neighbors.push(neighborState);
        }
    }

    return neighbors;
}

// Reconstruct and display the path to the solution

function reconstructPath(node) {
    const path = [];
    while (node !== null) {
        path.unshift(node.state);
        node = node.parent;
    }
    animateSolution(path);
}

// Helper function to animate the solution
function animateSolution(path) {
    let i = 0;
    const interval = setInterval(() => {
        if (i < path.length) {
            currentState = path[i];
            createPuzzleBoard();
            i++;
        } else {
            clearInterval(interval);
            showCustomAlert('Puzzle Solved!');
            setTimeout(() => {
                location.reload();
            }, 300);
        }
    }, 800);
}

shuffleButton.addEventListener("click", () => {
    

});

createPuzzleBoard();

