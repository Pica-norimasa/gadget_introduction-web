# Draftly

「アイデアを、育てながら見せる場所」を掲げる、AI創作物・個人開発作品の発表プラットフォームです。作品そのものだけでなく、アイデア、制作過程、更新、公開までの活動を投稿・共有できます。

## 主な機能

- 作品の作成・編集・削除、画像・GitHub・YouTube・ストアURLの掲載
- アイデアや制作記録を投稿するタイムラインと、作品に紐づけない単独投稿
- 作品・投稿へのリアクション、コメントと1階層の返信、リポスト、ブックマーク
- フォロー、通知、検索、人気順・新着順のランキング、タグ・ツール・対応プラットフォーム別の閲覧
- GitHub / X (Twitter) / Google / LINE によるログインと、匿名ゲストセッションの併用
- プロフィール編集、メールアドレス確認、通知設定、ミュート・ブロック・通報
- 管理画面での通報・ユーザー・クリック分析の確認
- Open Graph画像、sitemap、robots.txt、プライバシーポリシー・利用規約

企画の背景と画面構成は [docs/plan.html](docs/plan.html)、再設計案は [docs/plan-v2.html](docs/plan-v2.html) を参照してください。未完了の技術課題は [docs/todo.md](docs/todo.md) に記録しています。

## 技術構成

- Next.js 16 / React 19 / TypeScript
- Prisma 7 + MySQL（AWS RDSを想定）
- Auth.js（OAuth）
- AWS S3（投稿・コメント画像。ローカル開発では `public/uploads` にフォールバック）
- Docker（Next.js standalone出力）+ AWS App Runner / ECR / CodeBuild

## ローカル開発

Node.js 22系と、接続可能なMySQLデータベースが必要です。現在のPrismaスキーマはMySQL専用のため、SQLiteでは起動できません。

```bash
npm install
Copy-Item .env.example .env
```

`.env` の `DATABASE_URL` を開発用MySQLへ設定します。OAuthログインや管理画面、画像アップロードを試す場合は、必要な環境変数も `.env.example` を参考に設定してください。秘密情報をコミットしないでください。

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

利用可能な主なコマンド:

```bash
npm run lint       # ESLint
npm run build      # 本番ビルド
npm run start      # ビルド済みアプリを起動
npm run db:migrate # Prismaマイグレーションを開発DBへ反映
npm run db:seed    # 開発データを投入
npm run db:studio  # Prisma Studioを開く
npm run db:up      # 開発用RDSを起動
npm run db:down    # 開発用RDSを停止
```

`npm run build` はDBへ到達できる環境で実行してください。また、`next dev` と `next build` を同時に実行すると `.next` を競合させることがあるため、ビルド検証後は開発サーバーを再起動してください。

## 環境変数

最低限必要なのは `DATABASE_URL` です。設定例と説明は [.env.example](.env.example) にあります。

| 変数 | 用途 |
| --- | --- |
| `DATABASE_URL` | MySQL接続文字列 |
| `AUTH_SECRET` | Auth.jsのJWT署名用シークレット |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth |
| `AUTH_TWITTER_ID` / `AUTH_TWITTER_SECRET` | X OAuth |
| `GITHUB_TOKEN` | GitHubリポジトリプレビュー取得のレート制限緩和（任意） |
| `ADMIN_KEY` | `/admin` の管理画面用合言葉 |
| `S3_BUCKET_NAME` / `AWS_REGION` / `S3_PUBLIC_URL_BASE` | S3画像保存・配信設定（任意） |
| `AUTH_URL` | App Runnerなどプロキシ配下の本番URL。OAuthのコールバックURLをHTTPSで固定するため本番では設定 |

Google / LINE OAuthを有効にする場合も、各プロバイダーのAuth.js環境変数を設定し、コールバックURLを `/api/auth/callback/<provider>` に登録してください。

## 本番デプロイ

Dockerイメージは [Dockerfile](Dockerfile) でビルドします。`next.config.ts` は `output: "standalone"` を有効にしており、App Runnerでの実行を想定しています。[buildspec.yml](buildspec.yml) はCodeBuildからECRへイメージをpushする設定です。

本番では次を設定します。

