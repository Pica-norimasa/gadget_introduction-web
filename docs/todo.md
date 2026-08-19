# TODO / 技術的な宿題

実装は後回しにするが、忘れないように残しておくメモ。

## GitHub プレビュー機能のレート制限対策 (AWS + MySQL移行時)

`app/api/github-preview/route.ts` は現状、カード表示のたびにクライアントから
このRoute Handlerを叩き、Route Handlerがその場で `api.github.com` に
ライブでリクエストする構成になっている。

無認証だと GitHub API は **60req/hour** までしか呼べないため、ユーザー数が
増えると簡単に頭打ちになる(実際にローカル検証中に枠を使い切り、
プレビューが取得できない状態を確認した)。

1. ~~**GitHub Personal Access Token(またはGitHub App)で認証する**~~ →
   対応済み。`route.ts`のfetchに`GITHUB_TOKEN`(`.env`、スコープ無しの
   PATで可、公開リポジトリの読み取りのみのため)を使った
   `Authorization: Bearer`ヘッダーを追加(未設定でも無認証のまま動く
   フォールバック付き)。無認証60req/hour→認証済み5,000req/hourに
   実際に上がったことを`X-RateLimit-Limit`ヘッダーで確認し、
   レート制限で表示できなかった実際のカードが正しく表示されるように
   なったことも確認した。**本番(AWS)側では`.env`ではなくSecrets
   Manager等にトークンを置くこと**(ローカルの`.env`は`.gitignore`
   済みでリポジトリには含まれない)。

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
45. ~~自分のプロフィール内の投稿した作品・リポストした作品・
    ブロックユーザーが縦に全部並んでいて見づらい~~ → 実装済み。
    3つのセクションを`FeedSection.tsx`の新着/急上昇/あなたへタブと
    同じ下線付きタブUIに統合。新設した`ProfileTabs.tsx`(クライアント
    コンポーネント)は「どのタブが選択されているか」の状態だけを持ち、
    各タブの中身はサーバー側で既にレンダリング済みのReactNode
    (`WorkCard`のグリッドや`MutedBlockedList`)をそのまま受け取って
    出し分けるだけの薄い構成(データ取得ロジックは`/u/[name]/page.tsx`
    側から一切動かしていない)。ユーザーに確認の上、「ミュート中」は
    独立タブにはせず、従来通り「ブロックユーザー」タブの中に
    (`MutedBlockedList`がそうしているように)一緒に表示する形を選択。
    `MutedBlockedList`はこれまでミュート・ブロックどちらも0件だと
    `null`を返して何も表示していなかったが、タブの中身として使うと
    空白のタブになってしまうため、他のセクションと同じ空状態メッセージ
    (「ミュート・ブロック中のユーザーはいません」)を返すように変更。
    「ブロックユーザー」タブは他人のプロフィールでは非表示(自分の
    ミュート/ブロック状態なので他人のページで見せる意味が無い、という
    既存の設計を維持)。ブラウザで、(1)自分のプロフィールで3つの
    タブが表示されクリックで正しく切り替わること、(2)他人(sora)の
    プロフィールでは「投稿した作品」「リポストした作品」の2タブのみ
    (「ブロックユーザー」タブが出ない)であること、を確認した。
    lint/build clean。
46. ~~「フォロー中ユーザー」のアイコンをクリックしてもプロフィールに
    飛ばない~~ → 実装済み。トップページの「フォロー中ユーザー」
    ストーリーズ風の丸アイコン列(`StoriesStrip.tsx`)は、アイコンを
    タップすると投稿ビューア(ストーリーズ)が開く仕様で、プロフィール
    へはビューア内の作者名からしか遷移できなかった。調査したところ
    他の「フォロー中の作者」系アバター(サイドバーのおすすめ作者等)は
    既に`/u/[name]`へリンク済みで、このストーリーズのアイコンだけが
    例外だった。X/Instagramのストーリーズと同じ意図的な挙動(アイコンは
    ストーリーズを開く)なので単純なバグではないが、ユーザーと相談の
    上、アイコンの挙動はそのまま残しつつ、アイコン下の作者名テキストを
    `/u/[name]`への直接リンクにする案で合意し実装。`<button>`の中に
    `<Link>`を入れる(インタラクティブ要素の入れ子)のではなく、外側を
    `<div>`にしてボタンとリンクを兄弟要素として分離(このセッションで
    繰り返し出てきた「兄弟リンクに分割」パターンと同じ)。ブラウザで、
    (1)アイコンをタップすると従来通りストーリーズが開くこと、
    (2)作者名をタップすると`/u/[author]`へ正しく遷移すること、を
    実際にsoraをフォローして確認した後、テスト用のフォロー関係は
    解除して原状回復した。lint/build clean。
