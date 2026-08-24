// 「開発中止」は失敗の烙印ではなく、そこまでの試行錯誤・振り返り
// (Project.retrospective)にも価値を持たせるための状態(project-actions.ts
// のupdateProject()参照。ステージ前進判定から明示的に除外している)。
export type Stage = "アイデア" | "プロトタイプ" | "ベータ" | "公開中" | "開発中止";
// "self" = AIツールを使わず自作。"multiple" = 単一のツール名では言い表せない
// 複数ツール併用。null = アイデア段階でまだ何も作っていない(ツール未定)。
export type AiTool = "Claude" | "ChatGPT" | "Gemini" | "Bolt" | "v0" | "Cursor" | "self" | "multiple" | null;
export type Category =
  | "Webアプリ"
  | "スマホアプリ"
  | "PCアプリ"
  | "ゲーム"
  | "AIツール"
  | "AI Agent"
  | "拡張機能"
  | "プロトタイプ"
  | "その他";

// 対応プラットフォーム。自由記述タグではなく固定語彙にして、
// 表記ゆれなしにフィルタできるようにする。
export type Platform =
  | "iOS"
  | "Android"
  | "Windows"
  | "macOS"
  | "Linux"
  | "Web"
  | "拡張機能"
  | "Unity"
  | "Unreal Engine"
  | "その他";

export type Work = {
  id: string;
  title: string;
  catch: string; // 一言キャッチ〜説明文。最大200文字程度を想定。カード上では60文字でいったん折りたたみ、「続きを読む」で全文表示する
  category: Category;
  stage: Stage;
  tool: AiTool;
  platforms: Platform[];
  author: string;
  // 内部的に一意なハンドル(User.name)。プロフィールURL(/u/[name])や
  // フォロー等の内部参照にのみ使う。mock-data.ts由来のシードWorkには
  // 無意味なので省略可(実データはqueries.tsのtoWork()が常に埋める)。
  authorHandle?: string;
  // 実際にXに連携している場合だけ、そのユーザー名を「表示名@ハンドル」の
  // 形で添える(queries.tsのsocialHandleOf()参照)。連携が無ければ表示
  // しない。authorHandleとは別物(内部ハンドル≠実際のSNSのハンドル)。
  authorSocialHandle?: string;
  // GitHub/X/Google/LINEいずれかで実際にログインしたユーザーかどうか
  // (ゲスト/未ログインと区別する小さなバッジ用。queries.tsの
  // isVerifiedAuthor()参照)。mock-data.ts由来のシードWorkはfalse扱い。
  authorVerified?: boolean;
  // GitHubログインのアバター、またはアップロードした画像。未設定ならAuthorAvatarが
  // 生成イニシャルにフォールバックする。mock-data.ts由来のシードWorkには無意味。
  authorImage?: string;
  members?: {
    id: string;
    name: string;
    displayName: string;
    image?: string;
  }[];
  // 「自分のProject一覧」を絞り込むためのUser.id。mock-data.ts由来のシード
  // Workには無意味なので省略可(実データはqueries.tsのtoWork()が常に埋める)。
  authorId?: string;
  hue: number; // thumbnail accent hue, 0-360
  glyph: string | null; // 1-2 char thumbnail mark. null = 作者が画像・動画を用意しなかった投稿
  coverImageUrl?: string; // アップロードされた実写真。あればglyph/hueより優先して表示
  githubUrl?: string; // 画像がない場合、リポジトリ情報を自動取得してカード化する
  youtubeUrl?: string; // 設定されていればサムネイルカードを表示する
  appStoreUrl?: string; // App Storeへのリンク(設定されていればWorkDetailにリンクを表示)
  googlePlayUrl?: string; // Google Playへのリンク(同上)
  hasMotion?: boolean; // true = 動画/GIFを添付した投稿。ホバー/スクロール時にミュート再生風プレビューを見せる
  reactions: {
    like: number;
    useful: number;
    idea: number;
    wantToTry: number;
  };
  comments: number;
  reposts: number;
  views: number; // ページビュー的な指標。Xのインプレッション表示のように使う
  daysAgo: number;
  // タイムライン投稿・コメント追加も含めた最終アクティビティからの経過日数。
  // 未設定(mock-data.ts由来のシードWork)はdaysAgoにフォールバックする。
  lastActivityDaysAgo?: number;
  // Draftly AIによる自動応援コメントのON/OFF。未設定(mock-data.ts由来の
  // シードWork)はtrue(有効)扱いにする。
  aiCommentsEnabled?: boolean;
  trendScore: number; // 0-100, "急上昇" strength
  followers: number; // author follower count — small number = "無名"
  // この作品が他の作品にインスパイアされて作られた場合の元Project。
  // getWorkById()(単体の詳細ページ)でのみ埋める。フィード一覧の
  // 各カードでは毎回追加クエリになるため取得しない(未設定=undefined)。
  inspiredByProjectId?: string;
  inspiredByProjectTitle?: string;
  // 自分がブックマーク(あとで見る)済みかどうか。mock-data.ts由来の
  // シードWorkはfalse扱い(queries.tsのtoWork()が実データを埋める)。
  bookmarked?: boolean;
  // JSON-LD(構造化データ)のdatePublished用に絶対日時が要る場面のみ使う
  // ISO 8601文字列。表示自体はdaysAgo/lastActivityDaysAgoの相対表記を使い
  // 続けるため、通常のUIロジックはこのフィールドを見に行かない。
  // mock-data.ts由来のシードWorkは省略可(queries.tsのtoWork()が実データを埋める)。
  createdAtIso?: string;
  // stageが「開発中止」のときだけ意味を持つ、任意の振り返り文
  // (project-actions.tsのupdateProject()参照)。
  retrospective?: string;
};

