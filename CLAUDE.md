# Gmail Invoice to Drive プロジェクト

## プロジェクト概要
Gmail で受信した請求書メールの PDF 添付ファイルを Google Drive に自動保存する Google Apps Script

## 技術スタック
- **言語**: Google Apps Script (JavaScript)
- **API**: Gmail API, Google Drive API
- **実行環境**: Google Apps Script (サーバーレス)

## アーキテクチャ
- メイン関数: `saveInvoicesToDrive()` - トリガーで定期実行
- 検索: 件名キーワード + 送信者メールアドレス（AND条件）
- 重複防止: Gmail ラベルで処理済みを管理

## コーディング規約
- 関数名: キャメルケース（例: `buildSearchQuery`）
- 定数: UPPER_SNAKE_CASE（例: `CONFIG.SENDER_EMAILS`）
- コメント: 日本語で記述
- エラーハンドリング: try-catch で Logger.log にエラー出力

## 重要な設定項目（CONFIG）
- `DRIVE_FOLDER_ID`: 保存先フォルダID（空=マイドライブルート）
- `SEARCH_KEYWORDS`: 件名検索キーワード配列
- `SENDER_EMAILS`: 送信者フィルタ配列（空=フィルタなし）
- `PROCESSED_LABEL`: 処理済みラベル名
- `FILE_NAME_FORMAT`: ファイル名形式（変数: {date}, {subject}, {sender}, {original}）

## よく使う関数
- `setupTrigger()`: 自動実行トリガーを作成（毎日午前9時）
- `testRun()`: テスト実行（30日分検索）
- `removeTrigger()`: トリガー削除

## 開発時の注意点
- Gmail API の検索クエリではラベル名の `/` は `-` に置換される
- ファイル名に使用できない文字（`\/:*?"<>|`）は `_` に置換
- PDF判定: `Content-Type: application/pdf` または拡張子 `.pdf`
- 同名ファイルが存在する場合はスキップ

## Git ワークフロー
- コミットメッセージ: 日本語で記述
- main ブランチに直接プッシュ
- Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com> を含める