47. ~~コメントへの返信(スレッド化)~~ → 実装済み。`Comment.parentId`
    (自己参照、nullable)を追加し、Xと同じ1階層のみのフラットな
    スレッドにした(「返信への返信」はデータ上は可能だがUI側で
    ボタンを出さないことで防いでいる)。`getCommentsForProject`/
    `getCommentsForPost`は共通ヘルパー`loadCommentThreads()`に統合し、
    トップレベルコメント+その`replies: CommentView[]`という
    `CommentThread`型を返すように変更(以前はコメントを平坦な配列で
    返していた)。新設`CommentThread.tsx`(クライアントコンポーネント)
    が1スレッド分(本体+「返信する」トグル+返信一覧+返信フォーム)を
    まとめて描画し、`WorkDetail.tsx`/`app/post/[id]/page.tsx`両方の
    インラインなコメント描画をこれに置き換えた。`CommentForm.tsx`に
    `parentId`/`onDone`propsを追加(返信フォームは自動フォーカス+
    送信成功で自動的に畳まれる)。通知は新設`type: "reply"`で、
    返信先コメントの作者に送る(project/post所有者への既存の
    `comment`通知とは別人の場合のみ。同一人物なら二重通知しない)。
    **ハマった点**: コメント一覧を平坦配列からスレッド構造に変えた際、
    見出しの`コメント({comments.length})`が トップレベル件数だけを
    数えるようになり、返信を追加しても件数表示が増えない不具合を
    実装直後に発見・修正(`comments.reduce((sum, c) => sum + 1 +
    c.replies.length, 0)`で返信も含めた総数に変更)。ブラウザで、
    (1)トップレベルコメントに返信→スレッド内に正しくネストして
    表示、(2)返信先(project/post所有者と別人)に`reply`通知が
    正しく飛ぶこと、(3)返信先が所有者と同一人物のケースでは二重
    通知にならないこと、(4)返信コメントには「返信する」ボタンが
    出ない(1階層制限)こと、をすべて確認した後、テスト用のコメント・
    通知はすべて削除して原状回復した。lint/build clean。
48. ~~単独投稿(つぶやき)自体への通報機能~~ → 実装済み。既存の
    `Report`(project/comment/userの3種)に`postId`を追加し
    `targetType`に`"post"`を追加(`ReportTargetType`/
    `report-actions.ts`)。`/post/[id]`ページの作者行に、自分の投稿
    以外の場合だけ`MoreActionsMenu`(⋯→通報する)を新設(これまで
    投稿本体には通報導線が無く、投稿へのコメントしか通報できない
    非対称な状態だった)。管理画面(`/admin/reports`)の
    `AdminReportView`にも`"post"`種別を追加し、「対象の投稿: 本文
    冒頭60文字 → /post/[id]」の形でリンク表示するようにした。
    ブラウザで、(1)実際に他ユーザー(山中)の投稿を通報→
    `targetType: "post"`・`postId`のみが埋まったReport行が
    正しく作られることを確認、(2)`ADMIN_KEY`を一時的に設定して
    `/admin/reports`にログインし、「対象の投稿」リンクが正しい
    `/post/[id]`を指すことを確認、(3)確認後`ADMIN_KEY`は元の空文字
    (誰もログインできない安全側のデフォルト)に戻し、テスト用の
    Report行も削除して原状回復した。lint/build clean。
49. ~~通報一覧に「対応済み」ステータスが無い~~ → 実装済み。`Report`に
    `resolvedAt`(nullable、対応済みにした日時。誰が対応したかは
    `ADMIN_KEY`が個人を識別しない共有の合言葉のため記録しない)を追加。
    `admin-actions.ts`に`toggleReportResolved()`(`isAdminAuthed()`で
    ゲート)、新設`ReportResolveButton.tsx`(クライアントコンポーネント、
    `useTransition`でpending状態を出す)を各行に設置。一覧ページには
    「未対応/対応済み/すべて」の3タブを追加(`?filter=`のcrawlable
    なクエリパラメータ方式、`FeedSection`のタブと似た下線UI)。既定は
    「未対応」(通報が溜まる一方だった問題への対処として、開いた瞬間に
    対応すべきものだけが見える状態にした)。対応済みの行は一覧内で
    薄く(`opacity-60`)表示し、対応済み日時も併記する。ブラウザで、
    実際の通報(山中による本物の通報)を一時的に対応済み→未対応に
    戻す往復操作で、(1)ボタンの表示切り替え、(2)タブごとの件数の
    増減、(3)未対応タブでは対応済みにした瞬間に一覧から消えること、
    を確認した後、確実に元の状態(未対応)に戻し、`ADMIN_KEY`も
    元の空文字に戻して原状回復した。**開発環境の注意点**: この検証中に
    項目44で踏んだのと同じ「`next dev`稼働中の`npm run build`繰り返しで
    devサーバーのルーティングキャッシュが壊れる」不具合を再度実際に
    踏んだ(`/admin/reports`が404に)。`.next`ごと削除してdevサーバーを
    再起動する対処で直ることを再確認。lint/build clean。
