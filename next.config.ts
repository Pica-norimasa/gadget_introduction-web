import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // タイムライン/コメントの画像添付(最大5MB)をServer Action経由で
    // 受け取れるようにする。デフォルトは1MBなので、multipart/form-dataの
    // オーバーヘッド分も見込んで少し余裕を持たせている。
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
