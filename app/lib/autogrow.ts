// 行数固定だと複数行書きたい時に窮屈なので、内容に合わせて高さを伸ばす。
// PostForm.tsx・CommentForm.tsx・PostEditor.tsxで同じロジックが必要になった
// ため、3つ目の複製を作らずここに集約した。
export function autoGrow(el: HTMLTextAreaElement): void {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}
