/**
 * レトロテトリス - 80年代スタイル
 * メインゲームスクリプト
 * 
 * このファイルはテトリスゲームの全てのロジックを含みます：
 * - ゲームボードとブロックの描画
 * - キーボード操作
 * - スコア管理
 * - BGM（コロベイニキ）と効果音
 * - ローカルストレージへのハイスコア保存
 */

'use strict';

console.log('[テトリス] ゲームスクリプトを読み込み中...');

// ===================================
// 定数定義
// ===================================

// ゲームボードのサイズ
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;
const NEXT_BLOCK_SIZE = 20;  // NEXTプレビュー用のブロックサイズ

// ブロック描画用の定数
const BLOCK_PADDING = 1;        // ブロック間のパディング
const BLOCK_EDGE_WIDTH = 3;     // ブロックのハイライト/シャドウの幅
const BLOCK_DOT_SIZE = 4;       // ブロック内のドットのサイズ

// テトリミノの定義（基本形状のみ、回転はrotateMatrix関数で動的に処理）
const TETROMINOS = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00ffff' // シアン
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffff00' // 黄色
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#ff00ff' // マゼンタ
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00ff00' // 緑
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#ff0000' // 赤
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000ff' // 青
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#ff8800' // オレンジ
    }
};

const TETROMINO_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// 難易度設定（落下間隔 ms）
const DIFFICULTY_SETTINGS = {
    easy: { baseSpeed: 1000, speedDecrement: 50, minSpeed: 200 },
    normal: { baseSpeed: 800, speedDecrement: 40, minSpeed: 100 },
    hard: { baseSpeed: 500, speedDecrement: 30, minSpeed: 50 }
};

// スコア計算
const SCORE_TABLE = {
    1: 100,   // シングル
    2: 300,   // ダブル
    3: 500,   // トリプル
    4: 800   // テトリス
};

// ===================================
// グローバル変数
// ===================================

let canvas, ctx;
let nextCanvas, nextCtx;
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let highScore = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let dropInterval = null;
let dropSpeed = 800;
let lastDropTime = 0;
let soundEnabled = true;
let bgmEnabled = true;
let difficulty = 'normal';

// オーディオコンテキスト
let audioContext = null;
let bgmInterval = null;
let bgmPlaying = false;

// ===================================
// 初期化
// ===================================

/**
 * DOMContentLoaded時の初期化処理
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[テトリス] DOM読み込み完了、初期化を開始');
    
    initializeCanvas();
    initializeUI();
    loadHighScore();
    initializeBoard();
    drawBoard();
    
    console.log('[テトリス] 初期化完了');
});

/**
 * キャンバスの初期化
 */
function initializeCanvas() {
    console.log('[テトリス] キャンバスを初期化中...');
    
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    nextCanvas = document.getElementById('next-canvas');
    nextCtx = nextCanvas.getContext('2d');
    
    // キャンバスサイズを設定
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    
    console.log(`[テトリス] キャンバスサイズ: ${canvas.width}x${canvas.height}`);
}

/**
 * UI要素の初期化とイベントリスナー設定
 */
function initializeUI() {
    console.log('[テトリス] UI要素を初期化中...');
    
    // ボタンイベント
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('restart-btn').addEventListener('click', resetGame);
    
    // 設定イベント
    document.getElementById('difficulty').addEventListener('change', (e) => {
        difficulty = e.target.value;
        console.log(`[テトリス] 難易度変更: ${difficulty}`);
    });
    
    document.getElementById('sound-toggle').addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
        console.log(`[テトリス] 効果音: ${soundEnabled ? 'ON' : 'OFF'}`);
    });
    
    document.getElementById('bgm-toggle').addEventListener('change', (e) => {
        bgmEnabled = e.target.checked;
        console.log(`[テトリス] BGM: ${bgmEnabled ? 'ON' : 'OFF'}`);
        if (!bgmEnabled) {
            stopBGM();
        } else if (gameRunning && !gamePaused) {
            startBGM();
        }
    });
    
    // キーボードイベント
    document.addEventListener('keydown', handleKeyDown);
    
    console.log('[テトリス] UI初期化完了');
}

