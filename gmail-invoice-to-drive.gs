/**
 * Gmail請求書自動保存スクリプト
 * 件名に「請求書」または「Invoice」を含むメールのPDF添付ファイルを
 * Google Driveに自動保存します
 */

// ========== 設定 ==========
const CONFIG = {
  // Google DriveのフォルダID（空の場合はマイドライブのルートに保存）
  // フォルダIDの取得方法: Google Driveでフォルダを開いた時のURLの最後の部分
  // 例: https://drive.google.com/drive/folders/FOLDER_ID_HERE
  DRIVE_FOLDER_ID: "",

  // 検索キーワード（件名に含まれる文字列）
  SEARCH_KEYWORDS: ["請求書", "Invoice", "御請求書"],

  // 送信者のメールアドレス（空の配列の場合は送信者による絞り込みなし）
  // 例: ['billing@example.com', 'invoice@company.com']
  SENDER_EMAILS: [],

  // 処理済みラベル名
  PROCESSED_LABEL: "請求書/処理済み",

  // 検索対象期間（日数）- 過去何日分のメールを検索するか
  SEARCH_DAYS: 7,

  // 保存するファイル名の形式
  // {date}: 受信日 (YYYY-MM-DD)
  // {subject}: メール件名
  // {sender}: 送信者名
  // {original}: 元のファイル名
  FILE_NAME_FORMAT: "{date}_{original}",

  // さくらインターネット請求書のテキストファイル保存設定
  SAKURA: {
    // さくらインターネットからのメールアドレス（例: noreply@secure.sakura.ad.jp）
    SENDER_EMAIL: "noreply@secure.sakura.ad.jp",
    // テキストファイルとして保存するか
    SAVE_AS_TEXT: true,
    // テキストファイル名の形式
    // {date}: 受信日 (YYYY-MM-DD)
    // {subject}: メール件名
    // {sender}: 送信者名
    // {billno}: 請求書番号
    TEXT_FILE_NAME_FORMAT: "{date}_sakura_invoice_{billno}.txt",
  },
};

// ========== メイン関数 ==========
/**
 * メイン処理: 請求書メールを検索してPDFを保存
 * この関数をトリガーで定期実行します
 */
function saveInvoicesToDrive() {
  try {
    Logger.log("請求書保存処理を開始します...");

    // ラベルを取得または作成
    const processedLabel = getOrCreateLabel(CONFIG.PROCESSED_LABEL);

    // 保存先フォルダを取得
    const folder = CONFIG.DRIVE_FOLDER_ID
      ? DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID)
      : DriveApp.getRootFolder();

    Logger.log("保存先フォルダ: " + folder.getName());

    // 検索クエリを作成
    const searchQuery = buildSearchQuery();
    Logger.log("検索クエリ: " + searchQuery);

    // メールを検索
    const threads = GmailApp.search(searchQuery);
    Logger.log("見つかったスレッド数: " + threads.length);

    let totalSaved = 0;

    // 各スレッドを処理
    threads.forEach(function (thread) {
      const messages = thread.getMessages();

      messages.forEach(function (message) {
        // 既に処理済みかチェック
        if (isProcessed(message, processedLabel)) {
          Logger.log(
            "⏭ スキップ（処理済み）: " +
              message.getSubject() +
              " from " +
              message.getFrom(),
          );
          return; // スキップ
        }

        let savedCount = 0;

        // メール情報をログ出力
        const sender = message.getFrom();
        Logger.log("----------------------------------------");
        Logger.log("📧 メール処理中:");
        Logger.log("  件名: " + message.getSubject());
        Logger.log("  送信者: " + sender);
        Logger.log("  受信日: " + message.getDate());

        // さくらインターネットからのメールかチェック
        const isSakuraMail = sender.indexOf(CONFIG.SAKURA.SENDER_EMAIL) !== -1;
        Logger.log(
          "  さくらインターネット判定: " +
            (isSakuraMail ? "○ 該当" : "× 非該当"),
        );

        if (CONFIG.SAKURA.SAVE_AS_TEXT && isSakuraMail) {
          // さくらインターネット請求書をテキストファイルとして保存
          Logger.log("  → さくらインターネット請求書情報を抽出中...");
          const invoiceInfo = extractSakuraInvoiceInfo(message);

          if (invoiceInfo) {
            Logger.log("  → 抽出成功:");
            Logger.log("     会員ID: " + (invoiceInfo.memberId || "なし"));
            Logger.log("     請求書番号: " + invoiceInfo.billNo);
            Logger.log("     請求合計額: " + (invoiceInfo.amount || "なし"));

            if (saveSakuraInvoiceAsText(invoiceInfo, folder)) {
              savedCount++;
              Logger.log(
                "✓ さくらインターネット請求書を保存: 請求書番号 " +
                  invoiceInfo.billNo,
              );
            }
          } else {
            Logger.log("  ⚠ 請求書情報の抽出に失敗しました");
          }
        }

        // PDF添付ファイルを保存
        savedCount += savePdfAttachments(message, folder);

        if (savedCount > 0) {
          // 処理済みラベルを付ける
          message.getThread().addLabel(processedLabel);
          totalSaved += savedCount;
          Logger.log(
            "✓ 保存完了: " + message.getSubject() + " (" + savedCount + "件)",
          );
        }
      });
    });

    Logger.log("========================================");
    Logger.log("処理完了: " + totalSaved + "個のPDFを保存しました");
    Logger.log("========================================");
  } catch (error) {
    Logger.log("エラーが発生しました: " + error.toString());
    // エラーを自分にメール通知（オプション）
    // MailApp.sendEmail(Session.getActiveUser().getEmail(),
    //   '請求書保存スクリプトエラー', error.toString());
  }
}

