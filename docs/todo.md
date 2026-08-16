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
    利用してupsertする固定User(`Draftly AI`、sessionId無し=mock由来の
    シードUserと同じ扱い)。トリガーは`app/lib/post-actions.ts`の
    `createPost`内、Projectに紐づくPost(=タイムライン投稿。新規
    プロジェクト作成の最初の投稿も含む)が作られたときで、`next/server`の
    `after()`でレスポンス送信後に実行している(将来LLM API呼び出しに
    差し替えたときのレイテンシで投稿自体を遅くしないため)。生成した
    コメントは通常のコメント投稿と同様`Notification`(type: "comment")
    も作るので、通知ベルにも「Draftly AIさんがコメントしました」として出る。
    **未着手**: 実際のLLM API呼び出しへの差し替え(要APIキー)。
16. ~~ユーザーフォローがプロダクト単位に見える~~ → 実装済み。実は
    `Follow`モデルは元々User⇄User(フォローすると相手の今後の全
    プロジェクトがサイドバーの「フォロー中の創作活動」に流れる)だった
    が、フォロー結果を確認できる場所(プロフィールページ)が無く、
    フォローボタンも各作品カードの中にしか出てこないため、プロダクト
    単位のフォローに見えていた。Xのユーザーページに相当する
    `/u/[name]`(`app/u/[name]/page.tsx`)を新設し、アバター・
    フォロワー数/フォロー中の数・その人が投稿した全プロジェクト
    (`getUserProfile()`、`getWorksWhere({ authorId })`を再利用)・
    フォローボタンを表示。`User.name`は既にAuthor識別に使われている
    ため(`toggleFollowAction(authorName)`等)そのままURLパラメータに
    採用、日本語名は`encodeURIComponent`/`decodeURIComponent`で
    往復させている。既存の作者名/アバター(`WorkCard`のカード内、
    `WorkDetail`の作者行、`WorkDetail`のコメント行)からこのページへの
    リンクを追加。**未着手**: サイドバーの活動ログや通知ベルの投稿者名、
    `StoriesStrip`のストーリー内の作者名はまだリンクしていない(同じ
    パターンで機械的に追加できるはずだが、今回のスコープからは外した)。
17. ~~ユーザー情報の更新が表示名変更だけ~~ → 実装済み。`User.bio
    String?`を追加(migration: `20260816094059_add_user_bio`)。
    プロフィールページ(`/u/[name]`)に`BioEditor.tsx`を置き、
    `IdentityBadge.tsx`と同じ表示⇔編集トグルパターンで自分の自己紹介
    (160文字まで)を書ける。他人のプロフィールでは編集UIは出さず、
    テキストがあればそのまま表示、無ければ何も出さない(自分の場合だけ
    「自己紹介はまだありません」というプレースホルダを見せて編集を促す)。
    `session-actions.ts`に`updateBio()`を追加、更新後は`/u/[name]`
    だけを`revalidatePath`(自己紹介はそのページにしか出ないため、
    `updateDisplayName`のようにlayout全体を無効化する必要はない)。
    スキーマ変更後、常駐していた`next dev`プロセスが古いPrisma
    Clientをメモリに保持したままだったため`Unknown argument bio`
    エラーになった。プロセス再起動で解消(`prisma generate`後は
    実行中のdev serverの再起動が必要、というのを覚えておく)。
18. ~~トップページから自分のプロフィールへの入り口が無い~~ →
    実装済み。プロフィールページ自体(項目16)は作ったが、辿り着けるのは
    「自分の投稿した作品カードの中の自分の名前」経由だけで、未投稿だと
    その経路も無かった。サイドバーの「自分の創作物」見出しの右に
    「プロフィールを見る」リンクを追加(`Sidebar`に`currentUserName`を
    新規propとして渡し、`/u/${encodeURIComponent(currentUserName)}`
    へ)。User行がまだ無い(一度も投稿・リアクション・フォローしていない)
    訪問者にはリンク自体を出さない(そのプロフィールページはまだ
    存在しないため)。
19. ~~「あなたへ」タブが個人化されていない~~ → 実装済み。UI/UX比較
    レビューで指摘した通り、従来は`followers`昇順(小さな作者優遇)で
    閲覧者に関係なく同じ並びだった。本物のレコメンドAIの代わりに、
    手元に既にある2つのシグナルから素点を作る簡易パーソナライズに
    変更(`FeedSection.tsx`の`personalizedScore()`)。
    (1)フォロー中の作者の作品を強く優遇(+100)、(2)過去にリアクション
    した作品と同じカテゴリ(+20)・同じツール(+10)を優遇、(3)強い
    シグナルが無いユーザー向けに、従来の「小さな作者優遇」を弱めた形で
    残す(発見の余地の確保)。`myReactions`(props)と`followedAuthors`
    (`follow-store.ts`の`useFollowedAuthors()`)は既にクライアント側に
    あるシグナルなので、新規のサーバー問い合わせは不要だった。
    ブラウザで実際にsoraをフォロー→「あなたへ」の先頭にsoraの作品が
    来ることを確認、フォロー解除で元の並びに戻ることも確認した。
20. ~~サムネイルが絵文字ベースでビジュアルが弱い~~ → 実装済み。UI/UX
    比較レビューの指摘通り、`WorkThumb`は色相+絵文字のプレースホルダー
    しか持たず、実写真を貼れなかった。`Project.coverImageUrl String?`を
    追加(migration: `20260816102158_add_project_cover_image`)、
    設定されていれば`GitHubCard`/`MotionThumb`/`WorkThumb`より優先して
    `CoverImage.tsx`(実画像を`object-cover`で表示、`compact`/`size`
    バリアントはWorkThumbと同じ考え方)を表示する。設定経路は2つ:
    (1)投稿コンポーザーで新規プロジェクト作成時に画像を添付すると、
    その画像がそのまま初期カバーになる(`post-actions.ts`)。
    (2)作品編集ページ(`ProjectEditForm.tsx`)に`ImagePickerButton`を
    追加し、後から設定・差し替え・削除できる。削除は「アップロード
    無し」と区別する必要があるため、`removeCoverImage`という隠し
    フィールドを別途持たせている(`project-actions.ts`の`updateProject`:
    新規アップロードがあれば差し替え、`removeCoverImage=1`ならnullに、
    どちらも無ければ既存値に触れない)。`WorkCard`・`WorkDetail`・
    `Sidebar`(週間ランキング・自分の創作物のcompactサムネイル)の
    3箇所に反映。OGP画像(`opengraph-image.tsx`)はまだ絵文字のままで
    未対応(Satoriでの画像URL解決が別途必要になるため、今回はスコープ
    外)。ブラウザで実際に画像付き投稿→カード/詳細ページへの反映、
    編集ページでの削除→プレースホルダーへの復帰まで確認した。