- MySQL（RDS）へマイグレーションを適用し、`DATABASE_URL` をシークレットとして注入する
- `AUTH_SECRET`、OAuthのcredentials、必要に応じて `GITHUB_TOKEN` をシークレットとして注入する
- App Runnerのヘルスチェックを `/api/health` に設定する
- App Runner環境では `AUTH_URL` に公開HTTPS URLを設定する
- アップロードを使う場合はS3バケットと、書き込み権限を持つ実行ロールを設定する

`/api/health` はDBへ接続せず、アプリケーションプロセスが応答できるかだけを確認します。

### 手動デプロイ手順

コストを抑えるため、通常の `git push` では本番デプロイしません。GitHub ActionsのCIも `pull_request` と手動実行（`workflow_dispatch`）のみで動きます。

本番へ反映する場合は、必要なタイミングでCodeBuildとApp Runnerを手動実行します。CodeBuildはDockerイメージをビルドしてECRの `latest` を更新し、App Runnerはその `latest` イメージを取り込んで再デプロイします。

```bash
aws codebuild start-build \
  --region ap-northeast-1 \
  --project-name gadget-introduction-web-build \
  --source-version develop
```

CodeBuildが `SUCCEEDED` になったら、App Runnerを再デプロイします。

```bash
aws apprunner start-deployment \
  --region ap-northeast-1 \
  --service-arn arn:aws:apprunner:ap-northeast-1:<AWS_ACCOUNT_ID>:service/gadget-introduction-web/<SERVICE_ID>
```

デプロイ後は次を確認します。

```bash
curl https://<APP_RUNNER_DOMAIN>.ap-northeast-1.awsapprunner.com/api/health
```

期待値は `{"status":"ok"}` です。CodeBuildの実行にはビルド時間に応じた費用が発生するため、細かい修正ごとではなく、いくつか変更をまとめてから実行してください。

## バックアップと復旧

RDS `gadget-introduction-web-dev` は自動バックアップを有効にしています。

- 自動バックアップ保持期間: 7日
- バックアップ時間: `19:27-19:57 UTC`（日本時間 `04:27-04:57`）
- 削除保護: 有効
- スナップショットへのタグコピー: 有効

RDSのポイントインタイムリカバリは、既存DBを直接巻き戻すのではなく、指定時刻の状態から新しいDBインスタンスを作成します。復旧時は次の流れで切り替えます。

1. AWS ConsoleまたはAWS CLIで、`gadget-introduction-web-dev` の最新復元可能時刻を確認する。
2. 復元したい時刻を指定して、新しいRDSインスタンスへ復元する。
3. 新しいDBインスタンスのステータスが `available` になるまで待つ。
4. セキュリティグループ、パラメータ、バックアップ保持期間、削除保護を確認する。
5. 新しいDBへ管理ユーザーで接続し、`draftly_dev` の主要テーブルと件数を確認する。
6. App Runnerが参照するSecrets Managerの `DATABASE_URL` を、新しいRDSエンドポイントへ更新する。ユーザーは通常実行用の `draftly_app` を使う。
7. App Runnerを再デプロイする。
8. `/api/health`、トップページ、ログイン、投稿、コメントなど主要動作を確認する。
9. 問題があれば、Secrets Managerの `DATABASE_URL` を元のRDSエンドポイントへ戻して再デプロイする。

AWS CLIで確認する例:

```bash
aws rds describe-db-instances \
  --region ap-northeast-1 \
  --db-instance-identifier gadget-introduction-web-dev \
  --query "DBInstances[0].{Status:DBInstanceStatus,BackupRetentionPeriod:BackupRetentionPeriod,LatestRestorableTime:LatestRestorableTime,DeletionProtection:DeletionProtection}"
```

指定時刻へ復元する例:

```bash
aws rds restore-db-instance-to-point-in-time \
  --region ap-northeast-1 \
  --source-db-instance-identifier gadget-introduction-web-dev \
  --target-db-instance-identifier gadget-introduction-web-restore-YYYYMMDD \
  --restore-time YYYY-MM-DDTHH:MM:SSZ
```

復元後の切り替えはアプリの接続先変更を伴うため、Secrets Managerの更新前に必ず復元先DBへ直接接続してデータを確認してください。削除保護が有効なため、RDSインスタンスを削除する場合は削除保護を無効化してから削除する必要があります。
