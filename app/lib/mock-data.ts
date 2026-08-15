export type Stage = "アイデア" | "プロトタイプ" | "ベータ" | "公開中";
export type AiTool = "Claude" | "ChatGPT" | "Gemini" | "Bolt" | "v0" | "Cursor" | null;
export type Category =
  | "Webアプリ"
  | "スマホアプリ"
  | "PCアプリ"
  | "ゲーム"
  | "AIツール"
  | "AI Agent"
  | "拡張機能"
  | "プロトタイプ";

// 対応プラットフォーム。自由記述タグではなく固定語彙にして、
// 表記ゆれなしにフィルタできるようにする。
export type Platform = "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "Web" | "拡張機能";

export type Work = {
  id: string;
  title: string;
  catch: string;
  category: Category;
  stage: Stage;
  tool: AiTool;
  platforms: Platform[];
  author: string;
  hue: number; // thumbnail accent hue, 0-360
  glyph: string | null; // 1-2 char thumbnail mark. null = 作者が画像・動画を用意しなかった投稿
  githubUrl?: string; // 画像がない場合、リポジトリ情報を自動取得してカード化する
  hasMotion?: boolean; // true = 動画/GIFを添付した投稿。ホバー/スクロール時にミュート再生風プレビューを見せる
  reactions: {
    interesting: number;
    useful: number;
    idea: number;
    wantToTry: number;
  };
  comments: number;
  daysAgo: number;
  trendScore: number; // 0-100, "急上昇" strength
  followers: number; // author follower count — small number = "無名"
};

export const works: Work[] = [
  {
    id: "kondate-makasete",
    title: "献立まかせて",
    catch: "冷蔵庫の中身を写真で送ると、今日の献立を3つ提案してくれる",
    category: "Webアプリ",
    stage: "ベータ",
    tool: "Claude",
    platforms: ["Web"],
    author: "みかん",
    hue: 18,
    glyph: "🍳",
    reactions: { interesting: 41, useful: 142, idea: 38, wantToTry: 96 },
    comments: 23,
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
    reactions: { interesting: 30, useful: 210, idea: 18, wantToTry: 61 },
    comments: 34,
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
    reactions: { interesting: 88, useful: 12, idea: 54, wantToTry: 70 },
    comments: 19,
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
    reactions: { interesting: 15, useful: 120, idea: 9, wantToTry: 44 },
    comments: 8,
    daysAgo: 4,
    trendScore: 40,
    followers: 156,
  },
  {
    id: "shizuka-ext",
    title: "静かにしてブラウザ拡張",
    catch: "うるさい自動再生タブを検知して黙らせるだけの拡張機能",
    category: "拡張機能",
    stage: "公開中",
    tool: "Cursor",
    platforms: ["拡張機能"],
    author: "ふじたか",
    hue: 340,
    glyph: "🔇",
    hasMotion: true,
    reactions: { interesting: 66, useful: 190, idea: 11, wantToTry: 58 },
    comments: 27,
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
    reactions: { interesting: 54, useful: 20, idea: 61, wantToTry: 48 },
    comments: 15,
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
    reactions: { interesting: 47, useful: 33, idea: 40, wantToTry: 65 },
    comments: 11,
    daysAgo: 3,
    trendScore: 63,
    followers: 45,
  },
  {
    id: "neko-honyaku",
    title: "猫の鳴き声、翻訳してみた",
    catch: "録音すると感情を推定して日本語で教えてくれる(精度は察してください)",
    category: "プロトタイプ",
    stage: "プロトタイプ",
    tool: "Gemini",
    platforms: ["iOS", "Android"],
    author: "sora",
    hue: 25,
    glyph: "🐱",
    hasMotion: true,
    reactions: { interesting: 132, useful: 8, idea: 70, wantToTry: 91 },
    comments: 42,
    daysAgo: 1,
    trendScore: 97,
    followers: 12,
  },
  {
    id: "taishoku-daikou",
    title: "円満退職の伝え方メーカー",
    catch: "伝えづらいシーン別に、退職の切り出し方を生成する",
    category: "Webアプリ",
    stage: "ベータ",
    tool: "Claude",
    platforms: ["Web"],
    author: "まめ",
    hue: 190,
    glyph: null,
    reactions: { interesting: 60, useful: 74, idea: 22, wantToTry: 39 },
    comments: 14,
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
    reactions: { interesting: 10, useful: 240, idea: 6, wantToTry: 50 },
    comments: 31,
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
    reactions: { interesting: 101, useful: 28, idea: 66, wantToTry: 40 },
    comments: 22,
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
    tool: "Claude",
    platforms: ["Web"],
    author: "りんどう",
    hue: 315,
    glyph: "🎫",
    reactions: { interesting: 24, useful: 88, idea: 14, wantToTry: 30 },
    comments: 9,
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
    reactions: { interesting: 118, useful: 5, idea: 84, wantToTry: 52 },
    comments: 33,
    daysAgo: 0,
    trendScore: 89,
    followers: 3,
  },
  {
    id: "pomodoro-inu",
    title: "ポモドーロ、犬に叱られる",
    catch: "サボると犬のキャラが本気で怒ってくる集中タイマー",
    category: "PCアプリ",
    stage: "ベータ",
    tool: "Cursor",
    platforms: ["Windows", "macOS"],
    author: "ao",
    hue: 35,
    glyph: "🐶",
    hasMotion: true,
    reactions: { interesting: 95, useful: 60, idea: 30, wantToTry: 84 },
    comments: 26,
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
    reactions: { interesting: 20, useful: 175, idea: 10, wantToTry: 55 },
    comments: 17,
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
    reactions: { interesting: 44, useful: 70, idea: 20, wantToTry: 35 },
    comments: 13,
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
    reactions: { interesting: 18, useful: 26, idea: 8, wantToTry: 22 },
    comments: 4,
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
    reactions: { interesting: 12, useful: 9, idea: 15, wantToTry: 10 },
    comments: 2,
    daysAgo: 4,
    trendScore: 19,
    followers: 4,
  },
];