21. ~~通知がグルーピングされない~~ → 実装済み。UI/UX比較レビューの
    指摘通り、人気作品ができるとリアクション/コメント/フォローが1件
    ずつそのまま並び、バズると実用に耐えなくなる懸念があった。
    `getNotificationData()`(`queries.ts`)で、種別+対象Project+
    リアクション種別が同じ通知をグルーピングするように変更(フォロー
    通知はprojectId/reactionTypeを持たないため種別だけでまとまる)。
    グルーピング対象を確保するため元データの取得件数を20→50件に
    増やし、グループ化後に上位20件を返す。`NotificationView`は
    `actorName: string`から`actorNames: string[]`+`actorCount: number`
    に変更、`NotificationBell.tsx`の`actorLabel()`が「Aさん」「Aさん、
    Bさん」「Aさん、Bさん他5人」の3パターンを組み立てる(X/Instagramと
    同じ考え方)。未読件数(`unreadCount`)も生の行数ではなく「未読を
    含むグループの数」に変更し、バッジの数字と一覧の件数が一致する
    ようにした(グループ内に1件でも未読があればグループごと未読扱い)。
    `markNotificationsRead()`自体は変更なし(元々行単位で全既読化する
    実装のままでよい)。ブラウザで、3人が同じ作品に同じリアクション種別
    で反応→1件の「Aさん、Bさん他1人が😲リアクションしました」に
    まとまることを確認、未読バッジの数もグループ数と一致することを
    確認した(その過程で実ユーザーが並行してテストしていた本物の
    フォロー通知が未読バッジに混ざっているのに気づいたが、これは
    正しい挙動)。
22. ~~リポスト(拡散)導線が無い~~ → 実装済み。UI/UX比較レビューの
    指摘通り、外部シェア(LINE/X/リンクコピー)しか無く、プラットフォーム
    内で他人の投稿を自分のフォロワーに再配布する仕組みが無かった。
    新しい`Repost`モデル(`userId`+`projectId`、`@@unique`でトグル、
    migration: `20260816105132_add_repost`)を追加し、`FollowButton`/
    `ReactionBar`と同じ設計(`repost-actions.ts`の`toggleRepost()` +
    `repost-store.ts`(`useSyncExternalStore`のクライアント側キャッシュ)
    + `RepostHydrator.tsx`(`app/layout.tsx`でDBの状態を初回反映))で
    `RepostButton.tsx`(🔁アイコン、`WorkCard`/`WorkDetail`の
    ReactionBar横に設置)を作った。コメント数と同様、押した瞬間の
    カウントは楽観的更新せず(revalidatePathで次回描画時に反映)、
    押下状態(自分がリポスト済みか)だけは即座にグローバルストア経由で
    反映される。自分の作品を自分でリポストすること自体は禁止しない
    (Xのセルフリツイートに近い扱い。通知だけは自分宛てに作らない)。
    **本題である「再配布」の実装**: サイドバーの「フォロー中の創作活動」
    が、フォロー中の作者本人の投稿(既存)に加えて、フォロー中の"誰か"が
    リポストした作品(新規、`getRecentReposts()`)も時系列でマージして
    表示するようになった。ここでのポイントは、リポストされた作品の
    作者自体はフォロー対象でなくてもよいこと――フォロー中の人が
    リポストするだけで、その人のフォロワーに届く。これが実際の
    ネットワーク効果(直接フォローしていない相手の作品にも、フォロー
    中の人の拡散を通じてリーチが伸びる)にあたる。リポスト通知
    (`type: "repost"`)も追加し、項目21のグルーピングにもそのまま
    載る(`projectId`ベースでグループ化されるため、コメント通知と
    同じ扱いで自然にまとまる)。没入ビューア(`ImmersiveViewer.tsx`)には
    リポストボタンを追加していない(そもそもFollowButtonも置かれていない
    サーフェスで、一貫性のため見送った)。「あなたへ」タブの
    パーソナライズ(項目19)にリポストのシグナルを混ぜることも検討したが、
    プロジェクトごとの「誰がリポストしたか」一覧をクライアントに渡す
    追加のデータ配線が必要になるため、今回は見送った。ブラウザで
    実際にリポスト→カウント反映(リロード後)→通知作成、別ユーザー
    (sora)による他人の作品のリポスト→そのユーザーをフォロー→
    サイドバーに「🔁 soraさんがリポスト」として表示、まで確認した。
23. ~~引用リポスト(コメント付き)~~ → 実装済み。`Repost`に
    `comment String?`を追加(migration: `20260816110952_add_repost_comment`、
    1ユーザー1Projectあたり1行の制約は変えず、後からコメントを
    付け足す/書き直すのもこの行のUPDATEで表現)。UIはXの「リポスト/
    引用」選択に近い形: `RepostButton`に`allowQuote`propを追加し、
    まだリポストしていない状態でクリックすると「🔁 そのままリポスト」
    /「💬 コメントを付けて引用」の選択肢が出る(既にリポスト済みなら
    今まで通りクリック1発で即取り消し)。「コメントを付けて引用」を
    選ぶとその場でテキストエリアが開き、`quoteRepost`(Server Action、
    `useActionState`)が送信を受けてRepost行をupsertする。**この選択肢
    はWorkDetailだけで有効**(`allowQuote`はWorkCardには渡していない)。
    理由: WorkCardは`overflow-hidden`なカード内でスペースが無く、
    選択メニューやテキストエリアが見切れるため。通知は初回リポスト時
    だけ作る(コメントの書き直しでは重複通知しない、`quoteRepost`内で
    既存行の有無を見て判定)。サイドバーの`RepostRow`は`comment`が
    あればそれを本文として表示し見出しも「引用リポスト」に変える
    (無ければ従来通り作品自体のキャッチコピー+「リポスト」)。ブラウザで
    実際に、コメント付きでの引用→カウント/押下状態への反映、別ユーザー
    (kaede_p)による引用リポスト→フォロー→サイドバーに「🔁 kaede_pさんが
    引用リポスト」+コメント本文が表示されることまで確認した。