export type ReactionKey = keyof Work["reactions"];

export const REACTION_META: { key: ReactionKey; icon: string; label: string }[] = [
  { key: "like", icon: "❤️", label: "いいね" },
  { key: "useful", icon: "🛠️", label: "便利" },
  { key: "idea", icon: "💡", label: "発想◎" },
  { key: "wantToTry", icon: "🙋", label: "使ってみたい" },
];

// このデータはアプリ本体からはもう読まれない。prisma/seed.tsがDBへ投入する
// ための唯一のソースとしてのみ使われる(実際の表示はapp/lib/queries.ts経由でDBから読む)。
export const works: Work[] = [
  {
    id: "kondate-makasete",
    title: "献立まかせて",
    catch:
      "冷蔵庫の中身を写真で送ると、今日の献立を3つ提案してくれる。一人暮らしを始めてから「今日何作ろう」を考えるのが地味に一番しんどかったので、まず自分のために作った。余り物から逆算して提案してくれるので、最近は食材を捨てることがほぼなくなった。",
    category: "Webアプリ",
    stage: "ベータ",
    tool: "Claude",
    platforms: ["Web"],
    author: "みかん",
    hue: 18,
    glyph: "🍳",
    reactions: { like: 41, useful: 142, idea: 38, wantToTry: 96 },
    comments: 23,
    reposts: 0,
    views: 18900,
    daysAgo: 1,
    trendScore: 92,
    followers: 34,
  },
  {
    id: "giji-iranai",
    title: "議事録イラナイ",
    catch: "会議の音声を投げると、決定事項とToDoだけ抜き出してSlackに送る",
    category: "AI Agent",
    stage: "公開中",
    tool: "ChatGPT",
    platforms: ["Web"],
    author: "けんと",
    hue: 205,
    glyph: "📝",
    reactions: { like: 30, useful: 210, idea: 18, wantToTry: 61 },
    comments: 34,
    reposts: 0,
    views: 24000,
    daysAgo: 6,
    trendScore: 58,
    followers: 812,
  },
  {
    id: "tsumige-kuyou",
    title: "積みゲー供養",
    catch: "積んでるゲームを登録すると、AIが「今日消化すべき1本」を選ぶ",
    category: "ゲーム",
    stage: "プロトタイプ",
    tool: "Gemini",
    platforms: ["Windows", "macOS"],
    author: "8bit_ojisan",
    hue: 265,
    glyph: "🎮",
    hasMotion: true,
    reactions: { like: 88, useful: 12, idea: 54, wantToTry: 70 },
    comments: 19,
    reposts: 0,
    views: 9800,
    daysAgo: 2,
    trendScore: 81,
    followers: 21,
  },
  {
    id: "ryoushuusho-shaberu",
    title: "領収書、喋るだけ",
    catch: "内容を喋るだけで経費精算フォームが自動で埋まる",
    category: "スマホアプリ",
    stage: "ベータ",
    tool: "Claude",
    platforms: ["iOS", "Android"],
    author: "yuzu.code",
    hue: 150,
    glyph: "🧾",
    reactions: { like: 15, useful: 120, idea: 9, wantToTry: 44 },
    comments: 8,
    reposts: 0,
    views: 4200,
    daysAgo: 4,
    trendScore: 40,
    followers: 156,
  },
  {
    id: "shizuka-ext",
    title: "静かにしてブラウザ拡張",
    catch:
      "うるさい自動再生タブを検知して黙らせるだけの拡張機能。ニュースサイトを開くたびに勝手に動画が流れて音が出るのがストレスで、似たような拡張機能もいくつか試したけど検知精度が微妙だったので自分で作った。今のところ誤検知はほぼゼロです。",
    category: "拡張機能",
    stage: "公開中",
    tool: "Cursor",
    platforms: ["拡張機能"],
    author: "ふじたか",
    hue: 340,
    glyph: "🔇",
    hasMotion: true,
    reactions: { like: 66, useful: 190, idea: 11, wantToTry: 58 },
    comments: 27,
    reposts: 0,
    views: 15600,
    daysAgo: 12,
    trendScore: 35,
    followers: 402,
  },
  {
    id: "oshi-birthday",
    title: "推しの誕生日、忘れない",
    catch: "好きなキャラの誕生日を登録すると前日にLINEで教えてくれる",
    category: "Webアプリ",
    stage: "アイデア",
    tool: null,
    platforms: ["Web"],
    author: "つきみ",
    hue: 330,
    glyph: null,
    reactions: { like: 54, useful: 20, idea: 61, wantToTry: 48 },
    comments: 15,
    reposts: 0,
    views: 3100,
    daysAgo: 0,
    trendScore: 74,
    followers: 6,
  },
  {
    id: "zatsudan-renshuu",
    title: "雑談、練習しませんか",
    catch: "苦手な雑談の練習相手になってくれるAIエージェント",
    category: "AI Agent",
    stage: "プロトタイプ",
    tool: "ChatGPT",
    platforms: ["Web"],
    author: "hal",
    hue: 45,
    glyph: "💬",
    reactions: { like: 47, useful: 33, idea: 40, wantToTry: 65 },
    comments: 11,
    reposts: 0,
    views: 5400,
    daysAgo: 3,
    trendScore: 63,
    followers: 45,
  },
  {
    id: "neko-honyaku",
    title: "猫の鳴き声、翻訳してみた",
    catch:
      "録音すると感情を推定して日本語で教えてくれる(精度は察してください)。うちの猫が構ってほしいのか怒っているのか毎回分からなくて作り始めたけど、結局「多分お腹すいてる」しか当たらない。でも当たった時は本当に嬉しいので、供養だと思って公開します。",
    category: "プロトタイプ",
    stage: "プロトタイプ",
    tool: "Gemini",
    platforms: ["iOS", "Android"],
    author: "sora",
    hue: 25,
    glyph: "🐱",
    hasMotion: true,
    reactions: { like: 132, useful: 8, idea: 70, wantToTry: 91 },
    comments: 42,
    reposts: 0,
    views: 22000,
    daysAgo: 1,
    trendScore: 97,
    followers: 12,
  },
  {
    id: "taishoku-daikou",
    title: "円満退職の伝え方メーカー",
    catch:
      "伝えづらいシーン別に、退職の切り出し方を生成する。自分が転職する時に「何て言えばいいんだ」と一週間くらい悩んだ実体験がベースになってます。円満退職テンプレというより、心の準備をするためのツールという感じで使ってもらえたら嬉しいです。",
    category: "Webアプリ",
    stage: "ベータ",
    tool: "Claude",
    platforms: ["Web"],
    author: "まめ",
    hue: 190,
    glyph: null,
    reactions: { like: 60, useful: 74, idea: 22, wantToTry: 39 },
    comments: 14,
    reposts: 0,
    views: 3800,
    daysAgo: 8,
    trendScore: 29,
    followers: 88,
  },
  {
    id: "kakeibo-satsu",
    title: "家計簿、撮るだけ",
    catch: "レシートを撮るだけで自動で仕分けしてくれる家計簿アプリ",
    category: "スマホアプリ",
    stage: "公開中",
    tool: "v0",
    platforms: ["iOS", "Android"],
    author: "taro_maker",
    hue: 95,
    glyph: "🧮",
    reactions: { like: 10, useful: 240, idea: 6, wantToTry: 50 },
    comments: 31,
    reposts: 0,
    views: 31000,
    daysAgo: 20,
    trendScore: 22,
    followers: 1204,
  },
  {
    id: "ronsou-ondokei",
    title: "議論の温度計",
    catch: "リプライ欄が炎上気味かどうかをAIが判定し、アイコンの色で警告",
    category: "拡張機能",
    stage: "プロトタイプ",
    tool: "Bolt",
    platforms: ["拡張機能"],
    author: "kaede_p",
    hue: 5,
    glyph: "🌡️",
    reactions: { like: 101, useful: 28, idea: 66, wantToTry: 40 },
    comments: 22,
    reposts: 0,
    views: 8900,
    daysAgo: 2,
    trendScore: 78,
    followers: 19,
  },
  {
    id: "oshikatsu-warikan",
    title: "推し活遠征、割り勘ツール",
    catch: "遠征の交通費・宿泊費をメンバーでフェアに割り勘計算する",
    category: "Webアプリ",
    stage: "ベータ",
    tool: "self",
    platforms: ["Web"],
    author: "りんどう",
    hue: 315,
    glyph: "🎫",
    reactions: { like: 24, useful: 88, idea: 14, wantToTry: 30 },
    comments: 9,
    reposts: 0,
    views: 2900,
    daysAgo: 5,
    trendScore: 33,
    followers: 63,
  },
  {
    id: "kaigi-bgm",
    title: "退屈な会議のBGM生成機",
    catch: "会議の空気を読んで、それっぽいBGMを流し続けるだけ",
    category: "AIツール",
    stage: "アイデア",
    tool: null,
    platforms: ["Web"],
    author: "dev_nanashi",
    hue: 260,
    glyph: null,
    reactions: { like: 118, useful: 5, idea: 84, wantToTry: 52 },
    comments: 33,
    reposts: 0,
    views: 14200,
    daysAgo: 0,
    trendScore: 89,
    followers: 3,
  },
  {
    id: "pomodoro-inu",
    title: "ポモドーロ、犬に叱られる",
    catch:
      "サボると犬のキャラが本気で怒ってくる集中タイマー。普通のポモドーロタイマーだと結局スマホを触ってしまうので、罪悪感を外部から強制的に与える方式にしてみた。効果には個人差があると思いますが、自分にはめちゃくちゃ効きました。",
    category: "PCアプリ",
    stage: "ベータ",
    tool: "Cursor",
    platforms: ["Windows", "macOS"],
    author: "ao",
    hue: 35,
    glyph: "🐶",
    hasMotion: true,
    reactions: { like: 95, useful: 60, idea: 30, wantToTry: 84 },
    comments: 26,
    reposts: 0,
    views: 10500,
    daysAgo: 3,
    trendScore: 71,
    followers: 27,
  },
  {
    id: "tabi-shiori",
    title: "旅のしおり、丸投げ",
    catch: "行き先と日数を伝えるだけで、しおりが出来上がる",
    category: "Webアプリ",
    stage: "公開中",
    tool: "Gemini",
    platforms: ["Web"],
    author: "komugi",
    hue: 165,
    glyph: "🧳",
    reactions: { like: 20, useful: 175, idea: 10, wantToTry: 55 },
    comments: 17,
    reposts: 0,
    views: 11800,
    daysAgo: 15,
    trendScore: 25,
    followers: 340,
  },
  {
    id: "shougi-kansousen",
    title: "AIと将棋の感想戦",
    catch: "指した将棋の棋譜を貼ると、AIが感想戦に付き合ってくれる",
    category: "ゲーム",
    stage: "公開中",
    tool: "ChatGPT",
    platforms: ["Web"],
    author: "nemui_dev",
    hue: 220,
    glyph: "♟️",
    reactions: { like: 44, useful: 70, idea: 20, wantToTry: 35 },
    comments: 13,
    reposts: 0,
    views: 5600,
    daysAgo: 10,
    trendScore: 31,
    followers: 210,
  },
  {
    id: "shuuchuu-log-cli",
    title: "集中ログ、CLIで淡々と",
    catch: "使い方はREADME参照。GUIは作ってないです",
    category: "PCアプリ",
    stage: "公開中",
    tool: "Cursor",
    platforms: ["Windows", "macOS", "Linux"],
    author: "nanashi_cli",
    hue: 210,
    glyph: null,
    githubUrl: "https://github.com/octocat/Hello-World",
    reactions: { like: 18, useful: 26, idea: 8, wantToTry: 22 },
    comments: 4,
    reposts: 0,
    views: 980,
    daysAgo: 6,
    trendScore: 27,
    followers: 9,
  },
  {
    id: "yowa-rss-bot",
    title: "夜間だけ動くRSSまとめボット",
    catch: "深夜の間だけ巡回して、朝イチでまとめを投げてくるだけのbot",
    category: "AIツール",
    stage: "プロトタイプ",
    tool: null,
    platforms: ["Web"],
    author: "yowa_dev",
    hue: 250,
    glyph: null,
    githubUrl: "https://github.com/yowa-dev/this-repo-does-not-exist",
    reactions: { like: 12, useful: 9, idea: 15, wantToTry: 10 },
    comments: 2,
    reposts: 0,
    views: 520,
    daysAgo: 4,
    trendScore: 19,
    followers: 4,
  },
];