// ========== サブ関数 ==========

/**
 * 検索クエリを構築
 */
function buildSearchQuery() {
  const keywordQuery = CONFIG.SEARCH_KEYWORDS.map(
    (keyword) => 'subject:"' + keyword + '"',
  ).join(" OR ");

  const dateQuery = "newer_than:" + CONFIG.SEARCH_DAYS + "d";
  const hasAttachment = "has:attachment";
  const notProcessed = "-label:" + CONFIG.PROCESSED_LABEL.replace("/", "-");

  let query =
    "(" +
    keywordQuery +
    ") " +
    hasAttachment +
    " " +
    dateQuery +
    " " +
    notProcessed;

  // 送信者の条件を追加（配列が空でない場合）
  if (CONFIG.SENDER_EMAILS && CONFIG.SENDER_EMAILS.length > 0) {
    const senderQuery = CONFIG.SENDER_EMAILS.map(
      (email) => "from:" + email,
    ).join(" OR ");
    query += " (" + senderQuery + ")";
  }

  return query;
}

/**
 * ラベルを取得または作成
 */
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);

  if (!label) {
    label = GmailApp.createLabel(labelName);
    Logger.log("ラベルを作成しました: " + labelName);
  }

  return label;
}

/**
 * メッセージが既に処理済みかチェック
 */
function isProcessed(message, processedLabel) {
  const labels = message.getThread().getLabels();
  return labels.some(function (label) {
    return label.getName() === processedLabel.getName();
  });
}

/**
 * PDF添付ファイルを保存
 */
function savePdfAttachments(message, folder) {
  const attachments = message.getAttachments();
  let savedCount = 0;

  attachments.forEach(function (attachment) {
    // PDFファイルのみ処理
    if (
      attachment.getContentType() === "application/pdf" ||
      attachment.getName().toLowerCase().endsWith(".pdf")
    ) {
      const fileName = generateFileName(message, attachment);

      // 既に同じ名前のファイルが存在するかチェック
      const existingFiles = folder.getFilesByName(fileName);
      if (existingFiles.hasNext()) {
        Logger.log("⚠ スキップ（既存）: " + fileName);
        return;
      }

      // ファイルを保存
      const file = folder.createFile(attachment);
      file.setName(fileName);

      savedCount++;
      Logger.log("  → 保存: " + fileName);
    }
  });

  return savedCount;
}

/**
 * ファイル名を生成
 */
