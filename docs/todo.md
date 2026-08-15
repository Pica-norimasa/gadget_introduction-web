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

1. ~~コンポーネント側をPrisma経由に切り替える~~ → 実装済み。`app/lib/queries.ts`
   (`getWorks`/`getWorkById`/`getPosts`)がDBの行を既存の`Work`/`Post`型に変換して返す
   アダプタ層になっており、`page.tsx`・`work/[id]/page.tsx`・`opengraph-image.tsx`は
   これ経由でDBから読むように切り替えた。`WorkCard`/`FeedSection`/`HeroRail`/
   `WorkDetail`/`ImmersiveEntry`/`ImmersiveViewer`など下流の表示コンポーネントは
   型が同じなので変更不要、`posts`をpropsで受け取る形にしただけ。`latestPostFor`/
   `postsForProject`は`app/lib/post-helpers.ts`に移動し、posts配列を引数で受け取る
   純粋関数にした(元は`mock-data.ts`のモジュール変数を直接参照していたため)。
   `mock-data.ts`自体は削除せず、`prisma/seed.ts`が読む「シードの元データ」として
   残してある。また`User.followersSeed`を追加し(`Project.commentsSeed`等と同じ
   起点カウント方式)、フォロワー数が0固定になって「無名の逆転枠」判定が
   壊れるのを防いだ。実フォロー数(Follow行)は下の項目3で実際に加算するように
   なった。
2. ~~投稿コンポーザーの実装~~ → 実装済み。`app/components/PostComposer.tsx`
   (Server Action `app/lib/post-actions.ts` 経由で`prisma.post.create()`)。
   投稿は`app/lib/infer-post-type.ts`の簡易ヒューリスティックで種別を自動判定し、
   Projectへの紐付けは必須にしていない(孤立したPostとしてそのまま公開される、
   plan-v2.htmlの方針どおり)。`app/components/RecentActivity.tsx`でDBから
   直接クエリして「最新の創作活動」として表示し、投稿→即反映を確認済み。
   ただし**まだログイン機構が無いため、コンポーザーからの投稿は全員
   固定の「あなた」という1アカウント名義になる**(`post-actions.ts`の
   `GUEST_USER_NAME`参照)。認証ができたら実ユーザーに置き換える。
3. ~~Follow/Reactionは認証が無いと繋げられない~~ → 認証を待たずに、投稿と
   同じ`GUEST_USER_NAME`パターンでDB接続した。
   - `app/lib/reaction-actions.ts`の`toggleReaction`、`app/lib/follow-actions.ts`
     の`toggleFollowAction`がそれぞれReaction/Follow行をトグル(あれば削除、
     なければ作成)するServer Action。
   - `ReactionBar`は表示カウント(`work.reactions`)が既にseed+実カウントの
     合算になったため、「自分の1票を二重に足さない」よう
     `baseCount = 表示カウント - 自分が押した分` を引いてから現在のトグル
     状態を足し戻す形にした。`app/lib/queries.ts`の`getMyReactions`/
     `getMyReactionsForProject`で「自分が既にどのProjectにどのリアクションを
     押したか」をDBから取得し、`posts`と同じやり方でWorkCard/WorkDetail/
     ImmersiveViewerまでpropsで引き回している。
   - Followは複数枚のカードに同じ作者が出ること(フィードの無限スクロールが
     shuffleした複製を繰り返す仕様のため)があるので、`follow-store.ts`の
     クライアント側グローバルストアはそのまま残し、初期値だけをDB由来に
     差し替えた。`app/layout.tsx`を非同期化して`getFollowedAuthors()`を
     取得し、`app/components/FollowHydrator.tsx`(マウント時に一度だけ
     `hydrateFollowed()`を呼ぶだけの非表示コンポーネント)経由でストアに
     反映する。トグル時はローカルを楽観的に更新しつつ`toggleFollowAction`を
     バックグラウンドで呼ぶ(失敗時のロールバックは無し、プロトタイプ相応の
     割り切り)。
   - フォロワー数(`work.followers`)も`followersSeed + 実Follow数`
     (`_count.followedBy`)の合算に更新したので、実際にフォローすると
     「無名の逆転枠」判定や人気順ソートにも反映される。
4. **本番切り替え時にMySQL用アダプタへ変更。**
   `prisma/schema.prisma`の`datasource.provider`を`"mysql"`に、
   `app/lib/prisma.ts`のアダプタを`@prisma/adapter-mariadb`
   (またはPrisma公式のMySQL用ドライバアダプタ)に差し替える。