/**
 * ゲームボードの初期化
 */
function initializeBoard() {
    console.log('[テトリス] ゲームボードを初期化中...');
    
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = null;
        }
    }
    
    console.log(`[テトリス] ボードサイズ: ${COLS}x${ROWS}`);
}

/**
 * ハイスコアの読み込み
 */
function loadHighScore() {
    console.log('[テトリス] ハイスコアを読み込み中...');
    
    const saved = localStorage.getItem('tetris-high-score');
    if (saved) {
        highScore = parseInt(saved, 10);
        console.log(`[テトリス] ハイスコア読み込み完了: ${highScore}`);
    } else {
        console.log('[テトリス] 保存されたハイスコアなし');
    }
    
    updateDisplay();
}

/**
 * ハイスコアの保存
 */
function saveHighScore() {
    localStorage.setItem('tetris-high-score', highScore.toString());
    console.log(`[テトリス] ハイスコア保存: ${highScore}`);
}

// ===================================
// ゲームロジック
// ===================================

/**
 * ゲーム開始
 */
function startGame() {
    console.log('[テトリス] ゲーム開始');
    
    if (gameRunning) {
        console.log('[テトリス] 既にゲーム実行中');
        return;
    }
    
    // AudioContextを初期化（ユーザー操作後に必要）
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('[テトリス] AudioContext初期化完了');
    }
    
    gameRunning = true;
    gamePaused = false;
    gameOver = false;
    score = 0;
    level = 1;
    lines = 0;
    
    // 難易度に応じた落下速度を設定
    const settings = DIFFICULTY_SETTINGS[difficulty];
    dropSpeed = settings.baseSpeed;
    
    initializeBoard();
    spawnPiece();
    updateDisplay();
    
    // UIを更新
    document.getElementById('start-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    document.getElementById('game-over-overlay').classList.add('hidden');
    
    // BGMを開始
    if (bgmEnabled) {
        startBGM();
    }
    
    // ゲームループ開始
    lastDropTime = Date.now();
    gameLoop();
    
    console.log(`[テトリス] ゲーム開始 - 難易度: ${difficulty}, 落下速度: ${dropSpeed}ms`);
}

/**
 * ゲーム一時停止/再開
 */
function togglePause() {
    if (!gameRunning || gameOver) return;
    
    gamePaused = !gamePaused;
    
    const pauseOverlay = document.getElementById('pause-overlay');
    if (gamePaused) {
        pauseOverlay.classList.remove('hidden');
        stopBGM();
        console.log('[テトリス] ゲーム一時停止');
    } else {
        pauseOverlay.classList.add('hidden');
        if (bgmEnabled) {
            startBGM();
        }
        lastDropTime = Date.now();
        gameLoop();
        console.log('[テトリス] ゲーム再開');
    }
}

/**
 * ゲームリセット
 */
function resetGame() {
    console.log('[テトリス] ゲームリセット');
    
    gameRunning = false;
    gamePaused = false;
    gameOver = false;
    
    stopBGM();
    
    score = 0;
    level = 1;
    lines = 0;
    currentPiece = null;
    nextPiece = null;
    
    initializeBoard();
    drawBoard();
    drawNextPiece();
    updateDisplay();
    
    // UIを更新
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
}

/**
 * ゲームオーバー処理
 */
function handleGameOver() {
    console.log('[テトリス] ゲームオーバー');
    
    gameRunning = false;
    gameOver = true;
    
    stopBGM();
    playSound('gameOver');
    
    // ハイスコア更新チェック
    if (score > highScore) {
        highScore = score;
        saveHighScore();
        console.log(`[テトリス] 新ハイスコア: ${highScore}`);
    }
    
    // ゲームオーバー画面を表示
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-overlay').classList.remove('hidden');
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    
    updateDisplay();
}

/**
 * メインゲームループ
 */
