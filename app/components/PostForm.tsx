"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { POST_TYPE_META, type PostType, type Work } from "@/app/lib/mock-data";
import { autoGrow } from "@/app/lib/autogrow";
import { GUEST_POST_LIMIT } from "@/app/lib/guest-limits";
import { inferPostType } from "@/app/lib/infer-post-type";
import { clearInspiredBy, useComposerPostTypeRequest, useInspiredBy } from "@/app/lib/composer-store";
import { createPost, type CreatePostState } from "@/app/lib/post-actions";
import { ImagePickerButton } from "./ImagePickerButton";
import { YouTubeUrlInput } from "./YouTubeUrlInput";

const initialState: CreatePostState = {};

const COMPOSE_PROMPTS: { type: PostType; title: string; hint: string; placeholder: string }[] = [
  {
    type: "question",
    title: POST_TYPE_META.question.label,
    hint: "気軽に投稿",
    placeholder: "例: この機能、A案とB案で少し迷っている。まずは小さく試してみたい",
  },
  {
    type: "idea",
    title: POST_TYPE_META.idea.label,
    hint: "思いつきだけ",
    placeholder: "例: 〇〇できるアプリがあったら便利そう。まずは小さく試したい",
  },
  {
    type: "making",
    title: POST_TYPE_META.making.label,
    hint: "途中経過",
    placeholder: "例: 今日ここまで作った。次は〇〇を直す予定",
  },
  {
    type: "screenshot",
    title: POST_TYPE_META.screenshot.label,
    hint: "画面共有",
    placeholder: "例: 新しい一覧画面です。カードの余白を少し広げました",
  },
  {
    type: "demo",
    title: POST_TYPE_META.demo.label,
    hint: "動作紹介",
    placeholder: "例: 動くところを短く撮りました。ここから触り心地を詰めます",
  },
  {
    type: "prototype",
    title: POST_TYPE_META.prototype.label,
    hint: "試作品",
    placeholder: "例: プロトタイプを公開しました。まずは主要な流れだけ触れます",
  },
  {
    type: "update",
    title: POST_TYPE_META.update.label,
    hint: "改善報告",
    placeholder: "例: 検索条件を保存できるようにしました",
  },
  {
    type: "release",
    title: POST_TYPE_META.release.label,
    hint: "できた報告",
    placeholder: "例: β版を公開しました。触ってみて気づいた点があれば教えてください",
  },
];

