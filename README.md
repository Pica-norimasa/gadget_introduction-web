# gadget_introduction-web

「アイデアを、育てながら見せる場所」— AI創作物 作品発表プラットフォームの企画・プロトタイプ。

- 企画書: [docs/plan.html](docs/plan.html)
- 再設計企画書v2(創作活動そのものを投稿する案、批判的評価つき): [docs/plan-v2.html](docs/plan-v2.html)
- トップページUIモック: `app/page.tsx`（モックデータのみ、バックエンド連携なし。DBは用意したがアプリからはまだ未接続）
- 今後の技術的な宿題: [docs/todo.md](docs/todo.md)

## 開発

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。

## DB(Prisma)

開発中はSQLite、本番はAWS RDS(MySQL)を想定。`app/lib/mock-data.ts`の内容を
そのままDBに投入できるシードスクリプトを用意している。

```bash
npm run db:migrate   # ローカルSQLiteにスキーマを反映
npm run db:seed      # mock-data.tsの内容を投入
npm run db:studio    # ブラウザでDBの中身を確認
```

本番(MySQL)へ切り替える際は `prisma/schema.prisma` の `datasource.provider` を
`"mysql"` にし、`app/lib/prisma.ts` のアダプタを `@prisma/adapter-mariadb` 等の
MySQL用アダプタに差し替える。アプリのコンポーネント側はまだ`mock-data.ts`を
直接読んでおり、Prisma経由には未接続([docs/todo.md](docs/todo.md)参照)。