function gameLoop() {
    if (!gameRunning || gamePaused || gameOver) return;
    
    const now = Date.now();
    const delta = now - lastDropTime;
    
    if (delta >= dropSpeed) {
        moveDown();
        lastDropTime = now;
    }
    
    drawBoard();
    requestAnimationFrame(gameLoop);
}

/**
 * 新しいピースを生成
 */
function spawnPiece() {
    if (nextPiece) {
        currentPiece = nextPiece;
    } else {
        currentPiece = createRandomPiece();
    }
    
    nextPiece = createRandomPiece();
    drawNextPiece();
    
    // 開始位置を設定
    currentPiece.x = Math.floor((COLS - currentPiece.shape[0].length) / 2);
    currentPiece.y = 0;
    
    // 衝突チェック（ゲームオーバー判定）
    if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
        handleGameOver();
    }
    
    console.log(`[テトリス] 新ピース生成: ${currentPiece.name}, 位置: (${currentPiece.x}, ${currentPiece.y})`);
}

/**
 * ランダムなテトリミノを作成
 */
function createRandomPiece() {
    const name = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
    const tetromino = TETROMINOS[name];
    
    return {
        name: name,
        shape: tetromino.shape.map(row => [...row]),
        color: tetromino.color,
        x: 0,
        y: 0
    };
}

/**
 * 衝突判定
 */
function checkCollision(shape, offsetX, offsetY) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = offsetX + col;
                const newY = offsetY + row;
                
                // 境界チェック
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                // 既存ブロックとの衝突
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * ピースを左に移動
 */
function moveLeft() {
    if (!currentPiece || !gameRunning || gamePaused) return;
    
    if (!checkCollision(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x--;
        playSound('move');
        console.log(`[テトリス] 左移動: (${currentPiece.x}, ${currentPiece.y})`);
    }
}

/**
 * ピースを右に移動
 */
function moveRight() {
    if (!currentPiece || !gameRunning || gamePaused) return;
    
    if (!checkCollision(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x++;
        playSound('move');
        console.log(`[テトリス] 右移動: (${currentPiece.x}, ${currentPiece.y})`);
    }
}

/**
 * ピースを下に移動
 */
function moveDown() {
    if (!currentPiece || !gameRunning || gamePaused) return;
    
    if (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
    } else {
        lockPiece();
    }
}

/**
 * ピースを即座に落下
 */
function hardDrop() {
    if (!currentPiece || !gameRunning || gamePaused) return;
    
    let dropDistance = 0;
    while (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        dropDistance++;
    }
    
    if (dropDistance > 0) {
        score += dropDistance * 2; // ハードドロップボーナス
        playSound('drop');
        console.log(`[テトリス] ハードドロップ: ${dropDistance}マス`);
    }
    
    lockPiece();
}

/**
 * ピースを回転
 */
function rotate() {
    if (!currentPiece || !gameRunning || gamePaused) return;
    
    const rotated = rotateMatrix(currentPiece.shape);
    
    // 回転後の衝突チェック（壁蹴り対応）
    let offsetX = 0;
    if (checkCollision(rotated, currentPiece.x, currentPiece.y)) {
        // 右にずらして試す
        if (!checkCollision(rotated, currentPiece.x + 1, currentPiece.y)) {
            offsetX = 1;
        // 左にずらして試す
        } else if (!checkCollision(rotated, currentPiece.x - 1, currentPiece.y)) {
            offsetX = -1;
        // 2マス右にずらして試す（Iピース用）
        } else if (!checkCollision(rotated, currentPiece.x + 2, currentPiece.y)) {
            offsetX = 2;
        // 2マス左にずらして試す（Iピース用）
        } else if (!checkCollision(rotated, currentPiece.x - 2, currentPiece.y)) {
            offsetX = -2;
        } else {
            console.log('[テトリス] 回転不可');
            return; // 回転できない
        }
    }
    
    currentPiece.shape = rotated;
    currentPiece.x += offsetX;
    playSound('rotate');
    console.log(`[テトリス] 回転実行`);
}

/**
 * 行列を時計回りに90度回転
 */
function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    
    for (let col = 0; col < cols; col++) {
        rotated[col] = [];
        for (let row = rows - 1; row >= 0; row--) {
            rotated[col][rows - 1 - row] = matrix[row][col];
        }
    }
    
    return rotated;
}

/**
 * ピースを固定してボードに配置
 */
function lockPiece() {
    console.log(`[テトリス] ピース固定: ${currentPiece.name}`);
    
    // ピースをボードに配置
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;
                
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
    
    playSound('lock');
    
    // ライン消去チェック
    clearLines();
    
    // 次のピースを生成
    spawnPiece();
}

/**
 * 揃ったラインを消去
 */
function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        let isComplete = true;
        
        for (let col = 0; col < COLS; col++) {
            if (!board[row][col]) {
                isComplete = false;
                break;
            }
        }
        
        if (isComplete) {
            // ラインを消去
            board.splice(row, 1);
            // 上に新しい空の行を追加
            board.unshift(new Array(COLS).fill(null));
            linesCleared++;
            row++; // 同じ行を再チェック
        }
    }
    
    if (linesCleared > 0) {
        console.log(`[テトリス] ${linesCleared}ライン消去`);
        
        // スコア加算
        const lineScore = SCORE_TABLE[linesCleared] || linesCleared * 100;
        score += lineScore * level;
        lines += linesCleared;
        
        // 効果音
        if (linesCleared === 4) {
            playSound('tetris');
        } else {
            playSound('clear');
        }
        
        // レベルアップチェック（10ライン毎）
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            levelUp(newLevel);
        }
        
        updateDisplay();
    }
}