const TIMELINE_PROMPTS: { type: PostType; title: string; hint: string; placeholder: string }[] = [
  {
    type: "making",
    title: POST_TYPE_META.making.label,
    hint: "進捗",
    placeholder: "例: 今日はログインまわりを直しました。次は投稿画面を触ります",
  },
  {
    type: "idea",
    title: POST_TYPE_META.idea.label,
    hint: "思いつき",
    placeholder: "例: この作品で次にこういう体験を作れたら面白そう",
  },
  {
    type: "screenshot",
    title: POST_TYPE_META.screenshot.label,
    hint: "画面共有",
    placeholder: "例: 新しい一覧画面です。カードの余白を少し広げました",
  },
  {
    type: "demo",
    title: POST_TYPE_META.demo.label,
    hint: "動作紹介",
    placeholder: "例: 動くところを短く撮りました。ここから触り心地を詰めます",
  },
  {
    type: "prototype",
    title: POST_TYPE_META.prototype.label,
    hint: "試作品",
    placeholder: "例: プロトタイプを公開しました。まずは主要な流れだけ触れます",
  },
  {
    type: "update",
    title: POST_TYPE_META.update.label,
    hint: "改善報告",
    placeholder: "例: 検索条件を保存できるようにしました",
  },
  {
    type: "release",
    title: POST_TYPE_META.release.label,
    hint: "公開報告",
    placeholder: "例: 正式にリリースしました。ここまでの改善点もまとめました",
  },
  {
    type: "question",
    title: POST_TYPE_META.question.label,
    hint: "ひとこと",
    placeholder: "例: 次は通知か検索を足したい。まずは使い勝手を見ながら決める予定",
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
  // つぶやきは「投稿先」を持たない独立投稿。アイデア/制作メモ/公開は
  // 作品に紐づく投稿なので、投稿先は既存Projectか新規Projectに限る。
  // まだProjectが無い人がつぶやき以外を選んだ時は、新規Projectを既定にする。
  // timelineは常にこのProjectへの投稿固定。
  const defaultProjectTarget = variant === "compose" ? (props.myProjects[0]?.id ?? "new") : props.projectId;
  const [projectTarget, setProjectTarget] = useState(defaultProjectTarget);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  // 画像/YouTubeは全投稿で常に必要な項目ではないため、普段は畳んで
  // composerの情報量を減らす。スクショ投稿だけは添付が主目的なので
  // 選択時に開く。
  const [attachmentOpen, setAttachmentOpen] = useState(false);
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
  const postTypeRequest = useComposerPostTypeRequest();

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
    setAttachmentOpen(false);

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
      // つぶやき(プロジェクト無し)の投稿はホーム上位タブの
      // 「つぶやきタイムライン」に切り替えて、作成された投稿位置まで
      // スクロールする。タブ状態はHomeContentTabs側にあるため、疎結合な
      // カスタムイベントで依頼する。
      window.dispatchEvent(new CustomEvent("draftly:show-murmurs", { detail: { postId: state.postId } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- variant/propsは呼び出し中に変わらない前提
  }, [state.success, state.projectId, defaultProjectTarget]);

  useEffect(() => {
    if (variant !== "compose" || !postTypeRequest.postType) return;
    const requestedPostType = postTypeRequest.postType;
    const frame = requestAnimationFrame(() => {
      setSelectedType(requestedPostType);
      setAttachmentOpen(false);
      if (requestedPostType !== "question" && !projectTarget) {
        setProjectTarget(defaultProjectTarget);
      }
      textareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- リクエストversion単位で反映する
  }, [postTypeRequest.version]);

  const trimmed = body.trim();
  const guessedType = selectedType || inferPostType(body);
  const selectedPrompt = promptOptions.find((option) => option.type === selectedType);
  const showProjectTarget = variant === "compose" && selectedType !== "question";
  const showAttachments = attachmentOpen || Boolean(imagePreview) || Boolean(youtubeUrl) || selectedType === "screenshot";
  const attachmentHint =
    selectedType === "screenshot"
      ? "スクショ投稿は画像を添えると伝わりやすいです"
      : selectedType === "question"
        ? "必要なら画像やYouTubeも添付できます"
        : "画像やYouTubeは必要なときだけ追加できます";
  const selectedProjectName =
    variant === "compose" && projectTarget && projectTarget !== "new"
      ? props.myProjects.find((project) => project.id === projectTarget)?.title
      : null;
  const guestRemaining = variant === "timeline" ? GUEST_POST_LIMIT - props.guestPostCount : Infinity;
  const createdHref = state.projectId ? `/work/${state.projectId}` : state.postId ? `/post/${state.postId}` : null;
  const successTitle = state.projectId ? "作品ページに投稿しました" : "つぶやきタイムラインに投稿しました";
  const successDescription = state.projectId
    ? "作品カードへ移動します。続きの進捗は同じ作品に積み重ねられます。"
    : "つぶやきタイムラインへ移動します。投稿の詳細ページからコメントも確認できます。";
  const successLinkLabel = state.projectId ? "作品ページを確認する" : "つぶやきを確認する";

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
      className={`rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] ${variant === "compose" ? "p-4 sm:p-4" : "p-3"}`}
    >
      {variant === "timeline" && <input type="hidden" name="projectTarget" value={props.projectId} />}
      {variant === "compose" && selectedType && <input type="hidden" name="postType" value={selectedType} />}
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
      {variant === "compose" ? (
        <div className="mb-4">
          <p className="mb-2 text-[11.5px] font-medium text-[var(--ink-faint)] sm:text-[12px]">何を投稿しますか?</p>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
            {promptOptions.map((option) => {
              const active = selectedType === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedType(option.type);
                    setAttachmentOpen(false);
                    if (option.type !== "question" && !projectTarget) setProjectTarget(defaultProjectTarget);
                    textareaRef.current?.focus();
                  }}
                  className={`min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-left transition-colors sm:min-h-14 sm:rounded-xl ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--line)] bg-[var(--bg-sunken)]/25 text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
                  }`}
                >
                  <span className="block text-[11.5px] font-bold sm:text-[12px]">
                    {POST_TYPE_META[option.type].icon} {option.title}
                  </span>
                  <span className="hidden text-[11px] opacity-75 sm:block">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] text-[var(--ink-faint)]">種類</span>
          <select
            name="postType"
            value={selectedType}
            onChange={(event) => {
              const nextType = event.target.value as PostType;
              setSelectedType(nextType);
              setAttachmentOpen(nextType === "screenshot");
            }}
            className="h-8 rounded-full border border-[var(--line)] bg-[var(--bg-sunken)] px-2.5 text-[13px] text-[var(--ink-soft)] focus:outline-none"
          >
            {promptOptions.map((option) => (
              <option key={option.type} value={option.type}>
                {POST_TYPE_META[option.type].icon} {option.title}
              </option>
            ))}
          </select>
        </div>
      )}
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
        className={`w-full resize-none overflow-hidden border-none bg-transparent leading-7 text-[var(--ink-soft)] placeholder:text-[var(--ink-faint)] focus:outline-none ${
          variant === "compose" ? "text-[14px] sm:text-[15px]" : "text-[14px]"
        }`}
      />
      {variant === "compose" && selectedType === "question" && (
        <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)]/20 px-3 py-2 text-[11px] leading-5 text-[var(--ink-muted)] sm:text-[11.5px]">
          ひとこと投稿として、みんなのつぶやきタイムラインに表示されます
        </p>
      )}
      {showProjectTarget && (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)]/20 px-3 py-3">
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
            <span className="text-[11px] text-[var(--ink-faint)]">作品</span>
            <select
              name="projectTarget"
              value={projectTarget}
              onChange={(e) => setProjectTarget(e.target.value)}
              className="h-8 min-w-0 rounded-full border border-[var(--line)] bg-[var(--bg-sunken)] px-2.5 text-[13px] text-[var(--ink-soft)] focus:outline-none sm:min-w-fit"
            >
              <option value="new">🆕 新しい作品として投稿</option>
              {props.myProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.title} に追加
                </option>
              ))}
            </select>
            {projectTarget === "new" && (
              <input
                type="text"
                name="newProjectTitle"
                placeholder="作品名(空欄なら投稿内容から自動生成)"
                maxLength={40}
                className="h-8 min-w-0 rounded-full border border-[var(--line)] bg-transparent px-2.5 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)] sm:min-w-[180px] sm:flex-1"
              />
            )}
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-faint)]">
            {projectTarget === "new"
              ? "新しい作品ページを作り、最初の投稿として表示します。"
              : selectedProjectName
                ? `「${selectedProjectName}」の制作タイムラインに追加します。`
                : "選んだ作品の制作タイムラインに追加します。"}
          </p>
        </div>
      )}
      {/* 送信ボタンはフォーム右下に固定感を出す。添付ボタン・判定ラベル・
          文字数が折り返しても、投稿ボタンだけ変な位置に流れないよう
          左右のグループに分ける。 */}
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5">
        <div className="min-w-0">
          {showAttachments ? (
            <div className="space-y-1.5">
              <p className="text-[11px] leading-5 text-[var(--ink-faint)]">{attachmentHint}</p>
              <div className="flex min-h-8 min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] sm:flex-wrap sm:gap-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                <ImagePickerButton
                  fileInputRef={fileInputRef}
                  preview={imagePreview}
                  onChange={handleImageChange}
                  onClear={clearImage}
                />
                <YouTubeUrlInput key={resetCount} value={youtubeUrl} onChange={setYoutubeUrl} />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAttachmentOpen(true)}
              className="inline-flex h-8 items-center rounded-full border border-[var(--line)] px-3 text-[11px] text-[var(--ink-faint)] transition-colors hover:border-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
            >
              ＋ 画像・YouTubeを追加
            </button>
          )}
        </div>
        <div className="flex min-h-8 shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <span
            className={`items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-soft)] transition-opacity ${
              trimmed ? "hidden sm:inline-flex" : "hidden"
            }`}
          >
            {POST_TYPE_META[guessedType].icon} {POST_TYPE_META[guessedType].label}として投稿
          </span>
          <span className="inline-flex h-8 items-center font-mono text-[11px] text-[var(--ink-faint)]">
            {body.length}/280
          </span>
          <button
            type="submit"
            disabled={(!trimmed && !imagePreview && !youtubeUrl) || pending}
            className="h-8 rounded-full bg-[var(--accent)] px-4 text-[13px] font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40"
          >
            {pending ? "投稿中…" : "投稿する"}
          </button>
        </div>
      </div>
      {state.error && <p className="mt-2 text-[12px] text-[var(--accent)]">{state.error}</p>}
      {/* 作品詳細では投稿が直上の制作タイムラインへ即時反映されるため、
          同じ内容を伝える完了パネルはホームの投稿欄だけに表示する。 */}
      {state.success && variant === "compose" && (
        <div className="mt-3 rounded-xl border border-[var(--teal)] bg-[var(--teal-soft)] px-3 py-2">
          <p className="text-[13px] font-medium text-[var(--teal)]">{successTitle}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--teal)] opacity-90">{successDescription}</p>
          {createdHref && (
            <Link
              href={createdHref}
              className="mt-2 inline-flex rounded-full bg-[var(--teal)] px-3 py-1.5 text-[12px] font-medium text-[var(--teal-soft)]"
            >
              {successLinkLabel}
            </Link>
          )}
        </div>
      )}
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
