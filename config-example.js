/**
 * 設定例ファイル
 * このファイルの内容をスクリプトのCONFIGセクションにコピーして使用してください
 */

// ========== 基本設定（デフォルト） ==========
const CONFIG_BASIC = {
  DRIVE_FOLDER_ID: '',  // マイドライブのルートに保存
  SEARCH_KEYWORDS: ['請求書', 'Invoice', '御請求書'],
  PROCESSED_LABEL: '請求書/処理済み',
  SEARCH_DAYS: 7,
  FILE_NAME_FORMAT: '{date}_{original}'
};

// ========== 設定例1: 特定フォルダに日付+件名で保存 ==========
const CONFIG_EXAMPLE1 = {
  DRIVE_FOLDER_ID: '1a2b3c4d5e6f7g8h9i0j',  // ← 実際のフォルダIDに変更
  SEARCH_KEYWORDS: ['請求書', 'Invoice'],
  PROCESSED_LABEL: '請求書/処理済み',
  SEARCH_DAYS: 7,
  FILE_NAME_FORMAT: '{date}_{subject}'  // 例: 2024-01-15_クラウドサービス請求書.pdf
};

// ========== 設定例2: 特定の送信元からのみ処理 ==========
const CONFIG_EXAMPLE2 = {
  DRIVE_FOLDER_ID: '1a2b3c4d5e6f7g8h9i0j',
  SEARCH_KEYWORDS: ['from:billing@example.com', 'from:invoice@company.co.jp'],
  PROCESSED_LABEL: '請求書/処理済み',
  SEARCH_DAYS: 30,  // 過去30日分
  FILE_NAME_FORMAT: '{sender}_{date}_{original}'  // 例: billing_2024-01-15_invoice.pdf
};

// ========== 設定例3: 月次処理用（長期間対応） ==========
const CONFIG_EXAMPLE3 = {
  DRIVE_FOLDER_ID: '1a2b3c4d5e6f7g8h9i0j',
  SEARCH_KEYWORDS: ['請求書', 'Invoice', '明細書', 'Statement'],
  PROCESSED_LABEL: '経理/処理済み',
  SEARCH_DAYS: 31,  // 1ヶ月分
  FILE_NAME_FORMAT: '{date}_{sender}_{original}'  // 例: 2024-01-15_company_invoice.pdf
};

// ========== 設定例4: シンプル（日付のみ） ==========
const CONFIG_EXAMPLE4 = {
  DRIVE_FOLDER_ID: '',
  SEARCH_KEYWORDS: ['請求書'],
  PROCESSED_LABEL: '処理済み',
  SEARCH_DAYS: 7,
  FILE_NAME_FORMAT: '{date}'  // 例: 2024-01-15.pdf（同日複数ある場合は注意）
};

// ========== 設定例5: 詳細なファイル名 ==========
const CONFIG_EXAMPLE5 = {
  DRIVE_FOLDER_ID: '1a2b3c4d5e6f7g8h9i0j',
  SEARCH_KEYWORDS: ['請求書', 'Invoice'],
  PROCESSED_LABEL: '請求書/自動保存済み',
  SEARCH_DAYS: 14,
  FILE_NAME_FORMAT: '{date}_{sender}_{subject}'  // 例: 2024-01-15_company_1月分請求書.pdf
};

/*
使い方:
1. 上記の設定例から好みのものを選ぶ、または自分でカスタマイズ
2. gmail-invoice-to-drive.gs ファイルの CONFIG セクションに貼り付け
3. DRIVE_FOLDER_ID を実際のフォルダIDに変更
4. 必要に応じて他の項目も調整

ファイル名フォーマットで使える変数:
- {date}     : メール受信日 (YYYY-MM-DD 形式)
- {subject}  : メールの件名
- {sender}   : 送信者名（@より前の部分）
- {original} : 添付ファイルの元のファイル名（拡張子なし）

検索キーワードのヒント:
- 件名検索: ['請求書', 'Invoice']
- 送信者検索: ['from:billing@example.com']
- 複合条件: ['請求書 from:example.com']
- Gmail検索演算子が使えます: https://support.google.com/mail/answer/7190
*/
