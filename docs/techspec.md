# レトロテトリス 技術仕様書

## 1. アーキテクチャ概要

### 1.1 システム構成
```
┌─────────────────────────────────────────────────────────────┐
│                        ブラウザ                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │   index.html    │  │   styles.css    │  │ script.js  │  │
│  │                 │  │                 │  │            │  │
│  │  ・Canvas要素   │  │  ・レトロ風UI   │  │ ・ゲーム   │  │
│  │  ・UI構造       │  │  ・アニメーション│  │   ロジック │  │
│  │  ・設定パネル   │  │  ・レスポンシブ │  │ ・Audio    │  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
│                               │                             │
│  ┌────────────────────────────┴───────────────────────────┐ │
│  │                    Web APIs                             │ │
│  │  ・Canvas API  ・Web Audio API  ・LocalStorage API      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 モジュール構成

```javascript
// script.js の主要モジュール
┌──────────────────────────────────────────────────────────┐
│ 定数定義                                                 │
│  ・COLS, ROWS, BLOCK_SIZE                                │
│  ・TETROMINOS（形状・色定義）                            │
│  ・DIFFICULTY_SETTINGS                                   │
│  ・SCORE_TABLE                                           │
├──────────────────────────────────────────────────────────┤
│ ゲーム状態管理                                           │
│  ・board[][] - ゲームボード                              │
│  ・currentPiece - 現在のテトリミノ                       │
│  ・nextPiece - 次のテトリミノ                            │
│  ・score, highScore, level, lines                        │
│  ・gameRunning, gamePaused, gameOver                     │
├──────────────────────────────────────────────────────────┤
│ ゲームロジック                                           │
│  ・startGame(), togglePause(), resetGame()               │
│  ・spawnPiece(), moveLeft/Right/Down(), rotate()         │
│  ・hardDrop(), lockPiece(), clearLines()                 │
│  ・checkCollision(), handleGameOver()                    │
├──────────────────────────────────────────────────────────┤
│ 描画処理                                                 │
│  ・drawBoard(), drawBlock(), drawGhostBlock()            │
│  ・drawNextPiece()                                       │
│  ・updateDisplay()                                       │
├──────────────────────────────────────────────────────────┤
│ 入力処理                                                 │
│  ・handleKeyDown()                                       │
├──────────────────────────────────────────────────────────┤
│ サウンド処理                                             │
│  ・playSound()                                           │
│  ・startBGM(), stopBGM()                                 │
│  ・playMelodyNote(), playBassNote()                      │
└──────────────────────────────────────────────────────────┘
```

## 2. データ構造

### 2.1 テトリミノ定義
```javascript
const TETROMINOS = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00ffff'
    },
    // O, T, S, Z, J, L も同様の構造
};
```

### 2.2 ゲームボード
```javascript
// 10列 x 20行の2次元配列
// null = 空セル, 色コード = ブロック
board[row][col] = null | '#rrggbb';
```

### 2.3 現在のピース
```javascript
currentPiece = {
    name: 'T',           // テトリミノ名
    shape: [[...], ...], // 形状行列
    color: '#ff00ff',    // 色
    x: 3,                // X座標（列）
    y: 0                 // Y座標（行）
};
```

## 3. 主要アルゴリズム

### 3.1 衝突判定
```javascript
function checkCollision(shape, offsetX, offsetY) {
    for (各セル in shape) {
        if (セルがブロック) {
            newX = offsetX + col;
            newY = offsetY + row;
            
            // 境界チェック
            if (newX < 0 || newX >= COLS || newY >= ROWS) {
                return true; // 衝突
            }
            
            // 既存ブロックとの衝突
            if (newY >= 0 && board[newY][newX]) {
                return true; // 衝突
            }
        }
    }
    return false; // 衝突なし
}
```

### 3.2 回転アルゴリズム
```javascript
function rotateMatrix(matrix) {
    // 時計回り90度回転
    // 転置 + 列の反転
    for (col = 0 to cols) {
        for (row = rows-1 downto 0) {
            rotated[col][rows-1-row] = matrix[row][col];
        }
    }
    return rotated;
}
```

### 3.3 壁蹴り（Wall Kick）
```javascript
function rotate() {
    rotated = rotateMatrix(currentPiece.shape);
    
    // 通常位置でチェック
    if (!checkCollision(rotated, x, y)) {
        currentPiece.shape = rotated;
        return;
    }
    
    // 壁蹴りを試行
    offsets = [+1, -1, +2, -2];
    for (offset of offsets) {
        if (!checkCollision(rotated, x + offset, y)) {
            currentPiece.shape = rotated;
            currentPiece.x += offset;
            return;
        }
    }
    // 回転不可
}
```

### 3.4 ライン消去
```javascript
function clearLines() {
    for (row = ROWS-1 downto 0) {
        if (行が完全に埋まっている) {
            board.splice(row, 1);     // 行を削除
            board.unshift(空の行);     // 上に空行追加
            linesCleared++;
            row++;  // 同じ位置を再チェック
        }
    }
    
    if (linesCleared > 0) {
        score += SCORE_TABLE[linesCleared] * level;
        lines += linesCleared;
        checkLevelUp();
    }
}
```

## 4. サウンドシステム

### 4.1 Web Audio API構成
```
AudioContext
    └── Oscillator (音源)
            └── GainNode (音量制御)
                    └── Destination (出力)