// 「作品」ではなく「創作活動」を投稿の最小単位にする再設計(docs/plan-v2.html)を
// データ構造に反映したもの。Work(=Project)は依然としてフィード表示用の集約情報を
// 持つが、実際の中身は時系列のPostの積み重ねとして表現する。
// 「Ideaを他人が拾って作る」導線(WANTEDなど)はv2企画書の批判的評価に基づき
// フェーズ2送りにしたため、Postの作者は常にそのProjectの作者と同一(セルフ循環)。
export type PostType =
  | "idea"
  | "making"
  | "screenshot"
  | "demo"
  | "prototype"
  | "release"
  | "update"
  | "question";

export const POST_TYPE_META: Record<PostType, { icon: string; label: string }> = {
  idea: { icon: "💡", label: "アイデア" },
  making: { icon: "🛠", label: "制作中" },
  screenshot: { icon: "📷", label: "スクショ" },
  demo: { icon: "🎥", label: "デモ" },
  prototype: { icon: "🚀", label: "プロトタイプ公開" },
  release: { icon: "✨", label: "リリース" },
  update: { icon: "🔧", label: "アップデート" },
  question: { icon: "💬", label: "つぶやき" },
};

// 「他人の成功も失敗も、自分の経験値に。」を伝えるための任意タグ。上の
// PostType(投稿の種類: アイデア/制作中/リリース等)とは別概念で、
// 「この投稿は試行錯誤の記録として何だったか」を示す。未設定がデフォルト。
export type ExperienceType = "trying" | "success" | "failure" | "learning";