/**
 * レベルアップ処理
 */
function levelUp(newLevel) {
    level = newLevel;
    
    // 落下速度を更新
    const settings = DIFFICULTY_SETTINGS[difficulty];
    dropSpeed = Math.max(
        settings.minSpeed,
        settings.baseSpeed - (level - 1) * settings.speedDecrement
    );
    
    playSound('levelUp');
    
    // レベル表示にアニメーション
    const levelDisplay = document.getElementById('level');
    levelDisplay.classList.add('level-up');
    setTimeout(() => levelDisplay.classList.remove('level-up'), 500);
    
    console.log(`[テトリス] レベルアップ: ${level}, 落下速度: ${dropSpeed}ms`);
}

// ===================================
// 描画処理
// ===================================

/**
 * ゲームボードを描画
 */
function drawBoard() {
    // 背景をクリア
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // グリッド線を描画
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(canvas.width, row * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    
    // 固定されたブロックを描画
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }
    
    // 現在のピースを描画
    if (currentPiece) {
        // ゴーストピースを描画（落下位置のプレビュー）
        let ghostY = currentPiece.y;
        while (!checkCollision(currentPiece.shape, currentPiece.x, ghostY + 1)) {
            ghostY++;
        }
        if (ghostY !== currentPiece.y) {
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        drawGhostBlock(ctx, currentPiece.x + col, ghostY + row, currentPiece.color);
                    }
                }
            }
        }
        
        // 現在のピースを描画
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    drawBlock(ctx, currentPiece.x + col, currentPiece.y + row, currentPiece.color);
                }
            }
        }
    }
}

/**
 * ブロックを描画（レトロスタイル）
 */
function drawBlock(context, x, y, color) {
    const size = BLOCK_SIZE;
    const padding = BLOCK_PADDING;
    const edgeWidth = BLOCK_EDGE_WIDTH;
    
    // メインカラー
    context.fillStyle = color;
    context.fillRect(
        x * size + padding,
        y * size + padding,
        size - padding * 2,
        size - padding * 2
    );
    
    // ハイライト（左上）
    context.fillStyle = lightenColor(color, 40);
    context.fillRect(
        x * size + padding,
        y * size + padding,
        size - padding * 2,
        edgeWidth
    );
    context.fillRect(
        x * size + padding,
        y * size + padding,
        edgeWidth,
        size - padding * 2
    );
    
    // シャドウ（右下）
    context.fillStyle = darkenColor(color, 40);
    context.fillRect(
        x * size + padding,
        y * size + size - padding - edgeWidth,
        size - padding * 2,
        edgeWidth
    );
    context.fillRect(
        x * size + size - padding - edgeWidth,
        y * size + padding,
        edgeWidth,
        size - padding * 2
    );
    
    // 内側のドット（ブロック中央にハイライト）
    const dotOffset = Math.floor(size / 4);
    context.fillStyle = lightenColor(color, 20);
    context.fillRect(
        x * size + dotOffset,
        y * size + dotOffset,
        BLOCK_DOT_SIZE,
        BLOCK_DOT_SIZE
    );
}