5. ~~投稿からのProject自動生成(plan-v2.html項目09)~~ → 実装済み。
   `app/components/PostComposer.tsx`に投稿先セレクタを追加し、
   「🆕 新しいプロジェクトとして」「単独の投稿」「📁 自分の既存Project」
   から選べるようにした。「新しいプロジェクトとして」選択時のみ、任意の
   プロジェクト名入力欄が出る(空欄なら投稿本文の先頭24文字から自動生成)。
   `app/lib/post-actions.ts`の`createPost`が、選択に応じてProjectを新規作成
   するか(`category`は暫定で"プロトタイプ"固定、`stage`は投稿の推定タイプから
   決める初期値、`platforms`は["Web"]固定、`hue`はランダム)、既存Projectに
   紐付けるか(所有者が自分のProjectであることをDB側で検証してから紐付け、
   改ざん対策)を判定する。「自分のProject」は`GUEST_USER_NAME`で絞り込むため、
   この定数を`app/lib/guest-user.ts`に切り出した("use server"ファイルは
   async関数以外をexportできないため、post-actions.tsから直接exportできない)。
   新規Projectのidは日本語タイトルをそのままローマ字slug化するのが難しいため、
   `p-`+ランダムhexのopaqueなidにしている(mock-data.ts由来の既存Projectだけが
   読みやすいslugを持つ)。カテゴリ変更・画像追加などのProject編集UIはまだ無い。
   ※この項目中の`GUEST_USER_NAME`/`app/lib/guest-user.ts`は下の項目6で
   軽量セッションに置き換えられ、どちらも削除済み。
6. ~~軽量セッション(認証の代わり)~~ → 実装済み。項目2・3・5がすべて依存していた
   「投稿は全員固定の『あなた』1アカウント名義」を解消した。本格的なOAuth認証は
   まだ作らず、訪問者ごとにCookieで別のUser行を持たせるだけの割り切った実装。
   - `proxy.ts`(プロジェクトルート。Next.js 16では`middleware.ts`ではなく
     `proxy.ts`が正式名称 — ビルド時に非推奨警告が出たので合わせて改名した)が
     edge runtimeで動き、`kizashi_session`という名前のopaqueなCookie(UUID、
     httpOnly)を初回アクセス時に発行するだけ。DBには一切触れない
     (Prismaのネイティブアダプタはedge runtimeで動かせないため)。
   - `app/lib/session.ts`の`getCurrentUser()`(表示用、読み取り専用。まだ何も
     していない訪問者はUser行が無いのでnull)と`getOrCreateCurrentUser()`
     (書き込み系Server Action専用。初回の投稿/リアクション/フォロー時に
     「ゲストXXXX」名でUser行を遅延生成)の2つがエントリポイント。
     `app/lib/guest-user.ts`(`GUEST_USER_NAME`定数)は完全に削除し、
     post-actions.ts/reaction-actions.ts/follow-actions.ts/queries.ts/page.tsx
     の参照をすべてこの2関数に置き換えた。
   - `app/components/IdentityBadge.tsx`(`SiteHeader`から表示)で表示名を
     いつでも変更できる。名前の重複は`User.name`のunique制約で弾かれ、
     「その名前は既に使われています」を表示する。
   - `Work.authorId`をmock-data.tsとqueries.tsに追加し、`page.tsx`の
     「自分のProject一覧」(投稿コンポーザーの紐付け先セレクタ)を
     表示名ではなくidで絞り込むようにした(表示名は訪問者ごとに変わる
     動的な値になったため、文字列一致では判定できない)。
   - **既知の割り切り**: `follow-store.ts`(クライアント側の楽観的更新
     ストア)は「自分自身をフォローできない」ガードを外した。表示名が
     動的になり、クライアント側で安く「自分かどうか」を判定できないため。
     実際の永続化は`follow-actions.ts`側でid比較して防いでいるので、
     自分のカードで誤ってフォローボタンを押しても見た目が一瞬変わる
     だけでDBには残らない(次のリロードで元に戻る)。
   - **既知の副作用**: `cookies()`はNext.jsの「動的API」に該当するため、
     `/`と`/work/[id]`は静的プリレンダリング(SSG)ではなく毎リクエスト
     サーバーレンダリング(dynamic)に切り替わった。訪問者ごとに表示内容
     (自分の名前・リアクション・フォロー状態)が変わる以上これは正しい
     挙動だが、将来アクセス数が増えてパフォーマンスが気になる場合は
     Partial Prerendering(PPR)で個人化された部分だけSuspense境界の
     内側に切り出す余地がある。
   - 本格的なOAuth認証(Googleログイン等)への移行は依然として未着手。
     移行時は`getOrCreateCurrentUser()`の中身をセッションCookie参照から
     実際の認証プロバイダのユーザー解決に差し替えるだけで、呼び出し側
     (Server Action群)は変更不要になるよう設計してある。

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