24. ~~トップの「Build Logs」ラベルが分かりにくい~~ → 実装済み。
    `StoriesStrip.tsx`(フォロー中の作者の最近の投稿をストーリー形式で
    見せる欄)の見出しが英語の`Build Logs`(企画書内では「制作過程を
    継続的に発信する機能」全体を指す社内用語で、この欄単体の説明には
    なっていなかった)のままだったのを「フォロー中ユーザー」に変更。
    合わせて、フォロー中の作者が誰もいない(≒新規訪問者の大半)場合は
    見出しだけが中身の無いまま浮いて見えていた問題も直し、
    `stories.length === 0`のときはセクションごと非表示にした
    (サイドバーの他セクションと同じ「空なら隠す」パターン)。ブラウザで、
    未フォロー時は非表示・1人フォローすると見出しとストーリーが
    出ることを確認した。
25. ~~フォローの立ち上げ導線が弱い~~ → 実装済み。UI/UX比較レビューの
    指摘通り、新規ユーザーがフォロー0人のまま孤立し、直近で作った
    フォロー起点の機能(パーソナライズされた「あなたへ」タブ、リポスト
    拡散、フォロー中ユーザーのストーリーズ)が何も機能しない状態
    だった。サイドバーに「おすすめの作者」セクションを新設
    (`getSuggestedAuthors()`)。本物のレコメンドの代わりに、まだ
    フォローしていない/自分以外で、作品を1つ以上投稿しているUserを
    フォロワー数順に並べるだけの簡易実装(`Draftly AI`はProjectを
    持たないため`projects: { some: {} }`の条件だけで自然に除外される)。
    各行はアバター+名前+自己紹介(未設定なら代表作のタイトル、それも
    無ければフォロワー数)+その場でフォローできるボタン。候補が0件の
    ときはセクションごと非表示(項目24と同じ「空なら隠す」パターン)。
    配置は「最新の創作活動」と「フォロー中の創作活動」の間――後者を
    育てるための導線という位置づけが伝わるように、あえて隣接させた。
    ブラウザで実際に1人フォロー→そのユーザーが候補から消え、別の
    候補が繰り上がることを確認した。
26. ~~通報機能が無い~~ → 実装済み。新しい`Report`モデルを追加
    (migration: `20260816114631_add_report`)。`targetType`
    (project/comment/user)に応じて`projectId`/`commentId`/
    `reportedUserId`のどれか1つだけが埋まるポリモーフィックな形
    (`Notification.projectId`と同じ考え方)。「⋯」ボタン→「🚩 通報する」
    →理由(スパム/不適切な内容/なりすまし・詐称/その他)選択+詳細
    (任意)のフォーム、という段階をNotificationBellと同じクリック
    外側で閉じるドロップダウンパターンで実装(項目27でこのメニュー
    自体は`MoreActionsMenu.tsx`に拡張・改名)。`WorkDetail.tsx`
    (作品自体、他人の作品のときだけ表示)・コメント行(他人のコメント
    のときだけ、DeleteCommentButtonと排他)・`/u/[name]`(ユーザー自体、
    他人のプロフィールのときだけ)の3箇所に設置。自分の作品/コメント/
    自分自身への通報はUIの導線を出さないだけでなく、`submitReport()`
    (`report-actions.ts`)側でも弾く(defense in depth)。**やらな
    かったこと**: モデレーション画面(通報一覧を確認する管理者向け
    UI)は無く、現状はPrisma Studio等で`Report`テーブルを直接見る
    運用が前提。ブラウザで、作品・コメント・ユーザーそれぞれへの通報が
    正しく`Report`行として記録されること、自分の作品/プロフィールには
    通報導線が出ないことを確認した。
27. ~~ブロック・ミュートが無い~~ → 実装済み。`Mute`(一方通行、相手には
    何も伝わらずコンテンツを非表示にするだけ)と`Block`
    (同じ非表示に加えてブロック開始時点の相互フォローを解消する)を
    それぞれ追加(migration: `20260816115628_add_mute_block`)。
    `toggleMute`/`toggleBlock`(それぞれ`mute-actions.ts`/
    `block-actions.ts`)+`mute-store.ts`/`block-store.ts`
    (`useSyncExternalStore`のクライアント側キャッシュ)+
    `MuteHydrator.tsx`/`BlockHydrator.tsx`(`app/layout.tsx`でDBの
    状態を初回反映)という、Follow/Repostと全く同じ3点セットの設計。
    項目26の`ReportMenu.tsx`を`MoreActionsMenu.tsx`に拡張・改名し、
    「⋯」メニューに「🔇/🔊 ミュート」「🚫 ブロック」「🚩 通報する」の
    3項目を並べた(ミュート/ブロックは対象コンテンツではなく常に
    その「作者」に対する操作なので、呼び出し側は`reportTarget`とは
    別に`author: { id, name }`も渡す)。**コンテンツ非表示の実装**:
    `getMutedOrBlockedAuthorIds()`という共通ヘルパーを作り、能動的な
    発見導線(`getWorks()`・`searchWorks()`・`getRecentActivity()`・
    `getRecentReposts()`・`getSuggestedAuthors()`・
    `getCommentsForProject()`)にだけ適用した。特定のプロフィール
    ページやWork詳細ページなど、URLで直接たどり着いた先までは
    意図的に隠していない(能動的な閲覧までは妨げない、という一方向の
    非表示という設計判断)。**ハマった点**: `getWorks()`が
    `getCurrentUser()`(=`cookies()`)を呼ぶようになったことで、
    ビルド時にリクエストコンテキストを持たない`generateStaticParams`
    (`app/work/[id]/page.tsx`)がクラッシュした。`generateStaticParams`
    は特定閲覧者のミュート/ブロック状態と無関係に「存在する全ページ」
    を対象にすべきなので、フィルタ無しでID一覧だけを返す軽量版
    `getAllProjectIds()`を別途用意して置き換えた(ついでにreaction
    集計等の不要なデータ取得も無くなり効率化にもなった)。**やら
    なかったこと**: 認証が無いプロトタイプなので、ブロックされた側の
    書き込み(コメント・リアクション・リポスト・フォロー)そのものを
    サーバー側で拒否する強制力は持たせていない(表示上取り除くところ
    までがスコープ)。双方向の非表示(ブロックした側のコンテンツを
    ブロックされた側からも隠す)も無し、一方向のみ。ブラウザで、
    ミュート→対象作者の作品が新着/急上昇/最新の創作活動/おすすめの
    作者から消える→解除で復帰、ブロック→同じ非表示+事前に張っていた
    相互フォローが実際に解消されることまで確認した。
