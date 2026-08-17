# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# schema.prismaのgenerator出力先(app/generated/prisma)はgit管理外なので、
# ビルド前に必ず生成する。DATABASE_URLはprisma generate自体には不要だが、
# 一部ツールが未設定を警告するのでダミー値を渡す。
ENV DATABASE_URL="mysql://user:pass@localhost:3306/placeholder"
RUN npx prisma generate
RUN npm run build

# --- Runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

# App RunnerのようなPaaSはコンテナに独自のHOSTNAME環境変数(インスタンスの
# ホスト名)を注入することがあり、Dockerfileの`ENV HOSTNAME=0.0.0.0`はそれに
# 上書きされてしまう。Next.jsのstandaloneサーバーはHOSTNAMEでbindアドレスを
# 決めるため、起動コマンド自体で明示的に指定して上書きされないようにする
# (実際にHOSTNAME=<インスタンスのホスト名>にbindされ、ヘルスチェックが
# 到達できずデプロイに失敗する不具合を確認済み)。
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]