export type BuildLogEntry = {
  id: string;
  workTitle: string;
  workId: string;
  author: string;
  note: string;
  hoursAgo: number;
};

export const buildLogFeed: BuildLogEntry[] = [
  {
    id: "log-1",
    workTitle: "献立まかせて",
    workId: "kondate-makasete",
    author: "みかん",
    note: "写真の認識精度を上げて、冷蔵庫の奥の調味料も拾えるようにした",
    hoursAgo: 3,
  },
  {
    id: "log-2",
    workTitle: "猫の鳴き声、翻訳してみた",
    workId: "neko-honyaku",
    author: "sora",
    note: "「お腹すいた」の的中率が体感5割に。学習データ募集中",
    hoursAgo: 7,
  },
  {
    id: "log-3",
    workTitle: "議論の温度計",
    workId: "ronsou-ondokei",
    author: "kaede_p",
    note: "誤検知が多かったので閾値を調整。次はミュート機能をつけたい",
    hoursAgo: 11,
  },
  {
    id: "log-4",
    workTitle: "ポモドーロ、犬に叱られる",
    workId: "pomodoro-inu",
    author: "ao",
    note: "犬のセリフを50パターン追加。同じ怒られ方に飽きなくなった",
    hoursAgo: 20,
  },
  {
    id: "log-5",
    workTitle: "献立まかせて",
    workId: "kondate-makasete",
    author: "みかん",
    note: "苦手食材を除外できるオプションを追加。要望くれた人ありがとう",
    hoursAgo: 26,
  },
  {
    id: "log-6",
    workTitle: "猫の鳴き声、翻訳してみた",
    workId: "neko-honyaku",
    author: "sora",
    note: "「遊んで」の検出だけ精度が低い…録音データ提供してくれる人募集中",
    hoursAgo: 30,
  },
];

// 作品カードに「いつ・何を更新したか」をひと目で出すため、
// その作品の最新ビルドログを1件だけ返す。無ければnull(=投稿後まだ更新なし)。
export function latestUpdateFor(workId: string): BuildLogEntry | null {
  const entries = buildLogFeed.filter((e) => e.workId === workId);
  if (entries.length === 0) return null;
  return entries.reduce((latest, e) => (e.hoursAgo < latest.hoursAgo ? e : latest));
}
