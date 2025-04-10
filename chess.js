/**
 * 国际象棋游戏核心逻辑
 * 实现了国际象棋规则，棋盘状态和移动验证
 */

class ChessGame {
    constructor() {
        // 初始化棋盘
        this.board = this.createEmptyBoard();
        this.resetBoard();
        
        // 游戏状态
        this.currentPlayer = 'white';  // 白方先行
        this.gameOver = false;
        this.checkmate = false;
        this.stalemate = false;
        this.draw = false;
        this.selectedPiece = null;
        this.kings = { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } };
        
        // 历史记录
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.positionHistory = {};  // 用于三次重复位置判断
        
        // 特殊规则状态
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;  // 50回合规则计数器
        this.fullMoveNumber = 1;
        
        // 用于检测将军状态
        this.inCheck = { white: false, black: false };
    }
    
    /**
     * 创建空棋盘
     * @returns {Array} 8x8的二维数组表示棋盘
     */
    createEmptyBoard() {
        const board = [];
        for (let i = 0; i < 8; i++) {
            board.push(Array(8).fill(null));
        }
        return board;
    }
    
    /**
     * 重置棋盘到初始状态
     */
    resetBoard() {
        // 放置棋子
        this.placePiece(0, 0, { type: 'rook', color: 'black' });
        this.placePiece(0, 1, { type: 'knight', color: 'black' });
        this.placePiece(0, 2, { type: 'bishop', color: 'black' });
        this.placePiece(0, 3, { type: 'queen', color: 'black' });
        this.placePiece(0, 4, { type: 'king', color: 'black' });
        this.placePiece(0, 5, { type: 'bishop', color: 'black' });
        this.placePiece(0, 6, { type: 'knight', color: 'black' });
        this.placePiece(0, 7, { type: 'rook', color: 'black' });
        
        // 黑方兵
        for (let col = 0; col < 8; col++) {
            this.placePiece(1, col, { type: 'pawn', color: 'black' });
        }
        
        // 白方兵
        for (let col = 0; col < 8; col++) {
            this.placePiece(6, col, { type: 'pawn', color: 'white' });
        }
        
        // 白方主要棋子
        this.placePiece(7, 0, { type: 'rook', color: 'white' });
        this.placePiece(7, 1, { type: 'knight', color: 'white' });
        this.placePiece(7, 2, { type: 'bishop', color: 'white' });
        this.placePiece(7, 3, { type: 'queen', color: 'white' });
        this.placePiece(7, 4, { type: 'king', color: 'white' });
        this.placePiece(7, 5, { type: 'bishop', color: 'white' });
        this.placePiece(7, 6, { type: 'knight', color: 'white' });
        this.placePiece(7, 7, { type: 'rook', color: 'white' });
    }
    
    /**
     * 在棋盘上放置棋子
     * @param {number} row - 行坐标 (0-7)
     * @param {number} col - 列坐标 (0-7)
     * @param {Object} piece - 棋子对象，包含type和color属性
     */
    placePiece(row, col, piece) {
        this.board[row][col] = piece;
    }
    
    /**
     * 移除棋盘上的棋子
     * @param {number} row - 行坐标 (0-7)
     * @param {number} col - 列坐标 (0-7)
     * @returns {Object|null} 被移除的棋子或null
     */
    removePiece(row, col) {
        const piece = this.board[row][col];
        this.board[row][col] = null;
        return piece;
    }
    
    /**
     * 获取指定位置的棋子
     * @param {number} row - 行坐标 (0-7)
     * @param {number} col - 列坐标 (0-7)
     * @returns {Object|null} 棋子对象或null
     */
    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) {
            return null;
        }
        return this.board[row][col];
    }
    
    /**
     * 判断坐标是否在棋盘内
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @returns {boolean} 是否在棋盘内
     */
    isValidPosition(row, col) {
        return row >= 0 && row <= 7 && col >= 0 && col <= 7;
    }
    
    /**
     * 切换当前玩家
     */
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    }
    
    /**
     * 选择棋子
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @returns {boolean} 选择是否成功
     */
    selectPiece(row, col) {
        const piece = this.getPiece(row, col);
        
        // 检查是否可以选择该棋子
        if (!piece || piece.color !== this.currentPlayer || this.gameOver) {
            return false;
        }
        
        this.selectedPiece = { row, col, piece };
        return true;
    }
    
    /**
     * 获取所选棋子的可能移动位置
     * @returns {Array} 可能的移动位置数组，每个元素为{row, col, type}
     */
    getPossibleMoves() {
        if (!this.selectedPiece) {
            return [];
        }
        
        const { row, col, piece } = this.selectedPiece;
        let moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }
        
        // 过滤掉会导致自己被将军的移动
        return this.filterValidMoves(moves, row, col, piece);
    }
    
    /**
     * 获取兵的可能移动位置
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 棋子颜色
     * @returns {Array} 可能的移动位置数组
     */
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // 前进一步
        if (this.isValidPosition(row + direction, col) && !this.getPiece(row + direction, col)) {
            moves.push({ row: row + direction, col, type: 'move' });
            
            // 前进两步（起始位置）
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col, type: 'move' });
            }
        }
        
        // 吃子（左斜）
        if (this.isValidPosition(row + direction, col - 1)) {
            const piece = this.getPiece(row + direction, col - 1);
            if (piece && piece.color !== color) {
                moves.push({ row: row + direction, col: col - 1, type: 'capture' });
            }
            
            // 吃过路兵
            if (this.enPassantTarget && 
                this.enPassantTarget.row === row + direction && 
                this.enPassantTarget.col === col - 1) {
                moves.push({ 
                    row: row + direction, 
                    col: col - 1, 
                    type: 'enPassant',
                    captureRow: row,
                    captureCol: col - 1
                });
            }
        }
        
        // 吃子（右斜）
        if (this.isValidPosition(row + direction, col + 1)) {
            const piece = this.getPiece(row + direction, col + 1);
            if (piece && piece.color !== color) {
                moves.push({ row: row + direction, col: col + 1, type: 'capture' });
            }
            
            // 吃过路兵
            if (this.enPassantTarget && 
                this.enPassantTarget.row === row + direction && 
                this.enPassantTarget.col === col + 1) {
                moves.push({ 
                    row: row + direction, 
                    col: col + 1, 
                    type: 'enPassant',
                    captureRow: row,
                    captureCol: col + 1
                });
            }
        }
        
        return moves;
    }
    
    /**
     * 获取车的可能移动位置
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 棋子颜色
     * @returns {Array} 可能的移动位置数组
     */
    getRookMoves(row, col, color) {
        const moves = [];
        const directions = [
            { dr: -1, dc: 0 }, // 上
            { dr: 1, dc: 0 },  // 下
            { dr: 0, dc: -1 }, // 左
            { dr: 0, dc: 1 }   // 右
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                
                if (!piece) {
                    // 空位，可以移动
                    moves.push({ row: r, col: c, type: 'move' });
                } else if (piece.color !== color) {
                    // 敌方棋子，可以吃
                    moves.push({ row: r, col: c, type: 'capture' });
                    break;
                } else {
                    // 友方棋子，不能越过
                    break;
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return moves;
    }
    
    /**
     * 获取马的可能移动位置
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 棋子颜色
     * @returns {Array} 可能的移动位置数组
     */
    getKnightMoves(row, col, color) {
        const moves = [];
        const possibleMoves = [
            { dr: -2, dc: -1 },
            { dr: -2, dc: 1 },
            { dr: -1, dc: -2 },
            { dr: -1, dc: 2 },
            { dr: 1, dc: -2 },
            { dr: 1, dc: 2 },
            { dr: 2, dc: -1 },
            { dr: 2, dc: 1 }
        ];
        
        for (const move of possibleMoves) {
            const r = row + move.dr;
            const c = col + move.dc;
            
            if (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                
                if (!piece) {
                    // 空位，可以移动
                    moves.push({ row: r, col: c, type: 'move' });
                } else if (piece.color !== color) {
                    // 敌方棋子，可以吃
                    moves.push({ row: r, col: c, type: 'capture' });
                }
            }
        }
        
        return moves;
    }
    
    /**
     * 获取象的可能移动位置
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 棋子颜色
     * @returns {Array} 可能的移动位置数组
     */
    getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [
            { dr: -1, dc: -1 }, // 左上
            { dr: -1, dc: 1 },  // 右上
            { dr: 1, dc: -1 },  // 左下
            { dr: 1, dc: 1 }    // 右下
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                
                if (!piece) {
                    // 空位，可以移动
                    moves.push({ row: r, col: c, type: 'move' });
                } else if (piece.color !== color) {
                    // 敌方棋子，可以吃
                    moves.push({ row: r, col: c, type: 'capture' });
                    break;
                } else {
                    // 友方棋子，不能越过
                    break;
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return moves;
    }
    
    /**
     * 获取后的可能移动位置
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 棋子颜色
     * @returns {Array} 可能的移动位置数组
     */
    getQueenMoves(row, col, color) {
        // 后的移动是车和象的移动结合
        return [
            ...this.getRookMoves(row, col, color),
            ...this.getBishopMoves(row, col, color)
        ];
    }
    
    /**
     * 获取王的可能移动位置
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 棋子颜色
     * @returns {Array} 可能的移动位置数组
     */
    getKingMoves(row, col, color) {
        const moves = [];
        const possibleMoves = [
            { dr: -1, dc: -1 },
            { dr: -1, dc: 0 },
            { dr: -1, dc: 1 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: -1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 }
        ];
        
        for (const move of possibleMoves) {
            const r = row + move.dr;
            const c = col + move.dc;
            
            if (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                
                if (!piece) {
                    // 空位，可以移动
                    moves.push({ row: r, col: c, type: 'move' });
                } else if (piece.color !== color) {
                    // 敌方棋子，可以吃
                    moves.push({ row: r, col: c, type: 'capture' });
                }
            }
        }
        
        // 王车易位检查
        if (!this.inCheck[color]) {
            // 王车易位，王侧
            if (this.castlingRights[color].kingSide) {
                const rookCol = 7;
                if (!this.getPiece(row, col + 1) && !this.getPiece(row, col + 2) &&
                    this.getPiece(row, rookCol)?.type === 'rook') {
                    
                    // 检查移动过程中是否会被将军
                    if (!this.isSquareAttacked(row, col + 1, color) && 
                        !this.isSquareAttacked(row, col + 2, color)) {
                        moves.push({ 
                            row, 
                            col: col + 2, 
                            type: 'castling', 
                            rookFromCol: rookCol,
                            rookToCol: col + 1
                        });
                    }
                }
            }
            
            // 王车易位，后侧
            if (this.castlingRights[color].queenSide) {
                const rookCol = 0;
                if (!this.getPiece(row, col - 1) && !this.getPiece(row, col - 2) && 
                    !this.getPiece(row, col - 3) &&
                    this.getPiece(row, rookCol)?.type === 'rook') {
                    
                    // 检查移动过程中是否会被将军
                    if (!this.isSquareAttacked(row, col - 1, color) && 
                        !this.isSquareAttacked(row, col - 2, color)) {
                        moves.push({ 
                            row, 
                            col: col - 2, 
                            type: 'castling', 
                            rookFromCol: rookCol,
                            rookToCol: col - 1
                        });
                    }
                }
            }
        }
        
        return moves;
    }
    
    /**
     * 过滤掉会导致自己被将军的移动
     * @param {Array} moves - 可能的移动位置数组
     * @param {number} fromRow - 起始行
     * @param {number} fromCol - 起始列
     * @param {Object} piece - 棋子对象
     * @returns {Array} 过滤后的移动位置数组
     */
    filterValidMoves(moves, fromRow, fromCol, piece) {
        return moves.filter(move => {
            // 模拟移动
            const capturedPiece = this.simulateMove(fromRow, fromCol, move.row, move.col, move);
            
            // 检查移动后是否会导致自己被将军
            const kingPos = piece.type === 'king' 
                ? { row: move.row, col: move.col } 
                : this.kings[piece.color];
            
            const inCheck = this.isSquareAttacked(kingPos.row, kingPos.col, piece.color);
            
            // 恢复移动
            this.undoSimulatedMove(fromRow, fromCol, move.row, move.col, piece, capturedPiece, move);
            
            return !inCheck;
        });
    }
    
    /**
     * 模拟移动棋子（用于AI计算）
     * @param {number} fromRow - 起始行
     * @param {number} fromCol - 起始列
     * @param {number} toRow - 目标行
     * @param {number} toCol - 目标列
     * @param {Object} move - 移动信息
     * @returns {Object|null} 被吃的棋子或null
     */
    simulateMove(fromRow, fromCol, toRow, toCol, move) {
        if (!move) {
            console.error('simulateMove: 移动信息为空');
            return null;
        }
        
        // 确保有棋子可移动
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) {
            console.error(`simulateMove: 位置[${fromRow},${fromCol}]没有棋子`);
            return null;
        }
        
        // 移动棋子
        this.removePiece(fromRow, fromCol);
        let capturedPiece = null;
        
        // 处理吃子或吃过路兵
        if (move.type === 'enPassant' && move.captureRow !== undefined && move.captureCol !== undefined) {
            capturedPiece = this.removePiece(move.captureRow, move.captureCol);
        } else {
            capturedPiece = this.removePiece(toRow, toCol);
        }
        
        this.placePiece(toRow, toCol, piece);
        
        // 如果是王，更新王的位置
        if (piece.type === 'king') {
            this.kings[piece.color] = { row: toRow, col: toCol };
            
            // 如果是王车易位，还需要移动车
            if (move.type === 'castling' && move.rookFromCol !== undefined && move.rookToCol !== undefined) {
                const rook = this.removePiece(fromRow, move.rookFromCol);
                if (rook) {
                    this.placePiece(fromRow, move.rookToCol, rook);
                }
            }
        }
        
        return capturedPiece;
    }
    
    /**
     * 撤销模拟的移动
     * @param {number} fromRow - 起始行
     * @param {number} fromCol - 起始列
     * @param {number} toRow - 目标行
     * @param {number} toCol - 目标列
     * @param {Object} piece - 棋子对象
     * @param {Object|null} capturedPiece - 被吃掉的棋子
     * @param {Object} move - 移动信息
     */
    undoSimulatedMove(fromRow, fromCol, toRow, toCol, piece, capturedPiece, move) {
        if (!piece || !move) {
            console.error('undoSimulatedMove: 棋子或移动信息为空');
            return;
        }
        
        // 移除目标位置的棋子
        this.removePiece(toRow, toCol);
        
        // 恢复原位置的棋子
        this.placePiece(fromRow, fromCol, piece);
        
        // 恢复被吃的棋子
        if (capturedPiece) {
            if (move.type === 'enPassant' && move.captureRow !== undefined && move.captureCol !== undefined) {
                this.placePiece(move.captureRow, move.captureCol, capturedPiece);
            } else {
                this.placePiece(toRow, toCol, capturedPiece);
            }
        }
        
        // 如果是王，还原王的位置
        if (piece.type === 'king') {
            this.kings[piece.color] = { row: fromRow, col: fromCol };
            
            // 如果是王车易位，还需要还原车
            if (move.type === 'castling' && move.rookFromCol !== undefined && move.rookToCol !== undefined) {
                const rook = this.removePiece(fromRow, move.rookToCol);
                if (rook) {
                    this.placePiece(fromRow, move.rookFromCol, rook);
                }
            }
        }
    }
    
    /**
     * 检查指定位置是否被攻击
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {string} color - 被检查方的颜色
     * @returns {boolean} 是否被攻击
     */
    isSquareAttacked(row, col, color) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // 检查是否被兵攻击
        const pawnDir = color === 'white' ? 1 : -1;
        if (this.isValidPosition(row + pawnDir, col - 1)) {
            const piece = this.getPiece(row + pawnDir, col - 1);
            if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
                return true;
            }
        }
        if (this.isValidPosition(row + pawnDir, col + 1)) {
            const piece = this.getPiece(row + pawnDir, col + 1);
            if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
                return true;
            }
        }
        
        // 检查是否被马攻击
        const knightMoves = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];
        for (const move of knightMoves) {
            const r = row + move.dr;
            const c = col + move.dc;
            if (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                if (piece && piece.type === 'knight' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        // 检查是否被车或后攻击（直线方向）
        const rookDirections = [
            { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
        ];
        for (const dir of rookDirections) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            while (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                if (piece) {
                    if ((piece.type === 'rook' || piece.type === 'queen') && 
                        piece.color === opponentColor) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        // 检查是否被象或后攻击（斜线方向）
        const bishopDirections = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
        ];
        for (const dir of bishopDirections) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            while (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                if (piece) {
                    if ((piece.type === 'bishop' || piece.type === 'queen') && 
                        piece.color === opponentColor) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        // 检查是否被王攻击
        const kingMoves = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
        ];
        for (const move of kingMoves) {
            const r = row + move.dr;
            const c = col + move.dc;
            if (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                if (piece && piece.type === 'king' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * 移动棋子
     * @param {number} toRow - 目标行
     * @param {number} toCol - 目标列
     * @returns {Object|null} 移动信息或null（如果移动非法）
     */
    movePiece(toRow, toCol) {
        if (!this.selectedPiece || this.gameOver) {
            return null;
        }
        
        const { row: fromRow, col: fromCol, piece } = this.selectedPiece;
        
        // 获取所有合法移动
        const possibleMoves = this.getPossibleMoves();
        
        // 检查目标位置是否在合法移动中
        const targetMove = possibleMoves.find(move => 
            move.row === toRow && move.col === toCol
        );
        
        if (!targetMove) {
            return null; // 非法移动
        }
        
        // 记录起始和目标位置的棋子（用于历史记录和撤销）
        const fromPiece = { ...piece };
        const toPiece = this.getPiece(toRow, toCol);
        
        // 移动棋子
        this.removePiece(fromRow, fromCol);
        
        // 处理特殊情况（吃过路兵）
        if (targetMove.type === 'enPassant') {
            this.removePiece(this.enPassantTarget.captureRow, this.enPassantTarget.captureCol);
            if (toPiece) {
                this.capturedPieces[this.currentPlayer].push(toPiece);
            }
        } else if (toPiece) {
            // 记录被吃的棋子
            this.capturedPieces[this.currentPlayer].push(toPiece);
        }
        
        this.placePiece(toRow, toCol, piece);
        
        // 处理特殊情况（王车易位）
        if (targetMove.type === 'castling') {
            const rook = this.removePiece(fromRow, targetMove.rookFromCol);
            this.placePiece(fromRow, targetMove.rookToCol, rook);
        }
        
        // 更新王的位置
        if (piece.type === 'king') {
            this.kings[piece.color] = { row: toRow, col: toCol };
            
            // 王移动后失去王车易位权利
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        }
        
        // 车移动后失去王车易位权利
        if (piece.type === 'rook') {
            if (fromCol === 0) { // 后侧车
                this.castlingRights[piece.color].queenSide = false;
            } else if (fromCol === 7) { // 王侧车
                this.castlingRights[piece.color].kingSide = false;
            }
        }
        
        // 处理兵的升变
        let promotionPending = false;
        if (piece.type === 'pawn') {
            // 检查是否达到底线
            if ((piece.color === 'white' && toRow === 0) || 
                (piece.color === 'black' && toRow === 7)) {
                promotionPending = true;
            }
            
            // 设置过路兵目标
            this.enPassantTarget = null;
            if (Math.abs(fromRow - toRow) === 2) {
                this.enPassantTarget = {
                    row: (fromRow + toRow) / 2,
                    col: toCol,
                    captureRow: toRow,
                    captureCol: toCol
                };
            }
        } else {
            // 非兵的移动，清除过路兵目标
            this.enPassantTarget = null;
        }
        
        // 更新着法记录
        const moveData = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: fromPiece,
            captured: toPiece,
            moveType: targetMove.type,
            moveNumber: this.fullMoveNumber,
            castling: targetMove.type === 'castling' ? {
                rookFromCol: targetMove.rookFromCol,
                rookToCol: targetMove.rookToCol
            } : null,
            enPassant: targetMove.type === 'enPassant' ? {
                captureRow: this.enPassantTarget?.captureRow,
                captureCol: this.enPassantTarget?.captureCol
            } : null,
            promotion: promotionPending ? { row: toRow, col: toCol } : null,
            check: false,
            checkmate: false
        };
        
        this.moveHistory.push(moveData);
        
        // 重置选择
        this.selectedPiece = null;
        
        // 检查将军和将杀
        this.updateGameStatus();
        
        // 如果不需要升变，切换玩家
        if (!promotionPending) {
            this.switchPlayer();
            
            // 黑方移动后增加回合数
            if (this.currentPlayer === 'white') {
                this.fullMoveNumber++;
            }
        }
        
        return { ...moveData, promotionPending };
    }
    
    /**
     * 兵升变
     * @param {string} pieceType - 要升变成的棋子类型
     * @returns {boolean} 升变是否成功
     */
    promotePawn(pieceType) {
        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        
        if (!lastMove || !lastMove.promotion) {
            return false;
        }
        
        const { row, col } = lastMove.promotion;
        const piece = this.getPiece(row, col);
        
        if (!piece || piece.type !== 'pawn') {
            return false;
        }
        
        // 升变兵
        piece.type = pieceType;
        
        // 更新历史记录
        lastMove.promotion.promotedTo = pieceType;
        
        // 检查升变后是否导致将军或将杀
        this.updateGameStatus();
        
        // 升变后切换玩家
        this.switchPlayer();
        
        // 黑方移动后增加回合数
        if (this.currentPlayer === 'white') {
            this.fullMoveNumber++;
        }
        
        return true;
    }
    
    /**
     * 更新游戏状态，检查将军和将杀
     */
    updateGameStatus() {
        const opponentColor = this.currentPlayer === 'white' ? 'black' : 'white';
        const kingPos = this.kings[opponentColor];
        
        // 检查是否将军
        this.inCheck.white = false;
        this.inCheck.black = false;
        const isInCheck = this.isSquareAttacked(kingPos.row, kingPos.col, opponentColor);
        this.inCheck[opponentColor] = isInCheck;
        
        // 更新最后一步是否将军
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            lastMove.check = isInCheck;
        }
        
        // 检查是否有合法移动
        let hasLegalMove = false;
        
        // 检查对手所有棋子是否有合法移动
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === opponentColor) {
                    // 暂时选择该棋子
                    const savedSelectedPiece = this.selectedPiece;
                    this.selectedPiece = { row, col, piece };
                    
                    // 检查是否有合法移动
                    const moves = this.getPossibleMoves();
                    if (moves.length > 0) {
                        hasLegalMove = true;
                        // 恢复选择
                        this.selectedPiece = savedSelectedPiece;
                        break;
                    }
                    
                    // 恢复选择
                    this.selectedPiece = savedSelectedPiece;
                }
            }
            if (hasLegalMove) break;
        }
        
        if (!hasLegalMove) {
            // 无合法移动
            if (isInCheck) {
                // 将军且无法应对 => 将杀
                this.checkmate = true;
                this.gameOver = true;
                
                // 更新最后一步为将杀
                if (this.moveHistory.length > 0) {
                    this.moveHistory[this.moveHistory.length - 1].checkmate = true;
                }
            } else {
                // 无法移动但未被将军 => 逼和
                this.stalemate = true;
                this.gameOver = true;
            }
        }
        
        // TODO: 检查其他和棋情况（三次重复局面、50回合规则等）
    }
    
    /**
     * 获取游戏状态信息
     * @returns {Object} 游戏状态信息
     */
    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            selectedPiece: this.selectedPiece,
            possibleMoves: this.selectedPiece ? this.getPossibleMoves() : [],
            inCheck: this.inCheck,
            checkmate: this.checkmate,
            stalemate: this.stalemate,
            gameOver: this.gameOver,
            moveHistory: this.moveHistory,
            capturedPieces: this.capturedPieces,
            lastMove: this.moveHistory.length > 0 ? 
                this.moveHistory[this.moveHistory.length - 1] : null
        };
    }
    
    /**
     * 重置游戏到初始状态
     */
    resetGame() {
        // 初始化棋盘
        this.board = this.createEmptyBoard();
        
        // 放置棋子
        // 黑方主要棋子
        this.placePiece(0, 0, { type: 'rook', color: 'black' });
        this.placePiece(0, 1, { type: 'knight', color: 'black' });
        this.placePiece(0, 2, { type: 'bishop', color: 'black' });
        this.placePiece(0, 3, { type: 'queen', color: 'black' });
        this.placePiece(0, 4, { type: 'king', color: 'black' });
        this.placePiece(0, 5, { type: 'bishop', color: 'black' });
        this.placePiece(0, 6, { type: 'knight', color: 'black' });
        this.placePiece(0, 7, { type: 'rook', color: 'black' });
        
        // 黑方兵
        for (let col = 0; col < 8; col++) {
            this.placePiece(1, col, { type: 'pawn', color: 'black' });
        }
        
        // 白方兵
        for (let col = 0; col < 8; col++) {
            this.placePiece(6, col, { type: 'pawn', color: 'white' });
        }
        
        // 白方主要棋子
        this.placePiece(7, 0, { type: 'rook', color: 'white' });
        this.placePiece(7, 1, { type: 'knight', color: 'white' });
        this.placePiece(7, 2, { type: 'bishop', color: 'white' });
        this.placePiece(7, 3, { type: 'queen', color: 'white' });
        this.placePiece(7, 4, { type: 'king', color: 'white' });
        this.placePiece(7, 5, { type: 'bishop', color: 'white' });
        this.placePiece(7, 6, { type: 'knight', color: 'white' });
        this.placePiece(7, 7, { type: 'rook', color: 'white' });
        
        // 游戏状态
        this.currentPlayer = 'white';  // 白方先行
        this.gameOver = false;
        this.checkmate = false;
        this.stalemate = false;
        this.draw = false;
        this.selectedPiece = null;
        this.kings = { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } };
        
        // 历史记录
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.positionHistory = {};  // 用于三次重复位置判断
        
        // 特殊规则状态
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;  // 50回合规则计数器
        this.fullMoveNumber = 1;
        
        // 用于检测将军状态
        this.inCheck = { white: false, black: false };
    }
} 