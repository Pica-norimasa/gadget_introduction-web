export function CoverImage({
  src,
  compact = false,
  size = "md",
}: {
  src: string;
  compact?: boolean;
  size?: "md" | "lg";
}) {
  if (compact) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
      <img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
    <img
      src={src}
      alt=""
      className={`w-full rounded-xl object-cover ${size === "lg" ? "aspect-[4/3]" : "aspect-square"}`}
    />
  );
}
