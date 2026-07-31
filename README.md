# 読書記録

読んだ本のタイトル・著者・読了日・評価・書影を記録する PWA です。GitHub Pages で静的ホストできます。データはブラウザ内（IndexedDB）に保存されます。

## 機能

- タイトル（必須）・著者・書影（画像アップロード）
- 読了日を複数回記録（1回目、2回目…）
- 回ごとに評価（神 / とてもおもしろい / ふつう / 微妙）
- 一覧では最新の評価を表示
- オフライン対応の PWA

## 開発

Node.js 22 以上を推奨（`.nvmrc` あり）。

```bash
nvm use
npm install
npm run dev
```

ローカルでは `http://localhost:5173/reading-log/` で開きます。

## ビルド

```bash
npm run build
npm run preview
```

## GitHub Pages 公開

1. このリポジトリを GitHub に push
2. Settings → Pages → Source を **GitHub Actions** にする
3. `main` への push で自動デプロイ

公開 URL は `https://<username>.github.io/reading-log/` です。

リポジトリ名を変える場合は `vite.config.ts` の `base` / manifest の `start_url`・`scope` も合わせて変更してください。

## 注意

- データはこの端末のブラウザにだけ保存されます（サーバー同期なし）
- ブラウザのデータを消すと記録も消えます