50. ~~ブロックしても相手は自分のコンテンツに書き込める~~ → 実装済み。
    従来のミュート/ブロックは「自分の画面から相手を消す」だけで、
    ブロック中ユーザーの側から見ればコメント/リアクション/リポストを
    普通に実行できてしまっていた(サーバー側のチェックが一切無かった)。
    新設`isBlockedBy(authorId, userId)`(コンテンツ作者がユーザーを
    ブロックしているか)を`queries.ts`に追加し、`comment-actions.ts`の
    `createComment`・`reaction-actions.ts`の`toggleReaction`/
    `toggleLike`・`repost-actions.ts`の`toggleRepost`/`quoteRepost`
    それぞれの「新規作成」経路にチェックを追加。**「取り消し」は
    ブロックされていても常に許可する**(ブロックされる前の自分の
    行動を後から縛る必要は無いという判断。既存のリアクション行/
    リポスト行の削除、引用リポストの本文更新は対象外)。コメントは
    既存のエラー表示の仕組み(`CreateCommentState.error`)を使って
    「この投稿にはコメントできません」を表示できるが、リアクション/
    リポストは元々サーバーの成功・失敗をUIに伝える仕組みが無い
    (楽観的トグルのみ、失敗時のロールバックも元から無い設計)ため、
    そちらは静かに何もしない形にした(リロードすれば表示が実態に
    戻る)。加えて、`isBlockedByAuthor(authorId)`(閲覧者視点、今の
    セッションがそのコンテンツの作者にブロックされているか)を
    `getWorkById`/`getPostById`の詳細ページ側で使い、ブロックされて
    いる場合は`WorkDetail.tsx`/`app/post/[id]/page.tsx`で
    ReactionBar・RepostButton・LikeButton・CommentFormを最初から
    出さず、代わりに理由を示すメッセージを表示するようにした
    (サーバー側の拒否と対になる、無駄な操作をさせないための先回り)。
    ブラウザで、(1)実際に一時的なBlock行を作成→対象作品ページで
    UIが正しくメッセージに置き換わることを確認、(2)UIの出し分けを
    一時的にバイパスして直接フォーム操作→サーバー側で実際に
    コメント/リアクション/リポストがすべて拒否されDBに行が
    作られないことを確認、(3)ブロックを解除→通常通り動作することを
    確認、をすべて行った後、テスト用のBlock行・UIバイパスは削除・
    復元して原状回復した。lint/build clean。
51. ~~検索がつぶやき投稿を拾わない~~ → 実装済み。`searchWorks()`は
    Projectのtitle/catchText/作者名しか見ておらず、単独投稿
    (つぶやき)はどんなキーワードでも検索結果に出てこない非対称が
    あった。`getRecentStandalonePosts()`のクエリ本体を共通ヘルパー
    `loadStandalonePosts(extraWhere, limit?)`に切り出し、新設
    `searchStandalonePosts(query)`(本文+作者名の部分一致、
    `searchWorks()`と同じ条件)を追加。`/search`ページは
    「作品(N)」「つぶやき(N)」の2セクションに分け、それぞれ0件なら
    見出しごと非表示にする(両方0件のときだけ「一致する結果は
    見つかりませんでした」)。つぶやき側の表示には新設
    `StandalonePostCard.tsx`を使用。このコンポーネントは元々
    `WorkDetail.tsx`の「この作品からインスパイアされた投稿」に
    インラインで書かれていた単独投稿カードのJSXと、今回の検索結果
    表示とで同じ見た目が3箇所目(MurmurStripも別実装で同種)になった
    ため、このタイミングで切り出して`WorkDetail.tsx`側もこちらを
    使うようにリファクタした(MurmurStripは横スクロール帯+いいね数
    バッジ付きで表示要件が異なるため据え置き)。ブラウザで、
    (1)作者名(「山中」)で検索→作品4件+つぶやき5件が両セクションに
    正しく分かれて表示、(2)Projectのcatchtextにしか無い語(「うんこ」)
    で検索→作品のみ1件(つぶやきセクションは非表示)、(3)つぶやきの
    本文にしか無い語で検索→つぶやきのみ2件(作品セクションは非表示)、
    (4)存在しない語→「一致する結果は見つかりませんでした」、を
    すべて確認した。lint/build clean。