/**
 * ゴーストブロックを描画
 */
function drawGhostBlock(context, x, y, color) {
    const size = BLOCK_SIZE;
    const padding = 2;
    
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.setLineDash([3, 3]);
    context.strokeRect(
        x * size + padding,
        y * size + padding,
        size - padding * 2,
        size - padding * 2
    );
    context.setLineDash([]);
}

/**
 * 次のピースを描画
 */
function drawNextPiece() {
    // 背景をクリア
    nextCtx.fillStyle = '#0a0a0a';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (!nextPiece) return;
    
    // 中央に配置するためのオフセット計算
    const pieceWidth = nextPiece.shape[0].length;
    const pieceHeight = nextPiece.shape.length;
    const offsetX = (nextCanvas.width - pieceWidth * NEXT_BLOCK_SIZE) / 2;
    const offsetY = (nextCanvas.height - pieceHeight * NEXT_BLOCK_SIZE) / 2;
    
    for (let row = 0; row < nextPiece.shape.length; row++) {
        for (let col = 0; col < nextPiece.shape[row].length; col++) {
            if (nextPiece.shape[row][col]) {
                drawBlockSmall(nextCtx, col, row, nextPiece.color, offsetX, offsetY);
            }
        }
    }
}

/**
 * 小さいブロックを描画（NEXTプレビュー用）
 */
function drawBlockSmall(context, x, y, color, offsetX, offsetY) {
    const size = NEXT_BLOCK_SIZE;
    const padding = BLOCK_PADDING;
    
    context.fillStyle = color;
    context.fillRect(
        offsetX + x * size + padding,
        offsetY + y * size + padding,
        size - padding * 2,
        size - padding * 2
    );
    
    // ハイライト
    context.fillStyle = lightenColor(color, 30);
    context.fillRect(
        offsetX + x * size + padding,
        offsetY + y * size + padding,
        size - padding * 2,
        2
    );
}

/**
 * 色を明るくする
 */
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * 色を暗くする
 */
function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * 表示を更新
 */
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// ===================================
// 入力処理
// ===================================

/**
 * キーボード入力の処理
 */
function handleKeyDown(event) {
    console.log(`[テトリス] キー入力: ${event.key}`);
    
    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            event.preventDefault();
            moveRight();
            break;
        case 'ArrowDown':
            event.preventDefault();
            moveDown();
            break;
        case 'ArrowUp':
            event.preventDefault();
            rotate();
            break;
        case ' ':
            event.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
        case 'r':
        case 'R':
            resetGame();
            break;
        case 's':
        case 'S':
            if (!gameRunning) {
                startGame();
            }
            break;
    }
}

// ===================================
// サウンド処理
// ===================================

/**
 * 効果音を再生
 */
function playSound(type) {
    if (!soundEnabled || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'move':
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'rotate':
                oscillator.frequency.value = 400;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.08);
                break;
            case 'lock':
                oscillator.type = 'square';
                oscillator.frequency.value = 150;
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'drop':
                oscillator.type = 'sawtooth';
                oscillator.frequency.value = 100;
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
            case 'clear':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1047, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'tetris':
                // 4ライン消去時の特別な音
                playTetrisSound();
                return;
            case 'levelUp':
                playLevelUpSound();
                return;
            case 'gameOver':
                playGameOverSound();
                return;
        }
    } catch (error) {
        console.error('[テトリス] 効果音再生エラー:', error);
    }
}

/**
 * テトリス（4ライン消去）効果音
 */