28. ~~投稿の意思決定コストが高い~~ → 実装済み。UI/UX比較レビューの
    指摘通り、投稿コンポーザーの「投稿先」ドロップダウンが毎回
    「🆕 新しいプロジェクトとして」から始まるため、一番よくある使い方
    (今取り組んでいるプロジェクトに続きを積む)のたびに、投稿するより
    前にドロップダウン操作が必須になっていた。`PostComposer.tsx`の
    既定値を、既存プロジェクトがあれば直近に作成したもの(`myProjects[0]`)
    に変更。プロジェクトが1つも無い(初回投稿者)場合だけ従来通り
    「新しいプロジェクトとして」が既定のまま。これにより、2回目以降の
    投稿は「本文を書いて投稿するだけ」が既定の最短動線になる
    (新しいプロジェクトを始めたいときだけドロップダウンを操作すれば
    よい)。ついでにドロップダウンの前に「投稿先」という短いラベルを
    添えて、何を選んでいるかが一目でわかるようにした。投稿成功後の
    リセット処理も、ハードコードされた`"new"`ではなく同じ既定値ロジック
    に揃えた。ブラウザで、初回投稿(0件時は「新しいプロジェクトとして」
    既定)→投稿後にリロード→2回目以降はその投稿したプロジェクトが
    既定で選ばれていることを確認した。
29. ~~自分のプロフィールでミュート・ブロック中一覧を見て解除できない~~
    → 実装済み。項目27でミュート・ブロックの仕組み自体は作ったが、
    誰をミュート/ブロックしたか一覧で振り返って解除する場所が無く、
    相手のプロフィールを覚えていて個別に開き直すしかなかった。
    `getMutedUsers()`/`getBlockedUsers()`(`queries.ts`、id一覧だけの
    既存`getMutedUserIds()`/`getBlockedUserIds()`とは別に表示名も
    含めて返す)を追加し、自分のプロフィールページ(`/u/[name]`、
    `isOwnProfile`のときだけ)の末尾に「ミュート中」「ブロック中」の
    セクションを表示。`MutedBlockedList.tsx`は各行に既存の
    `toggleMute`/`toggleBlock`(トグルなので「解除する」は同じ関数を
    再度呼ぶだけでよい)を紐付け、表示自体はサーバーから渡された初期
    一覧をクライアント側ストアの最新状態でフィルタしているので、解除
    すると即座にその行が消える(ページ再読み込み不要)。両方0件になった
    らセクションごと非表示。他人のプロフィールでは`isOwnProfile`が
    falseなのでこの一覧自体を取得・表示しない(自分の非公開情報が
    他人のページ経由で漏れないようにするため)。ブラウザで、ミュート
    1件+ブロック1件を作った状態から自分のプロフィールで両方確認→
    それぞれ解除→即座に行が消えて最終的にセクションごと消えること、
    他人のプロフィールにはこの情報が出ないことを確認した。
    追記: ブロック中一覧にはいつブロックしたかも表示してほしいと
    要望があり、`getBlockedUsers()`が`daysAgo`も返すように変更
    (`BlockedUserRef`型、`formatPostedAgo()`で「今日にブロック」
    のように表示)。ミュート側は要望が無かったため据え置き(ミュートは
    Mute行自体に`createdAt`はあるが、一覧側では表示していない)。
30. ~~ユーザー詳細ページにトップへ戻るボタンが無い~~ → 実装済み。
    `app/work/[id]/page.tsx`(WorkDetail)には既に「← 発見に戻る」
    リンクがあったが、`/u/[name]`には無く、ヘッダーのロゴ
    (`SiteHeader.tsx`)も`href="#"`(現在ページの先頭にスクロールする
    だけで、トップページへの遷移にはならない)のままだったため、
    プロフィールページからは実質トップに戻る手段が無かった。WorkDetail
    と同じ「← 発見に戻る」リンク(`href="/"`)をプロフィールページの
    先頭に追加。ブラウザで実際にクリックしてトップページへ遷移する
    ことを確認した。
    追記: 「ついでに直して」との依頼を受け、`SiteHeader.tsx`側の
    根本原因も解消した。ロゴの`<a href="#">`を`<Link href="/">`に
    変更(SiteHeaderは全ページ共通ヘッダーなので、これでどのページ
    からでもロゴクリックでトップへ戻れるようになった)。同じファイル内
    で全く同じ問題を抱えていた「発見する」(`href="#feed"`)・
    「ランキング」(`href="#ranking"`)のデスクトップ幅ナビリンクも
    ついでに`href="/#feed"`・`href="/#ranking"`に修正(ホーム以外の
    ページではトップに戻らずその場でスクロールを試みるだけの、全く
    同じ種類のバグだったため)。ブラウザで、使い方ページからロゴ
    クリック→トップページへの遷移、ヘッダー内4リンク全ての`href`が
    `/`または`/#...`になっていることを確認した。
31. ~~通知ベル・サイドバーの投稿者名がプロフィールにリンクしていない~~
    → 実装済み。項目16で「サイドバーの活動ログや通知ベルの投稿者名、
    StoriesStripのストーリー内の作者名はまだリンクしていない」と
    明示的に保留にしていた箇所を仕上げた。`NotificationBell.tsx`
    (`ActorLabel`/`NotificationMessage`)、`Sidebar.tsx`の
    `RankingRow`/`PostRow`/`RepostRow`/`ActivityRow`、`StoriesStrip.tsx`
    の展開ストーリー表示、の計6箇所。**共通してハマった点**:
    どの箇所も元々「行全体を対象Project(または`#work-...`アンカー)への
    リンク」にしていたため、そこにさらに作者名リンクを混ぜると
    `<a>`のネスト(不正なHTML、Reactが警告を出す)になる。解決策として、
    「作者名リンク」と「残りの内容(対象Projectへのリンクを含む)」を
    親子ではなく兄弟要素に分離する形に統一した(行全体を1つの
    stretched linkにするのをやめ、それぞれが独立したリンクを持つ)。
    NotificationBellはグルーピングされた通知(項目21)の「Aさん、Bさん
    他5人」のうち、先頭2名だけを個別にプロフィールへリンクし
    (「他N人」の部分はリンクしようがないのでプレーンテキストのまま)、
    通知全体のクリックで閉じていたドロワーは各リンクの`onClick`で
    個別に閉じるよう変更した。StoriesStripは、ストーリーの円形
    サムネイル自体(タップでストーリーを開く主動作)は変更せず、
    展開後のビューア内のヘッダー(作者名+アイコン)だけをプロフィール
    リンクにした(親要素に既に`stopPropagation`があるため、リンクの
    クリックが背景クリックによる`close()`を誤爆させないことも確認
    済み)。ブラウザで、通知ベル(単独/グループ化された複数名)・
    週間ランキング・最新の創作活動・フォロー中の創作活動(投稿/
    リポスト両方)・展開ストーリーのそれぞれで、作者名リンクと本来の
    リンク(作品詳細/該当カードへのアンカー)が両方独立して正しく
    機能することを確認した。
