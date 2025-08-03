class Match3Game {
    constructor() {
        this.boardSize = 8;
        this.candyTypes = 6;
        this.board = [];
        this.score = 0;
        this.moves = 30;
        this.selectedCandy = null;
        this.gameOver = false;
        this.isProcessing = false;
        
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreElement = document.getElementById('score');
        this.movesElement = document.getElementById('moves');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.initializeEventListeners();
        this.initializeGame();
    }
    
    initializeEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.initializeGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }
    
    initializeGame() {
        this.score = 0;
        this.moves = 30;
        this.gameOver = false;
        this.selectedCandy = null;
        this.isProcessing = false;
        this.updateUI();
        this.hideGameOverModal();
        this.createBoard();
        this.renderBoard();
        
        // Remove initial matches and fill gaps
        while (this.findMatches().length > 0) {
            this.removeMatches();
            this.applyGravity();
            this.fillEmptySpaces();
        }
        this.renderBoard();
    }
    
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                let candyType;
                do {
                    candyType = Math.floor(Math.random() * this.candyTypes);
                } while (this.wouldCreateMatch(row, col, candyType));
                
                this.board[row][col] = candyType;
            }
        }
    }
    
    wouldCreateMatch(row, col, candyType) {
        // Check horizontal match
        let horizontalCount = 1;
        // Check left
        for (let c = col - 1; c >= 0 && this.board[row][c] === candyType; c--) {
            horizontalCount++;
        }
        // Check right
        for (let c = col + 1; c < this.boardSize && this.board[row] && this.board[row][c] === candyType; c++) {
            horizontalCount++;
        }
        
        // Check vertical match
        let verticalCount = 1;
        // Check up
        for (let r = row - 1; r >= 0 && this.board[r][col] === candyType; r--) {
            verticalCount++;
        }
        // Check down
        for (let r = row + 1; r < this.boardSize && this.board[r] && this.board[r][col] === candyType; r++) {
            verticalCount++;
        }
        
        return horizontalCount >= 3 || verticalCount >= 3;
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const candyElement = document.createElement('div');
                candyElement.className = `candy type-${this.board[row][col]}`;
                candyElement.dataset.row = row;
                candyElement.dataset.col = col;
                candyElement.addEventListener('click', (e) => this.handleCandyClick(e));
                this.gameBoard.appendChild(candyElement);
            }
        }
    }
    
    handleCandyClick(event) {
        if (this.gameOver || this.isProcessing) return;
        
        const clickedCandy = event.target;
        const row = parseInt(clickedCandy.dataset.row);
        const col = parseInt(clickedCandy.dataset.col);
        
        if (!this.selectedCandy) {
            // First candy selection
            this.selectedCandy = { row, col, element: clickedCandy };
            clickedCandy.classList.add('selected');
        } else {
            // Second candy selection
            const selectedRow = this.selectedCandy.row;
            const selectedCol = this.selectedCandy.col;
            
            // Remove selection highlight
            this.selectedCandy.element.classList.remove('selected');
            
            if (row === selectedRow && col === selectedCol) {
                // Clicked same candy, deselect
                this.selectedCandy = null;
                return;
            }
            
            // Check if candies are adjacent
            if (this.areAdjacent(selectedRow, selectedCol, row, col)) {
                this.swapCandies(selectedRow, selectedCol, row, col);
            }
            
            this.selectedCandy = null;
        }
    }
    
    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    async swapCandies(row1, col1, row2, col2) {
        this.isProcessing = true;
        
        // Swap in board array
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
        
        // Re-render to show swap
        this.renderBoard();
        
        // Check for matches
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            // Valid move
            this.moves--;
            this.updateUI();
            await this.processMatches();
            
            if (this.moves <= 0) {
                this.endGame();
            }
        } else {
            // Invalid move, swap back
            const temp2 = this.board[row1][col1];
            this.board[row1][col1] = this.board[row2][col2];
            this.board[row2][col2] = temp2;
            this.renderBoard();
        }
        
        this.isProcessing = false;
    }
    
    findMatches() {
        const matches = [];
        
        // Find horizontal matches
        for (let row = 0; row < this.boardSize; row++) {
            let count = 1;
            let currentType = this.board[row][0];
            
            for (let col = 1; col < this.boardSize; col++) {
                if (this.board[row][col] === currentType) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = col - count; i < col; i++) {
                            matches.push({ row, col: i });
                        }
                    }
                    count = 1;
                    currentType = this.board[row][col];
                }
            }
            
            if (count >= 3) {
                for (let i = this.boardSize - count; i < this.boardSize; i++) {
                    matches.push({ row, col: i });
                }
            }
        }
        
        // Find vertical matches
        for (let col = 0; col < this.boardSize; col++) {
            let count = 1;
            let currentType = this.board[0][col];
            
            for (let row = 1; row < this.boardSize; row++) {
                if (this.board[row][col] === currentType) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = row - count; i < row; i++) {
                            matches.push({ row: i, col });
                        }
                    }
                    count = 1;
                    currentType = this.board[row][col];
                }
            }
            
            if (count >= 3) {
                for (let i = this.boardSize - count; i < this.boardSize; i++) {
                    matches.push({ row: i, col });
                }
            }
        }
        
        return matches;
    }
    
    async processMatches() {
        let matches = this.findMatches();
        
        while (matches.length > 0) {
            // Highlight matches
            this.highlightMatches(matches);
            
            // Wait for animation
            await this.delay(500);
            
            // Remove matches and update score
            this.removeMatches(matches);
            this.score += matches.length * 10;
            this.updateUI();
            
            // Apply gravity
            this.applyGravity();
            
            // Fill empty spaces
            this.fillEmptySpaces();
            
            // Re-render board
            this.renderBoard();
            
            // Wait for falling animation
            await this.delay(300);
            
            // Check for new matches
            matches = this.findMatches();
        }
    }
    
    highlightMatches(matches) {
        matches.forEach(match => {
            const candyElement = this.gameBoard.children[match.row * this.boardSize + match.col];
            if (candyElement) {
                candyElement.classList.add('matching');
            }
        });
    }
    
    removeMatches(matches = null) {
        if (!matches) {
            matches = this.findMatches();
        }
        
        matches.forEach(match => {
            this.board[match.row][match.col] = null;
        });
    }
    
    applyGravity() {
        for (let col = 0; col < this.boardSize; col++) {
            let writeIndex = this.boardSize - 1;
            
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    this.board[writeIndex][col] = this.board[row][col];
                    if (writeIndex !== row) {
                        this.board[row][col] = null;
                    }
                    writeIndex--;
                }
            }
        }
    }
    
    fillEmptySpaces() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    this.board[row][col] = Math.floor(Math.random() * this.candyTypes);
                }
            }
        }
    }
    
    showHint() {
        if (this.gameOver || this.isProcessing) return;
        
        // Find possible moves
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // Try swapping with right neighbor
                if (col < this.boardSize - 1) {
                    this.simulateSwap(row, col, row, col + 1);
                    if (this.findMatches().length > 0) {
                        this.highlightHint(row, col, row, col + 1);
                        this.undoSimulateSwap(row, col, row, col + 1);
                        return;
                    }
                    this.undoSimulateSwap(row, col, row, col + 1);
                }
                
                // Try swapping with bottom neighbor
                if (row < this.boardSize - 1) {
                    this.simulateSwap(row, col, row + 1, col);
                    if (this.findMatches().length > 0) {
                        this.highlightHint(row, col, row + 1, col);
                        this.undoSimulateSwap(row, col, row + 1, col);
                        return;
                    }
                    this.undoSimulateSwap(row, col, row + 1, col);
                }
            }
        }
    }
    
    simulateSwap(row1, col1, row2, col2) {
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
    }
    
    undoSimulateSwap(row1, col1, row2, col2) {
        this.simulateSwap(row1, col1, row2, col2); // Swap back
    }
    
    highlightHint(row1, col1, row2, col2) {
        const candy1 = this.gameBoard.children[row1 * this.boardSize + col1];
        const candy2 = this.gameBoard.children[row2 * this.boardSize + col2];
        
        candy1.style.boxShadow = '0 0 20px #00ff00';
        candy2.style.boxShadow = '0 0 20px #00ff00';
        
        setTimeout(() => {
            candy1.style.boxShadow = '';
            candy2.style.boxShadow = '';
        }, 2000);
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.movesElement.textContent = this.moves;
    }
    
    endGame() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        this.showGameOverModal();
    }
    
    showGameOverModal() {
        this.gameOverModal.classList.remove('hidden');
    }
    
    hideGameOverModal() {
        this.gameOverModal.classList.add('hidden');
    }
    
    restartGame() {
        this.initializeGame();
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Match3Game();
});