function playTetrisSound() {
    if (!audioContext) return;
    
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'square';
        osc.frequency.value = freq;
        
        const startTime = audioContext.currentTime + index * 0.08;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        osc.start(startTime);
        osc.stop(startTime + 0.15);
    });
}

/**
 * レベルアップ効果音
 */
function playLevelUpSound() {
    if (!audioContext) return;
    
    const notes = [262, 330, 392, 523];
    notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = audioContext.currentTime + index * 0.1;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        
        osc.start(startTime);
        osc.stop(startTime + 0.2);
    });
}

/**
 * ゲームオーバー効果音
 */
function playGameOverSound() {
    if (!audioContext) return;
    
    const notes = [392, 370, 349, 330, 311, 294, 277, 262];
    notes.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        const startTime = audioContext.currentTime + index * 0.1;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        osc.start(startTime);
        osc.stop(startTime + 0.15);
    });
}

// ===================================
// BGM（コロベイニキ）
// ===================================

/**
 * コロベイニキのメロディを定義
 * 楽譜に基づいて音符を配列で定義
 * 
 * 記号説明:
 * - E, D, C, B, A, G, F = 音名
 * - ↓ = 1オクターブ下
 * - 四分 = 四分音符（0.4秒）
 * - 八分 = 八分音符（0.2秒）
 * - 二分 = 二分音符（0.8秒）
 * - 休み = 休符
 */

// 音名から周波数への変換（A4 = 440Hz基準）
const NOTE_FREQUENCIES = {
    // オクターブ3（低い）
    'A3': 220.00,
    'B3': 246.94,
    'C4': 261.63,
    'D4': 293.66,
    'E4': 329.63,
    'F4': 349.23,
    'G4': 392.00,
    // オクターブ4（通常）
    'A4': 440.00,
    'B4': 493.88,
    'C5': 523.25,
    'D5': 587.33,
    'E5': 659.26,
    'F5': 698.46,
    'G5': 783.99,
    'A5': 880.00,
    // 休符
    'REST': 0
};

// コロベイニキのメロディ（完全版ワンコーラス）
// 楽譜を解釈して周波数と長さの配列に変換
const KOROBEINIKI_MELODY = [
    // 1行目: E四分,B↓八分,C八分,D四分,C八分,B↓八分,
    { note: 'E5', duration: 0.4 },
    { note: 'B4', duration: 0.2 },
    { note: 'C5', duration: 0.2 },
    { note: 'D5', duration: 0.4 },
    { note: 'C5', duration: 0.2 },
    { note: 'B4', duration: 0.2 },
    
    // 2行目: A↓四分,A↓八分,C八分,E四分,D八分,C八分,
    { note: 'A4', duration: 0.4 },
    { note: 'A4', duration: 0.2 },
    { note: 'C5', duration: 0.2 },
    { note: 'E5', duration: 0.4 },
    { note: 'D5', duration: 0.2 },
    { note: 'C5', duration: 0.2 },
    
    // 3行目: B↓四分,B↓八分,C八分,D四分,E四分,
    { note: 'B4', duration: 0.4 },
    { note: 'B4', duration: 0.2 },
    { note: 'C5', duration: 0.2 },
    { note: 'D5', duration: 0.4 },
    { note: 'E5', duration: 0.4 },
    
    // 4行目: C四分,A↓四分,A↓四分,休み四分
    { note: 'C5', duration: 0.4 },
    { note: 'A4', duration: 0.4 },
    { note: 'A4', duration: 0.4 },
    { note: 'REST', duration: 0.4 },
    
    // 5行目: 休み八分,D四分,F八分,A四分,G八分,F八分,
    { note: 'REST', duration: 0.2 },
    { note: 'D5', duration: 0.4 },
    { note: 'F5', duration: 0.2 },
    { note: 'A5', duration: 0.4 },  // 高いA（A5）
    { note: 'G5', duration: 0.2 },
    { note: 'F5', duration: 0.2 },
    
    // 6行目: E四分,休み八分,C八分,E四分,D八分,C八分,
    { note: 'E5', duration: 0.4 },
    { note: 'REST', duration: 0.2 },
    { note: 'C5', duration: 0.2 },
    { note: 'E5', duration: 0.4 },
    { note: 'D5', duration: 0.2 },
    { note: 'C5', duration: 0.2 },
    
    // 7行目: B↓四分,B↓八分,C八分,D四分,E四分
    { note: 'B4', duration: 0.4 },
    { note: 'B4', duration: 0.2 },
    { note: 'C5', duration: 0.2 },
    { note: 'D5', duration: 0.4 },
    { note: 'E5', duration: 0.4 },
    
    // 8行目: C四分,A↓四分,A↓二分
    { note: 'C5', duration: 0.4 },
    { note: 'A4', duration: 0.4 },
    { note: 'A4', duration: 0.8 }
];