32. ~~通報一覧を確認するモデレーション画面が無い~~ → 実装済み。項目26
    (通報機能)で積み残していた「通報を確認する場所」を`/admin/reports`
    として新設。このアプリには認証もユーザー権限も無いため、本格的な
    権限管理の代わりに環境変数`ADMIN_KEY`と突き合わせるだけの軽量な
    ゲートにした(`app/lib/admin-auth.ts`の`isAdminAuthed()`)。
    `ADMIN_KEY`が未設定なら誰もログインできない(空文字同士が一致して
    しまう事故を防ぐ安全側のデフォルト)。ログインは合言葉フォーム
    (`AdminLoginForm.tsx`)→`adminLogin`(Server Action)が
    `httpOnly`な`draftly_admin`Cookieを発行、以降はそのCookieの値が
    `ADMIN_KEY`と一致するかだけを見る(`session-cookie.ts`と同じ設計
    パターン)。`getAllReports()`(`queries.ts`)は他のクエリと違い
    「現在ユーザー」でスコープしない唯一の例外(通報は全体を見る運営者
    向けの一覧のため)、`targetType`に応じてproject/comment/userの
    どれか該当するリンク先を組み立てて返す。**やらなかったこと**:
    ちゃんとした認証基盤・ロールベースの権限管理は無い(将来的に実
    認証を入れる際にこのゲートごと差し替える想定)。既読/対応済み
    フラグなどのステータス管理も無く、今回は一覧表示のみ。ブラウザで、
    間違った合言葉で拒否→正しい合言葉でログイン→実際に溜まっていた
    (実ユーザーによる本物の)通報が正しく表示され対象ユーザーへの
    リンクも機能すること→ログアウト→`ADMIN_KEY`未設定時は誰もログイン
    できないこと、まで確認した。
33. ~~リアルタイム感がない~~ → 実装済み(通知ベルのみ、スコープは
    ユーザーと相談して決めた)。UI/UX比較レビューの指摘通り、
    Server Actions + revalidatePathのアーキテクチャは他人のアクション
    (フォロー・リアクション・コメント・リポスト)による通知が自分の
    開いているタブに反映されず、リロードするまで気づけなかった。
    WebSocket/SSEのような本格的なプッシュ基盤は今のアーキテクチャ
    (単一Next.jsサーバー、pub/sub基盤なし)からの変更が大きいため、
    ユーザーと相談の上、ポーリングで通知ベルだけを対象にする方針にした
    (フィードのポーリングは今回のスコープ外)。
    `notification-actions.ts`に`fetchNotificationData()`を追加
    (`queries.ts`の`getNotificationData()`は`"use server"`を持たない
    ためクライアントから直接呼べず、薄いラッパーとして公開)。
    `NotificationBell.tsx`が15秒おきに`setInterval`でこれを呼び、
    バッジの数字と通知一覧をローカルstateとして更新する。ドロワーを
    閉じていてもポーリング自体は動き続ける(閉じた状態でもバッジが
    更新されるのが目的のため)。タブがバックグラウンドの間は
    `document.visibilityState`を見て無駄打ちしない。ブラウザで、
    リロードせずに、他ユーザーからの新着通知(フォロー)がバッジの
    数字と一覧の両方に反映されることを実際に確認した(通知を仕込んで
    から18秒待ち、ページを一切触らずにバッジが0→1に変わることを確認)。
    **やらなかったこと**: フィード(新着投稿)のライブ更新、
    WebSocket/SSEへの置き換えは今回のスコープ外。
34. ~~リポストのシグナルを「あなたへ」の個人化に混ぜる~~ → 実装済み。
    項目22(リポスト機能)で「プロジェクトごとの『誰がリポストしたか』
    一覧をクライアントに渡す追加のデータ配線が必要」として見送っていた
    分。実際にはSidebar向けに既に`getRecentReposts()`をトップページで
    取得済みだったため、追加のデータ取得は不要で、その`reposts`を
    `FeedSection`にもpropとして渡すだけで済んだ。`personalizedScore()`
    (`FeedSection.tsx`)に第4のシグナルとして「フォロー中の"誰か"が
    リポストした作品か」を追加(+60点、直接フォローの+100点ほどでは
    ないがカテゴリ/ツール一致の+20/+10点より強い、という重み付け)。
    これにより、作品の作者自体はフォローしていなくても、フォロー中の
    人がリポストしていれば「あなたへ」タブで優遇されるようになった
    ――項目6(リポスト拡散)がサイドバーの「フォロー中の創作活動」
    だけでなく、メインフィードの個人化にも実際に効くようになった形。
    ブラウザで、フォローしていない作者(8bit_ojisan)の作品を、別の
    ユーザー(kaede_p)がリポスト→kaede_pをフォロー→「あなたへ」タブで
    その作品が(kaede_p自身の作品に次ぐ)上位に来ることを確認、
    フォロー/リポストを取り消すと元の並びに戻ることも確認した。
35. ~~更新感が低い(気軽な単独投稿が埋もれる)~~ → 実装済み。Xと比べて
    「常に何か動いている感じ」が弱い、特にプロジェクトに紐付けない
    気軽な投稿がサイドバーの「最新の創作活動」の奥に埋もれて
    もったいない、という指摘。ただし「プロダクト一覧を一番見せたい」
    という制約は保ちたいとのことで、以前のような「トップ最上部に
    投稿ストリームを置く」形は避け、案として(A)メインフィードに軽量
    カードとして混ぜる/(B)ヒーローの下に専用の帯を新設、の2案を提示。
    (B)を選択。`MurmurStrip.tsx`をHeroRail(今日の掘り出し物)の直後・
    メインフィードグリッドの直前に新設し、単独投稿だけを横スクロールの
    帯として見せる(StoriesStripと同じ「ヒーロー下に控えめな帯」という
    配置パターン)。各カードはアバター+名前+時間+本文(3行まで)+
    画像(あれば)で、投稿単体の詳細ページが無いため投稿者のプロフィール
    へリンク。`getRecentStandalonePosts()`(`queries.ts`)を新設、
    ミュート/ブロックのフィルタも他の能動的発見面と同様に適用。合わせて
    `getRecentActivity()`(サイドバー「最新の創作活動」向け)を
    プロジェクト紐付き投稿限定に変更し、単独投稿が新しい帯とサイドバーの
    両方に重複して出ないようにした(以前はここに一緒に出ていて、それが
    「埋もれる」の元凶だった)。ブラウザで、実際の単独投稿(山中さんに
    よるもの)がヒーローの直後に正しい見た目で表示され、クリックで
    投稿者プロフィールへ遷移すること、サイドバーの「最新の創作活動」
    からは同じ投稿が消えて重複表示が無くなったことを確認した。