// failureのラベルは、失敗そのものを評価するのではなく「何が分かったか」に
// 意識が向くよう意図的に「失敗から分かったこと」という表現にしている。
export const EXPERIENCE_TYPE_META: Record<ExperienceType, { icon: string; label: string }> = {
  trying: { icon: "🔄", label: "試行錯誤中" },
  success: { icon: "✅", label: "うまくいった" },
  failure: { icon: "💡", label: "失敗から分かったこと" },
  learning: { icon: "📘", label: "学びがあった" },
};

export type Post = {
  id: string;
  projectId: string;
  type: PostType;
  body: string;
  imageUrl?: string;
  youtubeUrl?: string;
  hoursAgo: number;
  experienceType?: ExperienceType;
};

export const posts: Post[] = [
  // 献立まかせて
  { id: "kondate-makasete-idea", projectId: "kondate-makasete", type: "idea", body: "冷蔵庫の中身を撮ったら献立を考えてくれるアプリ、誰か作ってないかな", hoursAgo: 72 },
  { id: "kondate-makasete-stage", projectId: "kondate-makasete", type: "prototype", body: "とりあえずチャットで献立を聞けるだけのプロトタイプができた", hoursAgo: 44 },
  { id: "log-5", projectId: "kondate-makasete", type: "update", body: "苦手食材を除外できるオプションを追加。要望くれた人ありがとう", hoursAgo: 26 },
  { id: "log-1", projectId: "kondate-makasete", type: "update", body: "写真の認識精度を上げて、冷蔵庫の奥の調味料も拾えるようにした", hoursAgo: 3 },

  // 議事録イラナイ
  { id: "giji-iranai-idea", projectId: "giji-iranai", type: "idea", body: "会議の音声から決定事項だけ抜き出してSlackに送ってくれたら助かるのに", hoursAgo: 192 },
  { id: "giji-iranai-stage", projectId: "giji-iranai", type: "release", body: "社内で使ってもらえる形になったので公開しました", hoursAgo: 164 },

  // 積みゲー供養
  { id: "tsumige-kuyou-idea", projectId: "tsumige-kuyou", type: "idea", body: "積みゲーが多すぎて、今日やるべき1本をAIに決めてほしい", hoursAgo: 96 },
  { id: "tsumige-kuyou-stage", projectId: "tsumige-kuyou", type: "making", body: "Steamのライブラリを読み込むところまでできた", hoursAgo: 68 },

  // 領収書、喋るだけ
  { id: "ryoushuusho-shaberu-idea", projectId: "ryoushuusho-shaberu", type: "idea", body: "経費精算、レシート見ながら喋るだけで終わらせたい", hoursAgo: 144 },
  { id: "ryoushuusho-shaberu-stage", projectId: "ryoushuusho-shaberu", type: "prototype", body: "喋った内容がフォームに反映されるところまで動いた", hoursAgo: 116 },

  // 静かにしてブラウザ拡張
  { id: "shizuka-ext-idea", projectId: "shizuka-ext", type: "idea", body: "ニュースサイトの自動再生動画、いい加減黙らせたい", hoursAgo: 336 },
  { id: "shizuka-ext-stage", projectId: "shizuka-ext", type: "release", body: "誤検知もほぼ無くなったので公開します", hoursAgo: 308 },

  // 推しの誕生日、忘れない(アイデア段階、まだこれだけ)
  { id: "oshi-birthday-idea", projectId: "oshi-birthday", type: "idea", body: "推しキャラの誕生日、前日にLINEで教えてくれるアプリが欲しい", hoursAgo: 48 },

  // 雑談、練習しませんか
  { id: "zatsudan-renshuu-idea", projectId: "zatsudan-renshuu", type: "idea", body: "雑談が苦手すぎて、練習相手になってくれるAIが欲しい", hoursAgo: 120 },
  { id: "zatsudan-renshuu-stage", projectId: "zatsudan-renshuu", type: "making", body: "雑談っぽい受け答えをするAIの土台ができてきた", hoursAgo: 92 },

  // 猫の鳴き声、翻訳してみた
  { id: "neko-honyaku-idea", projectId: "neko-honyaku", type: "idea", body: "うちの猫が何を訴えてるのか、鳴き声から知りたい", hoursAgo: 72 },
  { id: "neko-honyaku-stage", projectId: "neko-honyaku", type: "making", body: "感情推定モデルを繋いでみた。まだ精度はお察し", hoursAgo: 44 },
  { id: "log-6", projectId: "neko-honyaku", type: "update", body: "「遊んで」の検出だけ精度が低い…録音データ提供してくれる人募集中", hoursAgo: 30 },
  { id: "log-2", projectId: "neko-honyaku", type: "update", body: "「お腹すいた」の的中率が体感5割に。学習データ募集中", hoursAgo: 7 },

  // 円満退職の伝え方メーカー
  { id: "taishoku-daikou-idea", projectId: "taishoku-daikou", type: "idea", body: "退職の伝え方が分からなくて一週間悩んだので、AIに考えてもらいたい", hoursAgo: 240 },
  { id: "taishoku-daikou-stage", projectId: "taishoku-daikou", type: "prototype", body: "シーン別に文章を生成するところまでできた", hoursAgo: 212 },

  // 家計簿、撮るだけ
  { id: "kakeibo-satsu-idea", projectId: "kakeibo-satsu", type: "idea", body: "レシートを撮るだけで家計簿がつく仕組みが欲しい", hoursAgo: 528 },
  { id: "kakeibo-satsu-stage", projectId: "kakeibo-satsu", type: "release", body: "仕分け精度が安定してきたので正式公開しました", hoursAgo: 500 },

  // 議論の温度計
  { id: "ronsou-ondokei-idea", projectId: "ronsou-ondokei", type: "idea", body: "リプライ欄が荒れてるかどうか、開く前に知りたい", hoursAgo: 96 },
  { id: "ronsou-ondokei-stage", projectId: "ronsou-ondokei", type: "making", body: "炎上度を判定してアイコンの色を変える機能ができた", hoursAgo: 68 },
  { id: "log-3", projectId: "ronsou-ondokei", type: "update", body: "誤検知が多かったので閾値を調整。次はミュート機能をつけたい", hoursAgo: 11 },

  // 推し活遠征、割り勘ツール
  { id: "oshikatsu-warikan-idea", projectId: "oshikatsu-warikan", type: "idea", body: "遠征費の割り勘計算、毎回揉めるので自動化したい", hoursAgo: 168 },
  { id: "oshikatsu-warikan-stage", projectId: "oshikatsu-warikan", type: "prototype", body: "交通費と宿泊費を分けて計算できるようになった", hoursAgo: 140 },

  // 退屈な会議のBGM生成機(アイデア段階)
  { id: "kaigi-bgm-idea", projectId: "kaigi-bgm", type: "idea", body: "退屈な会議の空気を読んで、それっぽいBGMを流すbotが欲しい", hoursAgo: 48 },

  // ポモドーロ、犬に叱られる
  { id: "pomodoro-inu-idea", projectId: "pomodoro-inu", type: "idea", body: "普通のポモドーロだと結局サボるので、罪悪感を煽ってくるタイマーが欲しい", hoursAgo: 120 },
  { id: "pomodoro-inu-stage", projectId: "pomodoro-inu", type: "prototype", body: "犬が怒るアニメーションを組み込めた", hoursAgo: 92 },
  { id: "log-4", projectId: "pomodoro-inu", type: "update", body: "犬のセリフを50パターン追加。同じ怒られ方に飽きなくなった", hoursAgo: 20 },

  // 旅のしおり、丸投げ
  { id: "tabi-shiori-idea", projectId: "tabi-shiori", type: "idea", body: "行き先と日数を伝えるだけでしおりを作ってくれるツールが欲しい", hoursAgo: 408 },
  { id: "tabi-shiori-stage", projectId: "tabi-shiori", type: "release", body: "テンプレートも増やして公開しました", hoursAgo: 380 },

  // AIと将棋の感想戦
  { id: "shougi-kansousen-idea", projectId: "shougi-kansousen", type: "idea", body: "棋譜を貼るだけで感想戦に付き合ってくれるAIが欲しい", hoursAgo: 288 },
  { id: "shougi-kansousen-stage", projectId: "shougi-kansousen", type: "release", body: "定跡データを増強して公開しました", hoursAgo: 260 },

  // 集中ログ、CLIで淡々と
  { id: "shuuchuu-log-cli-idea", projectId: "shuuchuu-log-cli", type: "idea", body: "GUIはいらないから、CLIで完結する集中ログツールが欲しい", hoursAgo: 192 },
  { id: "shuuchuu-log-cli-stage", projectId: "shuuchuu-log-cli", type: "release", body: "READMEを整備して公開しました", hoursAgo: 164 },

  // 夜間だけ動くRSSまとめボット
  { id: "yowa-rss-bot-idea", projectId: "yowa-rss-bot", type: "idea", body: "深夜だけ巡回してまとめを作ってくれるRSSボットが欲しい", hoursAgo: 144 },
  { id: "yowa-rss-bot-stage", projectId: "yowa-rss-bot", type: "making", body: "巡回スケジュールだけは動くようになった", hoursAgo: 116 },
];