function generateFileName(message, attachment) {
  const date = Utilities.formatDate(
    message.getDate(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd",
  );
  const subject = message.getSubject().replace(/[\\/:*?"<>|]/g, "_"); // 無効な文字を置換
  const sender = message
    .getFrom()
    .replace(/[<>]/g, "")
    .split("@")[0]
    .replace(/[\\/:*?"<>|]/g, "_");
  const originalName = attachment.getName().replace(/\.pdf$/i, "");

  let fileName = CONFIG.FILE_NAME_FORMAT.replace("{date}", date)
    .replace("{subject}", subject)
    .replace("{sender}", sender)
    .replace("{original}", originalName);

  // PDFが拡張子に含まれていない場合は追加
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    fileName += ".pdf";
  }

  return fileName;
}

// ========== さくらインターネット請求書処理 ==========

/**
 * さくらインターネットのメール本文から請求書情報を抽出
 * @param {GmailMessage} message - Gmailメッセージオブジェクト
 * @return {Object|null} 抽出した請求書情報、または抽出失敗時はnull
 */
function extractSakuraInvoiceInfo(message) {
  try {
    const body = message.getPlainBody();

    // 会員IDを抽出
    const memberIdMatch = body.match(/会員ID\s*[:：]\s*([a-zA-Z0-9]+)/);
    const memberId = memberIdMatch ? memberIdMatch[1] : null;

    // 請求書番号を抽出
    const billNoMatch = body.match(/請求書番号\s*[:：]\s*(\d+)/);
    const billNo = billNoMatch ? billNoMatch[1] : null;

    // 請求合計額を抽出
    const amountMatch = body.match(/請求合計額\s*[:：]\s*([\d,]+)\s*円/);
    const amount = amountMatch ? amountMatch[1] : null;

    // 必須情報が揃っているかチェック
    if (!billNo) {
      Logger.log("⚠ さくらインターネット請求書番号が見つかりませんでした");
      return null;
    }

    return {
      memberId: memberId,
      billNo: billNo,
      amount: amount,
      date: Utilities.formatDate(
        message.getDate(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd",
      ),
      subject: message.getSubject(),
      body: body,
    };
  } catch (error) {
    Logger.log(
      "さくらインターネット請求書情報の抽出エラー: " + error.toString(),
    );
    return null;
  }
}

/**
 * さくらインターネット請求書情報をテキストファイルとして保存
 * @param {Object} invoiceInfo - extractSakuraInvoiceInfo関数で抽出した請求書情報
 * @param {Folder} folder - 保存先フォルダ
 * @return {boolean} 保存成功時はtrue、失敗時はfalse
 */
function saveSakuraInvoiceAsText(invoiceInfo, folder) {
  try {
    // ファイル名を生成
    const subject = invoiceInfo.subject.replace(/[\\/:*?"<>|]/g, "_"); // 無効な文字を置換
    const sender = "sakura"; // さくらインターネット固定

    let fileName = CONFIG.SAKURA.TEXT_FILE_NAME_FORMAT.replace(
      "{date}",
      invoiceInfo.date,
    )
      .replace("{subject}", subject)
      .replace("{sender}", sender)
      .replace("{billno}", invoiceInfo.billNo);

    // .txtが拡張子に含まれていない場合は追加
    if (!fileName.toLowerCase().endsWith(".txt")) {
      fileName += ".txt";
    }

    // 既に同じ名前のファイルが存在するかチェック
    const existingFiles = folder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      Logger.log("⚠ スキップ（既存）: " + fileName);
      return false;
    }

    // テキストファイル内容を生成
    const content =
      "さくらインターネット請求書\n" +
      "================================\n" +
      "\n" +
      "受信日: " +
      invoiceInfo.date +
      "\n" +
      "件名: " +
      invoiceInfo.subject +
      "\n" +
      "\n" +
      "--------------------------------\n" +
      "請求書情報\n" +
      "--------------------------------\n" +
      (invoiceInfo.memberId ? "会員ID: " + invoiceInfo.memberId + "\n" : "") +
      "請求書番号: " +
      invoiceInfo.billNo +
      "\n" +
      (invoiceInfo.amount
        ? "請求合計額: " + invoiceInfo.amount + " 円（消費税含）\n"
        : "") +
      "\n" +
      "--------------------------------\n" +
      "メール本文（全文）\n" +
      "--------------------------------\n" +
      invoiceInfo.body;

    // ファイルを作成して保存
    const file = folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
    Logger.log("  → 保存: " + fileName);

    return true;
  } catch (error) {
    Logger.log(
      "さくらインターネット請求書のテキストファイル保存エラー: " +
        error.toString(),
    );
    return false;
  }
}

// ========== セットアップ関数 ==========

/**
 * 初回セットアップ: トリガーを作成
 * この関数を一度だけ手動実行してください
 */
function setupTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "saveInvoicesToDrive") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 新しいトリガーを作成（毎日午前9時に実行）
  ScriptApp.newTrigger("saveInvoicesToDrive")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  Logger.log("トリガーを作成しました: 毎日午前9時に実行されます");

  // または1時間ごとに実行したい場合は以下をコメント解除
  // ScriptApp.newTrigger('saveInvoicesToDrive')
  //   .timeBased()
  //   .everyHours(1)
  //   .create();
}

/**
 * トリガーを削除
 */
function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "saveInvoicesToDrive") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log("トリガーを削除しました");
}

/**
 * テスト実行: 最新の請求書メール1件を処理
 */
function testRun() {
  Logger.log("=== テスト実行 ===");
  CONFIG.SEARCH_DAYS = 30; // テスト用に30日分検索
  saveInvoicesToDrive();
}