// ベースライン（コロベイニキに合わせたシンプルなベース）
const KOROBEINIKI_BASS = [
    // 1-2小節
    { note: 'E4', duration: 0.8 },
    { note: 'E4', duration: 0.8 },
    { note: 'A3', duration: 0.8 },
    { note: 'A3', duration: 0.8 },
    // 3-4小節
    { note: 'B3', duration: 0.8 },
    { note: 'B3', duration: 0.8 },
    { note: 'A3', duration: 0.8 },
    { note: 'A3', duration: 0.8 },
    // 5-6小節
    { note: 'D4', duration: 0.8 },
    { note: 'D4', duration: 0.8 },
    { note: 'E4', duration: 0.8 },
    { note: 'E4', duration: 0.8 },
    // 7-8小節
    { note: 'B3', duration: 0.8 },
    { note: 'B3', duration: 0.8 },
    { note: 'A3', duration: 1.6 }
];

let melodyIndex = 0;
let bassIndex = 0;
let melodyTimeout = null;
let bassTimeout = null;

/**
 * BGMを開始
 */
function startBGM() {
    if (bgmPlaying || !audioContext) return;
    
    console.log('[テトリス] BGM開始: コロベイニキ');
    bgmPlaying = true;
    melodyIndex = 0;
    bassIndex = 0;
    
    playMelodyNote();
    playBassNote();
}

/**
 * BGMを停止
 */
function stopBGM() {
    console.log('[テトリス] BGM停止');
    bgmPlaying = false;
    
    if (melodyTimeout) {
        clearTimeout(melodyTimeout);
        melodyTimeout = null;
    }
    if (bassTimeout) {
        clearTimeout(bassTimeout);
        bassTimeout = null;
    }
}

/**
 * メロディの音符を再生
 */
function playMelodyNote() {
    if (!bgmPlaying || !bgmEnabled || !audioContext) return;
    
    const noteData = KOROBEINIKI_MELODY[melodyIndex];
    const frequency = NOTE_FREQUENCIES[noteData.note];
    const duration = noteData.duration;
    
    if (frequency > 0) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        
        // 音量エンベロープ
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.06, audioContext.currentTime + duration * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration * 0.9);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    // 次の音符へ
    melodyIndex = (melodyIndex + 1) % KOROBEINIKI_MELODY.length;
    
    melodyTimeout = setTimeout(() => {
        playMelodyNote();
    }, duration * 1000);
}

/**
 * ベースの音符を再生
 */
function playBassNote() {
    if (!bgmPlaying || !bgmEnabled || !audioContext) return;
    
    const noteData = KOROBEINIKI_BASS[bassIndex];
    const frequency = NOTE_FREQUENCIES[noteData.note];
    const duration = noteData.duration;
    
    if (frequency > 0) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;
        
        // 音量エンベロープ
        gainNode.gain.setValueAtTime(0.06, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.04, audioContext.currentTime + duration * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration * 0.95);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    // 次の音符へ
    bassIndex = (bassIndex + 1) % KOROBEINIKI_BASS.length;
    
    bassTimeout = setTimeout(() => {
        playBassNote();
    }, duration * 1000);
}

console.log('[テトリス] ゲームスクリプト読み込み完了');
