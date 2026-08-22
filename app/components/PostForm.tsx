"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { POST_TYPE_META, type PostType, type Work } from "@/app/lib/mock-data";
import { GUEST_POST_LIMIT } from "@/app/lib/guest-limits";
import { inferPostType } from "@/app/lib/infer-post-type";
import { clearInspiredBy, useInspiredBy } from "@/app/lib/composer-store";
import { createPost, type CreatePostState } from "@/app/lib/post-actions";
import { ImagePickerButton } from "./ImagePickerButton";
import { YouTubeUrlInput } from "./YouTubeUrlInput";

const initialState: CreatePostState = {};

const COMPOSE_PROMPTS: { type: PostType; title: string; hint: string; placeholder: string }[] = [
  {
    type: "idea",
    title: "アイデア",
    hint: "思いつきだけ",
    placeholder: "例: 〇〇できるアプリがあったら便利そう。まずは小さく試したい",
  },
  {
    type: "making",
    title: "制作メモ",
    hint: "途中経過",
    placeholder: "例: 今日ここまで作った。次は〇〇を直す予定",
  },
  {
    type: "question",
    title: "質問",
    hint: "相談したい",
    placeholder: "例: この機能、先に作るならAとBどっちが良さそうですか?",
  },
  {
    type: "release",
    title: "公開",
    hint: "できた報告",
    placeholder: "例: β版を公開しました。触ってみて気づいた点があれば教えてください",
  },
];

const TIMELINE_PROMPTS: { type: PostType; title: string; hint: string; placeholder: string }[] = [
  {
    type: "making",
    title: "制作中",
    hint: "進捗",
    placeholder: "例: 今日はログインまわりを直しました。次は投稿画面を触ります",
  },
  {
    type: "screenshot",
    title: "スクショ",
    hint: "画面共有",
    placeholder: "例: 新しい一覧画面です。カードの余白を少し広げました",
  },
  {
    type: "update",
    title: "更新",
    hint: "改善報告",
    placeholder: "例: 検索条件を保存できるようにしました",
  },
  {
    type: "question",
    title: "質問",
    hint: "意見募集",
    placeholder: "例: この作品に次に足すなら、通知と検索どちらが良さそうですか?",
  },
];

// ホームの投稿欄(PostComposer)と作品詳細ページからその場でタイムラインに
// 追記する簡易フォーム(TimelinePostForm)は、以前は別ファイルとしてほぼ
// 同じ構造(本文欄・画像/YouTube・種類判定・文字数・投稿ボタン)を別々に
// 持っていた。同じ修正(高さ統一など)を毎回2箇所に当てる羽目になって
// いたため、差分だけをvariantで出し分ける1つのコンポーネントに統合した。
type PostFormProps =
  | {
      variant: "compose";
      myProjects: Work[];
    }
  | {
      variant: "timeline";
      projectId: string;
      isLoggedIn: boolean;
      // ログイン済みの場合は上限が無いので無視される。
      guestPostCount: number;
    };

