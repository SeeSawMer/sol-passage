/**
 * Sol Passage - School Extension Config（校内夏休み版）
 *
 * ここには校内固有の設定（外部サービスURL・学校向け表示文言等）のみを置く。
 * Core側のロジック・データ（問題・Knowledge・Learning Card・Tech Story・
 * 推薦ロジック・画面遷移等）には一切触れない。
 *
 * 必ず core-config.js の後に読み込むこと。
 * 公開版を作る際は、このファイルをリポジトリから外すだけでよい
 * （index.html・app.jsの変更は不要）。
 */
window.SOL_PASSAGE_CONFIG = Object.assign({}, window.SOL_PASSAGE_CONFIG, {
  mode: "school",
  siteName: "Sol Passage",
  siteSubtitle: "情報Ⅰ＊学習プラットフォーム",
  editionLabel: "2026　Summer",
  footerText: "Sol Passage Public Preview 0.1",

  features: {
    ranking: true,
    externalResources: true,
    schoolContent: true,
    workspaceAuth: false // 今回は実装しない。将来Google Workspace認証を追加する際にtrueへ切り替える想定の予約項目
  },

  ranking: {
    // Google Apps Script（Code.gs）をWebアプリとしてデプロイした際に発行されるURL
    apiUrl: "https://script.google.com/macros/s/AKfycbzU1vBRTAn3ry0xZyr6YqPzbNgL_7hx5QRjCNYvD7KVCasfMSL3cwI3qG5pCufvas1Irw/exec"
  },

  externalResources: {
    lifeIsTechLogin: {
      id: "life-is-tech-login",
      label: "Life is Tech! にログイン",
      url: "", // 正式なログインURLが確定したらここに入力する（未入力の間は自動的に「準備中」表示になる）
      note: "学校から案内されたアカウントでログインしてください。",
      requiresLogin: true,
      active: true
    }
  },

  externalResourceLinks: {
    "binary-place-value": ["life-is-tech-login"],
    "binary-to-decimal": ["life-is-tech-login"],
    "decimal-to-binary": ["life-is-tech-login"],
    "bit-capacity": ["life-is-tech-login"],
    "binary-addition": ["life-is-tech-login"]
  }
});