36. ~~トップ最上部の投稿フォームを常時表示しない~~ → 実装済み。項目35の
    延長で、トップページを開いた瞬間に投稿フォームより先に作品一覧を
    見せたい、ヘッダーの「投稿する」ボタンをクリックしたときだけ出せば
    よい、という要望。`PostComposerToggle.tsx`を新設し、既定では
    「✎ 今なにか作ってますか？投稿する」という折りたたんだバーだけを
    表示、クリックで`PostComposer`本体に展開する(投稿後に畳み直す
    UIは無し、Xと同様に開いたままにする)。**ハマった点**: ヘッダーの
    「投稿する」は元々`<Link href="/#composer">`だったが、既にトップ
    ページにいる状態でクリックしても展開されないというバグが発生。
    調べたところ、next/linkは同一ページ内のハッシュだけの遷移では
    (`node_modules/next/dist/docs`によれば)ブラウザ標準の
    `scrollIntoView()`を内部で直接呼ぶだけで、`history.pushState`
    ベースのためネイティブな`hashchange`イベントを発火しない(仕様上
    `pushState`は`hashchange`の対象外)。ハッシュ監視だけでは検知
    できないため、`composer-store.ts`という共有の状態源
    (`useSyncExternalStore`)を新設し、`ComposerButton.tsx`
    (ヘッダー、`usePathname()`でホームかどうか判定)がホーム上に
    いるときは直接この状態を開く形に変更、他ページにいるときのみ
    従来通り`Link href="/#composer"`で遷移してマウント時のハッシュ
    判定に任せる、という2経路構成にした。同じ理由で、ホーム上に常に
    存在するサイドバーの「投稿してみる」(空の「自分の創作物」内)も
    同じ問題を抱えていたため、同じストアを直接呼ぶボタンに変更した。
    ブラウザで、(1)ホーム初回表示時は折りたたみ状態、(2)折りたたみ
    バーのクリックで展開、(3)他ページからヘッダーの「投稿する」で
    来た場合に展開済みで表示、(4)ホームに既にいる状態でヘッダーの
    「投稿する」をクリックしても展開される(修正後)、(5)サイドバーの
    「投稿してみる」でも同様に展開される、の5パターンすべてを確認した。
37. ~~投稿欄の文言が「何か作ってないと投稿しづらい」~~ → 実装済み。
    折りたたみバー・投稿欄プレースホルダーとも「今なにか作ってますか？」
    という、既に何かを制作中であることを前提にした問いかけになって
    いたため、心理的なハードルになっていた。「思いついたこと、気軽に
    投稿する」(折りたたみバー、`PostComposerToggle.tsx`)、
    「思いついたこと、気になってること、なんでもどうぞ(未完成・
    アイデアだけでもOK)」(プレースホルダー、`PostComposer.tsx`)に
    変更し、「作っている最中」を前提としない書き方にした。ブラウザで
    両方の文言が実際に反映されていることを確認した。
38. ~~プロジェクトに紐づかない単独投稿にコメントできない~~ → 実装済み。
    `Comment`モデルの`projectId`を必須から`String?`(任意)に変更し、
    `postId String?`を新設(`Report`と同じ「discriminatorなしで
    片方だけ埋まる」ポリモーフィック関連のパターン)。`Notification`
    モデルにも同様に`postId`を追加し、単独投稿へのコメント通知は
    `projectId`の代わりに`postId`を使う。`comment-actions.ts`の
    `createComment`はフォームの`targetType`("project"/"post")と
    `targetId`から投稿先を判定して`projectId`/`postId`のどちらか
    片方だけをセットする形に全面書き換え、`CommentForm.tsx`の
    props も`projectId: string`から`target: { type; id }`に変更。
    新設した`/post/[id]`ページ(`app/post/[id]/page.tsx`)が
    単独投稿の詳細ページで、`WorkDetail.tsx`のコメント部分相当
    (本文・画像・コメント一覧・`CommentForm`)のみを持つ簡易版。
    `MurmurStrip.tsx`のリンク先を投稿者プロフィールから`/post/[id]`
    に変更し、カードに💬件数を追加。通知ベル(`NotificationBell.tsx`)
    は`type === "comment" && postId`の場合に「〇〇さんがあなたの
    投稿にコメントしました」という(プロジェクトのタイトルが無いため)
    専用文言を出し`/post/[id]`へリンクする分岐を追加。**ハマった点**:
    `Comment.projectId`が任意になったことで、通報一覧
    (`getAllReports()`/`admin/reports/page.tsx`)の`AdminReportView`
    型が`projectId: string`を要求していた箇所がビルドエラーになった
    ため、`projectId: string | null; postId: string | null`に広げ、
    リンク先も`projectId`があれば`/work/...`、無ければ`/post/...`
    を選ぶよう修正。**スコープ外**: 単独投稿そのものへの通報機能
    (今回追加したのはコメントへの通報のみで、既存のコメント通報の
    延長)。ブラウザで、(1)単独投稿を作成→`/post/[id]`に正しい
    タイトル・本文・空のコメント状態で表示、(2)別ユーザーがコメント
    →投稿者への通知が「があなたの投稿にコメントしました」の文言で
    生成され`/post/[id]`へのリンクが正しく機能、(3)MurmurStripの
    カードの💬件数がコメント追加後に1へ更新、(4)既存のプロジェクトへ
    のコメント(`/work/[id]`)が今回のポリモーフィック化後も
    リグレッション無く動作すること、をすべて確認した。
