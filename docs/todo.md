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
   **同じタイミングで`app/lib/upload.ts`の画像保存先もS3等に
   差し替える必要がある**(項目13参照)。ECS Fargateのような複数
   インスタンス/エフェメラルなファイルシステム前提の構成では、
   ローカルファイルシステムへの保存はそのままでは動かない。
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
7. ~~閲覧数(views)が固定値のまま~~ → 実装済み。`app/lib/queries.ts`の
   `incrementViews(id)`が`Project.views`をアトミックに+1する。作品詳細ページの
   本体(`work/[id]/page.tsx`のデフォルトexport)からだけ呼び、`generateMetadata`
   やOGP画像生成ルートは別途`getWorkById`を呼ぶが増分しない(実際の閲覧とは
   言えないため)。ユニーク訪問者の重複排除はしていない(`Work.views`は元々
   Xのインプレッション表示を模した指標として設計されているため、これは仕様通り)。
8. ~~コメント機能が存在しない~~ → 実装済み。`Comment`モデル(`projectId`必須、
   `Post`と違って孤立コメントの概念は無い)を追加し、`app/lib/comment-actions.ts`
   の`createComment`(Server Action)が軽量セッションのUser名義で書き込む。
   表示は`work.comments`(`Project.commentsSeed` + 実`Comment`行数、
   reactions/followersと同じ起点カウント方式)と、作品詳細ページの
   `app/components/CommentForm.tsx`(投稿フォーム) + `WorkDetail.tsx`内の
   一覧表示(サーバーコンポーネントでそのまま`comments.map`)。自分のコメントは
   `deleteComment`でいつでも削除できる(Xと同様、時間制限なし)。編集・
   返信(ネスト)は未実装。
9. ~~ヘッダーの検索ボックスが飾りだけ~~ → 実装済み。`onChange`も検索結果も
   無いただのプレースホルダーだったものを、`SiteHeader.tsx`内の
   `<form action="/search" method="GET">`(ネイティブGETフォーム、JS不要)+
   新設の`app/search/page.tsx`で置き換えた。`app/lib/queries.ts`の
   `searchWorks(query)`はタイトル・キャッチコピー・作者名のいずれかに
   `contains`一致するProjectを返す(`getWorks()`の中身を`getWorksWhere(where?)`
   に切り出して共有)。
10. ~~🔔通知ボタンが飾りだけ~~ → 実装済み。`Notification`モデル
    (type: reaction/comment/follow, recipientId/actorId, 既読は`readAt`)を
    追加し、`reaction-actions.ts`/`comment-actions.ts`/`follow-actions.ts`の
    それぞれの「新規作成」分岐(トグルの取り消し側では作らない)に通知作成を
    追加した。自分自身の投稿への自分の反応は通知しない(actorId===recipientId
    は弾く)。`app/components/NotificationBell.tsx`(ドロップダウン、未読件数
    バッジ)が`SiteHeader`から表示され、開いた瞬間に`markNotificationsRead`
    (Server Action)を呼んで既読化する。実装中に「setOpenの関数形更新の中で
    setLocalUnreadを呼ぶ」というReactのアンチパターンで
    "Cannot update a component while rendering a different component"
    エラーを一度出しており、`toggle()`内で`open`の現在値を先に読んでから
    2つのsetStateを別々に(ネストさせずに)呼ぶ形に直して解消した。
    リアクション/コメントの絵文字アイコン定義(`REACTION_META`)は
    `ReactionBar.tsx`内のローカル定数から`mock-data.ts`のexportに移し、
    通知の文面生成でも共有している。同じリアクション/フォローを
    「取り消して→もう一度」した場合、その都度新しい通知行ができる
    (X等と同じくトグルのたびに別イベントとして扱う割り切り。取り消し時に
    対応する通知を消す処理はしていない)。
11. ~~ヘッダーの「投稿する」ボタンが飾りだけ~~ → 実装済み。単なる
    `<button type="button">`だったものを`<Link href="/#composer">`に
    変更した。`/work/[id]`・`/search`など投稿コンポーザーが無いページ
    からでも、まず`/`に遷移してからその場でスクロールする(Next.jsの
    Linkはハッシュ付きURLへの遷移時、遷移先ページのマウント後に自動で
    該当要素までスクロールしてくれる)。`PostComposer.tsx`のルート要素に
    `id="composer"`と、固定ヘッダーに隠れないよう`scroll-mt-24`
    (他のアンカー要素と同じ考え方)を付けた。