52. ~~インスパイアの信号を「あなたへ」の個人化に混ぜる~~ → 実装済み。
    リポストは既に個人化スコアに反映されていた(フォロー中の人が
    リポストした作品に+60点、`FeedSection.tsx`の`personalizedScore`)
    一方、後発の「インスパイア」機能は個人化に一切影響していなかった
    非対称を解消。`getRecentReposts()`と対になる新設
    `getRecentInspirations()`(`InspirationSignalView { userName,
    projectId }`、`Post.inspiredByProjectId`をプラットフォーム全体で
    最新順に取得)を`queries.ts`に追加し、`app/page.tsx`から
    `FeedSection`へ`inspirations`propとして渡すようにした。
    `personalizedScore`に`inspiredByFollowed`引数を追加し、リポストと
    同じ+60点(「拡散した」より「実際に何か作るくらい良いと思った」の
    方が強い信号とも言えるが、恣意的な差をつけるより同格の「フォロー中の
    人からの推薦」として揃えた、両方成立すれば加点は両方乗る)。
    ブラウザで、(1)実際にsoraをフォロー→みかんの「献立まかせて」に
    インスパイアされた投稿をsora名義で作成(テスト用)→RSC
    ペイロード内に`inspirations`配列が正しく`{userName:"sora",
    projectId:"kondate-makasete"}`を含んだ状態でクライアントへ渡って
    いることを確認(既存の山中さんによる本物のインスパイア行も2件
    混在していることも同時に確認できた)、を行った後、テスト用の
    投稿・フォロー関係は削除・解除して原状回復した。lint/build clean。
53. ~~ブロックしてもフォローされてしまう~~ → 実装済み。項目50
    (コメント/リアクション/リポストの書き込み拒否)と同じ
    `isBlockedBy()`を`follow-actions.ts`の`toggleFollowAction`に追加。
    新規フォローの作成だけを拒否し(**フォロー解除は常に許可**、他の
    書き込み系アクションと同じ「取り消しは縛らない」方針)、通知も
    当然作られなくなる。ブラウザで、実際にBlock行を作成→ブロック
    されている側からのフォローがサーバー側で拒否されFollow行が
    作られないこと、ブロック解除後は通常通りフォローできることを
    確認した後、テストデータは削除・原状回復した。lint/build clean。
54. ~~つぶやき投稿を後から編集できない~~ → 実装済み。`Post`モデルに
    編集用のServer Actionが存在しなかった(誤字を直したいだけでも
    削除→再投稿するしかなく、いいね・コメント・返信が全部消える
    問題)。新設`updatePost(postId, body)`(`post-actions.ts`)は
    本文のみの更新(画像の差し替え/削除は今回のスコープ外)で、
    `getCurrentUser()`による所有者チェックのみ(ブロックとは無関係、
    自分の投稿を直すだけの行為のため)。つぶやき(`projectId`無し)・
    制作タイムライン投稿(`projectId`有り)はどちらも同じPostモデル
    なので、この1つのActionで両方をカバーする。UI側は新設
    `PostEditor.tsx`(`BioEditor.tsx`と同じ表示⇔編集トグルパターン、
    呼び出し元でフォントサイズを変えられるよう`bodyClassName`を
    公開)を`/post/[id]`ページ(自分の投稿のときだけ)と
    `WorkDetail.tsx`の「制作タイムライン」一覧(自分のProjectの
    ときだけ)の両方に設置。ブラウザで、(1)つぶやき投稿を作成→
    「編集」から本文を書き換えて保存→表示に反映されることを確認、
    (2)新規Projectの1本目のタイムライン投稿でも同様に編集→反映を
    確認、をそれぞれ行った後、テスト用の投稿・Projectは削除して
    原状回復した。lint/build clean。
55. ~~GITHUBカードにREADME・contributorsの情報も載せたい/背景のせいで
    GitHubの情報っぽく見えない~~ → 実装済み。`app/api/github-preview/
    route.ts`で、既存のリポジトリメタデータ取得に加えて`/readme`
    (Markdown生データ)と`/contributors`(Linkヘッダーの`rel="last"`
    ページ番号から総数だけを取得する定番の手口、一覧を全件取得しない)
    を`Promise.allSettled`で並行取得。GitHub側の`description`が
    未設定のリポジトリは意外と多いため、その場合だけREADME冒頭から
    簡易Markdown除去(コードフェンス・画像・リンク・見出し記号等を
    正規表現で剥がすだけの雑なパーサ)で代わりの説明文を作る
    (`description ?? readmeExcerpt`)。README/contributors取得の失敗は
    リポジトリ本体の表示を妨げない(独立して失敗できる設計)。
    `GitHubCard.tsx`には⭐の隣に👥(contributors数)を追加。あわせて、
    見た目がGitHubの情報だと分かりにくいという指摘を受け、GitHub公式
    Octicon"mark-github"のパスを埋め込んだ小さなロゴ+「GITHUB」
    ラベルをカード上部に追加(色のトーン(#161b22というGitHubの
    ダーク配色そのもの)だけでは、単なる暗い箱にしか見えていなかった
    ため、背景色に依存しない明示的なブランディングにした)。ブラウザで、
    (1)`/api/github-preview`を直接叩いてcontributorsCountが正しい
    数字で返ること、(2)description未設定のリポジトリ
    (`Pica-norimasa/game_assetbundle`)で実際にREADME由来の説明文が
    返ること、(3)作品詳細ページの主要サムネイル版・画像下の
    「リポジトリ」小型版どちらでもGitHubロゴ+ラベル+👥人数が正しく
    表示されることを確認した。lint/build clean。