```

### 4.2 コロベイニキBGM
```javascript
// メロディ定義（周波数と長さの配列）
const KOROBEINIKI_MELODY = [
    { note: 'E5', duration: 0.4 },
    { note: 'B4', duration: 0.2 },
    // ...
];

// ベースライン
const KOROBEINIKI_BASS = [
    { note: 'E4', duration: 0.8 },
    // ...
];

// 周波数テーブル
const NOTE_FREQUENCIES = {
    'A3': 220.00,
    'B3': 246.94,
    'C4': 261.63,
    // ...
};
```

### 4.3 音符再生
```javascript
function playMelodyNote() {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'square';  // メロディは矩形波
    osc.frequency.value = NOTE_FREQUENCIES[note];
    
    // エンベロープ設定
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);
    
    osc.start();
    osc.stop(now + duration);
    
    // 次の音符をスケジュール
    setTimeout(playMelodyNote, duration * 1000);
}
```

## 5. 描画処理

### 5.1 Canvas描画フロー
```
drawBoard()
    │
    ├── 背景クリア
    ├── グリッド線描画
    ├── 固定ブロック描画
    ├── ゴーストピース描画
    └── 現在のピース描画
```

### 5.2 ブロック描画（3Dスタイル）
```javascript
function drawBlock(context, x, y, color) {
    // メインカラー
    fillRect(x, y, size, size);
    
    // ハイライト（左上）
    fillStyle = lightenColor(color, 40);
    fillRect(左上エッジ);
    
    // シャドウ（右下）
    fillStyle = darkenColor(color, 40);
    fillRect(右下エッジ);
    
    // 内側のドット
    fillRect(中央に小さい正方形);
}
```

## 6. 状態管理

### 6.1 ゲーム状態遷移
```
[初期状態] ─────────────────────────────────────────┐
    │                                               │
    │ startGame()                                   │
    ▼                                               │
[実行中] ◄────────┐                                 │
    │             │                                 │
    │ togglePause()                                 │
    ▼             │                                 │
[一時停止] ───────┘                                 │
    │                                               │
    │ resetGame()                                   │
    └───────────────────────────────────────────────┤
                                                    │
[実行中]                                            │
    │                                               │
    │ handleGameOver()                              │
    ▼                                               │
[ゲームオーバー] ─── resetGame() ───────────────────┘
```

### 6.2 状態変数
```javascript
let gameRunning = false;  // ゲーム実行中フラグ
let gamePaused = false;   // 一時停止フラグ
let gameOver = false;     // ゲームオーバーフラグ
```

## 7. ローカルストレージ

### 7.1 データ保存
```javascript
// 保存
localStorage.setItem('tetris-high-score', highScore.toString());

// 読み込み
const saved = localStorage.getItem('tetris-high-score');
if (saved) {
    highScore = parseInt(saved, 10);
}
```

## 8. パフォーマンス最適化

### 8.1 requestAnimationFrame
```javascript
function gameLoop() {
    if (!gameRunning || gamePaused || gameOver) return;
    
    const now = Date.now();
    if (now - lastDropTime >= dropSpeed) {
        moveDown();
        lastDropTime = now;
    }
    
    drawBoard();
    requestAnimationFrame(gameLoop);
}
```

### 8.2 画像レンダリング最適化
```css
canvas {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
}
```

## 9. セキュリティ考慮事項

### 9.1 入力検証
- キーボード入力は許可されたキーのみ処理
- ゲーム状態に応じた入力制御

### 9.2 ローカルストレージ
- 数値のみ保存（スコア）
- パース時のエラーハンドリング

## 10. 更新履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2024-11-27 | 1.0.0 | 初版作成 |
