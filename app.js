/**
 * 国际象棋游戏主应用程序
 * 处理UI交互和游戏控制
 */

document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏
    const game = new ChessGame();
    const ai = new ChessAI(game);
    
    // 游戏配置
    let gameMode = null; // 'local' 或 'ai'
    let playerColor = 'white'; // 玩家颜色（对战AI时）
    let aiThinking = false; // AI是否正在思考
    let boardFlipped = false; // 棋盘是否翻转
    let gameInProgress = false; // 游戏是否进行中
    let timers = { white: 300, black: 300 }; // 计时器（秒）
    let timerInterval = null; // 计时器间隔
    let inputBuffer = ''; // 键盘输入缓冲
    let secretInputBuffer = ''; // 秘密密码输入缓冲
    
    // 棋盘和UI元素
    const chessboard = document.getElementById('chessboard');
    const gameModeSelection = document.getElementById('game-mode-selection');
    const localModeButton = document.getElementById('local-mode');
    const aiModeButton = document.getElementById('ai-mode');
    const aiDifficultySection = document.getElementById('ai-difficulty');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const statusText = document.querySelector('.status-text');
    const newGameButton = document.getElementById('new-game');
    const undoButton = document.getElementById('undo-move');
    const flipBoardButton = document.getElementById('flip-board');
    const movesList = document.getElementById('moves-list');
    const promotionModal = document.getElementById('promotion-modal');
    const promotionPieces = document.querySelector('.promotion-pieces');
    const gameOverModal = document.getElementById('game-over-modal');
    const gameResultText = document.getElementById('game-result');
    const playAgainButton = document.getElementById('play-again');
    const whiteTimer = document.querySelector('.white-timer');
    const blackTimer = document.querySelector('.black-timer');
    const whiteCaptured = document.querySelector('.white-captured');
    const blackCaptured = document.querySelector('.black-captured');
    const rankCoordinates = document.querySelector('.rank-coordinates');
    const fileCoordinates = document.querySelector('.file-coordinates');
    const inputDisplay = document.createElement('div');
    inputDisplay.className = 'input-display';
    document.querySelector('.game-container').appendChild(inputDisplay);
    
    /**
     * 初始化应用程序
     */
    function init() {
        console.log('初始化应用程序');
        setupEventListeners();
        console.log('事件监听器设置完成');
        createChessboard();
        console.log('棋盘创建完成');
        createCoordinates();
        console.log('坐标创建完成');
        
        // 显示游戏模式选择
        gameModeSelection.classList.add('active');
        console.log('游戏模式选择显示完成');
    }
    
    /**
     * 设置事件监听器
     */
    function setupEventListeners() {
        // 游戏模式选择
        localModeButton.addEventListener('click', () => selectGameMode('local'));
        aiModeButton.addEventListener('click', () => {
            aiDifficultySection.classList.remove('hidden');
        });
        
        // AI难度选择
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const level = parseInt(button.dataset.level);
                ai.setDifficulty(level);
                selectGameMode('ai');
            });
        });
        
        // 游戏控制按钮
        newGameButton.addEventListener('click', startNewGame);
        undoButton.addEventListener('click', undoMove);
        flipBoardButton.addEventListener('click', flipBoard);
        
        // 再玩一局按钮
        playAgainButton.addEventListener('click', () => {
            gameOverModal.classList.remove('active');
            startNewGame();
        });
        
        // 键盘输入监听
        document.addEventListener('keydown', handleKeyboardInput);
    }
    
    /**
     * 创建棋盘
     */
    function createChessboard() {
        console.log('开始创建棋盘');
        chessboard.innerHTML = '';
        
        // 创建64个格子
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square ' + ((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                // 添加点击事件
                square.addEventListener('click', function(e) {
                    console.log(`点击了方格 [${row}, ${col}]`, e.target);
                    handleSquareClick(row, col);
                });
                
                chessboard.appendChild(square);
            }
        }
        console.log('棋盘创建完成，共生成64个方格');
    }
    
    /**
     * 创建棋盘坐标标签
     */
    function createCoordinates() {
        rankCoordinates.innerHTML = '';
        fileCoordinates.innerHTML = '';
        
        // 创建行坐标 (8-1)
        for (let i = 0; i < 8; i++) {
            const rank = document.createElement('div');
            rank.className = 'coordinate';
            rank.textContent = boardFlipped ? (i + 1) : (8 - i);
            rankCoordinates.appendChild(rank);
        }
        
        // 创建列坐标 (a-h)
        for (let i = 0; i < 8; i++) {
            const file = document.createElement('div');
            file.className = 'coordinate';
            file.textContent = String.fromCharCode(boardFlipped ? 104 - i : 97 + i); // 'a' 的 ASCII 码是 97
            fileCoordinates.appendChild(file);
        }
    }
    
    /**
     * 选择游戏模式
     * @param {string} mode - 游戏模式 ('local' 或 'ai')
     */
    function selectGameMode(mode) {
        console.log(`选择游戏模式: ${mode}`);
        gameMode = mode;
        
        // 如果是AI模式，默认设置玩家为白方
        if (mode === 'ai') {
            playerColor = 'white';
            console.log(`AI模式，玩家颜色设置为: ${playerColor}`);
        }
        
        gameModeSelection.classList.remove('active');
        startNewGame();
    }
    
    /**
     * 开始新游戏
     */
    function startNewGame() {
        console.log('开始新游戏');
        // 重置游戏状态
        game.resetGame();
        
        // 确保AI使用正确的游戏对象
        ai.game = game;
        console.log('游戏和AI对象重置完成');
        
        gameInProgress = true;
        
        // 更新UI
        updateBoard();
        updateStatus();
        updateMoveHistory();
        updateCapturedPieces();
        
        // 停止并重置计时器
        clearInterval(timerInterval);
        timers = { white: 300, black: 300 }; // 5分钟
        updateTimers();
        startTimer();
        
        console.log(`游戏模式: ${gameMode}, 玩家颜色: ${playerColor}, 当前玩家: ${game.currentPlayer}`);
        
        // 如果是AI模式且AI先行，让AI走棋
        if (gameMode === 'ai' && game.currentPlayer !== playerColor) {
            console.log('AI先行，准备AI走棋');
            setTimeout(aiMove, 500);
        } else {
        }
        
        // 启用撤销按钮
        undoButton.disabled = true;
    }
    
    /**
     * 处理方格点击事件
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     */
    function handleSquareClick(row, col) {
        console.log(`点击方格: row=${row}, col=${col}`);
        
        // 如果游戏未进行或AI正在思考，忽略点击
        if (!gameInProgress || aiThinking) {
            console.log('游戏未进行或AI正在思考，忽略点击');
            return;
        }
        
        // 如果是AI模式且不是玩家的回合，忽略点击
        if (gameMode === 'ai' && game.currentPlayer !== playerColor) {
            console.log('AI模式且不是玩家的回合，忽略点击');
            return;
        }
        
        // 如果棋盘已翻转，调整坐标
        let actualRow = row;
        let actualCol = col;
        if (boardFlipped) {
            actualRow = 7 - row;
            actualCol = 7 - col;
            console.log(`棋盘已翻转，调整后坐标: row=${actualRow}, col=${actualCol}`);
        }
        
        const piece = game.getPiece(actualRow, actualCol);
        console.log('当前位置棋子:', piece);
        console.log('当前选中棋子:', game.selectedPiece);
        
        // 闪烁效果显示点击
        const squareIndex = row * 8 + col;
        const squares = chessboard.querySelectorAll('.square');
        squares[squareIndex].style.backgroundColor = 'yellow';
        setTimeout(() => {
            squares[squareIndex].style.backgroundColor = '';
        }, 300);
        
        // 判断是否是选择新棋子还是移动棋子
        if (game.selectedPiece) {
            // 已有选中的棋子，尝试移动
            console.log('尝试移动棋子');
            const result = game.movePiece(actualRow, actualCol);
            
            if (result) {
                console.log('移动成功:', result);
                // 展示移动动画
                animateMove(result).then(() => {
                    // 如果需要升变，显示升变选择对话框
                    if (result.promotionPending) {
                        console.log('需要升变');
                        showPromotionDialog(actualRow, actualCol);
                        return;
                    }
                    
                    // 更新UI
                    updateStatus();
                    updateMoveHistory();
                    updateCapturedPieces();
                    
                    // 启用撤销按钮
                    undoButton.disabled = false;
                    
                    // 如果是AI模式且是AI的回合，让AI走棋
                    if (gameMode === 'ai' && game.currentPlayer !== playerColor) {
                        console.log('现在是AI的回合，准备AI走棋');
                        setTimeout(aiMove, 500);
                    }
                });
            } else {
                console.log('移动失败');
                // 移动失败，检查是否选择了新棋子
                if (piece && piece.color === game.currentPlayer) {
                    console.log('选择新棋子');
                    game.selectedPiece = null; // 先清除之前的选择
                    game.selectPiece(actualRow, actualCol);
                    updateBoard();
                } else {
                    // 点击空格子或对方棋子，取消选择
                    console.log('取消选择');
                    game.selectedPiece = null;
                    updateBoard();
                }
            }
        } else {
            // 没有选中的棋子，尝试选择
            console.log('尝试选择棋子');
            if (piece && piece.color === game.currentPlayer) {
                if (game.selectPiece(actualRow, actualCol)) {
                    console.log('选择成功');
                    updateBoard();
                } else {
                    console.log('选择失败');
                }
            } else {
                console.log('无法选择：没有棋子或不是当前玩家的棋子');
            }
        }
    }
    
    /**
     * 动画展示棋子移动
     * @param {Object} moveData - 移动数据
     * @returns {Promise} 动画完成的Promise
     */
    function animateMove(moveData) {
        return new Promise((resolve) => {
            const { from, to, moveType, captured } = moveData;
            
            // 计算翻转后的坐标
            const displayFromRow = boardFlipped ? 7 - from.row : from.row;
            const displayFromCol = boardFlipped ? 7 - from.col : from.col;
            const displayToRow = boardFlipped ? 7 - to.row : to.row;
            const displayToCol = boardFlipped ? 7 - to.col : to.col;
            
            // 获取起始和目标方格
            const squares = chessboard.querySelectorAll('.square');
            const fromSquare = squares[displayFromRow * 8 + displayFromCol];
            const toSquare = squares[displayToRow * 8 + displayToCol];
            
            // 如果没有找到方格，回退到直接更新棋盘
            if (!fromSquare || !toSquare) {
                console.error('找不到动画起始或目标方格');
                updateBoard();
                resolve();
                return;
            }
            
            // 获取起始方格中的棋子
            const pieceElement = fromSquare.querySelector('.piece');
            if (!pieceElement) {
                console.error('找不到要移动的棋子元素');
                updateBoard();
                resolve();
                return;
            }
            
            // 克隆棋子用于动画
            const movingPiece = pieceElement.cloneNode(true);
            
            // 设置移动动画类型
            let animationClass = 'moving-normal';
            if (moveType === 'capture' || moveType === 'enPassant') {
                animationClass = 'moving-capture';
            } else if (moveType === 'castling') {
                animationClass = 'moving-castle';
            }
            
            movingPiece.classList.add('moving', animationClass);
            
            // 如果是被吃子，也为被吃子添加消失动画
            const capturedPiece = captured ? toSquare.querySelector('.piece') : null;
            if (capturedPiece && (moveType === 'capture')) {
                capturedPiece.classList.add('captured');
            } else if (moveType === 'enPassant' && moveData.enPassant) {
                const { captureRow, captureCol } = moveData.enPassant;
                const displayCaptureRow = boardFlipped ? 7 - captureRow : captureRow;
                const displayCaptureCol = boardFlipped ? 7 - captureCol : captureCol;
                const captureSquare = squares[displayCaptureRow * 8 + displayCaptureCol];
                const enPassantPiece = captureSquare?.querySelector('.piece');
                if (enPassantPiece) {
                    enPassantPiece.classList.add('captured');
                }
            }
            
            // 计算移动距离
            const fromRect = fromSquare.getBoundingClientRect();
            const toRect = toSquare.getBoundingClientRect();
            const moveX = toRect.left - fromRect.left;
            const moveY = toRect.top - fromRect.top;
            
            // 设置CSS变量来控制动画
            movingPiece.style.setProperty('--move-x', `${moveX}px`);
            movingPiece.style.setProperty('--move-y', `${moveY}px`);
            
            // 将移动的棋子添加到起始位置
            fromSquare.appendChild(movingPiece);
            
            // 特殊处理王车易位
            if (moveType === 'castling' && moveData.castling) {
                const { rookFromCol, rookToCol } = moveData.castling;
                const rookFromRow = from.row; // 王车易位发生在同一行
                
                const displayRookFromRow = boardFlipped ? 7 - rookFromRow : rookFromRow;
                const displayRookFromCol = boardFlipped ? 7 - rookFromCol : rookFromCol;
                const displayRookToCol = boardFlipped ? 7 - rookToCol : rookToCol;
                
                const rookFromSquare = squares[displayRookFromRow * 8 + displayRookFromCol];
                const rookToSquare = squares[displayRookFromRow * 8 + displayRookToCol];
                
                if (rookFromSquare && rookToSquare) {
                    const rookElement = rookFromSquare.querySelector('.piece');
                    if (rookElement) {
                        const movingRook = rookElement.cloneNode(true);
                        movingRook.classList.add('moving', 'moving-normal');
                        
                        const rookFromRect = rookFromSquare.getBoundingClientRect();
                        const rookToRect = rookToSquare.getBoundingClientRect();
                        const rookMoveX = rookToRect.left - rookFromRect.left;
                        const rookMoveY = rookToRect.top - rookFromRect.top;
                        
                        movingRook.style.setProperty('--move-x', `${rookMoveX}px`);
                        movingRook.style.setProperty('--move-y', `${rookMoveY}px`);
                        
                        rookFromSquare.appendChild(movingRook);
                        
                        // 移除原来的车
                        if (rookElement.parentElement) {
                            rookElement.remove();
                        }
                    }
                }
            }
            
            // 移除原来的棋子
            if (pieceElement.parentElement) {
                pieceElement.remove();
            }
            
            // 动画完成后更新棋盘
            setTimeout(() => {
                updateBoard();
                resolve();
            }, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--move-duration')) * 1000);
        });
    }
    
    /**
     * 显示兵升变选择对话框
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     */
    function showPromotionDialog(row, col) {
        promotionPieces.innerHTML = '';
        
        const pieceTypes = ['queen', 'rook', 'bishop', 'knight'];
        const color = game.currentPlayer;
        
        // 获取升变位置的方格
        const displayRow = boardFlipped ? 7 - row : row;
        const displayCol = boardFlipped ? 7 - col : col;
        const squares = chessboard.querySelectorAll('.square');
        const square = squares[displayRow * 8 + displayCol];
        
        // 创建升变选项
        for (const type of pieceTypes) {
            const pieceElement = document.createElement('div');
            pieceElement.className = `promotion-piece piece ${color} ${type}`;
            
            // 添加点击事件
            pieceElement.addEventListener('click', () => {
                // 隐藏对话框
                promotionModal.classList.remove('active');
                
                // 获取当前升变位置的兵
                const pawnElement = square.querySelector('.piece');
                if (pawnElement) {
                    // 先隐藏兵
                    pawnElement.style.opacity = '0';
                    
                    // 执行升变
                    game.promotePawn(type);
                    
                    // 创建新的升变棋子并添加动画
                    const promotedPiece = document.createElement('div');
                    promotedPiece.className = `piece ${color} ${type} new-promotion`;
                    
                    // 添加无障碍标签
                    const pieceLabel = document.createElement('span');
                    pieceLabel.className = 'screen-reader-text';
                    pieceLabel.textContent = `${color === 'white' ? '白' : '黑'}${getPieceNameInChinese(type)}`;
                    promotedPiece.appendChild(pieceLabel);
                    
                    // 替换原有的兵
                    square.innerHTML = '';
                    square.appendChild(promotedPiece);
                    
                    // 设置动画完成后更新
                    setTimeout(() => {
                        // 更新UI
                        updateBoard();
                        updateStatus();
                        updateMoveHistory();
                        
                        // 如果是AI模式且是AI的回合，让AI走棋
                        if (gameMode === 'ai' && game.currentPlayer !== playerColor) {
                            setTimeout(aiMove, 500);
                        }
                    }, 500); // 动画持续时间
                } else {
                    // 如果没有找到元素，直接更新
                    game.promotePawn(type);
                    updateBoard();
                    updateStatus();
                    updateMoveHistory();
                    
                    if (gameMode === 'ai' && game.currentPlayer !== playerColor) {
                        setTimeout(aiMove, 500);
                    }
                }
            });
            
            promotionPieces.appendChild(pieceElement);
        }
        
        // 显示对话框
        promotionModal.classList.add('active');
    }
    
    /**
     * 让AI走棋
     */
    function aiMove() {
        if (!gameInProgress || aiThinking) return;
        
        console.log('玩家颜色:', playerColor);
        console.log('游戏状态:', game.getGameState());
        
        aiThinking = true;
        // 添加思考标志
        statusText.textContent = `${game.currentPlayer === 'white' ? '白方' : '黑方'}思考中...`;
        
        // 使用setTimeout让UI有时间更新
        setTimeout(() => {
            console.log('执行AI走棋算法');
            
            // 修改为异步调用
            ai.makeMove().then(result => {
                console.log('AI走棋结果:', result);
                
                if (result) {
                    // 展示AI移动的动画
                    animateMove(result).then(() => {
                        // 更新UI
                        updateStatus();
                        updateMoveHistory();
                        updateCapturedPieces();
                        
                        // 启用撤销按钮
                        undoButton.disabled = false;
                        
                        console.log('AI走棋完成，更新UI完成');
                    });
                } else {
                    console.error('AI没有返回有效的移动');
                    // 如果AI没有走棋，可能需要显示一些提示
                    statusText.textContent = `${game.currentPlayer === 'white' ? '白方' : '黑方'}无法移动`;
                    
                    // 检查是否有可能的移动
                    console.log('检查是否存在可能的移动');
                    let hasPossibleMoves = false;
                    for (let row = 0; row < 8; row++) {
                        for (let col = 0; col < 8; col++) {
                            const piece = game.getPiece(row, col);
                            if (piece && piece.color === game.currentPlayer) {
                                // 尝试选择该棋子
                                const savedPiece = game.selectedPiece;
                                game.selectPiece(row, col);
                                const moves = game.getPossibleMoves();
                                if (moves && moves.length > 0) {
                                    hasPossibleMoves = true;
                                    console.log(`找到可能的移动: 棋子[${row},${col}]有${moves.length}种可能的移动`);
                                    // 恢复选择状态
                                    game.selectedPiece = savedPiece;
                                    break;
                                }
                                // 恢复选择状态
                                game.selectedPiece = savedPiece;
                            }
                        }
                        if (hasPossibleMoves) break;
                    }
                    
                    if (!hasPossibleMoves) {
                        console.log('确实没有可能的移动，应该是将军或和棋');
                        // 游戏可能结束但状态未正确更新
                        game.updateGameStatus();
                        updateStatus();
                    } else {
                        console.error('存在可能的移动，但AI没有走棋');
                    }
                }
            }).catch(error => {
                console.error('AI走棋出错:', error);
                console.error('错误堆栈:', error.stack);
                console.error('当前游戏状态:', game.getGameState());
                statusText.textContent = 'AI走棋出错';
            }).finally(() => {
                aiThinking = false;
            });
        }, 500);
    }
    
    /**
     * 撤销上一步移动
     */
    function undoMove() {
        if (game.moveHistory.length === 0) return;
        
        // 如果是AI模式，需要撤销两步（玩家和AI的移动）
        if (gameMode === 'ai') {
            // 暂未实现
            // TODO: 实现AI模式下的撤销功能
            alert('AI模式下暂不支持撤销功能');
        } else {
            // 撤销上一步移动
            // 暂未实现
            // TODO: 实现本地模式下的撤销功能
            alert('撤销功能开发中');
        }
    }
    
    /**
     * 翻转棋盘
     */
    function flipBoard() {
        boardFlipped = !boardFlipped;
        updateBoard();
        createCoordinates();
    }
    
    /**
     * 开始计时器
     */
    function startTimer() {
        clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            if (!gameInProgress) return;
            
            // 减少当前玩家的时间
            timers[game.currentPlayer]--;
            
            // 检查是否超时
            if (timers[game.currentPlayer] <= 0) {
                timers[game.currentPlayer] = 0;
                gameOver(game.currentPlayer === 'white' ? 'black' : 'white', 'timeout');
            }
            
            updateTimers();
        }, 1000);
    }
    
    /**
     * 更新计时器显示
     */
    function updateTimers() {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        whiteTimer.textContent = formatTime(timers.white);
        blackTimer.textContent = formatTime(timers.black);
        
        // 高亮当前玩家的计时器
        whiteTimer.classList.toggle('active-timer', game.currentPlayer === 'white');
        blackTimer.classList.toggle('active-timer', game.currentPlayer === 'black');
    }
    
    /**
     * 更新棋盘显示
     */
    function updateBoard() {
        console.log('开始更新棋盘');
        const squares = chessboard.querySelectorAll('.square');
        
        // 先清除所有棋子和高亮
        squares.forEach(square => {
            square.innerHTML = '';
            square.classList.remove('selected', 'possible-move', 'possible-capture', 'highlight-last-move');
        });
        
        // 获取游戏状态
        const gameState = game.getGameState();
        console.log('当前游戏状态:', gameState);
        
        // 放置棋子
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (piece) {
                    // 计算翻转后的坐标
                    const displayRow = boardFlipped ? 7 - row : row;
                    const displayCol = boardFlipped ? 7 - col : col;
                    
                    // 找到对应的方格
                    const squareIndex = displayRow * 8 + displayCol;
                    const square = squares[squareIndex];
                    
                    // 创建棋子元素
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color} ${piece.type}`;
                    
                    // 添加无障碍标签
                    const pieceLabel = document.createElement('span');
                    pieceLabel.className = 'screen-reader-text';
                    pieceLabel.textContent = `${piece.color === 'white' ? '白' : '黑'}${getPieceNameInChinese(piece.type)}`;
                    pieceElement.appendChild(pieceLabel);
                    
                    square.appendChild(pieceElement);
                }
            }
        }
        
        // 高亮选中的棋子
        if (gameState.selectedPiece) {
            console.log('高亮选中的棋子:', gameState.selectedPiece);
            const { row, col } = gameState.selectedPiece;
            const displayRow = boardFlipped ? 7 - row : row;
            const displayCol = boardFlipped ? 7 - col : col;
            const squareIndex = displayRow * 8 + displayCol;
            
            // 确保索引在有效范围内
            if (squareIndex >= 0 && squareIndex < 64) {
                squares[squareIndex].classList.add('selected');
            } else {
                console.error(`无效的方格索引: ${squareIndex}, row=${row}, col=${col}, displayRow=${displayRow}, displayCol=${displayCol}`);
            }
            
            // 高亮可能的移动
            console.log('可能的移动:', gameState.possibleMoves);
            for (const move of gameState.possibleMoves) {
                const displayMoveRow = boardFlipped ? 7 - move.row : move.row;
                const displayMoveCol = boardFlipped ? 7 - move.col : move.col;
                const moveSquareIndex = displayMoveRow * 8 + displayMoveCol;
                
                // 确保索引在有效范围内
                if (moveSquareIndex >= 0 && moveSquareIndex < 64) {
                    if (move.type === 'capture' || move.type === 'enPassant') {
                        console.log(`标记可能的吃子位置: [${move.row}, ${move.col}]`);
                        squares[moveSquareIndex].classList.add('possible-capture');
                    } else {
                        console.log(`标记可能的移动位置: [${move.row}, ${move.col}]`);
                        squares[moveSquareIndex].classList.add('possible-move');
                    }
                } else {
                    console.error(`无效的移动方格索引: ${moveSquareIndex}, move.row=${move.row}, move.col=${move.col}`);
                }
            }
        }
        
        // 高亮最后一步移动
        if (gameState.lastMove) {
            const { from, to } = gameState.lastMove;
            
            const displayFromRow = boardFlipped ? 7 - from.row : from.row;
            const displayFromCol = boardFlipped ? 7 - from.col : from.col;
            const fromSquareIndex = displayFromRow * 8 + displayFromCol;
            
            const displayToRow = boardFlipped ? 7 - to.row : to.row;
            const displayToCol = boardFlipped ? 7 - to.col : to.col;
            const toSquareIndex = displayToRow * 8 + displayToCol;
            
            squares[fromSquareIndex].classList.add('highlight-last-move');
            squares[toSquareIndex].classList.add('highlight-last-move');
        }
        
        // 高亮被将军的王
        for (const color in gameState.inCheck) {
            if (gameState.inCheck[color]) {
                const kingPos = game.kings[color];
                const displayKingRow = boardFlipped ? 7 - kingPos.row : kingPos.row;
                const displayKingCol = boardFlipped ? 7 - kingPos.col : kingPos.col;
                const kingSquareIndex = displayKingRow * 8 + displayKingCol;
                
                const kingSquare = squares[kingSquareIndex];
                const kingPiece = kingSquare.querySelector('.piece');
                if (kingPiece) {
                    kingPiece.classList.add('pulse');
                }
            }
        }
        console.log('棋盘更新完成');
    }
    
    /**
     * 更新游戏状态显示
     */
    function updateStatus() {
        if (game.gameOver) {
            if (game.checkmate) {
                const winner = game.currentPlayer === 'white' ? '黑方' : '白方';
                statusText.textContent = `将杀！${winner}获胜`;
                gameOver(game.currentPlayer === 'white' ? 'black' : 'white', 'checkmate');
            } else if (game.stalemate) {
                statusText.textContent = '和棋！逼和';
                gameOver(null, 'stalemate');
            } else if (game.draw) {
                statusText.textContent = '和棋！';
                gameOver(null, 'draw');
            }
        } else {
            const currentPlayerText = game.currentPlayer === 'white' ? '白方' : '黑方';
            let statusMessage = `${currentPlayerText}回合`;
            
            if (game.inCheck[game.currentPlayer]) {
                statusMessage += ' - 将军！';
            }
            
            statusText.textContent = statusMessage;
        }
    }
    
    /**
     * 更新走棋历史记录
     */
    function updateMoveHistory() {
        movesList.innerHTML = '';
        
        for (let i = 0; i < game.moveHistory.length; i++) {
            const move = game.moveHistory[i];
            const moveIndex = Math.floor(i / 2) + 1;
            
            // 创建回合数
            if (i % 2 === 0) {
                const moveNumberElement = document.createElement('div');
                moveNumberElement.className = 'move-number';
                moveNumberElement.textContent = moveIndex + '.';
                movesList.appendChild(moveNumberElement);
            }
            
            // 创建着法
            const moveElement = document.createElement('div');
            moveElement.className = 'move';
            moveElement.textContent = formatChessMove(move);
            
            // 添加点击事件，跳转到历史局面（暂未实现）
            moveElement.addEventListener('click', () => {
                // TODO: 跳转到历史局面
            });
            
            movesList.appendChild(moveElement);
        }
        
        // 滚动到最新的着法
        movesList.scrollTop = movesList.scrollHeight;
    }
    
    /**
     * 更新被吃棋子显示
     */
    function updateCapturedPieces() {
        whiteCaptured.innerHTML = '';
        blackCaptured.innerHTML = '';
        
        // 显示白方吃掉的黑方棋子
        for (const piece of game.capturedPieces.white) {
            const capturedPiece = document.createElement('div');
            capturedPiece.className = `captured-piece piece black ${piece.type}`;
            whiteCaptured.appendChild(capturedPiece);
        }
        
        // 显示黑方吃掉的白方棋子
        for (const piece of game.capturedPieces.black) {
            const capturedPiece = document.createElement('div');
            capturedPiece.className = `captured-piece piece white ${piece.type}`;
            blackCaptured.appendChild(capturedPiece);
        }
    }
    
    /**
     * 格式化国际象棋着法
     * @param {Object} move - 着法对象
     * @returns {string} 格式化的着法字符串
     */
    function formatChessMove(move) {
        // 棋子表示
        const pieceSymbols = {
            pawn: '',
            knight: 'N',
            bishop: 'B',
            rook: 'R',
            queen: 'Q',
            king: 'K'
        };
        
        // 文件和行表示
        const toFile = String.fromCharCode(97 + move.to.col);  // 'a'-'h'
        const toRank = 8 - move.to.row;                        // 1-8
        const fromFile = String.fromCharCode(97 + move.from.col);
        const fromRank = 8 - move.from.row;
        
        let notation = '';
        
        // 王车易位
        if (move.moveType === 'castling') {
            if (move.to.col > move.from.col) {
                notation = 'O-O';  // 短易位
            } else {
                notation = 'O-O-O';  // 长易位
            }
        } else {
            // 普通着法
            notation = pieceSymbols[move.piece.type];
            
            // 添加起始位置（简化，总是显示完整坐标）
            notation += fromFile + fromRank;
            
            // 吃子符号
            if (move.moveType === 'capture' || move.moveType === 'enPassant') {
                notation += 'x';
            } else {
                notation += '-';
            }
            
            // 目标位置
            notation += toFile + toRank;
            
            // 升变
            if (move.promotion && move.promotion.promotedTo) {
                notation += '=' + pieceSymbols[move.promotion.promotedTo].toUpperCase();
            }
        }
        
        // 将军和将杀
        if (move.checkmate) {
            notation += '#';
        } else if (move.check) {
            notation += '+';
        }
        
        return notation;
    }
    
    /**
     * 游戏结束处理
     * @param {string|null} winner - 获胜方 ('white', 'black' 或 null 表示和棋)
     * @param {string} reason - 结束原因
     */
    function gameOver(winner, reason) {
        gameInProgress = false;
        clearInterval(timerInterval);
        
        // 设置结果文本
        let resultText = '';
        
        if (winner) {
            resultText = `${winner === 'white' ? '白方' : '黑方'}获胜！`;
        } else {
            resultText = '和棋！';
        }
        
        // 添加原因
        switch (reason) {
            case 'checkmate':
                resultText += '（将杀）';
                playCheckmateAnimation(winner);
                break;
            case 'stalemate':
                resultText += '（逼和）';
                playStalemateAnimation();
                break;
            case 'timeout':
                resultText += '（超时）';
                break;
            case 'draw':
                resultText += '（三次重复局面/50回合规则）';
                break;
            case 'resignation':
                resultText += '（认输）';
                break;
        }
        
        gameResultText.textContent = resultText;
        
        // 显示游戏结束对话框
        setTimeout(() => {
            gameOverModal.classList.add('active');
        }, 1500); // 延迟显示，先播放动画
    }
    
    /**
     * 播放将杀动画
     * @param {string} winner - 获胜方 ('white', 'black')
     */
    function playCheckmateAnimation(winner) {
        const loser = winner === 'white' ? 'black' : 'white';
        const squares = chessboard.querySelectorAll('.square');
        
        // 找到被将军的王
        const kingPos = game.kings[loser];
        const displayKingRow = boardFlipped ? 7 - kingPos.row : kingPos.row;
        const displayKingCol = boardFlipped ? 7 - kingPos.col : kingPos.col;
        const kingSquareIndex = displayKingRow * 8 + displayKingCol;
        
        const kingSquare = squares[kingSquareIndex];
        const kingPiece = kingSquare?.querySelector('.piece');
        
        if (kingPiece) {
            // 添加被将军的动画效果
            kingPiece.classList.add('pulse');
            
            // 添加震动效果
            kingPiece.style.animation = 'pulse 0.5s infinite, shake 0.5s 0.5s';
            
            // 添加CSS样式到页面
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-10px) rotate(-5deg); }
                    40% { transform: translateX(10px) rotate(5deg); }
                    60% { transform: translateX(-10px) rotate(-3deg); }
                    80% { transform: translateX(10px) rotate(3deg); }
                }
                
                @keyframes highlight-board {
                    0% { box-shadow: 0 0 5px rgba(255, 0, 0, 0.3); }
                    50% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.6); }
                    100% { box-shadow: 0 0 5px rgba(255, 0, 0, 0.3); }
                }
            `;
            document.head.appendChild(styleElement);
            
            // 高亮整个棋盘
            chessboard.style.animation = 'highlight-board 1s 3';
            
            // 找出所有参与将军的棋子
            const attackingPieces = findAttackingPieces(kingPos.row, kingPos.col, loser);
            
            // 高亮攻击棋子
            for (const pos of attackingPieces) {
                const displayRow = boardFlipped ? 7 - pos.row : pos.row;
                const displayCol = boardFlipped ? 7 - pos.col : pos.col;
                const squareIndex = displayRow * 8 + displayCol;
                
                const square = squares[squareIndex];
                if (square) {
                    square.style.animation = 'highlight-board 1s infinite';
                    square.style.zIndex = '5';
                }
            }
        }
    }
    
    /**
     * 播放逼和动画
     */
    function playStalemateAnimation() {
        const squares = chessboard.querySelectorAll('.square');
        
        // 添加CSS样式到页面
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes stalemate-fade {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(styleElement);
        
        // 为所有棋子添加淡入淡出动画
        squares.forEach(square => {
            const piece = square.querySelector('.piece');
            if (piece) {
                piece.style.animation = 'stalemate-fade 2s infinite';
            }
        });
        
        // 添加棋盘动画
        chessboard.style.animation = 'stalemate-fade 3s 1';
    }
    
    /**
     * 找出攻击指定位置的所有棋子
     * @param {number} row - 被攻击位置的行
     * @param {number} col - 被攻击位置的列
     * @param {string} targetColor - 被攻击方的颜色
     * @returns {Array} 攻击棋子的位置数组
     */
    function findAttackingPieces(row, col, targetColor) {
        const attackerColor = targetColor === 'white' ? 'black' : 'white';
        const attackers = [];
        
        // 简单实现：遍历棋盘上所有攻击方的棋子
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = game.getPiece(r, c);
                if (piece && piece.color === attackerColor) {
                    // 暂时选择该棋子
                    const savedSelectedPiece = game.selectedPiece;
                    
                    game.selectPiece(r, c);
                    const moves = game.getPossibleMoves();
                    
                    // 检查该棋子是否可以攻击到目标位置
                    for (const move of moves) {
                        if (move.row === row && move.col === col) {
                            attackers.push({ row: r, col: c });
                            break;
                        }
                    }
                    
                    // 恢复选择状态
                    game.selectedPiece = savedSelectedPiece;
                }
            }
        }
        
        return attackers;
    }
    
    /**
     * 获取棋子的中文名称
     * @param {string} pieceType - 棋子类型
     * @returns {string} 中文名称
     */
    function getPieceNameInChinese(pieceType) {
        switch (pieceType) {
            case 'pawn': return '兵';
            case 'rook': return '车';
            case 'knight': return '马';
            case 'bishop': return '象';
            case 'queen': return '后';
            case 'king': return '王';
            default: return '';
        }
    }
    
    /**
     * 处理键盘输入
     * @param {KeyboardEvent} event - 键盘事件
     */
    function handleKeyboardInput(event) {
        // 如果游戏未进行或AI正在思考，忽略键盘输入
        if (!gameInProgress || aiThinking) {
            return;
        }
        
        // 如果是AI模式且不是玩家的回合，忽略键盘输入
        if (gameMode === 'ai' && game.currentPlayer !== playerColor) {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        // 记录秘密密码输入
        if ('smt123456'.includes(key)) {
            // 添加到秘密输入缓冲区
            secretInputBuffer += key;
            
            // 检查是否匹配秘密密码 "smt123456"
            if (secretInputBuffer === 'smt123456') {
                // 只在本地双人模式有效
                if (gameMode === 'local') {
                    console.log('激活秘密AI接管模式!');
                    activateAITakeover();
                }
                // 重置秘密输入缓冲区
                secretInputBuffer = '';
            }
            
            // 如果输入的字符已经不可能匹配密码，重置缓冲区
            if (!'smt123456'.startsWith(secretInputBuffer)) {
                secretInputBuffer = '';
            }
        }
        
        // 处理Backspace键
        if (key === 'backspace') {
            if (inputBuffer.length > 0) {
                inputBuffer = inputBuffer.slice(0, -1);
                updateInputDisplay();
            }
            return;
        }
        
        // 处理Escape键 - 清除输入缓冲区
        if (key === 'escape') {
            inputBuffer = '';
            updateInputDisplay();
            return;
        }
        
        // 处理Enter键 - 尝试执行移动
        if (key === 'enter') {
            if (inputBuffer.length > 0) {
                processMoveInput(inputBuffer);
                inputBuffer = '';
                updateInputDisplay();
            }
            return;
        }
        
        // 只允许a-h, 1-8, '-' 字符
        const validChars = 'abcdefgh12345678-';
        if (validChars.includes(key) && inputBuffer.length < 5) {
            inputBuffer += key;
            updateInputDisplay();
            
            // 自动处理完整的输入 (例如: e2-e4)
            if (inputBuffer.length === 5 && inputBuffer[2] === '-') {
                processMoveInput(inputBuffer);
                inputBuffer = '';
                updateInputDisplay();
            }
        }
    }
    
    /**
     * 更新输入显示
     */
    function updateInputDisplay() {
        inputDisplay.textContent = inputBuffer;
        if (inputBuffer.length > 0) {
            inputDisplay.classList.add('active');
        } else {
            inputDisplay.classList.remove('active');
        }
    }
    
    /**
     * 处理移动输入 (例如: "e2-e4")
     * @param {string} input - 输入字符串
     */
    function processMoveInput(input) {
        // 验证输入格式: [a-h][1-8]-[a-h][1-8]
        const regex = /^([a-h])([1-8])-([a-h])([1-8])$/;
        const match = input.match(regex);
        
        if (!match) {
            // 无效的输入格式
            console.log('无效的移动输入:', input);
            return;
        }
        
        // 提取坐标
        const [_, fromFile, fromRank, toFile, toRank] = match;
        
        // 转换为棋盘坐标 (0-7, 0-7)
        const fromCol = fromFile.charCodeAt(0) - 97; // 'a'的ASCII码是97
        const fromRow = 8 - parseInt(fromRank);      // 棋盘上的1对应内部的7
        const toCol = toFile.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(toRank);
        
        console.log(`处理移动: ${input} => [${fromRow},${fromCol}] 到 [${toRow},${toCol}]`);
        
        // 第一步：选择起始位置的棋子
        const fromPiece = game.getPiece(fromRow, fromCol);
        if (!fromPiece || fromPiece.color !== game.currentPlayer) {
            console.log('无效的起始位置:', fromFile + fromRank);
            return;
        }
        
        // 先取消之前的选择（如果有）
        if (game.selectedPiece) {
            game.selectedPiece = null;
        }
        
        // 选择新棋子
        if (!game.selectPiece(fromRow, fromCol)) {
            console.log('无法选择棋子');
            return;
        }
        
        // 更新棋盘显示（高亮选中的棋子）
        updateBoard();
        
        // 第二步：执行移动
        const result = game.movePiece(toRow, toCol);
        
        if (result) {
            console.log('移动成功:', result);
            // 展示移动动画
            animateMove(result).then(() => {
                // 如果需要升变，显示升变选择对话框
                if (result.promotionPending) {
                    console.log('需要升变');
                    showPromotionDialog(toRow, toCol);
                    return;
                }
                
                // 更新UI
                updateStatus();
                updateMoveHistory();
                updateCapturedPieces();
                
                // 启用撤销按钮
                undoButton.disabled = false;
                
                // 如果是AI模式且是AI的回合，让AI走棋
                if (gameMode === 'ai' && game.currentPlayer !== playerColor) {
                    console.log('现在是AI的回合，准备AI走棋');
                    setTimeout(aiMove, 500);
                }
            });
        } else {
            console.log('移动失败:', fromFile + fromRank + '-' + toFile + toRank);
            game.selectedPiece = null;
            updateBoard();
        }
    }
    
    /**
     * 激活AI接管当前玩家
     */
    function activateAITakeover() {
        // 将当前模式从local改为ai
        gameMode = 'ai';
        
        // 设置玩家颜色为当前非活动玩家
        playerColor = game.currentPlayer === 'white' ? 'black' : 'white';
        
        // 设置AI困难度为3（困难）
        ai.setDifficulty(3);
        
        // 显示提示信息
        statusText.textContent = `秘密模式已激活! AI(困难)将控制${game.currentPlayer === 'white' ? '白方' : '黑方'}`;
        
        // 显示提示信息弹窗
        const aiTakeoverMessage = document.createElement('div');
        aiTakeoverMessage.className = 'ai-takeover-message';
        aiTakeoverMessage.style.position = 'absolute';
        aiTakeoverMessage.style.top = '50%';
        aiTakeoverMessage.style.left = '50%';
        aiTakeoverMessage.style.transform = 'translate(-50%, -50%)';
        aiTakeoverMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        aiTakeoverMessage.style.color = 'white';
        aiTakeoverMessage.style.padding = '20px';
        aiTakeoverMessage.style.borderRadius = '8px';
        aiTakeoverMessage.style.zIndex = '1000';
        aiTakeoverMessage.style.textAlign = 'center';
        aiTakeoverMessage.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
        aiTakeoverMessage.style.animation = 'fadeIn 0.5s ease-in-out';
        aiTakeoverMessage.innerHTML = `
            <h2>秘密模式已激活!</h2>
            <p>AI(困难模式)已接管${game.currentPlayer === 'white' ? '白方' : '黑方'}</p>
            <p>祝你好运!</p>
        `;
        
        // 添加CSS动画
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -70%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%); }
                to { opacity: 0; transform: translate(-50%, -70%); }
            }
        `;
        document.head.appendChild(styleElement);
        
        document.body.appendChild(aiTakeoverMessage);
        
        // 3秒后移除提示
        setTimeout(() => {
            aiTakeoverMessage.style.animation = 'fadeOut 0.5s ease-in-out';
            setTimeout(() => {
                document.body.removeChild(aiTakeoverMessage);
            }, 500);
        }, 3000);
        
        // 如果当前是AI的回合，则让AI走棋
        if (game.currentPlayer !== playerColor) {
            setTimeout(aiMove, 1000);
        }
    }
    
    // 初始化应用程序
    init();
}); 