56. ~~利用規約・プライバシーポリシーが無い~~ → 実装済み。
    「実際に人が使う場所にする」ための土台整備の一環(認証・本番移行
    より軽いものとして先に着手)。新設`/terms`・`/privacy`
    (`app/guide/page.tsx`と同じスタイルの静的ページ)を追加し、
    トップページのフッターからリンク。内容はこのアプリの現状に正直な
    ものにした: プロトタイプ段階であること、正式なアカウント登録
    機能が無くブラウザのセッションCookieだけで投稿者を識別している
    ため端末・ブラウザを変えると引き継げないこと、利用者自身による
    データ削除機能がまだ無いこと、GitHubリポジトリのプレビュー表示で
    GitHub社のAPIにサーバー側からアクセスしていること、などを明記。
    問い合わせ先はflytobrain@gmail.comとした(ユーザーに確認の上)。
    **免責**: 一般的な内容の下書きであり、専門家によるレビューを
    代替するものではない旨を認識しておくこと(将来、実際に不特定
    多数へ公開する際は改めて確認が必要)。ブラウザで、フッターの
    両リンクが正しく機能し、両ページの内容が正しく表示されることを
    確認した。lint/build clean。

57. ~~実アカウントが無く、ブラウザCookieだけが身元だった~~ → 実装済み。
    「実際に人が使う場所にする」ための3提案のうち最優先としていたもの。
    GitHub OAuthでのログインを追加し、GitHubログイン済みユーザーは
    実DBの`User`行に紐づく永続アカウントを持つようにした
    (端末・ブラウザを変えても同じアカウントに戻れる)。未ログインの
    匿名ゲスト(従来通りセッションCookieのみ)は変更せず共存させる方針
    (ユーザーとの相談の上で決定)。将来的に自前ID管理(ユーザー名+
    パスワード等)も検討したいとのことなので、Auth.js標準の
    `Session`・`VerificationToken`テーブルも(JWTセッション戦略では
    必須ではないが)あえて残し、後で他の認証方式を足しやすくしてある。

    実装: `next-auth@beta`(Auth.js v5) + `@auth/prisma-adapter`を追加。
    `auth.ts`(ルート直下)に設定を集約し、`app/api/auth/[...nextauth]/route.ts`
    でハンドラを公開。`session: { strategy: "jwt" }`でDBセッション行を
    増やさない構成。`User.name`はハンドル代わりで`@unique`のため、
    標準の`PrismaAdapter.createUser`をラップし、GitHub側の名前が
    既存ユーザーと衝突したら連番を付けて回避(`getOrCreateCurrentUser()`
    の匿名ゲスト作成時と同じ衝突回避パターン)。`app/lib/session.ts`の
    `getCurrentUser()`/`getOrCreateCurrentUser()`は`auth()`を先に見て、
    ログイン済みなら実アカウントを、未ログインなら従来通りゲストCookie
    経路にフォールバックする2段構え。ヘッダー(`SiteHeader.tsx`)に
    GitHubアバター表示・ログイン/ログアウトボタンを追加
    (`IdentityBadge.tsx`もアバター画像対応)。

    **スコープ外(意図的)**: 匿名ゲストとして投稿・フォロー等をした後で
    GitHubログインした場合の、ゲスト時代のアカウントとの統合機能は
    無い(ゲスト時代のUser行とログイン後のUser行は別人扱いのまま)。

    **検証中に見つけて直したバグ**: ログアウトボタンに`hidden sm:inline-block`
    が付いており、モバイル幅(sm未満)ではログアウトする手段が
    一つも無い状態になっていた。ログインボタン側は同じ制限が無く
    常時表示だったため非対称になっていた。ログアウトボタンを常時
    表示に修正。

    ブラウザで実際にGitHubアカウント(flytobrain@gmail.com)でログイン
    まで通し、①DBに`User`(email/image付き)・`Account`(github/oauth)
    行が正しく作られること、②ヘッダーにGitHubアバターと表示名
    「則政」が出ること、③ログイン中に実際にフォロー操作が書き込み
    できること(検証後DBから削除して後始末済み)、④ログアウトすると
    正しくゲスト表示に戻り、DBの状態と画面表示が一致すること、
    ⑤未ログインの匿名ゲストの閲覧・表示に影響が無いこと、を確認した。
    lint/build clean。

    なお、Browser paneのセキュリティ制限により`github.com`上の
    ログインフォーム/Authorize画面そのものは私からは見えない・操作
    できない(利用者にログインを完了してもらった)。GitHubの認証情報
    入力やOAuth許可のクリックを代行することはそもそも安全ルール上
    禁止/要許可の行為であり、この制限とは無関係に私からは行わない。