export function PostForm(props: PostFormProps) {
  const { variant } = props;
  const [state, formAction, pending] = useActionState(createPost, initialState);
  const [body, setBody] = useState("");
  const promptOptions = variant === "compose" ? COMPOSE_PROMPTS : TIMELINE_PROMPTS;
  const [selectedType, setSelectedType] = useState<PostType | "">(promptOptions[0].type);
  // 投稿のたびに「新しいプロジェクトとして」を選び直す必要があると、
  // 一番よくある使い方(今取り組んでいるプロジェクトに続きを積む)の
  // たびに毎回ドロップダウン操作が要る。既存プロジェクトがあれば
  // 直近のものを既定にして、「書くだけで投稿できる」を最短動線にする。
  // まだプロジェクトが無い(=初めての投稿になりやすい)人には、プロジェクト
  // 新規作成(タイトル入力が要る分ハードルが上がる)ではなく、一番身軽な
  // つぶやきを既定にする。timelineは常にこのProjectへの投稿固定。
  const defaultProjectTarget = variant === "compose" ? (props.myProjects.length > 0 ? props.myProjects[0].id : "") : props.projectId;
  const [projectTarget, setProjectTarget] = useState(defaultProjectTarget);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  // 送信成功のたびに増やし、YouTubeUrlInputのkeyに使う。ボタン⇄入力欄の
  // 開閉状態(その部品のuseState)を投稿後に強制的に初期化するため。
  const [resetCount, setResetCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // composer-store(インスパイア元)はホームの投稿欄限定の概念。Hookは
  // variantにかかわらず同じ順序で呼び、timelineでは値だけを使わない。
  const storedInspiredBy = useInspiredBy();
  const inspiredBy = variant === "compose" ? storedInspiredBy : null;

  // 行数固定だと複数行書きたい時に窮屈なので、内容に合わせて高さを伸ばす。
  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function clearImage() {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    if (!state.success) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの結果を受けてフォームをクリアする必要がある
    setBody("");
    setProjectTarget(defaultProjectTarget);
    setSelectedType(promptOptions[0].type);
    formRef.current?.reset();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    clearImage();
    setYoutubeUrl("");
    setResetCount((c) => c + 1);

    // 投稿後の遷移はcomposeだけの関心事(timelineは既にその作品の詳細
    // ページにいるので、再検証後のタイムラインに新しい投稿がそのまま
    // 差し込まれる。移動する必要が無い)。
    if (variant !== "compose") return;
    clearInspiredBy();
    if (state.projectId) {
      const projectId = state.projectId;
      // revalidatePath後の再レンダリングでカードがDOMに反映されてから
      // ハッシュを付けたい。location.hashを立てるとブラウザが自動で
      // #work-xxxまでスクロールし、WorkCardの`target:`スタイルで
      // リング枠が付く(DiceButton等と同じ仕組みを流用)。
      requestAnimationFrame(() => {
        window.location.hash = `work-${projectId}`;
      });
    } else {
      // つぶやき(プロジェクト無し)の投稿はカード単体へのアンカーが無いので、
      // 一覧セクション(MurmurStrip)自体へジャンプする。location.hashだと
      // 連続投稿時に同じハッシュへの再代入になり動かないため、
      // scrollIntoViewで直接スクロールする。
      requestAnimationFrame(() => {
        document.getElementById("murmurs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- variant/propsは呼び出し中に変わらない前提
  }, [state.success, state.projectId, defaultProjectTarget]);

  const trimmed = body.trim();
  const guessedType = selectedType || inferPostType(body);
  const selectedPrompt = promptOptions.find((option) => option.type === selectedType);
  const showProjectTarget = variant === "compose" && selectedType !== "question";
  const guestRemaining = variant === "timeline" ? GUEST_POST_LIMIT - props.guestPostCount : Infinity;

  // timelineだけ、ゲスト投稿の上限に達した場合ログイン導線に差し替える
  // (createPost自体は上限を検証済みだが、UIとして残り件数が見えないと
  // 不親切なため)。composeはPostComposerToggle.tsx側で同じガードを
  // 先にやっているのでここには来ない。
  if (variant === "timeline" && !props.isLoggedIn && guestRemaining <= 0) {
    return (
      <Link
        href="/login"
        className="flex w-full items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 text-left text-[15px] text-[var(--ink-faint)] transition-colors hover:border-[var(--accent)]"
      >
        <span aria-hidden>✎</span>
        ゲストの投稿は{GUEST_POST_LIMIT}件までです。続けて投稿するにはログインしてください
      </Link>
    );
  }

  const form = (
    <form
      ref={formRef}
      action={formAction}
      encType="multipart/form-data"
      className={`rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] ${variant === "compose" ? "p-4" : "p-3"}`}
    >
      {variant === "timeline" && <input type="hidden" name="projectTarget" value={props.projectId} />}
      {selectedType && <input type="hidden" name="postType" value={selectedType} />}
      {variant === "compose" && inspiredBy && (
        <div className="mb-2 flex items-center gap-1.5">
          <input type="hidden" name="inspiredByProjectId" value={inspiredBy.id} />
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--teal)] bg-[var(--teal-soft)] px-2.5 py-1 text-[12px] text-[var(--teal)]">
            🌱 {inspiredBy.title} からインスパイア
          </span>
          <button
            type="button"
            onClick={clearInspiredBy}
            aria-label="インスパイア元を解除"
            className="text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          >
            ✕
          </button>
        </div>
      )}
      {variant === "timeline" && !props.isLoggedIn && (
        <p className="mb-2 text-[12px] text-[var(--ink-faint)]">
          🔓 ログインなしでもあと{guestRemaining}件投稿できます(ログインすると無制限に投稿できます)
        </p>
      )}
      <div className="mb-3">
        <p className="mb-1.5 text-[12px] font-medium text-[var(--ink-soft)]">何を投稿しますか?</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {promptOptions.map((option) => {
            const active = selectedType === option.type;
            return (
              <button
                key={option.type}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelectedType(option.type);
                  textareaRef.current?.focus();
                }}
                className={`min-h-14 rounded-xl border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--line)] bg-[var(--bg-sunken)]/35 text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
                }`}
              >
                <span className="block text-[12px] font-bold">
                  {POST_TYPE_META[option.type].icon} {option.title}
                </span>
                <span className="block text-[11px] opacity-75">{option.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        name="body"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          autoGrow(e.target);
        }}
        placeholder={
          selectedPrompt?.placeholder ??
          (variant === "compose"
            ? "思いついたこと、気になってること、なんでもどうぞ(未完成・アイデアだけでもOK)"
            : "進捗を投稿する(未完成でもOK)")
        }
        rows={2}
        maxLength={280}
        className={`w-full resize-none overflow-hidden border-none bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none ${
          variant === "compose" ? "text-[15px]" : "text-[14px]"
        }`}
      />
      {variant === "compose" && selectedType === "question" && (
        <p className="mt-2 text-[12px] text-[var(--ink-faint)]">
          質問は作品に紐づけず、つぶやきとして投稿されます
        </p>
      )}
      {showProjectTarget && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[var(--ink-faint)]">投稿先</span>
          <select
            name="projectTarget"
            value={projectTarget}
            onChange={(e) => setProjectTarget(e.target.value)}
            className="h-8 rounded-full border border-[var(--line)] bg-[var(--bg-sunken)] px-2.5 text-[13px] text-[var(--ink-soft)] focus:outline-none"
          >
            <option value="">💬 つぶやき</option>
            <option value="new">🆕 新しいプロジェクトとして</option>
            {props.myProjects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.title}
              </option>
            ))}
          </select>
          {projectTarget === "new" && (
            <input
              type="text"
              name="newProjectTitle"
              placeholder="プロジェクト名(空欄なら投稿内容から自動生成)"
              maxLength={40}
              className="h-8 min-w-[180px] flex-1 rounded-full border border-[var(--line)] bg-transparent px-2.5 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
            />
          )}
        </div>
      )}
      {/* 添付ボタン列と送信ボタンを別の行に分けると高さが揃って見えないと
          いう指摘が続いたため、同じ1行にまとめている(items-centerで
          確実に同じ基準線に揃う)。狭い画面ではflex-wrapで自然に折り返す。 */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ImagePickerButton
          fileInputRef={fileInputRef}
          preview={imagePreview}
          onChange={handleImageChange}
          onClear={clearImage}
        />
        <YouTubeUrlInput key={resetCount} value={youtubeUrl} onChange={setYoutubeUrl} />
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-soft)] transition-opacity ${
            trimmed ? "opacity-100" : "opacity-0"
          }`}
        >
          {POST_TYPE_META[guessedType].icon} {POST_TYPE_META[guessedType].label}っぽい投稿として判定
        </span>
        <span className="font-mono text-[11px] text-[var(--ink-faint)]">{body.length}/280</span>
        <button
          type="submit"
          disabled={(!trimmed && !imagePreview) || pending}
          className="h-8 rounded-full bg-[var(--accent)] px-4 text-[13px] font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40"
        >
          {pending ? "投稿中…" : "投稿する"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-[12px] text-[var(--accent)]">{state.error}</p>}
    </form>
  );

  if (variant === "compose") {
    return (
      <div id="composer" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-6 sm:px-6">
        {form}
      </div>
    );
  }
  return form;
}
