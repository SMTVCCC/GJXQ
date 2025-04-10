/**
 * 国际象棋AI模块
 * 实现不同难度级别的电脑玩家
 */

class ChessAI {
    constructor(game) {
        this.game = game;
        this.difficulty = 1; // 默认难度：简单
        this.maxDepth = 2;   // 默认搜索深度
        
        // 棋子价值表
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };
        
        // 棋子位置评估表（简化版）
        this.positionValues = {
            pawn: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5,  5, 10, 25, 25, 10,  5,  5],
                [0,  0,  0, 20, 20,  0,  0,  0],
                [5, -5,-10,  0,  0,-10, -5,  5],
                [5, 10, 10,-20,-20, 10, 10,  5],
                [0,  0,  0,  0,  0,  0,  0,  0]
            ],
            knight: [
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            bishop: [
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0, 10, 10, 10, 10,  0,-10],
                [-10,  5,  5, 10, 10,  5,  5,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10,  5,  5,  5,  5,  5,  5,-10],
                [-10,  0,  5,  0,  0,  5,  0,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            rook: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [5, 10, 10, 10, 10, 10, 10,  5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [0,  0,  0,  5,  5,  0,  0,  0]
            ],
            queen: [
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [-5,  0,  5,  5,  5,  5,  0, -5],
                [0,  0,  5,  5,  5,  5,  0, -5],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            king: [
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [20, 20,  0,  0,  0,  0, 20, 20],
                [20, 30, 10,  0,  0, 10, 30, 20]
            ],
            kingEndgame: [
                [-50,-40,-30,-20,-20,-30,-40,-50],
                [-30,-20,-10,  0,  0,-10,-20,-30],
                [-30,-10, 20, 30, 30, 20,-10,-30],
                [-30,-10, 30, 40, 40, 30,-10,-30],
                [-30,-10, 30, 40, 40, 30,-10,-30],
                [-30,-10, 20, 30, 30, 20,-10,-30],
                [-30,-30,  0,  0,  0,  0,-30,-30],
                [-50,-30,-30,-30,-30,-30,-30,-50]
            ]
        };
        
        // 棋盘开发阶段
        this.gamePhase = 'opening'; // opening, middlegame, endgame
        
        // 开局库 - 常见的开局走法
        this.openingBook = {
            'start': ['e2-e4', 'd2-d4', 'c2-c4', 'g1-f3'],
            'e2-e4': ['e7-e5', 'c7-c5', 'e7-e6', 'c7-c6', 'd7-d6', 'd7-d5'],
            'd2-d4': ['d7-d5', 'g8-f6', 'e7-e6', 'c7-c5']
            // 可以扩展更多开局变例...
        };
        
        // 记录已经走过的步骤，用于开局库
        this.moveSequence = [];
    }
    
    /**
     * 设置AI难度
     * @param {number} level - 难度级别 (1: 简单, 2: 中等, 3: 困难)
     */
    setDifficulty(level) {
        this.difficulty = level;
        
        // 根据难度设置搜索深度
        switch (level) {
            case 1: // 简单
                this.maxDepth = 2;
                break;
            case 2: // 中等
                this.maxDepth = 10;
                break;
            case 3: // 困难
                this.maxDepth = 20; // 显著增加搜索深度为20
                break;
            default:
                this.maxDepth = 2;
        }
        
        // 重置开局序列
        this.moveSequence = [];
        this.gamePhase = 'opening';
    }
    
    /**
     * 让AI进行一步移动
     * @returns {Object|null} 移动结果
     */
    makeMove() {
        const color = this.game.currentPlayer;
        
        // 更新游戏阶段
        this.updateGamePhase();
        
        // 计算最佳移动
        let moveResult = null;
        
        // 显示思考中的状态
        this.showThinkingIndicator();
        
        // 使用Promise和setTimeout来实现延迟
        return new Promise((resolve) => {
            // 计算移动
            const calculateMove = () => {
                switch (this.difficulty) {
                    case 1: // 简单 - 随机移动或简单评估
                        moveResult = this.makeRandomMove(color);
                        break;
                        
                    case 2: // 中等 - 带Alpha-Beta剪枝的Minimax
                        moveResult = this.makeBestMove(color);
                        break;
                        
                    case 3: // 困难 - 开局库 + 更深的搜索深度 + 更好的评估
                        // 如果在开局阶段，使用开局库
                        if (this.gamePhase === 'opening') {
                            const bookMove = this.getOpeningBookMove();
                            if (bookMove) {
                                console.log('AI使用开局库走棋');
                                moveResult = this.executeBookMove(bookMove, color);
                            } else {
                                // 否则使用增强的Minimax算法
                                moveResult = this.makeBestMove(color);
                            }
                        } else {
                            // 否则使用增强的Minimax算法
                            moveResult = this.makeBestMove(color);
                        }
                        break;
                        
                    default:
                        moveResult = this.makeRandomMove(color);
                }
                
                // 模拟人类思考延迟 (1-2秒)
                const thinkDelay = 1000 + Math.random() * 1000;
                console.log(`AI已计算出移动，模拟思考延迟 ${Math.round(thinkDelay)}ms`);
                
                setTimeout(() => {
                    // 隐藏思考指示器
                    this.hideThinkingIndicator();
                    
                    // 返回移动结果
                    resolve(moveResult);
                }, thinkDelay);
            };
            
            // 立即开始计算，但延迟返回结果
            calculateMove();
        });
    }
    
    /**
     * 显示AI思考中的指示器
     */
    showThinkingIndicator() {
        // 创建思考指示器，如果不存在
        if (!document.getElementById('ai-thinking-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'ai-thinking-indicator';
            indicator.style.position = 'absolute';
            indicator.style.top = '50%';
            indicator.style.left = '50%';
            indicator.style.transform = 'translate(-50%, -50%)';
            indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            indicator.style.color = 'white';
            indicator.style.padding = '10px 20px';
            indicator.style.borderRadius = '5px';
            indicator.style.zIndex = '1000';
            indicator.style.fontFamily = 'Arial, sans-serif';
            indicator.textContent = '思考中...';
            document.body.appendChild(indicator);
        } else {
            document.getElementById('ai-thinking-indicator').style.display = 'block';
        }
    }
    
    /**
     * 隐藏AI思考中的指示器
     */
    hideThinkingIndicator() {
        const indicator = document.getElementById('ai-thinking-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    /**
     * 更新游戏阶段 (开局、中局、残局)
     */
    updateGamePhase() {
        // 计算棋盘上所有棋子的总价值
        let totalValue = 0;
        let piecesCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.getPiece(row, col);
                if (piece && piece.type !== 'king') {
                    totalValue += this.pieceValues[piece.type];
                    piecesCount++;
                }
            }
        }
        
        // 根据棋子总价值判断游戏阶段
        if (this.game.moveHistory.length < 10) {
            this.gamePhase = 'opening';
        } else if (totalValue < 3000 || piecesCount < 10) {
            this.gamePhase = 'endgame';
        } else {
            this.gamePhase = 'middlegame';
        }
    }
    
    /**
     * 从开局库中获取走法
     * @returns {string|null} 开局库走法 (例如: 'e2-e4')
     */
    getOpeningBookMove() {
        // 如果已经走了10步以上，不使用开局库
        if (this.game.moveHistory.length > 10) {
            return null;
        }
        
        // 获取当前局面的开局键
        const currentKey = this.moveSequence.length === 0 ? 'start' : this.moveSequence[this.moveSequence.length - 1];
        
        // 如果没有匹配的开局，返回null
        if (!this.openingBook[currentKey]) {
            return null;
        }
        
        // 从开局库中随机选择一个走法
        const possibleMoves = this.openingBook[currentKey];
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        return possibleMoves[randomIndex];
    }
    
    /**
     * 执行开局库中的走法
     * @param {string} bookMove - 开局库走法 (例如: 'e2-e4')
     * @param {string} color - 当前颜色
     * @returns {Object|null} 移动结果
     */
    executeBookMove(bookMove, color) {
        // 解析代数记号
        const [fromNotation, toNotation] = bookMove.split('-');
        
        const fromCol = fromNotation.charCodeAt(0) - 97;  // 'a'的ASCII码是97
        const fromRow = 8 - parseInt(fromNotation[1]);    // 棋盘上的1对应内部的7
        const toCol = toNotation.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(toNotation[1]);
        
        // 验证走法是否合法
        const piece = this.game.getPiece(fromRow, fromCol);
        if (!piece || piece.color !== color) {
            console.log('开局库走法无效，切换到Minimax搜索');
            return this.makeBestMove(color);
        }
        
        // 选择棋子
        this.game.selectedPiece = null;
        const selectResult = this.game.selectPiece(fromRow, fromCol);
        
        if (!selectResult) {
            console.log('无法选择开局库指定的棋子，切换到Minimax搜索');
            return this.makeBestMove(color);
        }
        
        // 获取可能的移动
        const possibleMoves = this.game.getPossibleMoves();
        const targetMove = possibleMoves.find(move => move.row === toRow && move.col === toCol);
        
        if (!targetMove) {
            console.log('开局库走法无效，切换到Minimax搜索');
            return this.makeBestMove(color);
        }
        
        // 执行移动
        const moveResult = this.game.movePiece(toRow, toCol);
        
        // 如果走法有效，记录到moveSequence
        if (moveResult) {
            this.moveSequence.push(bookMove);
        }
        
        return moveResult;
    }
    
    /**
     * 随机选择一个合法移动（简单难度）
     * @param {string} color - 棋子颜色
     * @returns {Object|null} 移动结果
     */
    makeRandomMove(color) {
        console.log('AI开始随机移动');
        // 收集所有可能的移动
        const allPossibleMoves = [];
        
        // 遍历棋盘
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.getPiece(row, col);
                
                // 检查是否为AI方的棋子
                if (piece && piece.color === color) {
                    console.log(`找到${color}方棋子[${row},${col}]: ${piece.type}`);
                    // 保存当前选择状态
                    const savedSelectedPiece = this.game.selectedPiece;
                    
                    // 选择该棋子并获取所有可能的移动
                    const selectResult = this.game.selectPiece(row, col);
                    console.log(`选择棋子结果: ${selectResult}`);
                    
                    const possibleMoves = this.game.getPossibleMoves();
                    console.log(`棋子[${row},${col}]可能的移动数量: ${possibleMoves.length}`);
                    
                    // 将该棋子的所有可能移动添加到列表中
                    for (const move of possibleMoves) {
                        allPossibleMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece,
                            score: this.evaluateMove(row, col, move, piece),
                            moveInfo: move
                        });
                    }
                    
                    // 恢复选择状态
                    this.game.selectedPiece = savedSelectedPiece;
                }
            }
        }
        
        console.log(`收集到${allPossibleMoves.length}个可能的移动`);
        
        if (allPossibleMoves.length === 0) {
            console.log('没有可用的移动');
            return null; // 无法移动
        }
        
        // 简单难度：有70%的概率选择一个随机移动，30%的概率选择最佳移动
        let selectedMove;
        if (this.difficulty === 1 && Math.random() < 0.7) {
            // 随机选择一个移动
            const randomIndex = Math.floor(Math.random() * allPossibleMoves.length);
            selectedMove = allPossibleMoves[randomIndex];
            console.log(`随机选择了移动: 从[${selectedMove.fromRow},${selectedMove.fromCol}]到[${selectedMove.toRow},${selectedMove.toCol}]`);
        } else {
            // 按评分排序，选择最佳移动
            allPossibleMoves.sort((a, b) => b.score - a.score);
            selectedMove = allPossibleMoves[0];
            console.log(`选择了最佳移动: 从[${selectedMove.fromRow},${selectedMove.fromCol}]到[${selectedMove.toRow},${selectedMove.toCol}], 分数: ${selectedMove.score}`);
        }
        
        // 保存当前游戏状态
        const savedState = {...this.game.getGameState()};
        
        // 先清除之前的选中状态
        this.game.selectedPiece = null;
        
        // 选择棋子
        const selectResult = this.game.selectPiece(selectedMove.fromRow, selectedMove.fromCol);
        console.log(`选择棋子结果: ${selectResult}`);
        
        if (!selectResult) {
            console.error(`无法选择棋子[${selectedMove.fromRow},${selectedMove.fromCol}]`);
            return null;
        }
        
        // 移动棋子
        const moveResult = this.game.movePiece(selectedMove.toRow, selectedMove.toCol);
        console.log(`移动棋子结果:`, moveResult);
        
        // 如果移动失败，尝试选择另一个移动
        if (!moveResult && allPossibleMoves.length > 1) {
            console.error('AI随机移动失败，尝试另一个移动');
            // 从列表中移除失败的移动
            const newPossibleMoves = allPossibleMoves.filter(move => 
                !(move.fromRow === selectedMove.fromRow && 
                  move.fromCol === selectedMove.fromCol &&
                  move.toRow === selectedMove.toRow &&
                  move.toCol === selectedMove.toCol)
            );
            
            if (newPossibleMoves.length > 0) {
                const newMove = newPossibleMoves[0];
                
                // 选择新的棋子
                this.game.selectedPiece = null;
                this.game.selectPiece(newMove.fromRow, newMove.fromCol);
                
                // 移动棋子
                const newMoveResult = this.game.movePiece(newMove.toRow, newMove.toCol);
                console.log(`新的移动棋子结果:`, newMoveResult);
                return newMoveResult;
            }
        }
        
        return moveResult;
    }
    
    /**
     * 使用Minimax算法选择最佳移动（中等和困难难度）
     * @param {string} color - 棋子颜色
     * @returns {Object|null} 移动结果
     */
    makeBestMove(color) {
        try {
            console.log(`AI开始最佳移动计算, 难度: ${this.difficulty}, 搜索深度: ${this.maxDepth}`);
            
            // 困难模式使用迭代加深
            let bestMove = null;
            
            // 添加时间控制
            const startTime = new Date().getTime();
            const timeLimit = this.difficulty === 3 ? 5000 : 2000; // 困难模式5秒时间限制，中等模式2秒
            let timeOut = false;
            
            if (this.difficulty === 3) {
                console.log('使用迭代加深搜索最佳移动');
                
                // 从较小的深度开始，逐渐增加深度
                for (let depth = 2; depth <= this.maxDepth; depth++) {
                    // 检查是否超时
                    const currentTime = new Date().getTime();
                    if (currentTime - startTime > timeLimit) {
                        console.log(`迭代加深搜索已用时${currentTime - startTime}ms，达到时间限制，停止搜索`);
                        timeOut = true;
                        break;
                    }
                    
                    console.log(`迭代加深 - 当前深度: ${depth}`);
                    const tempMaxDepth = this.maxDepth;
                    this.maxDepth = depth;
                    
                    // 使用当前深度查找最佳移动
                    const currentBestMove = this.findBestMove(color);
                    
                    // 恢复原始深度
                    this.maxDepth = tempMaxDepth;
                    
                    // 如果找到移动，更新bestMove
                    if (currentBestMove) {
                        bestMove = currentBestMove;
                        console.log(`深度 ${depth} 找到最佳移动: 从[${bestMove.fromRow},${bestMove.fromCol}]到[${bestMove.toRow},${bestMove.toCol}], 分数: ${bestMove.score}`);
                    }
                }
            } else {
                // 中等难度直接使用标准搜索
                bestMove = this.findBestMove(color);
            }
            
            if (!bestMove) {
                console.log('没有找到最佳移动');
                return null;
            }
            
            console.log(`找到最佳移动: 从[${bestMove.fromRow},${bestMove.fromCol}]到[${bestMove.toRow},${bestMove.toCol}], 分数: ${bestMove.score}`);
            
            // 保存当前游戏状态
            const savedState = {...this.game.getGameState()};
            
            // 先清除之前的选中状态
            this.game.selectedPiece = null;
            
            // 选择棋子
            const selectResult = this.game.selectPiece(bestMove.fromRow, bestMove.fromCol);
            console.log(`选择棋子结果: ${selectResult}`);
            
            if (!selectResult) {
                console.error(`无法选择棋子[${bestMove.fromRow},${bestMove.fromCol}]`);
                return null;
            }
            
            // 移动棋子
            const moveResult = this.game.movePiece(bestMove.toRow, bestMove.toCol);
            console.log(`移动棋子结果:`, moveResult);
            
            // 如果移动失败，恢复状态
            if (!moveResult) {
                console.error('AI移动失败，恢复游戏状态');
                return null;
            }
            
            return moveResult;
        } catch (error) {
            console.error('AI最佳移动计算出错:', error);
            console.error('错误堆栈:', error.stack);
            
            // 出错时尝试使用随机移动作为备选方案
            console.log('尝试使用随机移动作为备选方案');
            return this.makeRandomMove(color);
        }
    }
    
    /**
     * 使用Minimax算法和Alpha-Beta剪枝查找最佳移动
     * @param {string} color - 棋子颜色
     * @returns {Object|null} 最佳移动
     */
    findBestMove(color) {
        let bestScore = -Infinity;
        let bestMove = null;
        
        // 收集所有可能的移动
        const allPossibleMoves = [];
        
        // 遍历棋盘
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.getPiece(row, col);
                
                // 检查是否为AI方的棋子
                if (piece && piece.color === color) {
                    // 保存当前选择状态
                    const savedSelectedPiece = this.game.selectedPiece;
                    
                    // 选择该棋子并获取所有可能的移动
                    this.game.selectPiece(row, col);
                    const possibleMoves = this.game.getPossibleMoves();
                    
                    // 将该棋子的所有可能移动添加到列表中
                    for (const move of possibleMoves) {
                        allPossibleMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            moveInfo: move
                        });
                    }
                    
                    // 恢复选择状态
                    this.game.selectedPiece = savedSelectedPiece;
                }
            }
        }
        
        // 对移动进行初步评估和排序，以提高Alpha-Beta剪枝效率
        for (const move of allPossibleMoves) {
            const piece = this.game.getPiece(move.fromRow, move.fromCol);
            move.initialScore = this.evaluateMove(move.fromRow, move.fromCol, move.moveInfo, piece);
        }
        allPossibleMoves.sort((a, b) => b.initialScore - a.initialScore);
        
        // 限制搜索的移动数量（仅用于困难模式的性能优化）
        // 当移动很多时，我们只考虑评分最高的前N个移动
        const movesToSearch = this.difficulty === 3 && allPossibleMoves.length > 15 
            ? allPossibleMoves.slice(0, 15) // 困难模式只搜索最好的15个移动
            : allPossibleMoves;
            
        // 应用Minimax搜索
        for (const move of movesToSearch) {
            // 保存当前游戏状态
            const originalSelectedPiece = this.game.selectedPiece;
            
            // 模拟移动
            const piece = this.game.getPiece(move.fromRow, move.fromCol);
            const capturedPiece = this.game.simulateMove(
                move.fromRow, move.fromCol, move.toRow, move.toCol, move.moveInfo
            );
            
            // 评估移动
            const score = -this.minimax(this.maxDepth - 1, -Infinity, Infinity, color === 'white' ? 'black' : 'white');
            
            // 撤销模拟的移动
            this.game.undoSimulatedMove(
                move.fromRow, move.fromCol, move.toRow, move.toCol, piece, capturedPiece, move.moveInfo
            );
            
            // 恢复游戏选择状态
            this.game.selectedPiece = originalSelectedPiece;
            
            // 更新最佳移动
            if (score > bestScore) {
                bestScore = score;
                bestMove = {
                    ...move,
                    score: score
                };
            }
        }
        
        return bestMove;
    }
    
    /**
     * Minimax算法，带Alpha-Beta剪枝
     * @param {number} depth - 搜索深度
     * @param {number} alpha - Alpha值
     * @param {number} beta - Beta值
     * @param {string} color - 当前玩家颜色
     * @returns {number} 评估分数
     */
    minimax(depth, alpha, beta, color) {
        // 如果达到最大深度或游戏结束，返回评估分数
        if (depth === 0 || this.game.gameOver) {
            return this.evaluateBoard(color);
        }
        
        // 初始化最佳分数
        let bestScore = color === this.game.currentPlayer ? -Infinity : Infinity;
        
        // 收集所有可能的移动
        const allPossibleMoves = [];
        
        // 遍历棋盘
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.getPiece(row, col);
                
                // 检查是否为当前玩家的棋子
                if (piece && piece.color === color) {
                    // 保存当前选择状态
                    const savedSelectedPiece = this.game.selectedPiece;
                    
                    // 选择该棋子并获取所有可能的移动
                    this.game.selectPiece(row, col);
                    const possibleMoves = this.game.getPossibleMoves();
                    
                    // 将该棋子的所有可能移动添加到列表中
                    for (const move of possibleMoves) {
                        allPossibleMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            moveInfo: move
                        });
                    }
                    
                    // 恢复选择状态
                    this.game.selectedPiece = savedSelectedPiece;
                }
            }
        }
        
        // 如果没有可能的移动，可能是将杀或逼和
        if (allPossibleMoves.length === 0) {
            // 检查是否将军
            if (this.game.inCheck[color]) {
                // 将杀，返回非常低的分数
                return color === this.game.currentPlayer ? -20000 : 20000;
            } else {
                // 逼和，返回0分
                return 0;
            }
        }
        
        // 对移动进行初步排序，以提高剪枝效率（仅在困难模式的深层搜索中）
        if (this.difficulty === 3 && depth > 2) {
            for (const move of allPossibleMoves) {
                const piece = this.game.getPiece(move.fromRow, move.fromCol);
                move.score = this.evaluateMove(move.fromRow, move.fromCol, move.moveInfo, piece);
            }
            
            // 捕获移动和检查移动排在前面
            allPossibleMoves.sort((a, b) => {
                // 捕获移动优先
                const aIsCapture = a.moveInfo.type === 'capture' || a.moveInfo.type === 'enPassant';
                const bIsCapture = b.moveInfo.type === 'capture' || b.moveInfo.type === 'enPassant';
                
                if (aIsCapture && !bIsCapture) return -1;
                if (!aIsCapture && bIsCapture) return 1;
                
                // 然后按估值排序
                return b.score - a.score;
            });
        }
        
        // 对每个可能的移动应用Minimax
        for (const move of allPossibleMoves) {
            // 保存当前游戏状态
            const savedSelectedPiece = this.game.selectedPiece;
            const savedCurrentPlayer = this.game.currentPlayer;
            
            // 模拟移动
            const piece = this.game.getPiece(move.fromRow, move.fromCol);
            const capturedPiece = this.game.simulateMove(
                move.fromRow, move.fromCol, move.toRow, move.toCol, move.moveInfo
            );
            
            // 临时切换玩家
            this.game.currentPlayer = color === 'white' ? 'black' : 'white';
            
            // 递归评估
            const score = this.minimax(
                depth - 1, 
                alpha, 
                beta, 
                color === 'white' ? 'black' : 'white'
            );
            
            // 撤销模拟的移动
            this.game.undoSimulatedMove(
                move.fromRow, move.fromCol, move.toRow, move.toCol, piece, capturedPiece, move.moveInfo
            );
            
            // 恢复游戏状态
            this.game.selectedPiece = savedSelectedPiece;
            this.game.currentPlayer = savedCurrentPlayer;
            
            // 更新最佳分数
            if (color === this.game.currentPlayer) {
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, bestScore);
            } else {
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, bestScore);
            }
            
            // Alpha-Beta剪枝
            if (beta <= alpha) {
                break;
            }
        }
        
        return bestScore;
    }
    
    /**
     * 评估棋盘局面
     * @param {string} color - 待评估方的颜色
     * @returns {number} 评估分数
     */
    evaluateBoard(color) {
        let score = 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // 计算棋子价值和位置价值
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.getPiece(row, col);
                if (!piece) continue;
                
                // 基础棋子价值
                const pieceValue = this.pieceValues[piece.type];
                
                // 位置价值 - 根据游戏阶段选择不同的评估表
                let posValue = 0;
                if (piece.type === 'king' && this.gamePhase === 'endgame') {
                    // 在残局阶段使用特殊的王位置评估表
                    const posRow = piece.color === 'white' ? row : 7 - row;
                    const posCol = piece.color === 'white' ? col : 7 - col;
                    posValue = this.positionValues.kingEndgame[posRow][posCol];
                } else if (this.positionValues[piece.type]) {
                    // 为黑方翻转位置评估表
                    const posRow = piece.color === 'white' ? row : 7 - row;
                    const posCol = piece.color === 'white' ? col : 7 - col;
                    posValue = this.positionValues[piece.type][posRow][posCol];
                }
                
                // 根据游戏阶段调整权重
                let positionMultiplier = 1;
                if (this.gamePhase === 'opening') {
                    // 开局时更重视位置评估
                    positionMultiplier = 1.2;
                } else if (this.gamePhase === 'endgame') {
                    // 残局时更重视棋子价值
                    positionMultiplier = 0.8;
                }
                
                // 累加分数
                if (piece.color === color) {
                    score += pieceValue + (posValue * positionMultiplier);
                } else {
                    score -= pieceValue + (posValue * positionMultiplier);
                }
            }
        }
        
        // 考虑王的安全性
        const kingPos = this.game.kings[color];
        const opponentKingPos = this.game.kings[opponentColor];
        
        // 将军奖励 - 困难模式提高奖励值
        if (this.game.inCheck[opponentColor]) {
            score += this.difficulty === 3 ? 80 : 50;
        }
        
        // 被将军惩罚 - 困难模式提高惩罚值
        if (this.game.inCheck[color]) {
            score -= this.difficulty === 3 ? 80 : 50;
        }
        
        // 中央控制奖励
        const centerControl = this.evaluateCenterControl(color);
        score += centerControl;
        
        // 棋子机动性奖励
        const mobility = this.evaluateMobility(color);
        score += mobility;
        
        // 困难模式额外评估
        if (this.difficulty === 3) {
            // 评估棋子发展
            const development = this.evaluateDevelopment(color);
            score += development;
            
            // 评估王的安全
            const kingSafety = this.evaluateKingSafety(color);
            score += kingSafety;
            
            // 评估兵结构
            const pawnStructure = this.evaluatePawnStructure(color);
            score += pawnStructure;
        }
        
        return score;
    }
    
    /**
     * 评估单步移动的价值
     * @param {number} fromRow - 起始行
     * @param {number} fromCol - 起始列
     * @param {Object} move - 移动信息
     * @param {Object} piece - 棋子对象
     * @returns {number} 移动评分
     */
    evaluateMove(fromRow, fromCol, move, piece) {
        let score = 0;
        
        // 如果是吃子，加上被吃棋子的价值
        if (move.type === 'capture' || move.type === 'enPassant') {
            const capturedPiece = move.type === 'enPassant' 
                ? this.game.getPiece(move.captureRow, move.captureCol)
                : this.game.getPiece(move.row, move.col);
                
            if (capturedPiece) {
                score += this.pieceValues[capturedPiece.type] * 10;  // 吃子权重加大
                
                // 困难模式额外评估吃子价值
                if (this.difficulty === 3) {
                    // 如果被吃的子比吃子的子更值钱，更高的分数
                    if (this.pieceValues[capturedPiece.type] > this.pieceValues[piece.type]) {
                        score += (this.pieceValues[capturedPiece.type] - this.pieceValues[piece.type]) * 2;
                    }
                }
            }
        }
        
        // 如果移动到更好的位置，加分
        const oldPosRow = piece.color === 'white' ? fromRow : 7 - fromRow;
        const oldPosCol = piece.color === 'white' ? fromCol : 7 - fromCol;
        const newPosRow = piece.color === 'white' ? move.row : 7 - move.row;
        const newPosCol = piece.color === 'white' ? move.col : 7 - move.col;
        
        if (this.positionValues[piece.type]) {
            const oldPosValue = this.positionValues[piece.type][oldPosRow][oldPosCol];
            const newPosValue = this.positionValues[piece.type][newPosRow][newPosCol];
            score += (newPosValue - oldPosValue);
            
            // 在开局和中局阶段，更重视位置
            if (this.gamePhase !== 'endgame') {
                score += (newPosValue - oldPosValue) * 0.5;
            }
        }
        
        // 如果是升变，加分
        if (piece.type === 'pawn' && (move.row === 0 || move.row === 7)) {
            score += this.pieceValues.queen - this.pieceValues.pawn;  // 假设升变为后
        }
        
        // 如果是王车易位，加分（促进王的安全）
        if (move.type === 'castling') {
            score += 30;
            
            // 困难模式额外奖励王车易位
            if (this.difficulty === 3 && this.gamePhase === 'opening') {
                score += 20; // 开局阶段王车易位更有价值
            }
        }
        
        // 检查移动后是否会导致被将军，如果是则减分
        const capturedPiece = this.game.simulateMove(fromRow, fromCol, move.row, move.col, move);
        
        if (this.game.isSquareAttacked(this.game.kings[piece.color].row, this.game.kings[piece.color].col, piece.color)) {
            score -= 100;  // 被将军是非常不利的
            
            // 困难模式额外惩罚被将军
            if (this.difficulty === 3) {
                score -= 50;
            }
        }
        
        // 检查这个移动是否会将军对手，如果是则加分
        const opponentColor = piece.color === 'white' ? 'black' : 'white';
        const opponentKingPos = this.game.kings[opponentColor];
        
        if (this.game.isSquareAttacked(opponentKingPos.row, opponentKingPos.col, opponentColor)) {
            score += 50; // 将军是有利的
            
            // 困难模式额外奖励将军
            if (this.difficulty === 3) {
                score += 20;
            }
        }
        
        // 恢复移动
        this.game.undoSimulatedMove(fromRow, fromCol, move.row, move.col, piece, capturedPiece, move);
        
        // 困难模式额外评估
        if (this.difficulty === 3) {
            // 鼓励开局发展轻子
            if (this.gamePhase === 'opening' && (piece.type === 'knight' || piece.type === 'bishop')) {
                const homeRank = piece.color === 'white' ? 7 : 0;
                if (fromRow === homeRank && move.row !== homeRank) {
                    score += 15; // 奖励移出起始位置的轻子
                }
            }
            
            // 在残局阶段，鼓励王接近中心
            if (this.gamePhase === 'endgame' && piece.type === 'king') {
                const distToCenter = Math.abs(3.5 - move.row) + Math.abs(3.5 - move.col);
                score += (4 - distToCenter) * 5;
            }
            
            // 惩罚重复移动同一棋子
            const lastMove = this.game.moveHistory[this.game.moveHistory.length - 1];
            if (lastMove && lastMove.piece.color === piece.color &&
                lastMove.from.row === move.row && lastMove.from.col === move.col &&
                lastMove.to.row === fromRow && lastMove.to.col === fromCol) {
                score -= 30; // 惩罚来回移动同一棋子
            }
        }
        
        return score;
    }
    
    /**
     * 评估对中央区域的控制
     * @param {string} color - 棋子颜色
     * @returns {number} 评估分数
     */
    evaluateCenterControl(color) {
        const centerSquares = [
            { row: 3, col: 3 }, { row: 3, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 4 }
        ];
        
        let controlScore = 0;
        
        for (const square of centerSquares) {
            const piece = this.game.getPiece(square.row, square.col);
            
            // 如果中央有己方棋子，加分
            if (piece && piece.color === color) {
                controlScore += 10;
            }
            
            // 计算攻击中央格子的棋子数量
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const attacker = this.game.getPiece(row, col);
                    if (!attacker) continue;
                    
                    if (attacker.color === color) {
                        // 选择该棋子并检查是否能攻击中央格子
                        this.game.selectPiece(row, col);
                        const moves = this.game.getPossibleMoves();
                        
                        for (const move of moves) {
                            if (move.row === square.row && move.col === square.col) {
                                controlScore += 5;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        return controlScore;
    }
    
    /**
     * 评估棋子机动性（可移动性）
     * @param {string} color - 棋子颜色
     * @returns {number} 评估分数
     */
    evaluateMobility(color) {
        let mobilityScore = 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        let playerMoves = 0;
        let opponentMoves = 0;
        
        // 计算双方可能的移动数量
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.getPiece(row, col);
                if (!piece) continue;
                
                // 选择该棋子并获取可能的移动
                this.game.selectPiece(row, col);
                const moves = this.game.getPossibleMoves();
                
                if (piece.color === color) {
                    playerMoves += moves.length;
                } else {
                    opponentMoves += moves.length;
                }
            }
        }
        
        // 机动性差异
        mobilityScore = (playerMoves - opponentMoves) * 2;
        
        return mobilityScore;
    }
    
    /**
     * 评估棋子发展（主要在开局阶段）
     * @param {string} color - 棋子颜色
     * @returns {number} 评估分数
     */
    evaluateDevelopment(color) {
        // 只在开局阶段评估发展
        if (this.gamePhase !== 'opening') {
            return 0;
        }
        
        let score = 0;
        const homeRank = color === 'white' ? 7 : 0;
        
        // 检查轻子是否已发展（离开初始位置）
        for (let col = 1; col < 7; col++) {
            const piece = this.game.getPiece(homeRank, col);
            if (piece && piece.color === color && 
                (piece.type === 'knight' || piece.type === 'bishop')) {
                // 如果轻子仍在初始位置，减分
                score -= 10;
            }
        }
        
        // 奖励已发展的轻子
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.getPiece(row, col);
                if (piece && piece.color === color) {
                    if (piece.type === 'knight' || piece.type === 'bishop') {
                        if (color === 'white' && row < 7) {
                            score += 5;
                        } else if (color === 'black' && row > 0) {
                            score += 5;
                        }
                    }
                }
            }
        }
        
        // 奖励王车易位（通过检查王的位置）
        const kingPos = this.game.kings[color];
        if (kingPos.row === homeRank) {
            if (kingPos.col === 2 || kingPos.col === 6) {
                score += 30; // 已经完成王车易位
            }
        }
        
        return score;
    }
    
    /**
     * 评估王的安全
     * @param {string} color - 棋子颜色
     * @returns {number} 评估分数
     */
    evaluateKingSafety(color) {
        let score = 0;
        const kingPos = this.game.kings[color];
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // 计算攻击王周围的棋子数量
        const kingArea = [
            { row: kingPos.row - 1, col: kingPos.col - 1 },
            { row: kingPos.row - 1, col: kingPos.col },
            { row: kingPos.row - 1, col: kingPos.col + 1 },
            { row: kingPos.row, col: kingPos.col - 1 },
            { row: kingPos.row, col: kingPos.col + 1 },
            { row: kingPos.row + 1, col: kingPos.col - 1 },
            { row: kingPos.row + 1, col: kingPos.col },
            { row: kingPos.row + 1, col: kingPos.col + 1 }
        ];
        
        // 检查周围是否有己方棋子保护
        let protectingPieces = 0;
        // 检查周围是否有敌方棋子攻击
        let attackingPieces = 0;
        
        for (const pos of kingArea) {
            if (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8) {
                const piece = this.game.getPiece(pos.row, pos.col);
                if (piece) {
                    if (piece.color === color) {
                        protectingPieces++;
                    } else {
                        attackingPieces++;
                    }
                }
                
                // 检查这个位置是否被对手攻击
                if (this.game.isSquareAttacked(pos.row, pos.col, color)) {
                    score -= 5;
                }
            }
        }
        
        // 奖励有己方棋子保护的王
        score += protectingPieces * 5;
        // 惩罚有敌方棋子攻击的王
        score -= attackingPieces * 8;
        
        // 在开局和中局阶段，鼓励王远离中心
        if (this.gamePhase !== 'endgame') {
            // 计算王到中心的距离
            const distToCenter = Math.abs(3.5 - kingPos.row) + Math.abs(3.5 - kingPos.col);
            if (distToCenter < 2) {
                score -= 20; // 王太靠近中心，不安全
            }
        } else {
            // 在残局阶段，鼓励王接近中心
            const distToCenter = Math.abs(3.5 - kingPos.row) + Math.abs(3.5 - kingPos.col);
            score += (4 - distToCenter) * 5;
        }
        
        return score;
    }
    
    /**
     * 评估兵结构
     * @param {string} color - 棋子颜色
     * @returns {number} 评估分数
     */
    evaluatePawnStructure(color) {
        let score = 0;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // 按列统计兵
        const pawnColumns = Array(8).fill(0);
        const advancedPawns = Array(8).fill(false);
        
        // 遍历棋盘，找出所有兵
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.getPiece(row, col);
                
                if (piece && piece.type === 'pawn' && piece.color === color) {
                    // 统计每列的兵数
                    pawnColumns[col]++;
                    
                    // 检查过河兵
                    if ((color === 'white' && row < 4) || (color === 'black' && row > 3)) {
                        advancedPawns[col] = true;
                        score += 5; // 奖励过河兵
                    }
                    
                    // 检查相邻列是否有兵，形成兵链
                    if (col > 0 && this.hasAdjacentPawn(row, col - 1, color)) {
                        score += 5; // 相邻兵，形成保护
                    }
                    if (col < 7 && this.hasAdjacentPawn(row, col + 1, color)) {
                        score += 5; // 相邻兵，形成保护
                    }
                    
                    // 检查兵是否被阻挡
                    if (this.isPawnBlocked(row, col, color)) {
                        score -= 10; // 惩罚被阻挡的兵
                    }
                }
            }
        }
        
        // 惩罚孤立兵
        for (let col = 0; col < 8; col++) {
            if (pawnColumns[col] > 0) {
                // 检查是否孤立（左右两列没有兵）
                const isIsolated = (col === 0 || pawnColumns[col - 1] === 0) && 
                                 (col === 7 || pawnColumns[col + 1] === 0);
                if (isIsolated) {
                    score -= 10; // 惩罚孤立兵
                }
                
                // 惩罚重叠兵
                if (pawnColumns[col] > 1) {
                    score -= (pawnColumns[col] - 1) * 15; // 惩罚每列多于1个的兵
                }
            }
        }
        
        // 奖励控制中央的兵
        if (advancedPawns[3] || advancedPawns[4]) {
            score += 10;
        }
        
        return score;
    }
    
    /**
     * 检查在指定位置是否有同色兵
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 颜色
     * @returns {boolean} 是否存在同色兵
     */
    hasAdjacentPawn(row, col, color) {
        const piece = this.game.getPiece(row, col);
        return piece && piece.type === 'pawn' && piece.color === color;
    }
    
    /**
     * 检查兵是否被阻挡
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 颜色
     * @returns {boolean} 兵是否被阻挡
     */
    isPawnBlocked(row, col, color) {
        const direction = color === 'white' ? -1 : 1;
        const nextRow = row + direction;
        
        if (nextRow >= 0 && nextRow < 8) {
            // 检查前方是否有棋子阻挡
            const frontPiece = this.game.getPiece(nextRow, col);
            if (frontPiece) {
                return true;
            }
        }
        
        return false;
    }
} 