39. ~~対応環境にUnity・Unreal Engineが無い~~ → 実装済み。「使った
    ツール」(`AiTool`、Claude/Gemini/Bolt等)ではなく、ユーザーの
    要望通り「対応環境」(`Platform`、Web/iOS/Android/Windows/macOS/
    Linux/拡張機能)側への追加を選択(Unity/Unrealは慣習的には
    「制作に使うエンジン」寄りだが、UI上の見出し「対応環境」の文言と
    より一致するため)。`Platform`型(`mock-data.ts`)にUnity/Unreal
    Engineを追加、`PLATFORM_META`/`PLATFORM_ORDER`
    (`platform-meta.ts`)にアイコン(🎮/🕹️)付きで追加、
    `project-actions.ts`の`PLATFORMS`検証配列にも追加。`platforms`は
    Prisma上ただの`Json`カラム(DBレベルのenum制約は無し)なので
    マイグレーション不要。ブラウザで、(1)トップページの「対応環境」
    フィルタにUnity/Unreal Engineが正しいアイコンで表示されクリックで
    トグルできること、(2)作品編集フォームのチェックボックスにも両方が
    表示されること、(3)実際にUnityにチェックを入れて保存→作品詳細
    ページのバッジに🎮が反映されること、を確認した。lint/build clean。
40. ~~つぶやき投稿にいいねできない~~ → 実装済み。Projectの4種類
    リアクション(😲🛠️💡🙋、種類ごとにトグル可能)とは別物で、要望が
    「Xのハートアイコンのような」二値のいいねだったため、同じ流用は
    せず`Reaction`モデルをComment/Notificationと同じポリモーフィック
    パターンで拡張(`projectId`/`postId`はどちらか一方だけが埋まる、
    `@@unique`もそれぞれに追加)。Post向けの`type`は常に`"like"`
    固定(種類の出し分けが無いXのいいねと同じ単純さのため)。
    `reaction-actions.ts`に`toggleLike(postId)`を追加(`toggleReaction`
    と同じトグル+通知作成のパターン)。新設`LikeButton.tsx`は
    `ReactionBar.tsx`と違いローカルstateだけの最小構成の楽観トグル。
    表示箇所は(1)`MurmurStrip.tsx`のカード footer(💬件数の隣に
    ❤️/🤍)、(2)`/post/[id]`ページの本文直下。**ハマった点**:
    MurmurStripのカードは元々カード全体が1枚の`<Link>`だったため、
    いいねボタンをそのまま入れると`<a>`の中に`<button>`が入れ子になる
    (以前の「兄弟リンクに分割」問題と同種)。カード全体を`<div>`にし、
    本文部分だけを`<Link>`、footer(いいね+💬)は兄弟の`<div>`として
    分離して解消。`getMyReactions()`(Project専用)は`Reaction.projectId`
    がnullableになった影響で型・実行時両方の修正が必要になり、
    `projectId: { not: null }`で明示的にPost向けの行を除外。新設
    `getMyLikedPostIds()`(フィード一覧用)・`getMyLikeForPost()`
    (詳細ページ用)はgetMyReactions/getMyReactionsForProjectと対になる
    構成。通知ベルにも`type === "reaction" && postId`の専用文言
    (「があなたの投稿に❤️いいねしました」)を追加。ブラウザで、
    (1)MurmurStripのカードでいいねをクリックしてもカードへの遷移が
    発生しないこと(兄弟構造の検証)、(2)楽観トグル→リロード後も
    サーバー側に反映されていること、(3)いいね解除も正しくReaction行を
    削除すること、(4)本人以外への通知が正しいpostId・文言で作られる
    こと、(5)既存のProjectリアクション(ReactionBar)に
    リグレッションが無いこと、をすべて確認した。lint/build clean。
41. ~~通常のProject投稿にもハートのいいねが欲しい/4種リアクションの
    使い分けが分かりにくい~~ → 実装済み。ユーザーに確認したところ、
    4種のうち😲「面白い」がハートの「いいね」と意味が近く重複する
    ので、削除してハートに置き換えることを選択(😲🛠️💡🙋の4種→
    ❤️🛠️💡🙋の4種、種類数は変えず中身だけ差し替え)。`Reaction.type`の
    "interesting"を"like"に、`REACTION_META`の😲面白いを❤️いいねに
    改名。`Project.reactionInterestingSeed`カラムも`reactionLikeSeed`に
    リネーム。**データ移行に注意を払った点**: 単純に
    `prisma migrate dev`で列名変更すると非対話環境では「列を削除して
    新規追加」というdestructiveな移行になり、20件の起点カウントデータが
    消える警告が出た。対話プロンプトが必要なリネーム検出に頼らず、
    手動でマイグレーションファイルを作成
    (`ALTER TABLE "Project" RENAME COLUMN ...`により列の中身を保持した
    ままリネーム)、あわせて既存の`Reaction`行(type="interesting")と
    `Notification`行(reactionType="interesting")も同じマイグレーション
    内でtype="like"へUPDATEし、ユーザーの過去のリアクション履歴が
    「ハートのいいねだったこと」として引き継がれるようにした
    (`prisma db execute`で実行後、`prisma migrate resolve --applied`で
    履歴に記録)。ブラウザで、(1)作品詳細ページ・フィードカード両方で
    ❤️アイコン+従来通りのカウントが表示されること(起点カウントの
    保持を確認)、(2)実際にトグルして正しく動作すること、(3)通知が
    正しいtype/reactionTypeで作られること、を確認した後、テスト用に
    作成した通知・Reaction行は削除して原状回復した。lint/build clean。
42. ~~リポストのトグルをONにしても何が起きたか分からない~~ → 実装済み
    (X的な改善、第一段)。調査したところ、リポストは(a)カード上の
    🔁カウント、(b)相手への通知、(c)自分をフォローしている人の
    サイドバー、(d)「あなたへ」タブの並び順、の4箇所には反映される
    ものの、**リポストした本人には何も返ってこない**設計になっていた
    (`/u/[name]`は`works`=自分の投稿しか出さず、「自分がリポストした
    一覧」という概念が存在しなかった)。これがXと違い「反映されている
    実感が無い」の正体だった。Xを参考に、`getUserProfile()`
    (`queries.ts`)に`repostedWorks: Work[]`を追加(`prisma.repost`を
    リポスト日時降順で取得し、`getWorksWhere({ id: { in: ... } })`で
    取得したWorkを並び替えて返す)、`/u/[name]/page.tsx`に「投稿した
    作品」セクションの下へ「リポストした作品」セクションを新設
    (既存の`WorkCard`グリッドをそのまま再利用)。ユーザーと相談の上、
    X本来の「1つのタイムラインに時系列で混ぜる」方式ではなく、
    実装コストの低い「別セクションで追加」方式を選択(既存プロフィール
    レイアウトへの影響を最小化)。なお「インスパイアされて新しい投稿/
    プロジェクトを立ち上げる」という当初の意図(投稿コンポーザーで
    インスパイア元プロダクトを指定できるようにし、プロダクト同士・
    ユーザー同士の関係構築に繋げる)は今回のスコープ外で、次の課題
    として別途着手する。ブラウザで、(1)自分のプロフィールでリポスト
    した作品が「リポストした作品」セクションに表示されること、
    (2)他人(sora)のプロフィールでは自分の投稿のみ「投稿した作品」に
    出て「リポストした作品」は0件のままであること、を確認した後、
    テスト用のRepost行・通知は削除して原状回復した。lint/build clean。