58. AWSデプロイ準備(コード側)。「デプロイ作業を優先で」との依頼を受けて着手。
    ホスティング方式はDocker + App Runner(Next.js 16の新機能がAmplifyの
    ビルド自動検出に正しく対応しているか未検証なリスクを避けるため)。
    AWSリソース作成(RDS・S3・App Runner等)は利用者自身がAWSコンソールで
    実行する方針(私はアクセス情報を持たない)。

    やったこと:
    - `next.config.ts`に`output: "standalone"`を追加。
    - `Dockerfile`(alpine, multi-stage: deps→builder→runner, 非root実行)・
      `.dockerignore`を新規作成。
    - `prisma/schema.prisma`のdatasourceを`sqlite`→`mysql`に変更。MySQLの
      String既定型VARCHAR(191)を超え得る自由記述系フィールド(`Post.body`・
      `Comment.body`・`Repost.comment`・`Report.detail`・`Project.catchText`。
      各コンポーネントの`maxLength`実測値で判断)とOAuthトークン
      (`Account.refresh_token`/`access_token`/`id_token`)に`@db.Text`を付与。
    - `app/lib/prisma.ts`のアダプタを`@prisma/adapter-mariadb`
      (`PrismaMariaDb`、MySQLプロトコルにも対応)に差し替え、
      `@prisma/adapter-better-sqlite3`は削除。
    - `app/lib/upload.ts`を書き換え、`S3_BUCKET_NAME`が設定されていれば
      `@aws-sdk/client-s3`でS3に、未設定ならローカル開発向けに従来通り
      `/public/uploads`に書き込む2経路構成にした(コントリビューターが
      画像アップロードを試さないならAWS認証情報の設定は不要のまま)。
    - `package.json`に`engines.node`、`.nvmrc`を追加(Node 22.14.0固定)。
    - DBに触れない`/api/health`を追加(App Runnerのヘルスチェック用。
      `/`のようなDB問い合わせを伴うページを対象にすると、ヘルスチェック
      自体が負荷になるため)。
    - 旧SQLite向けマイグレーション履歴(20260815〜20260816分、20個)は
      MySQLとSQLでは非互換のため削除し、現在のスキーマから単一の初期
      マイグレーション(`prisma/migrations/20260817000000_init`)を
      `prisma migrate diff --from-empty`で生成し直した(RDS作成後に適用予定、
      項目60参照)。
    - `.env.example`のDATABASE_URLをMySQL形式に更新し、S3関連の変数
      (`S3_BUCKET_NAME`/`AWS_REGION`/`S3_PUBLIC_URL_BASE`)を追加。

    **ローカル開発への影響(重要)**: Prisma 7はdatasourceのproviderを
    1つに固定する必要があり、SQLiteとMySQLを同時サポートできないため、
    今後`npm run dev`にも実際に到達可能なMySQL(RDS)が必須になった
    (このMacはDocker/Homebrew経由のMySQLが非現実的なため、ローカル開発も
    RDS上の別データベース(`draftly_dev`)に接続する運用に変更、利用者との
    合意済み)。RDSが無い間は`npm run dev`/`npm run build`とも動かない
    (プレースホルダーのDATABASE_URLで`npm run build`を試し、コンパイル・
    型チェックまでは通り、DB接続タイムアウトでのみ失敗することを確認済み
    →コード自体は問題ない)。
    lint/tscはプレースホルダーDATABASE_URLで実行しclean。ブラウザでの
    実動作確認はRDS接続後(項目60)に行う。

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

