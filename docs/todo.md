# TODO / 技術的な宿題

実装は後回しにするが、忘れないように残しておくメモ。

## GitHub プレビュー機能のレート制限対策 (AWS + MySQL移行時)

`app/api/github-preview/route.ts` は現状、カード表示のたびにクライアントから
このRoute Handlerを叩き、Route Handlerがその場で `api.github.com` に
ライブでリクエストする構成になっている。

無認証だと GitHub API は **60req/hour** までしか呼べないため、ユーザー数が
増えると簡単に頭打ちになる。バックエンドをAWS + MySQLで持つタイミングで、
以下の2点を必ずやる。

1. **GitHub Personal Access Token(またはGitHub App)で認証する**
   無認証60req/hour → 認証済み5,000req/hourに引き上げる。トークンは
   サーバー側の環境変数(Secrets Manager等)に置き、クライアントには
   絶対に渡さない。公開リポジトリの読み取りだけなら追加のスコープは不要。

2. **「表示のたびに取得」をやめて「投稿時 or 定期バッチで取得してMySQLに
   キャッシュ」に切り替える**
   - `github_repo_cache` のようなテーブルを用意し、`owner/repo` 単位で
     `full_name / description / stars / language / owner_avatar / fetched_at`
     を保存する。
   - 作品投稿・編集時に一度取得してキャッシュに書き込む。
   - 日次などの定期ジョブ(cron / EventBridge)でstar数などを再取得して
     更新する。ページ表示は常にMySQLから読むだけにし、GitHub側への
     呼び出し回数をユーザーのアクセス数から完全に切り離す。
   - star数や説明文が数時間〜1日古くても実用上問題ないので、鮮度より
     呼び出し回数の削減を優先してよい。

現状(バックエンドなしのモック)では、Route Handler内の
`fetch(..., { next: { revalidate: 3600 } })` によりNext.jsのデータキャッシュが
1時間は同一リポジトリへの重複リクエストをある程度吸収してくれるが、
これはデプロイ環境・インスタンス数に依存する簡易的な緩和に過ぎない。

## DB基盤は用意したが、アプリはまだ未接続

`prisma/schema.prisma`(User/Project/Post/Reaction/Follow)・シード
(`npm run db:seed`)までは作った。`app/lib/mock-data.ts`の内容と1対1で
対応する形にしてあるので、投入結果は既存のUIが期待する形とほぼ一致する。

残っているのは以下:

1. **コンポーネント側をPrisma経由に切り替える。** 今は`page.tsx`はじめ
   全コンポーネントが`app/lib/mock-data.ts`を直接importしている。
   `app/lib/prisma.ts`のクライアント経由でDBから読むように順次置き換える。
2. **投稿コンポーザーの実装。** Post作成はDB基盤ができたことで初めて
   意味を持つ機能。`prisma.post.create()` + Server Actionで実装するのが
   Next.js App Routerとして素直。
3. **Follow/Reactionは認証が無いと繋げられない。** テーブルは用意したが
   「誰がフォローしているか」を表すにはログインユーザーの概念が必要。
   今の`follow-store.ts`/`ReactionBar`はブラウザ内だけの匿名状態なので、
   認証機能を先に作らないと実DBには繋げられない。
4. **本番切り替え時にMySQL用アダプタへ変更。**
   `prisma/schema.prisma`の`datasource.provider`を`"mysql"`に、
   `app/lib/prisma.ts`のアダプタを`@prisma/adapter-mariadb`
   (またはPrisma公式のMySQL用ドライバアダプタ)に差し替える。

### このマシン固有のメモ(開発環境の制約)

このMac(macOS 13 Ventura / Intel)では:
- **Docker Desktopが起動しない**(`kLSIncompatibleSystemVersionErr`—
  Docker Desktop側が古いOSのサポートを打ち切っている)。
- **Homebrewでの新規インストールが罠になりやすい。** このOSはbrewの
  ボトル配布対象から外れており、`mysql`はllvmのソースビルド、
  `mariadb`は38個の依存関係(X11・Java関連まで)を引き込み、
  どちらも非現実的な時間がかかる。
- そのため、Node.js・MySQL(SQLite代替)ともに、brew/Dockerを経由せず
  「公式バイナリを直接ダウンロード」または「npmのプリビルド済みネイティブ
  モジュール(`@prisma/adapter-better-sqlite3`等)」を使う方針で回避した。
  別のマシン(特に新しいmacOSやLinux)であればDocker Desktopや
  Homebrewが素直に使える可能性が高いので、次に触る環境によっては
  この節は無視してよい。