43. ~~インスパイアされて新規投稿/プロジェクト立ち上げ(項目42の続き)~~ →
    実装済み。「他人の作品にインスパイアされて投稿/新規Projectを作る」
    という、リポストが本来担うはずだった役割を、独立した機能として
    新設。`Post.inspiredByProjectId`(nullable FK→Project)を1つ追加
    するだけで、単独投稿・新規Project作成の両方をカバー(`createPost()`
    がPost/Project両方の唯一の作成経路なので、Post側にだけ持たせれば
    Project側の起点も辿れる、という設計)。入り口は作品詳細ページの
    「🌱 これにインスパイアされて投稿する」リンク(`WorkDetail.tsx`)
    のみで、コンポーザー単体からの自由検索ピッカーは今回作らないと
    ユーザーと合意。リンクは`/?inspiredById=&inspiredByTitle=#composer`
    でトップページのコンポーザーへ遷移し、`composer-store.ts`に
    追加した`inspiredBy`状態を`PostComposerToggle.tsx`がマウント時に
    (ハッシュ判定と同じ理由でwindow.location.searchを直接見て)
    セットしてコンポーザーを展開、`PostComposer.tsx`が「🌱 [元タイトル]
    からインスパイア ✕」のチップとhidden inputを表示する。投稿後は
    元の作者に`type: "inspired"`の通知を送り(自分の作品への自己
    インスパイアは通知しない)、`Notification`に新設した
    `sourceProjectId`(インスパイア元、文言用)と既存の`projectId`/
    `postId`(遷移先、新しく生まれたPost/Projectのどちらか)を両方
    使う(遷移先と文言の元ネタが別物になる、他の通知種別には無かった
    構成)。作品詳細ページには新設`getInspiredByProject()`で「この
    作品からインスパイアされた投稿(N)」セクションを追加(Projectが
    生まれていれば既存の`WorkCard`をそのまま再利用、単独投稿のままなら
    簡易カード)。生成された側にも`🌱 [元]からインスパイア`のバッジを
    表示(`WorkDetail.tsx`は起点Postを1本追加取得、`/post/[id]`は
    `getPostById()`が直接持つ)。**ハマった点**: `Post`/`Notification`
    がどちらも既にProjectへの1つ目のリレーション(`projectId`/
    `project`)を持っていたため、2つ目のリレーション
    (`inspiredByProjectId`/`sourceProjectId`)を追加した時点でPrisma
    が「同じ2モデル間に複数リレーションがあるので両方に`@relation`名を
    付けろ」という制約に引っかかり、既存の無名リレームも含めて
    `"ProjectPosts"`/`"NotificationTarget"`のように明示的に命名し直す
    必要があった(DBのカラム自体には影響しない、Prismaスキーマ内だけの
    話)。また`/work/[id]/page.tsx`の`Promise.all`で返り値なしの
    `incrementViews()`を配列の途中に置いたまま新しいクエリを追加すると
    分割代入の位置がずれるミスをその場で発見・修正(`incrementViews()`
    を配列の最後に移動)。ブラウザで、(1)単独投稿としてインスパイア
    投稿→投稿詳細・元作品の詳細ページ双方にバッジ/セクションが正しく
    反映、(2)新規Projectとしてインスパイア投稿→同様に新規Project側にも
    起点Postを介してバッジが反映、(3)通知データがsourceProjectId
    (文言用)とprojectId/postId(遷移先)を正しく別々に持つこと、
    を確認した後、テスト用のPost・Project・Notification等は全て削除して
    原状回復した。lint/build clean。
44. ~~カバー画像がある作品でGitHub URLを編集で追加/変更しても反映が
    確認できない~~ → 実装済み。`WorkDetail.tsx`のサムネイル分岐は
    `coverImageUrl`が最優先で、`githubUrl`はカバー画像が無いときにしか
    表示されない(if/else-ifの排他分岐)ため、画像投稿済みの作品に
    あとからGitHub URLを追加/変更しても、詳細ページ上はその変更が
    一切見えない状態になっていた(実際に山中さんの「test dayo」で
    再現、画像+GitHub URL両方が設定済みなのに後者が全く表示されて
    いなかった)。サムネイル分岐自体は変えず(画像優先は維持)、
    `work.coverImageUrl && work.githubUrl`の両方が揃っているときだけ、
    画像の下に「リポジトリ」ラベル付きで`GitHubCard`(`size="md"`の
    小さめ版)を追加表示するようにした。フィードカード(`WorkCard.tsx`)
    側は今回のスコープ外(要望が編集後の確認、という詳細ページの
    文脈だったため)。ブラウザで、実際に「test dayo」(画像+GitHub URL
    両方設定済みの実データ)を開き、画像の下に「リポジトリ」カードが
    正しく表示されることを確認した(GitHub側のプレビュー取得自体は
    無認証60req/hourのレート制限で失敗していたが、これは既知の別課題
    でありカードの表示自体は正しく機能している)。lint/build clean。

**開発環境の注意点(このセッション中に発生した実例)**: `next dev`を
長時間動かしたまま`npm run build`を何度も実行すると、両方が同じ
`.next/`ディレクトリを取り合う形になり、稼働中のdevサーバーの
ルーティングキャッシュ(Turbopack)が壊れて、実在するページ
(`/work/[id]/edit`)が原因不明の404を返すようになる不具合を実際に
踏んだ(コード自体は`next build`側では正常にルートとして認識されて
おり、バグではなかった)。`.next`ごと削除してdevサーバーを再起動
すれば直る。以後、`npm run build`で検証したあとは`next dev`側も
念のため再起動する運用にする。

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