12. ~~作成したProjectを後から編集できない~~ → 実装済み。投稿コンポーザーで
    「新しいプロジェクトとして」作成すると、カテゴリ・対応環境・画像・
    ツールが全部仮の初期値のまま直せなかった問題を解消。
    `app/work/[id]/edit/page.tsx`(自分のProjectでなければ`redirect`で
    詳細ページに戻す)+ `app/components/ProjectEditForm.tsx` +
    `app/lib/project-actions.ts`の`updateProject`(Server Action、
    こちらもDB側で所有者を検証してから更新)。タイトル・説明文・
    カテゴリ・ステージ・ツール・対応環境・アイコン(絵文字)・GitHub URL
    が編集できる。作品詳細ページの「← 発見に戻る」の右に、自分のProject
    のときだけ「✎ 編集する」リンクを出す。`hue`(サムネイルの色相)の
    変更UIは無し(見た目の些末な調整で優先度が低いため見送り)。
13. ~~タイムライン/コメントに画像を添付できない~~ → 実装済み(画像のみ、
    動画は「ゆくゆく」の要望なので今回は未着手)。`Post`/`Comment`両方に
    `imageUrl String?`を追加。`app/lib/upload.ts`の`saveUploadedImage()`
    がServer Action内で受け取った`File`をバリデーション(jpg/png/gif/webp、
    5MBまで)した上で**ローカルの`/public/uploads`に直接書き込む**
    実装になっている。これは本番のAWS環境(ECS Fargateのような複数
    インスタンス/エフェメラルなファイルシステム前提)ではそのまま動かない
    ため、S3移行が必須(項目4に追記)。本文か画像のどちらか一方だけでも
    投稿できるようにcreatePost/createCommentのバリデーションを緩和した。
    `next.config.ts`の`experimental.serverActions.bodySizeLimit`を
    デフォルト1MBから8MBに引き上げている(Server Actionの標準機能で
    File送信を受け取れるため、別途アップロード用のRoute Handlerは
    作っていない)。`app/components/ImagePickerButton.tsx`を
    PostComposer/TimelinePostForm/CommentForm共通の画像選択+プレビュー
    部品として切り出した。
14. ~~コメント欄にアイコンが出ない~~ → 実装済み。既存の`AuthorAvatar`
    (名前の文字列から色相を決定的に生成するイニシャルアバター)を
    `WorkDetail.tsx`のコメント行に追加しただけで、新規コンポーネントは
    不要だった。**未着手**: 「Xの@からはじまるユーザーID」のような、
    表示名とは別の恒久的なハンドル表示。今の`User.name`は表示名を
    兼ねていて`IdentityBadge`からいつでも変更できるため、そのまま
    ハンドルとして使うとXの@handleのような「基本は変わらない識別子」
    という性質に合わない。実装するなら、User作成時に別途
    `handle`(変更不可、または変更頻度を制限)を持たせる形になる。
15. ~~制作タイムライン投稿にAIが応援コメントを自動でつける~~ →
    実装済み。ただし本物のLLM呼び出しではなく、投稿の種別(アイデア/
    制作中/デモ/リリース等)と本文・画像の有無だけを見て定型文プールから
    ランダムに1件選ぶテンプレート実装(`app/lib/ai-comment.ts`の
    `generateEncouragementComment()`)。将来的に実際のLLM API呼び出しに
    差し替える前提で、この関数のシグネチャ(入力=投稿の意味的特徴のみ、
    出力=Promise<string>)だけで呼び出し側と分離してある。コメントの
    投稿者は`app/lib/ai-user.ts`の`getAiUser()`が`name`のuniqueを
    利用してupsertする固定User(`きざしAI`、sessionId無し=mock由来の
    シードUserと同じ扱い)。トリガーは`app/lib/post-actions.ts`の
    `createPost`内、Projectに紐づくPost(=タイムライン投稿。新規
    プロジェクト作成の最初の投稿も含む)が作られたときで、`next/server`の
    `after()`でレスポンス送信後に実行している(将来LLM API呼び出しに
    差し替えたときのレイテンシで投稿自体を遅くしないため)。生成した
    コメントは通常のコメント投稿と同様`Notification`(type: "comment")
    も作るので、通知ベルにも「きざしAIさんがコメントしました」として出る。
    **未着手**: 実際のLLM API呼び出しへの差し替え(要APIキー)。

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
