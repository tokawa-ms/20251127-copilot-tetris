# 🎮 RETRO TETRIS ～80年代アーケード風テトリス～

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

```
████████╗███████╗████████╗██████╗ ██╗███████╗
╚══██╔══╝██╔════╝╚══██╔══╝██╔══██╗██║██╔════╝
   ██║   █████╗     ██║   ██████╔╝██║███████╗
   ██║   ██╔══╝     ██║   ██╔══██╗██║╚════██║
   ██║   ███████╗   ██║   ██║  ██║██║███████║
   ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝
```

> 🕹️ **あの頃のゲームセンターが蘇る！** 80年代のドット絵スタイルで楽しむ、懐かしくも新しいテトリス体験

---

## 🎮 今すぐプレイ！

<div align="center">

### 👇 ゲームを起動 👇

# **[▶️ GAME START](src/index.html)**

*GitHub Pages でも公開予定です*

</div>

---

## 📸 スクリーンショット

<div align="center">

![ゲームプレイ画面](https://github.com/user-attachments/assets/44b18bce-8097-4638-a6b5-379e9cafe5f4)

*80年代アーケードゲームの雰囲気を再現したゲーム画面*

</div>

---

## 🕹️ ゲーム概要

「RETRO TETRIS」は、1980年代のアーケードゲームをオマージュした完全フリーのテトリスクローンです。

ブラウザで直接動作するため、インストール不要！HTMLファイルを開くだけで、懐かしのゲーム体験をお楽しみいただけます。

### ✨ 主な特徴

| 機能 | 説明 |
|------|------|
| 🎨 **ドット絵スタイル** | 80年代アーケードゲームを彷彿とさせるレトロなビジュアル |
| 🎵 **コロベイニキBGM** | Web Audio APIで実装された懐かしのメロディ |
| 🔊 **効果音** | 移動、回転、ライン消去などのサウンドエフェクト |
| 🏆 **スコアシステム** | ハイスコアはローカルストレージに自動保存 |
| 📈 **レベルシステム** | 10ライン消去毎にレベルアップ、落下速度が加速！ |
| 🎚️ **難易度設定** | EASY / NORMAL / HARD の3段階から選択 |
| 👻 **ゴーストピース** | 落下位置をプレビュー表示 |
| ⏸️ **一時停止機能** | いつでも中断・再開が可能 |

---

## 🎮 操作方法

```
┌─────────────────────────────────────────────────┐
│                  CONTROLS                        │
├─────────────────────────────────────────────────┤
│  ← →     ブロックを左右に移動                    │
│   ↑      ブロックを回転                          │
│   ↓      ブロックを高速落下（ソフトドロップ）    │
│ SPACE    一番下まで即座に落下（ハードドロップ）  │
│   P      一時停止 / 再開                         │
│   R      ゲームをリセット                        │
│   S      ゲーム開始                              │
└─────────────────────────────────────────────────┘
```

---

## 🧱 テトリミノ（ブロック）

全7種類のテトリミノが登場！

```
  ■■■■     ■■      ■        ■      ■■       ■■      ■■■
    I      ■■      ■■■    ■■■       ■■     ■■        ■
           O        J       L        S       Z        T
```

---

## 🚀 遊び方

### ブラウザで直接起動

1. このリポジトリをクローンまたはダウンロード
   ```bash
   git clone https://github.com/your-username/20251127-copilot-tetris.git
   ```

2. `src/index.html` をブラウザで開く

3. 難易度を選択して **[S]キー** でゲームスタート！

### 動作環境

- モダンな Web ブラウザ（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- サーバー不要、ローカルPCで動作

---

## 📁 プロジェクト構造

```
📦 20251127-copilot-tetris/
├── 📄 Readme.md              # このファイル
├── 📄 LICENSE                # MITライセンス
├── 📁 src/                   # アプリケーションソース
│   ├── 📄 index.html         # メインHTML（ゲーム本体）
│   ├── 📁 css/
│   │   └── 📄 styles.css     # カスタムスタイル
│   └── 📁 js/
│       └── 📄 script.js      # ゲームロジック
└── 📁 docs/                  # ドキュメント
    ├── 📄 RequirementsDefinition.md
    └── 📄 techspec.md
```

---

## 🛠️ 技術スタック

| 技術 | 用途 |
|------|------|
| **HTML5** | ゲーム画面の構造・Canvas要素 |
| **CSS3 (Tailwind CSS)** | レトロスタイルのUI・レスポンシブデザイン |
| **JavaScript (ES6+)** | ゲームロジック・操作制御 |
| **Web Audio API** | BGM・効果音の再生 |
| **LocalStorage API** | ハイスコアの永続化 |

---

## 🎯 スコアシステム

| アクション | 得点 |
|------------|------|
| 1ライン消去 | 100 × レベル |
| 2ライン同時消去 | 300 × レベル |
| 3ライン同時消去 | 500 × レベル |
| 4ライン同時消去（テトリス！） | 800 × レベル |
| ソフトドロップ | 落下距離 × 1 |
| ハードドロップ | 落下距離 × 2 |

---

## 📜 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

---

## 🙏 謝辞

- テトリスのオリジナルデザイン: アレクセイ・パジトノフ氏
- BGM「コロベイニキ」: ロシア民謡

---

<div align="center">

```
╔════════════════════════════════════════════════════╗
║                                                    ║
║     🎮 INSERT COIN TO PLAY 🎮                      ║
║                                                    ║
║          PRESS [S] TO START                        ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

**Made with ❤️ and レトロゲームへの愛**

</div>
