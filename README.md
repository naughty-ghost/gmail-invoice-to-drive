# Gmail請求書自動保存スクリプト

Gmailで受信した請求書メールのPDF添付ファイルを自動的にGoogle Driveに保存するGoogle Apps Scriptです。

## 機能

- 件名に「請求書」または「Invoice」を含むメールを自動検索
- PDF添付ファイルをGoogle Driveに保存
- 処理済みメールにラベルを自動付与（重複処理を防止）
- 定期実行可能（トリガー設定）
- カスタマイズ可能な設定

## セットアップ手順

### 1. Google Apps Scriptプロジェクトを作成

1. [Google Apps Script](https://script.google.com/) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「Gmail請求書自動保存」などに変更

### 2. スクリプトをコピー

1. 作成されたデフォルトの `コード.gs` ファイルを開く
2. `gmail-invoice-to-drive.gs` ファイルの内容をすべてコピー
3. Google Apps Scriptエディタに貼り付けて上書き
4. 保存（Ctrl+S または ファイル > 保存）

### 3. 設定をカスタマイズ

スクリプト上部の `CONFIG` セクションを環境に合わせて編集します。

```javascript
const CONFIG = {
  // Google DriveのフォルダID
  DRIVE_FOLDER_ID: '',  // ← ここに保存先フォルダIDを設定

  // 検索キーワード
  SEARCH_KEYWORDS: ['請求書', 'Invoice', '御請求書'],

  // 送信者のメールアドレス（空の配列の場合は送信者による絞り込みなし）
  SENDER_EMAILS: [],  // ← 例: ['billing@example.com', 'invoice@company.com']

  // 処理済みラベル名
  PROCESSED_LABEL: '請求書/処理済み',

  // 検索対象期間（日数）
  SEARCH_DAYS: 7,

  // ファイル名の形式
  FILE_NAME_FORMAT: '{date}_{original}'
};
```

#### フォルダIDの取得方法

1. Google Driveで保存先フォルダを開く
2. URLの最後の部分をコピー
   ```
   https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j
                                          ↑この部分がフォルダID
   ```
3. `DRIVE_FOLDER_ID: '1a2b3c4d5e6f7g8h9i0j'` のように設定

空のままにするとマイドライブのルートに保存されます。

#### 送信者メールアドレスの設定方法

1. 特定の送信者からのメールのみ処理したい場合は `SENDER_EMAILS` に設定
   ```javascript
   SENDER_EMAILS: ['billing@example.com', 'invoice@company.com']
   ```
2. 送信者による絞り込みをしない場合は空の配列のまま
   ```javascript
   SENDER_EMAILS: []
   ```

**注意**: `SENDER_EMAILS` に値を設定すると、件名に検索キーワードを含み、**かつ**指定した送信者からのメールのみが処理対象になります。

### 4. 初回実行と権限の許可

1. 関数選択ドロップダウンから `testRun` を選択
2. 実行ボタン（▷）をクリック
3. 「承認が必要です」と表示されたら「権限を確認」をクリック
4. Googleアカウントを選択
5. 「詳細」をクリック → 「（プロジェクト名）に移動」をクリック
6. 「許可」をクリック

実行ログを確認して、正常に動作することを確認してください。

### 5. 自動実行トリガーを設定

#### 方法A: スクリプトで自動設定（推奨）

1. 関数選択ドロップダウンから `setupTrigger` を選択
2. 実行ボタン（▷）をクリック
3. ログに「トリガーを作成しました」と表示されればOK

デフォルトでは**毎日午前9時**に自動実行されます。

#### 方法B: 手動でトリガーを設定

1. 左サイドバーの「トリガー」（時計アイコン）をクリック
2. 右下の「トリガーを追加」をクリック
3. 以下のように設定:
   - 実行する関数: `saveInvoicesToDrive`
   - イベントのソース: `時間主導型`
   - 時間ベースのトリガー: `日付ベースのタイマー`
   - 時刻: `午前9時~10時`
4. 「保存」をクリック

## 使い方

### 自動実行

トリガーを設定すると、自動的に定期実行されます。特に操作は不要です。

### 手動実行

必要に応じて手動で実行できます。

1. Google Apps Scriptエディタを開く
2. 関数選択から `saveInvoicesToDrive` を選択
3. 実行ボタン（▷）をクリック

### 実行ログの確認

1. 左サイドバーの「実行数」をクリック
2. 各実行の詳細を確認
3. または、実行後に「表示」→「ログ」でログを確認

## カスタマイズ

### 検索条件を変更

```javascript
// 特定の送信者からのメールのみ対象にする場合
SENDER_EMAILS: ['billing@example.com'],

// 複数の送信者を指定
SENDER_EMAILS: ['billing@example.com', 'invoice@company.com', 'accounts@vendor.jp'],

// 送信者による絞り込みをしない場合
SENDER_EMAILS: [],

// 複数のキーワードを組み合わせる
SEARCH_KEYWORDS: ['請求書', 'Invoice', '見積書'],
```

### ファイル名の形式を変更

```javascript
// 利用可能な変数:
// {date}: 受信日 (YYYY-MM-DD)
// {subject}: メール件名
// {sender}: 送信者名
// {original}: 元のファイル名

// 例1: 日付と件名
FILE_NAME_FORMAT: '{date}_{subject}'

// 例2: 送信者と元のファイル名
FILE_NAME_FORMAT: '{sender}_{original}'

// 例3: 日付のみ
FILE_NAME_FORMAT: '{date}'
```

### 実行頻度を変更

`setupTrigger` 関数内を編集:

```javascript
// 1時間ごとに実行
ScriptApp.newTrigger('saveInvoicesToDrive')
  .timeBased()
  .everyHours(1)
  .create();

// 週1回（月曜日の午前9時）に実行
ScriptApp.newTrigger('saveInvoicesToDrive')
  .timeBased()
  .onWeekDay(ScriptApp.WeekDay.MONDAY)
  .atHour(9)
  .create();
```

### 他のファイル形式も保存する

`savePdfAttachments` 関数を編集:

```javascript
// PDFと画像を保存
if (attachment.getContentType() === 'application/pdf' ||
    attachment.getContentType().startsWith('image/')) {
  // 保存処理
}

// すべての添付ファイルを保存
// if文の条件を削除するだけ
```

## トラブルシューティング

### メールが処理されない

1. 検索クエリを確認
   - `testRun` を実行してログを確認
   - ログに「検索クエリ: ...」と表示されるので、条件を確認

2. ラベルを確認
   - Gmailで「請求書/処理済み」ラベルが付いているメールは再処理されません
   - テストする場合はラベルを外してください

### 権限エラー

1. Google Apps Scriptの「サービス」で Gmail API と Drive API が有効か確認
2. 再度 `testRun` を実行して権限を再付与

### トリガーが動作しない

1. 左サイドバーの「トリガー」でトリガーが正しく設定されているか確認
2. 「実行数」で最近の実行結果を確認
3. エラーがある場合は詳細を確認

### 同じファイルが保存されない

- 既に同じ名前のファイルが存在する場合はスキップされます
- ログに「⚠ スキップ（既存）: ...」と表示されます

## トリガーの削除

自動実行を停止したい場合:

1. 関数選択から `removeTrigger` を選択して実行、または
2. 左サイドバーの「トリガー」から該当トリガーの右側の「...」→「トリガーを削除」

## セキュリティに関する注意

- このスクリプトはあなたのGoogleアカウント内でのみ動作します
- Gmail と Google Drive へのアクセス権限が必要です
- スクリプトを共有する場合は、機密情報（フォルダIDなど）を削除してください

## ライセンス

このスクリプトは自由に使用・改変できます。

## サポート

問題が発生した場合は、Google Apps Scriptのドキュメントを参照してください:
- [Google Apps Script リファレンス](https://developers.google.com/apps-script/reference)
- [Gmail Service](https://developers.google.com/apps-script/reference/gmail)
- [Drive Service](https://developers.google.com/apps-script/reference/drive)
