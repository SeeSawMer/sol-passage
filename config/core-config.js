/**
 * Sol Passage - Core Config
 *
 * 公開可能な一般名称・空の既定値のみを保持する。
 * 校内固有の情報（外部サービスURL、学校向け表示文言等）は一切含まない。
 *
 * school-config.js が読み込まれない場合でも、この既定値だけで
 * index.html + app.js が安全に起動できる（ランキング・外部教材リンクは
 * 無効化された状態で、診断・演習・Knowledge・Learning Card・Tech Story・
 * 端末内の学習履歴はすべて通常どおり動作する）。
 *
 * school-config.js を後から読み込む場合は、このファイルの値を
 * 上書きする形で使用する（core-config.js → school-config.js の順で読み込むこと）。
 */
window.SOL_PASSAGE_CONFIG = {
  mode: "core",
  siteName: "Sol Passage",
  siteSubtitle: "情報Ⅰ 学習ナビ",
  editionLabel: "",
  footerText: "Sol Passage",

  features: {
    ranking: false,          // 全体ランキング機能（APIが無いと個人記録のみ表示）
    externalResources: false, // 外部教材リンク（Life is Tech!等）の表示
    schoolContent: false,     // 校内固有コンテンツの拡張（将来用の予約フラグ）
    workspaceAuth: false      // Google Workspace認証（今回は未実装、常にfalse）
  },

  ranking: {
    apiUrl: "" // 空の場合、全体ランキングは取得・送信されず、端末内の個人記録のみ表示される
  },

  externalResources: {},      // 空の場合、外部教材リンクのパネルは一切表示されない
  externalResourceLinks: {}   // knowledgeId → externalResourcesのキー配列 の対応表
};