59. AWSデプロイ実行(項目58の続き、項目60として予告していたもの)。
    Windows機に移行後、実際にRDS作成〜App Runner公開まで完了した。

    **RDS(MySQL)**: `db.t4g.micro`・20GB gp3・Single-AZ・ap-northeast-1で
    作成(識別子`gadget-introduction-web-dev`)。デフォルトVPCのサブネット3つ
    (1a/1c/1d)でDBサブネットグループを構成。セキュリティグループは
    パブリックアクセス可。当初は開発者の自宅IPのみ許可していたが、
    後述の理由でApp Runner側がVPC外(NAT Gateway無し)からの接続に
    なったため、最終的に3306番ポートを`0.0.0.0/0`に開放している。

    **S3**: アップロード画像用に`gadget-introduction-web-dev-uploads-<account-id>`
    を作成。`app/lib/upload.ts`が署名なしの直接URLでオブジェクトを返す実装
    のため、バケットポリシーで`s3:GetObject`を全体公開(パブリックアクセス
    ブロックのうち`BlockPublicPolicy`/`RestrictPublicBuckets`のみ解除)。

    **IAM権限まわりでの躓き**: 個人アカウントなので概ねAWS管理の
    `*FullAccess`ポリシーで済ませる方針にしたが、以下で時間を溶かした。
    - `AmazonRDSFullAccess`と`AmazonRDSDataFullAccess`は別物(後者は
      Aurora Serverless向けRDS Data API専用で、通常の`CreateDBInstance`等には
      効かない)。名前が紛らわしいので要注意。
    - IAMユーザーに直接アタッチできる管理ポリシーは既定で**最大10個**という
      クォータがあり、作業を進めるうちにすぐ到達した。CloudWatch Logs閲覧や
      EventBridge Schedulerなど、追加のAWS管理ポリシーが用意されていない/
      枠が無いサービスは`put-user-policy`でインラインポリシーとして
      individual に付与する方が枠を消費せず楽(今回はCodeStar Connections用の
      カスタムポリシーも管理ポリシーとして作ってしまい枠を圧迫したので、
      次にやるならインライン一本化でよい)。

    **CodeBuild(Dockerビルド)**: ローカルDockerが使えない問題は前回の
    Macに続きWindows機でも発生(WSL2にはCPU仮想化支援(VT-x)がBIOS/UEFI
    レベルで必要で、このPCでは無効だった。BIOS変更は手間がかかるため
    見送り、AWS CodeBuildでのクラウドビルドに倒した)。`buildspec.yml`を
    追加(リポジトリ直下)。
    - リポジトリが非公開のため、CodeBuildのGitHubソース認証が必要。
      最初はCodeStar Connections(`CODECONNECTIONS`認証)を試したが、
      接続ステータスが`AVAILABLE`でGitHub App(AWS Connector for GitHub)も
      正しくインストール・全リポジトリ許可済みなのに、
      `CreateProject`が毎回`OAuthProviderException: User is not authorized
      to access connection`で失敗する謎の不具合に遭遇(接続の作り直し、
      IAM権限の総ざらいでも解決せず)。原因追求を諦め、GitHub Personal
      Access Token(classic、`repo`スコープ)を`codebuild
      import-source-credentials`で登録する方式に切り替えたところ即解決。
      Fine-grainedトークンは一度`authorization failed`で弾かれたので、
      CodeBuildと組み合わせるならclassicトークンが無難。

    **本番ビルドでしか出ない不具合(`next dev`では気づけなかった)**:
    ローカルの`next dev`だけで確認して「動く」と判断するのは危険だと
    今回学んだ。`npm run build && npm start`で一度本番相当の動作確認を
    してからデプロイする運用に変えるべき。
    - `app/work/[id]/page.tsx`の`generateStaticParams`(空配列を返すだけ)が
      `cookies()`の呼び出しと共存できず、本番ビルドで
      `DYNAMIC_SERVER_USAGE`エラーになり全`/work/[id]`ページが500に
      なっていた。`export const dynamic = "force-dynamic"`を明示して解決
      (このページは閲覧数カウントや自分のリアクション状態表示があり、
      元々キャッシュに向かない実態だったので、静的化を諦める判断は妥当)。
    - `public/`が中身(`uploads/`)ごとgitignore対象で、リポジトリを
      cloneすると`public/`ディレクトリ自体が存在しない。Dockerfileの
      `COPY --from=builder /app/public ./public`がそこで失敗する。
      `public/.gitkeep`を追加して解決。
    - App Runnerが独自の`HOSTNAME`環境変数(インスタンスのホスト名)を
      コンテナに注入し、Dockerfileの`ENV HOSTNAME=0.0.0.0`を上書きして
      しまうため、Next.js standaloneサーバーが`0.0.0.0`ではなく
      インスタンス固有のホスト名にbindしてヘルスチェックが失敗する不具合
      あり。`CMD`自体で`HOSTNAME=0.0.0.0 node server.js`のように明示的に
      上書きすることで解決(Dockerfileの`ENV`はPaaS側の注入に負けるが、
      起動コマンド自体での代入は勝つ)。
    - Auth.js(NextAuth v5)は非Vercel環境だとデフォルトでリクエストの
      Hostヘッダーを信用せず`UntrustedHost`エラーになる。`auth.ts`に
      `trustHost: true`を追加して解決。放置するとGitHubログインが
      本番でだけ壊れていた。

    **App Runner**: `0.5 vCPU / 1GB`→動作確認後に最小構成`0.25 vCPU / 0.5GB`
    へ変更(コスト優先、個人プロトタイプの負荷では十分)。機密情報
    (`DATABASE_URL`/`GITHUB_TOKEN`/`AUTH_GITHUB_SECRET`/`AUTH_SECRET`)は
    Secrets Manager経由で注入(`RuntimeEnvironmentSecrets`)。ヘルスチェック
    は`/api/health`。
    - デプロイ当初、このAWSアカウントが「無料プラン(Free Plan、$120
      クレジット/183日間、一部サービスへのアクセス制限あり)」だったため
      App RunnerのどのAerロール操作も`SubscriptionRequiredException`で
      弾かれた。支払い方法の確認だけでは直らず、アカウントを通常の
      従量課金プランへアップグレードして解決。似た症状(読み取り専用API
      すら弾かれる)に当たったら、まずアカウントのプラン状態を疑うとよい。
    - 2026年4月30日付でApp Runnerは新規顧客の受付を終了しており(既存
      サービスは動き続けるが新機能追加はない)、AWSはAmazon ECS Express
      Modeへの移行を推奨している。今すぐ困らないが、次に大きく触る時は
      ECS Express Modeへの移行を検討してよい。
    - **ネットワーク構成は最終的にVPCコネクタをやめた。** 当初はRDSに
      プライベート接続するためNetworkConfiguration.EgressTypeを`VPC`
      (VPCコネクタ経由)にしていたが、これだとインスタンスに外向きの
      インターネット経路(NAT Gateway)が無いため、GitHub OAuthの
      トークン交換のようなVPC外のAPI呼び出しが軒並み`ConnectTimeoutError`
      で失敗した(RDSのようなVPC内リソースへは繋がるが、それ以外は
      一切繋がらない)。NAT Gatewayを足す($45/月程度)と予算超過になる
      ため、`EgressType`を`DEFAULT`(通常のインターネット経由)に戻し、
      代わりにRDSのセキュリティグループの3306番ポートを`0.0.0.0/0`に
      開放する方針にした(強力なランダムパスワードのみで保護。個人
      プロトタイプでの妥協で、正式な構成ではない)。

    **GitHub OAuth**: 本番ドメイン(`*.awsapprunner.com`)が確定するのは
    デプロイ後なので、GitHub OAuth Appのリダイレクトにデプロイ後改めて
    本番URLを追加した(1つのOAuth Appで最大10個のリダイレクトURIを
    登録できるので、localhost用と本番用を共存させられる)。上のネットワーク
    構成変更でGitHub APIには到達できるようになったが、今度は
    `redirect_uri_mismatch`が発生した。App Runnerがエッジ側でTLSを終端し
    コンテナへは平文HTTPで転送する構成のため、`trustHost: true`だけでは
    Auth.jsがリクエストを`http://`と誤認識し、GitHubに登録した`https://`の
    URLと一致しなくなっていた。`AUTH_URL`環境変数に本番URLを明示的に
    設定して解決(ヘッダーベースの自動検出に頼らず固定する方が確実)。

    **コスト管理**: 個人プロトタイプなので稼働時間を絞ってコストを抑える
    方針にした。EventBridge Schedulerで毎日09:55にRDS起動→10:00に
    App Runner再開、20:00にApp Runner一時停止(`pause-service`)→20:05に
    RDS停止、という自動化を組んだ(実行ロールは`scheduler.amazonaws.com`を
    信頼するIAMロール、ターゲットは`arn:aws:scheduler:::aws-sdk:{service}:
    {action}`形式のuniversal targetでLambda不要)。ローカル開発が稼働時間外
    でも困らないよう、`npm run db:up`/`db:down`でRDSを個別に起動・停止
    できるようにした(`package.json`参照)。

    **その他の環境固有の問題**: このPCではNorton Antivirusの「Web/Mail
    Shield」機能がSSL/TLS通信を検査しており、独自ルート証明書をWindowsの
    証明書ストアには追加している(そのためPowerShellの`Invoke-WebRequest`
    等は問題なく通る)が、Python製のAWS CLIは自前の証明書バンドルしか
    見ないため信頼できず、`CERTIFICATE_VERIFY_FAILED`で全AWS CLI操作が
    失敗する状態になった。Windowsの証明書ストア(Root)を丸ごとPEMに
    エクスポートして`AWS_CA_BUNDLE`環境変数(ユーザー環境変数として永続化)
    に設定することで解決。同じ現象(PowerShellは繋がるがPython製CLIだけ
    証明書エラー)に当たったら、まずウイルス対策ソフトのHTTPS検査機能を疑うとよい。
