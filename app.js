/* ===================================================================
   CONFIG BRIDGE
   config/core-config.js（必須）と config/school-config.js（任意）が
   window.SOL_PASSAGE_CONFIG を設定してからこのファイルが読み込まれる想定。
   school-config.js が存在しない場合でも、CONFIGは core-config.js の
   既定値（空のranking/externalResources等）で安全に動作する。
=================================================================== */
const CONFIG = window.SOL_PASSAGE_CONFIG || {
  mode:'core', siteName:'Sol Passage', siteSubtitle:'情報Ⅰ 学習ナビ', editionLabel:'', footerText:'Sol Passage',
  features:{ ranking:false, externalResources:false, schoolContent:false, workspaceAuth:false },
  ranking:{ apiUrl:'' }, externalResources:{}, externalResourceLinks:{}
};

/* ===================================================================
   DATA LAYER（モック / v1.0）
   今回追加：LEARNING_ROUTES（知識項目ごとの段階別ルート設定を問題データから分離）、
   getQuestionCoverage()（管理者向け・整備状況の集計、生徒画面には未表示）、
   段階昇格に必要な正解数（REQUIRED_CORRECT_PER_STAGE）を用いた判定。
=================================================================== */

const categories = {
  design:{label:'情報デザイン', icon:'🎨'},
  algo:{label:'アルゴリズム', icon:'🧮'},
  network:{label:'ネットワーク', icon:'🌐'},
  data:{label:'データの活用', icon:'📊'}
};

const STAGE_ORDER = ['basic','application','common-test-mini','integrated'];
const LEVEL_LABELS = { basic:'基礎', application:'応用', 'common-test-mini':'共通テスト形式', integrated:'総合' };

/* 段階を上げるために必要な「異なる問題での正解数」。モック確認用に定数で調整可能。 */
const REQUIRED_CORRECT_PER_STAGE = 2;
/* 知識項目ごとに必要正解数を上書きしたい場合はここに追加する（今は上書きなし＝全項目共通） */
const ROUTE_OVERRIDES = {};

const KNOWLEDGE_ITEMS = {
  'universal-design': {id:'universal-design', category:'design', term:'ユニバーサルデザイン', shortDescription:'年齢や障がいの有無に関わらず、誰もが使いやすいように設計する考え方', keyPoint:'「誰にとっても使いやすいか」という視点で設計を考える', commonMistake:'バリアフリーと全く同じ意味だと思ってしまう（似ているが視点が異なる）', example:'自動ドアや、案内用のピクトグラム', whereUsed:'案内表示、券売機、自動ドア、Webサイトの音声読み上げ機能など', miniColumn:'空港の案内表示が絵とローマ字と日本語を併記しているのも、ユニバーサルデザインの工夫のひとつです。', takeaway:'誰にでも使いやすい設計', relatedIds:['info-design'], prerequisiteIds:[], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'info-design': {id:'info-design', category:'design', term:'情報デザイン', shortDescription:'情報をわかりやすく整理し、伝える表現方法を考える分野', relatedIds:['universal-design'], prerequisiteIds:[], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},

  'algorithm': {id:'algorithm', category:'algo', term:'アルゴリズム', shortDescription:'問題を解決するための手順を明確に表したもの', keyPoint:'「手順」であり、プログラムそのものとは区別する', commonMistake:'プログラムと同じ意味だと思ってしまう（アルゴリズムは手順、プログラムはその実装）', example:'料理のレシピのような「手順」', whereUsed:'カーナビの経路探索、ゲームのCPU思考、検索エンジンの結果表示など', miniColumn:'カーナビが最短ルートを一瞬で出すのも、裏側で経路探索のアルゴリズムが動いているからです。', takeaway:'手順を明確に表したもの', relatedIds:['complexity','flowchart'], prerequisiteIds:[], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'complexity': {id:'complexity', category:'algo', term:'計算量', shortDescription:'処理にかかるステップ数の目安。O記法で表される', keyPoint:'データが増えたときの処理時間の「増え方」を表す指標', commonMistake:'計算量が小さい＝プログラムが短いことだと誤解する（実際は処理の効率の指標）', example:'二分探索はO(log n)で効率がよい', whereUsed:'大量データを扱う検索エンジンやアプリの動作速度に直結', miniColumn:'アプリの「読み込みが速い/遅い」の差は、裏側のアルゴリズムの計算量の違いによることがあります。', takeaway:'計算量は処理効率の目安', relatedIds:['binary-search','sort'], prerequisiteIds:['algorithm'], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'binary-search': {id:'binary-search', category:'algo', term:'二分探索', shortDescription:'探索範囲を半分ずつ絞り込んで効率よく探索する方法', keyPoint:'データがあらかじめ並んでいることが前提になる', commonMistake:'データが並んでいなくても使えると思ってしまう', example:'辞書で言葉を探すときのイメージ', whereUsed:'辞書アプリの検索、ソート済みデータからの高速検索など', miniColumn:'分厚い辞書を端から探さず、真ん中から絞り込んでいく探し方が、まさに二分探索の考え方です。', takeaway:'半分ずつ絞り込む探し方', relatedIds:['complexity'], prerequisiteIds:['complexity'], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'flowchart': {id:'flowchart', category:'algo', term:'フローチャート', shortDescription:'処理の流れを図で表したもの', relatedIds:['branch','iteration'], prerequisiteIds:['algorithm'], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'branch': {id:'branch', category:'algo', term:'分岐', shortDescription:'条件に応じて実行する処理を切り替える構造', relatedIds:['iteration'], prerequisiteIds:['algorithm'], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'iteration': {id:'iteration', category:'algo', term:'反復', shortDescription:'同じ処理を繰り返す構造', relatedIds:['branch'], prerequisiteIds:['algorithm'], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'sort': {id:'sort', category:'algo', term:'ソート', shortDescription:'データを一定の順序に並べ替える処理', relatedIds:['complexity'], prerequisiteIds:['complexity'], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},

  'ip-address': {id:'ip-address', category:'network', term:'IPアドレス', shortDescription:'ネットワーク上で機器を識別するための番号', keyPoint:'機器ごとに割り振られる「住所」のようなもの', commonMistake:'IPアドレスとドメイン名（URLの文字列部分）を同じものだと思ってしまう', example:'192.168.1.1のような形式', whereUsed:'スマホやPCがWi-Fiに繋がるとき、すべての通信の基礎として', miniColumn:'同じWi-Fiに繋がっている家族のスマホにも、それぞれ別のIPアドレスが割り当てられています。', takeaway:'ネット上の機器の住所', relatedIds:['dns','url'], prerequisiteIds:[], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'domain-name': {id:'domain-name', category:'network', term:'ドメイン名', shortDescription:'IPアドレスの代わりに使われる、人が覚えやすい名前', relatedIds:['dns','url'], prerequisiteIds:[], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'dns': {id:'dns', category:'network', term:'DNS', shortDescription:'ドメイン名をIPアドレスに変換する仕組み', keyPoint:'ドメイン名⇄IPアドレスの「変換」を行う仕組み', commonMistake:'DNS自体がWebページのデータを保存していると誤解する', example:'example.jpと入力すると、対応するIPアドレスに変換されてアクセスする', whereUsed:'Google検索、YouTube、Google Classroomなどを開くとき', miniColumn:'学校のWi-Fiだけ繋がらないのに、スマホの4Gでは開ける。DNSサーバーの不調が原因かもしれません。', takeaway:'DNSはインターネットの電話帳', relatedIds:['ip-address','domain-name'], prerequisiteIds:['ip-address','domain-name'], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'url': {id:'url', category:'network', term:'URL', shortDescription:'インターネット上の情報の場所を示す文字列', keyPoint:'ドメイン名を含む、より広い概念', commonMistake:'URLとドメイン名を同じ意味だと思ってしまう', example:'https://example.jp/page のうちexample.jpがドメイン名', whereUsed:'ブラウザのアドレスバーに表示される文字列そのもの', miniColumn:'友達にWebページを共有するとき送っているリンクは、すべてURLです。', takeaway:'情報の住所を示す文字列', relatedIds:['dns','domain-name'], prerequisiteIds:['domain-name'], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'http': {id:'http', category:'network', term:'HTTP', shortDescription:'Webページをやり取りするための通信の約束事', keyPoint:'ブラウザとサーバーの間の「通信ルール」', commonMistake:'HTTPとHTMLを混同してしまう（HTTPは通信規約、HTMLはページの記述言語）', example:'ブラウザがサーバーにページを要求するときに使われる', whereUsed:'ブラウザでWebページを見るとき全般', miniColumn:'鍵マークのないサイトでパスワードを入力するのは避けた方がよいのは、HTTP（暗号化なし）だからです。', takeaway:'Webページをやり取りする約束事', relatedIds:['url','dns'], prerequisiteIds:['url'], commonTestPriority:3, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'encryption': {id:'encryption', category:'network', term:'暗号化', shortDescription:'通信内容を第三者に読み取られないようにする技術', keyPoint:'内容を第三者に読めない形に変換する技術', commonMistake:'暗号化すれば情報漏洩を完全に防げると思い込む（パスワード管理なども別途必要）', example:'https通信では内容が暗号化される', whereUsed:'LINE、ネットショッピング、オンラインバンキングなど', miniColumn:'LINEのトーク内容が途中で盗み見られにくいのも、暗号化の仕組みのおかげです。', takeaway:'内容を第三者に読ませない技術', relatedIds:['http'], prerequisiteIds:[], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'wifi': {id:'wifi', category:'network', term:'Wi-Fi', shortDescription:'ケーブルを使わずに機器をネットワークに接続する無線通信の規格', relatedIds:['ip-address'], prerequisiteIds:[], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},

  'histogram': {id:'histogram', category:'data', term:'ヒストグラム', shortDescription:'データの分布（散らばり方）を棒の高さで表すグラフ', keyPoint:'連続した数値を「範囲」で区切って集計する', commonMistake:'棒グラフと同じものだと思ってしまう（ヒストグラムは数値の範囲を区切って表す）', example:'テストの点数を10点刻みで集計して表す', whereUsed:'テストの得点分布、アンケート結果の集計など', miniColumn:'「平均点は60点」だけでは分からない得点のばらつきが、ヒストグラムを見ると一目で分かります。', takeaway:'データの散らばりを見るグラフ', relatedIds:['scatter'], prerequisiteIds:[], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'scatter': {id:'scatter', category:'data', term:'散布図', shortDescription:'2つの量的データの関係を点で表すグラフ', keyPoint:'2つのデータの「関係性」を点の集まりで見る', commonMistake:'相関関係と因果関係を同じものだと思ってしまう', example:'勉強時間とテストの点数の関係を確認する', whereUsed:'勉強時間と点数、身長と体重、気温と売上の関係を見るときなど', miniColumn:'「勉強時間が長い人ほど点数が高い」のような傾向は、散布図にすると点の並び方で見えてきます。', takeaway:'散布図は関係を見るグラフ', relatedIds:['histogram','stddev'], prerequisiteIds:[], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'stddev': {id:'stddev', category:'data', term:'標準偏差', shortDescription:'データの散らばり具合を数値で表したもの', relatedIds:['scatter'], prerequisiteIds:['scatter'], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'data-utilization': {id:'data-utilization', category:'data', term:'データの活用', shortDescription:'大量のデータを分析し、規則性や傾向を見つけて役立てること', relatedIds:['histogram','scatter'], prerequisiteIds:['histogram','scatter'], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},

  /* 2進数関連：binary-numberを5項目に分割 */
  'binary-place-value': {id:'binary-place-value', category:'data', term:'2進数の位取り', shortDescription:'2進数の各桁が2の何乗の位を表すかという考え方', keyPoint:'右から2の0乗、2の1乗、2の2乗…の位を表す', commonMistake:'一番左の桁を「1の位」だと思い込んでしまう', example:'4桁の2進数なら、左端は2の3乗＝8の位', whereUsed:'コンピュータ内部のあらゆる数値表現の土台', miniColumn:'普段10進数で考えている私たちにとって、2進数の位取りは少し違う「桁の考え方」に感じられます。', takeaway:'各桁は2の何乗かを表す', relatedIds:['binary-to-decimal','bit-capacity'], prerequisiteIds:[], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'binary-to-decimal': {id:'binary-to-decimal', category:'data', term:'2進数から10進数への変換', shortDescription:'2進数で表された数を10進数に変換する方法', keyPoint:'各桁の値（0/1）と位の重みをかけて足し合わせる', commonMistake:'0の桁も律儀に計算に含めてしまい、位がずれる', example:'1011→8+0+2+1＝11', whereUsed:'センサーの記録値、機器の設定値などを人が読むとき', miniColumn:'家電の内部では2進数で処理された値を、表示のときだけ10進数に変換して見せています。', takeaway:'各桁×位の重みを足す', relatedIds:['binary-place-value','decimal-to-binary'], prerequisiteIds:['binary-place-value'], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'decimal-to-binary': {id:'decimal-to-binary', category:'data', term:'10進数から2進数への変換', shortDescription:'10進数で表された数を2進数に変換する方法', keyPoint:'大きい位から順に、引けるかどうかを確認して1/0を決める', commonMistake:'2で割った余りを逆順に並べるのを忘れる', example:'13→8+4+1なので1101', whereUsed:'私たちが入力した数値をコンピュータが処理するとき', miniColumn:'私たちが「13」と入力しても、コンピュータの中では1101として処理されています。', takeaway:'大きい位から順に割り当てる', relatedIds:['binary-to-decimal'], prerequisiteIds:['binary-to-decimal'], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'bit-capacity': {id:'bit-capacity', category:'data', term:'ビット数と表現できる数', shortDescription:'ビット数によって表現できる値の範囲や個数が決まるという考え方', keyPoint:'nビットで表現できる値は2のn乗通り', commonMistake:'表現できる「最大値」と「通り数」を混同する（4ビットの最大値は15、通り数は16）', example:'4ビットなら0〜15の16通り', whereUsed:'画像の色数、IPアドレスの個数などあらゆる「表現できる数」の限界', miniColumn:'IPv4アドレスがいつか足りなくなると言われるのも、ビット数で表現できる数に限りがあるからです。', takeaway:'nビットで2のn乗通り表せる', relatedIds:['binary-place-value','binary-to-decimal'], prerequisiteIds:['binary-place-value'], commonTestPriority:2, internalMappings:{textbook:[], commonTest:[], certifications:[]}},
  'binary-addition': {id:'binary-addition', category:'data', term:'2進数の加算', shortDescription:'2進数どうしを足し算する方法', keyPoint:'1の位から順に足し、繰り上がりを次の位へ送る', commonMistake:'繰り上がりを忘れて桁がずれる', example:'0011+0101＝1000', whereUsed:'コンピュータ内部の計算処理全般の基礎', miniColumn:'複雑な計算も、コンピュータの中では最終的に2進数の足し算の積み重ねに分解されています。', takeaway:'繰り上がりを次の位へ送る', relatedIds:['binary-to-decimal'], prerequisiteIds:['binary-to-decimal'], commonTestPriority:1, internalMappings:{textbook:[], commonTest:[], certifications:[]}}
};

/* 問題データ */
const QUESTION_BANK = {
  design:[
    {id:'d1', category:'design', knowledgeIds:['info-design'], prerequisiteIds:[], relatedKnowledgeIds:['universal-design'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'配色において、情報の階層を示すために使う手法は？', choices:['コントラスト','トリミング','解像度変更','拡大縮小'], correct:0,
     explanation:'明暗や彩度の差（コントラスト）を使うと、重要な情報を目立たせたり階層を示したりできます。'},
    {id:'d2', category:'design', knowledgeIds:['universal-design'], prerequisiteIds:[], relatedKnowledgeIds:['info-design'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'誰にでも伝わりやすい図表を作る際に重要なことは？', choices:['色だけで区別する','文字を装飾する','色と形の両方で区別する','情報を減らさない'], correct:2,
     explanation:'色だけに頼ると、色の区別が難しい人に伝わらないことがあります。色と形の両方を使うと、より多くの人に伝わります。'},
    {id:'d3', category:'design', knowledgeIds:['universal-design'], prerequisiteIds:[], relatedKnowledgeIds:['info-design'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'多くの人にとって使いやすいデザインを目指す考え方は？', choices:['レスポンシブデザイン','ユニバーサルデザイン','フラットデザイン','マテリアルデザイン'], correct:1,
     explanation:'年齢や障がいの有無に関わらず、できるだけ多くの人が使えるように設計する考え方です。'},
    {id:'d4', category:'design', knowledgeIds:['info-design'], prerequisiteIds:[], relatedKnowledgeIds:[], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'情報を誤解なく伝えるために意識すべきことは？', choices:['装飾を増やす','情報を詰め込む','シンプルに整理する','専門用語を多用する'], correct:2,
     explanation:'情報を詰め込みすぎると伝わりにくくなります。要点を絞ってシンプルに整理することが大切です。'},
    {id:'d5', category:'design', knowledgeIds:['info-design'], prerequisiteIds:[], relatedKnowledgeIds:['histogram','scatter'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'グラフの種類を選ぶときに大切なことは？', choices:['見た目が派手なものを選ぶ','伝えたい内容に合わせて選ぶ','色数を増やす','データを全て使う'], correct:1,
     explanation:'割合を伝えたいなら円グラフ、分布を伝えたいならヒストグラムなど、目的に合わせてグラフを選びます。'},
    {id:'d6', category:'design', knowledgeIds:['universal-design'], prerequisiteIds:[], relatedKnowledgeIds:['info-design'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'ピクトグラム（案内用の絵記号）の役割は？', choices:['装飾のため','言語に関係なく意味を伝える','ファイルサイズを減らす','印刷を楽にする'], correct:1,
     explanation:'ピクトグラムは絵記号のような表現で、言語が異なっても意味が伝わりやすいという特徴があります。'}
  ],
  algo:[
    {id:'a1', category:'algo', knowledgeIds:['complexity'], prerequisiteIds:['algorithm'], relatedKnowledgeIds:['binary-search','sort'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'アルゴリズムの良し悪しを比較する指標は？', choices:['見た目の美しさ','計算量','使用言語','ファイル名'], correct:1,
     explanation:'処理にかかるステップ数の目安を計算量といい、O記法で表されます。'},
    {id:'a2', category:'algo', knowledgeIds:['iteration'], prerequisiteIds:['algorithm'], relatedKnowledgeIds:['branch'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'同じ処理を繰り返すプログラムの構造は？', choices:['分岐','逐次','反復','例外処理'], correct:2,
     explanation:'同じ処理を繰り返す構造を反復（ループ）といいます。プログラムの基本構造の一つです。'},
    {id:'a3', category:'algo', knowledgeIds:['binary-search'], prerequisiteIds:['complexity'], relatedKnowledgeIds:['complexity'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'探索アルゴリズムで、要素数nに対して計算量がO(log n)になるのは？', choices:['線形探索','二分探索','バブルソート','選択ソート'], correct:1,
     explanation:'二分探索は探索範囲を半分ずつ絞り込むため、要素数が増えても効率よく探索できます。'},
    {id:'a4', category:'algo', knowledgeIds:['branch'], prerequisiteIds:['algorithm'], relatedKnowledgeIds:['iteration'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'条件によって処理を切り替えるプログラムの構造は？', choices:['逐次','分岐','反復','例外処理'], correct:1,
     explanation:'条件に応じて実行する処理を切り替える構造を分岐といいます。'},
    {id:'a5', category:'algo', knowledgeIds:['sort'], prerequisiteIds:['complexity'], relatedKnowledgeIds:['complexity'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'データを一定の順序に並べ替える処理の目的は？', choices:['データを探しやすくする','データを暗号化する','データを削除する','データを圧縮する'], correct:0,
     explanation:'昇順・降順に並べ替える（ソートする）と、後の検索や処理がしやすくなります。'},
    {id:'a6', category:'algo', knowledgeIds:['flowchart'], prerequisiteIds:['algorithm'], relatedKnowledgeIds:['branch','iteration'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'処理の流れを図で表したものを何という？', choices:['フローチャート','ヒストグラム','データベース','プロトコル'], correct:0,
     explanation:'処理の流れを図で表したものをフローチャートといい、アルゴリズムを可視化するのに使われます。'},
    {id:'app-complexity', category:'algo', knowledgeIds:['complexity','binary-search'], prerequisiteIds:['algorithm'], relatedKnowledgeIds:['binary-search'], commonTestPriority:2,
     exerciseLevel:'application', questionType:'situational',
     stimulus:{text:'1万件のデータの中から目的のデータを探すプログラムを作ることになった。データはあらかじめ昇順に並んでいる。', table:null, image:null},
     q:'このとき、効率よく探索するために選ぶべき方法は？', choices:['先頭から1件ずつ確認する線形探索','範囲を半分ずつ絞り込む二分探索','データをすべてランダムに並べ替えてから探す','データを1件ずつ削除しながら探す'], correct:1,
     explanation:'データが並んでいる場合、二分探索を使うと探索範囲を半分ずつ絞り込めるため、線形探索より効率よく目的のデータを見つけられます。'},
    {id:'mini-complexity', category:'algo', knowledgeIds:['complexity'], prerequisiteIds:['algorithm'], relatedKnowledgeIds:['binary-search','sort'], commonTestPriority:2,
     exerciseLevel:'common-test-mini', questionType:'mini-passage',
     stimulus:{text:'あるプログラムは、データの数が2倍になると、処理にかかるステップ数もおよそ2倍になる。別のプログラムは、データの数が2倍になっても、処理にかかるステップ数はわずかしか増えない。', table:null, image:null},
     q:'一般的に、大量のデータを扱う場合に効率が良いといえるのは？', choices:['データの数が2倍になってもステップ数がわずかしか増えないプログラム','データの数が2倍になるとステップ数も2倍になるプログラム','どちらも同じ効率である','データの数とステップ数は関係がない'], correct:0,
     explanation:'計算量が小さい（データが増えてもステップ数の増加が緩やかな）アルゴリズムほど、大量のデータを扱う際に効率がよいといえます。'},
    {id:'int-algo', category:'algo', knowledgeIds:['complexity','binary-search','sort'], prerequisiteIds:['algorithm'], relatedKnowledgeIds:['complexity'], commonTestPriority:2,
     exerciseLevel:'integrated', questionType:'combined',
     stimulus:{text:'大量のデータの中から特定のデータを何度も検索するプログラムを作ることになった。データは検索のたびに変化しない。', table:null, image:null},
     q:'効率よく検索を行うための工夫として最も適切なものは？', choices:['あらかじめデータをソートしておき、二分探索で検索する','検索のたびにデータをランダムに並べ替える','データを1件ずつ手作業で確認する','検索のたびにすべてのデータを削除して作り直す'], correct:0,
     explanation:'あらかじめデータをソート（並べ替え）しておくことで二分探索が使えるようになり、検索を効率化できます。ソートと探索の組み合わせが計算量の削減につながります。'}
  ],
  network:[
    {id:'n1', category:'network', knowledgeIds:['http'], prerequisiteIds:['url'], relatedKnowledgeIds:['url','dns'], commonTestPriority:3,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'Webページを閲覧する際に主に使われるプロトコルは？', choices:['SMTP','FTP','HTTP','DNS'], correct:2,
     explanation:'Webブラウザとサーバーがページ情報をやり取りする際の通信規約（プロトコル）がHTTPです。'},
    {id:'n2', category:'network', knowledgeIds:['ip-address'], prerequisiteIds:[], relatedKnowledgeIds:['dns','url'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'IPアドレスの役割は？', choices:['機器を一意に識別する','データを暗号化する','画面を表示する','電力を供給する'], correct:0,
     explanation:'ネットワーク上の機器を識別するための番号がIPアドレスです。住所のような役割を果たします。'},
    {id:'n3', category:'network', knowledgeIds:['dns'], prerequisiteIds:['ip-address','domain-name'], relatedKnowledgeIds:['ip-address','domain-name'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'ドメイン名をIPアドレスに変換する仕組みは？', choices:['DNS','URL','HTTP','IPアドレス'], correct:0,
     explanation:'人が覚えやすいドメイン名を、機器が使うIPアドレスに変換する仕組みをDNSといいます。'},
    {id:'n4', category:'network', knowledgeIds:['encryption'], prerequisiteIds:[], relatedKnowledgeIds:['http'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'通信内容を第三者から守るための技術は？', choices:['HTML','暗号化','ピクセル','キャッシュ'], correct:1,
     explanation:'通信内容を第三者に読み取られないようにする技術を暗号化といいます。'},
    {id:'n5', category:'network', knowledgeIds:['url'], prerequisiteIds:['domain-name'], relatedKnowledgeIds:['dns','domain-name'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'インターネット上の情報の場所を示す文字列は？', choices:['URL','DNS','IPアドレス','HTTP'], correct:0,
     explanation:'インターネット上の情報の場所を示す文字列をURLといいます。'},
    {id:'n6', category:'network', knowledgeIds:['wifi'], prerequisiteIds:[], relatedKnowledgeIds:['ip-address'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'ケーブルなしで機器をネットワークに接続する無線通信の規格は？', choices:['Wi-Fi','USB','HDMI','SDカード'], correct:0,
     explanation:'ケーブルを使わずに機器をネットワークに接続する無線通信の規格をWi-Fiといいます。'},
    {id:'app-ip', category:'network', knowledgeIds:['ip-address'], prerequisiteIds:[], relatedKnowledgeIds:['dns','url'], commonTestPriority:2,
     exerciseLevel:'application', questionType:'situational',
     stimulus:{text:'家庭内のルーターには、複数の機器が接続されている。それぞれの機器を区別して通信するために、ルーターは各機器に固有の番号を割り当てている。', table:null, image:null},
     q:'このとき、各機器に割り当てられている固有の番号を何というか。', choices:['IPアドレス','パスワード','ファイル名','ポート名'], correct:0,
     explanation:'ネットワーク上の機器を識別するための番号がIPアドレスです。ルーターは接続された機器ごとにIPアドレスを割り当てて区別します。'},
    {id:'mini-ip', category:'network', knowledgeIds:['ip-address'], prerequisiteIds:[], relatedKnowledgeIds:['dns'], commonTestPriority:2,
     exerciseLevel:'common-test-mini', questionType:'mini-passage',
     stimulus:{text:'ある学校のネットワークでは、教室のPCに192.168.1.1から192.168.1.40までの番号が割り当てられている。', table:null, image:null},
     q:'この番号の並びが表しているものとして最も適切なものは？', choices:['それぞれのPCを識別するIPアドレス','PCのパスワード','ネットワークの回線速度','PCの購入日'], correct:0,
     explanation:'192.168.1.1のような形式の番号はIPアドレスであり、ネットワーク上の機器を一つずつ識別するために使われます。'},
    {id:'app-dns', category:'network', knowledgeIds:['dns'], prerequisiteIds:['ip-address','domain-name'], relatedKnowledgeIds:['ip-address','domain-name'], commonTestPriority:2,
     exerciseLevel:'application', questionType:'situational',
     stimulus:{text:'ブラウザにWebサイトのドメイン名を入力してアクセスしようとしたが、ページが表示されず、「サーバーが見つかりません」というエラーが出た。', table:null, image:null},
     q:'このエラーの原因として考えられることは？', choices:['ドメイン名をIPアドレスに変換する仕組みがうまく働いていない','キーボードの電池が切れている','画面の明るさが低すぎる','マウスが接続されていない'], correct:0,
     explanation:'ドメイン名をIPアドレスに変換する仕組みがDNSです。DNSがうまく機能しないと、ドメイン名を入力してもサーバーに接続できません。'},
    {id:'mini-dns', category:'network', knowledgeIds:['dns'], prerequisiteIds:['ip-address','domain-name'], relatedKnowledgeIds:['url'], commonTestPriority:2,
     exerciseLevel:'common-test-mini', questionType:'mini-passage',
     stimulus:{text:'表は、あるドメイン名とそれに対応するIPアドレスの一部である。', table:{headers:['ドメイン名','IPアドレス'], rows:[['example.jp','203.0.113.10'],['school.jp','203.0.113.25']]}, image:null},
     q:'この表のような対応関係を管理し、ドメイン名からIPアドレスへの変換を行う仕組みは？', choices:['DNS','HTTP','URL','Wi-Fi'], correct:0,
     explanation:'ドメイン名とIPアドレスの対応を管理し、変換を行う仕組みがDNSです。'},
    {id:'app-http', category:'network', knowledgeIds:['http'], prerequisiteIds:['url'], relatedKnowledgeIds:['encryption','url'], commonTestPriority:3,
     exerciseLevel:'application', questionType:'situational',
     stimulus:{text:'あるオンラインショップの支払いページのURLは「https://」から始まっていた。', table:null, image:null},
     q:'「https」の「s」が示していることとして最も適切なものは？', choices:['通信が暗号化されていること','ページの表示速度が速いこと','画像が多く使われていること','広告が表示されないこと'], correct:0,
     explanation:'HTTPS（HTTP＋暗号化）では通信内容が暗号化され、第三者に読み取られにくくなります。「s」はセキュア（secure）を表します。'},
    {id:'mini-http', category:'network', knowledgeIds:['http'], prerequisiteIds:['url'], relatedKnowledgeIds:['dns','url'], commonTestPriority:3,
     exerciseLevel:'common-test-mini', questionType:'mini-passage',
     stimulus:{text:'Webブラウザでページを表示するまでの流れを簡単に表すと、次のようになる。\n① ドメイン名をIPアドレスに変換する\n② サーバーにページの情報を要求する\n③ ページの情報を受け取り表示する', table:null, image:null},
     q:'②の「サーバーにページの情報を要求する」際に使われる通信の約束事は？', choices:['HTTP','DNS','IPアドレス','Wi-Fi'], correct:0,
     explanation:'Webブラウザとサーバーがページ情報をやり取りする際の通信規約がHTTPです。'},
    {id:'int-network', category:'network', knowledgeIds:['ip-address','dns','http','url'], prerequisiteIds:['ip-address','domain-name'], relatedKnowledgeIds:['dns','url','http'], commonTestPriority:3,
     exerciseLevel:'integrated', questionType:'combined',
     stimulus:{text:'ブラウザにWebサイトのURLを入力してからページが表示されるまでの流れを、次の4つの出来事に分けた。\nA. サーバーからページの情報が送られてくる\nB. ドメイン名がIPアドレスに変換される\nC. ブラウザにページが表示される\nD. サーバーにページの情報が要求される', table:null, image:null},
     q:'A〜Dを正しい順序に並べたものは？', choices:['B→D→A→C','D→B→A→C','B→A→D→C','D→A→B→C'], correct:0,
     explanation:'まずドメイン名がDNSによってIPアドレスに変換され（B）、そのIPアドレス宛にHTTPでページが要求され（D）、サーバーから情報が送られ（A）、最後にブラウザに表示されます（C）。'}
  ],
  data:[
    {id:'t1', category:'data', knowledgeIds:['histogram'], prerequisiteIds:[], relatedKnowledgeIds:['scatter'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'次のうち、データの分布を見るのに最も適したグラフは？', choices:['ヒストグラム','円グラフ','折れ線グラフ','散布図'], correct:0,
     explanation:'データがどの範囲に多く分布しているかを、棒の高さで表すグラフがヒストグラムです。'},
    {id:'t3', category:'data', knowledgeIds:['scatter'], prerequisiteIds:[], relatedKnowledgeIds:['histogram'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'2つの量的データの関係を調べるのに使うグラフは？', choices:['散布図','棒グラフ','円グラフ','ヒストグラム'], correct:0,
     explanation:'2つの量的データの関係性を点の集まりで表すグラフを散布図といいます。'},
    {id:'t4', category:'data', knowledgeIds:['stddev'], prerequisiteIds:['scatter'], relatedKnowledgeIds:['scatter'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'データのばらつきの大きさを示す指標は？', choices:['平均値','標準偏差','中央値','最頻値'], correct:1,
     explanation:'データの散らばり具合を数値で表したものが標準偏差です。値が大きいほどばらつきが大きいことを示します。'},
    {id:'t5', category:'data', knowledgeIds:['data-utilization'], prerequisiteIds:['histogram','scatter'], relatedKnowledgeIds:['histogram','scatter'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'大量のデータから規則性を見つけ出し役立てることの総称は？', choices:['データの活用','データ入力','データ削除','データ印刷'], correct:0,
     explanation:'大量のデータを分析し、規則性や傾向を見つけて役立てることをデータの活用といいます。'},
    {id:'t6', category:'data', knowledgeIds:['data-utilization'], prerequisiteIds:['histogram'], relatedKnowledgeIds:['histogram','scatter'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'グラフを作る際に注意すべきことは？', choices:['できるだけ派手にする','誤解を与えない表現にする','データを全部隠す','数値を丸めすぎる'], correct:1,
     explanation:'軸の範囲やグラフの種類によって印象が変わるため、誤解を与えないように表現することが大切です。'},
    {id:'app-histogram', category:'data', knowledgeIds:['histogram'], prerequisiteIds:[], relatedKnowledgeIds:['scatter'], commonTestPriority:2,
     exerciseLevel:'application', questionType:'situational',
     stimulus:{text:'あるクラスの小テストの得点を集計したところ、60点台の生徒が最も多く、点数が離れるほど人数が少なくなる傾向が見られた。', table:null, image:null},
     q:'このような得点の散らばり方を視覚的に確認するのに適したグラフは？', choices:['ヒストグラム','円グラフ','折れ線グラフ','ピクトグラム'], correct:0,
     explanation:'得点などのデータがどの範囲に多く集まっているかという分布を見るには、ヒストグラムが適しています。'},
    {id:'mini-histogram', category:'data', knowledgeIds:['histogram'], prerequisiteIds:[], relatedKnowledgeIds:['data-utilization'], commonTestPriority:2,
     exerciseLevel:'common-test-mini', questionType:'mini-passage',
     stimulus:{text:'表は、あるクラス40人の小テストの得点を10点ごとに区切って人数をまとめたものである。', table:{headers:['得点の範囲','人数'], rows:[['0〜19点','2人'],['20〜39点','5人'],['40〜59点','10人'],['60〜79点','15人'],['80〜100点','8人']]}, image:null},
     q:'この表の内容をグラフに表す場合、最も適切なグラフは？', choices:['ヒストグラム','円グラフ','散布図','ピクトグラム'], correct:0,
     explanation:'区切られた範囲ごとの人数（度数）を棒の高さで表すヒストグラムが、この表の内容を表すのに適しています。'},
    {id:'int-data', category:'data', knowledgeIds:['histogram','scatter','data-utilization'], prerequisiteIds:['histogram','scatter'], relatedKnowledgeIds:['histogram','scatter'], commonTestPriority:2,
     exerciseLevel:'integrated', questionType:'combined',
     stimulus:{text:'あるクラブの活動データを分析することになった。まず得点の分布を確認し、次に練習時間と得点の関係を確認し、最後にそれらをふまえて今後の練習方針を考えることにした。', table:null, image:null},
     q:'この分析の流れの中で、「得点の分布を確認する」段階と「練習時間と得点の関係を確認する」段階で、それぞれ使うのに適したグラフの組み合わせは？', choices:['ヒストグラムと散布図','円グラフと折れ線グラフ','散布図とヒストグラム','ピクトグラムと円グラフ'], correct:0,
     explanation:'分布を見るにはヒストグラム、2つの量の関係を見るには散布図が適しています。このように複数のグラフを目的に応じて使い分けることが、データの活用につながります。'},

    /* --- 2進数：位取り／10進変換／2進変換／ビット数／加算 --- */
    {id:'bpv-basic-1', category:'data', knowledgeIds:['binary-place-value'], prerequisiteIds:[], relatedKnowledgeIds:['binary-to-decimal'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'2進数の1101において、一番左の桁（最上位ビット）が表す10進数の値は？', choices:['1','2','4','8'], correct:3,
     explanation:'2進数の各桁は右から2の0乗、2の1乗、2の2乗…の位を表します。4桁目（左端）は2の3乗＝8の位です。'},

    {id:'t2', category:'data', knowledgeIds:['binary-to-decimal'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['binary-place-value'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'2進数の1011を10進数に変換すると？', choices:['9','11','13','15'], correct:1,
     explanation:'1011は、8の位が1、4の位が0、2の位が1、1の位が1なので、8+0+2+1=11になります。'},
    {id:'bd-basic-2', category:'data', knowledgeIds:['binary-to-decimal'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['binary-place-value'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'2進数の1100を10進数に変換すると？', choices:['10','12','14','16'], correct:1,
     explanation:'1100は、8の位が1、4の位が1、2の位が0、1の位が0なので、8+4=12になります。'},
    {id:'bd-basic-3', category:'data', knowledgeIds:['binary-to-decimal'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['binary-place-value'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'2進数の0111を10進数に変換すると？', choices:['5','6','7','8'], correct:2,
     explanation:'0111は、4の位が1、2の位が1、1の位が1なので、4+2+1=7になります。'},
    {id:'bd-app-1', category:'data', knowledgeIds:['binary-to-decimal'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['bit-capacity'], commonTestPriority:2,
     exerciseLevel:'application', questionType:'situational',
     stimulus:{text:'あるセンサーは、測定値を4ビットの2進数で記録している。記録された値が1011だった。', table:null, image:null},
     q:'この値を10進数で表すといくつか。', choices:['9','10','11','13'], correct:2,
     explanation:'1011を10進数に変換すると、8+0+2+1=11になります。'},
    {id:'bd-app-2', category:'data', knowledgeIds:['binary-to-decimal'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['bit-capacity'], commonTestPriority:2,
     exerciseLevel:'application', questionType:'situational',
     stimulus:{text:'ある照明のコントローラーは、明るさの設定を4ビットの2進数で管理している。現在の設定値は1001である。', table:null, image:null},
     q:'この設定値を10進数で表すといくつか。', choices:['7','8','9','10'], correct:2,
     explanation:'1001を10進数に変換すると、8+0+0+1=9になります。'},
    {id:'bd-mini-1', category:'data', knowledgeIds:['binary-to-decimal'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['binary-addition'], commonTestPriority:2,
     exerciseLevel:'common-test-mini', questionType:'mini-passage',
     stimulus:{text:'ある装置では、状態を4ビットの2進数で記録している。状態Aは1011、状態Bは0110である。', table:null, image:null},
     q:'状態Aと状態Bを10進数に変換したとき、その差はいくつか。', choices:['3','5','7','9'], correct:1,
     explanation:'状態Aは1011＝11、状態Bは0110＝6です。文章から2つの値を読み取り、それぞれ10進数に変換してから差を求めると、11－6＝5になります。'},
    {id:'bd-mini-2', category:'data', knowledgeIds:['binary-to-decimal'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['binary-addition'], commonTestPriority:2,
     exerciseLevel:'common-test-mini', questionType:'mini-passage',
     stimulus:{text:'あるシステムでは、通知の優先度を4ビットの2進数で表している。優先度Xは1101、優先度Yは1010である。', table:null, image:null},
     q:'優先度Xと優先度Yを10進数に変換したとき、値が大きいのはどちらか、またその差はいくつか。', choices:['Xの方が3大きい','Yの方が3大きい','Xの方が5大きい','Yの方が2大きい'], correct:0,
     explanation:'優先度Xは1101＝13、優先度Yは1010＝10です。それぞれ変換してから比較すると、Xの方が3大きいことがわかります。'},
    {id:'bd-int-1', category:'data', knowledgeIds:['binary-to-decimal','bit-capacity'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['binary-place-value'], commonTestPriority:2,
     exerciseLevel:'integrated', questionType:'combined',
     stimulus:{text:'ある温度センサーは、測定値を4ビットの2進数で記録している。記録できる値の範囲は0000から1111までである。', table:null, image:null},
     q:'このセンサーが記録した値が1110のとき、10進数で表した値と、4ビットで表現できる値の最大数の組み合わせとして正しいものは？', choices:['10進数14、最大16通り','10進数14、最大15通り','10進数15、最大16通り','10進数12、最大16通り'], correct:0,
     explanation:'1110を10進数に変換すると8+4+2=14です。4ビットでは0000〜1111の16通り（2の4乗）の値を表現できます。10進数への変換とビット数の知識を組み合わせて答える問題です。'},

    {id:'dtb-basic-1', category:'data', knowledgeIds:['decimal-to-binary'], prerequisiteIds:['binary-to-decimal'], relatedKnowledgeIds:['binary-to-decimal'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'10進数の13を2進数で表すと？', choices:['1101','1011','1110','1010'], correct:0,
     explanation:'13は8+4+1なので、8の位・4の位・1の位が1、2の位が0となり、1101と表されます。'},

    {id:'bc-basic-1', category:'data', knowledgeIds:['bit-capacity'], prerequisiteIds:['binary-place-value'], relatedKnowledgeIds:['binary-place-value'], commonTestPriority:2,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'4ビットの2進数で表現できる数は何通りか。', choices:['8通り','15通り','16通り','32通り'], correct:2,
     explanation:'1ビットにつき2通りの状態を表せるため、4ビットでは2の4乗＝16通りの値を表現できます。'},

    {id:'ba-basic-1', category:'data', knowledgeIds:['binary-addition'], prerequisiteIds:['binary-to-decimal'], relatedKnowledgeIds:['binary-to-decimal'], commonTestPriority:1,
     exerciseLevel:'basic', questionType:'direct', stimulus:null,
     q:'2進数の0011と0101を足すと？', choices:['1000','0111','1001','0110'], correct:0,
     explanation:'0011（10進数で3）と0101（10進数で5）を足すと10進数で8になり、2進数では1000と表されます。'}
  ]
};

/* ===================================================================
   「教科書の外、だけど中。」（TECH_STORIES） / v1.0
   身近な出来事や社会の技術を、情報Ⅰの知識と結びつける独立モジュール。
   QUESTION_BANKやKNOWLEDGE_ITEMSとは完全に独立したデータ構造とし、
   knowledgeIdsを介してのみ緩く関連付ける（既存の学習エンジンには一切混在させない）。

   [今後の拡張ポイント]
   - sourceLabel / sourceUrl / publishedAt は、将来の時事ニュース記事用に予約済み（v1.0では空文字）
   - choices は将来、記事内の簡易クイズ形式に拡張する余地として保持（v1.0では未使用・空配列）
   - category は現在すべて 'daily-life'。将来 'news' などを追加する想定
   - 教師がここに項目を追加・編集するだけで、選択ロジック／表示ロジックは変更不要
   - 3件（story-stair-switch / story-photo-compression / story-password-leak）が完成版、
     残り7件は仮データ（本文・問いを今後拡充する前提）
=================================================================== */
const TECH_STORIES = [
  {
    id:'story-stair-switch', title:'階段の上下にあるスイッチ',
    summary:'階段の上と下、どちらのスイッチからでも同じ照明をオン・オフできる。',
    body:'一見単純な仕組みに見えるが、これは「2つの入力のうち、どちらか一方だけがオンのときに出力がオンになる」という条件で動いている。片方のスイッチを切り替えるたびに回路の状態が変わり、それに応じて照明の状態も切り替わる。これは、複数の条件を組み合わせて結果を決める「論理回路」の考え方そのものであり、プログラムの「分岐（条件によって処理を切り替える）」の考え方とも深くつながっている。',
    knowledgeIds:['branch'], category:'daily-life',
    question:'この「どちらか一方だけオンなら点灯する」という仕組みは、身の回りの他にどんな場面で使われていると思いますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['論理回路','制御','身近な電気設備'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  },
  {
    id:'story-photo-compression', title:'スマホ写真と画像圧縮',
    summary:'スマホで撮った写真は、実はそのままのデータ量ではなく、少し「軽く」されてから保存・送信されている。',
    body:'撮影直後の画像データは容量が非常に大きい。そのままではストレージをすぐ使い切り、SNSへの送信にも時間がかかる。そこで多くのスマホは、人の目にはほとんど気づかれない範囲で情報量を減らす「圧縮」という処理を行い、データ量を小さくしてから保存している。写真を何度も保存し直すと画質が少しずつ荒くなることがあるのは、この圧縮の仕組みと関係している。',
    knowledgeIds:['compression'], category:'daily-life',
    question:'画質をできるだけ落とさずにデータ量を減らすには、どんな工夫が必要だと思いますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['画像圧縮','データ量','スマートフォン'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  },
  {
    id:'story-video-streaming', title:'動画配信とデータ量',
    summary:'同じ動画でも、画質を上げるほど通信に使うデータ量が大きくなる。',
    body:'動画は静止画を高速に切り替えて表示している。画質（解像度）を上げると1枚あたりの情報量が増え、それを毎秒何十枚も送るためデータ量が大きく膨らむ。動画配信アプリで画質を選べるのは、通信環境やギガ数に応じてこのデータ量を調整できるようにするためである。',
    knowledgeIds:['bit-capacity'], category:'daily-life',
    question:'画質を選べる動画アプリでは、なぜ画質によって通信量の表示が変わるのだと思いますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['動画配信','データ量'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  },
  {
    id:'story-qr-code', title:'QRコードと誤り訂正',
    summary:'QRコードは、一部が汚れたり欠けたりしていても読み取れることがある。',
    body:'QRコードは、模様の一部が汚れたり破れたりしていても正しく読み取れることが多い。これは、データの一部が欠けても元の情報を復元できるよう、あらかじめ余分な情報を埋め込んでおく「誤り訂正」という仕組みが組み込まれているためである。',
    knowledgeIds:['error-correction'], category:'daily-life',
    question:'QRコードの一部が破れていても読み取れるのは、どんな工夫があるからだと思いますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['QRコード','誤り訂正'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  },
  {
    id:'story-barcode-db', title:'レジのバーコードとデータベース',
    summary:'レジでバーコードを読み取ると、瞬時に商品名と価格が表示される。',
    body:'バーコードには商品を識別するための番号だけが記録されており、商品名や価格そのものは記録されていない。レジでは読み取った番号をもとに、店のシステムにある「データベース」を照合して商品名と価格を瞬時に表示している。',
    knowledgeIds:['database'], category:'daily-life',
    question:'商品名や価格をバーコードに直接書き込まずに、別の場所で管理しているのはなぜだと思いますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['バーコード','データベース'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  },
  {
    id:'story-map-location', title:'地図アプリと位置情報',
    summary:'地図アプリを開くと、自分がいる場所がすぐに表示される。',
    body:'スマホはGPSなどから受け取った信号をもとに自分がいる場所（緯度・経度）を計算し、その情報を地図上の座標に変換して表示している。位置情報は便利な一方、どこにいたかという記録にもなるため、扱いには注意が必要とされる。',
    knowledgeIds:['location-info'], category:'daily-life',
    question:'位置情報アプリが便利な場面と、少し不安に感じる場面をそれぞれ考えてみましょう。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['位置情報','地図アプリ'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  },
  {
    id:'story-login-auth', title:'ログイン通知と認証',
    summary:'「新しい端末からログインがありました」という通知が届くことがある。',
    body:'多くのサービスは、いつも使っている端末と違う端末や、普段と違う場所からログインがあったことを検知すると、本人かどうかを確認するために通知を送る仕組みを持っている。これは「認証」の一部であり、不正なログインにいち早く気づくための工夫である。',
    knowledgeIds:['authentication'], category:'daily-life',
    question:'このような通知が届いたとき、次に何を確認するべきだと思いますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['認証','セキュリティ'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  },
  {
    id:'story-password-leak', title:'情報漏洩とパスワード管理',
    summary:'あるサービスから流出した「メールアドレスとパスワードの組み合わせ」が、別のサービスへの不正ログインに悪用されることがある。',
    body:'複数のサービスで同じパスワードを使い回していると、1つのサービスから情報が漏れただけで、他のサービスにも不正にログインされてしまう危険がある。この被害を防ぐ基本的な考え方の一つが、通信内容を第三者に読み取られないようにする「暗号化」であり、加えてサービスごとに異なるパスワードを設定することや、二段階認証を使うことも有効な対策とされている。',
    knowledgeIds:['encryption'], category:'daily-life',
    question:'あなたが普段使っているパスワードの管理方法には、どんな工夫がありますか、あるいはどんな不安がありますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['情報セキュリティ','パスワード','個人情報'], difficulty:'intro', estimatedReadingSeconds:40, active:true
  },
  {
    id:'story-recommend-algo', title:'おすすめ動画とアルゴリズム',
    summary:'動画アプリを開くと、自分の興味に合いそうな動画が並んでいる。',
    body:'動画アプリのおすすめ欄には、これまでの視聴履歴などをもとに「次に見せると興味を持ってもらえそうな動画」を計算して選ぶ手順が使われている。この「決まった手順で結果を導き出す」やり方も、広い意味でのアルゴリズムの一種である。',
    knowledgeIds:['algorithm'], category:'daily-life',
    question:'おすすめに表示される動画が、いつも似た傾向になるのはなぜだと思いますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['アルゴリズム','レコメンド'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  },
  {
    id:'story-wifi-congestion', title:'Wi-Fiの混雑と通信速度',
    summary:'家族みんなで同時にWi-Fiを使うと、動画が止まりやすくなることがある。',
    body:'同じWi-Fiに多くの機器が同時につながり、それぞれが大きなデータをやり取りすると、電波や処理が混み合って一つ一つの通信速度が落ちることがある。家族で同時に動画を見ていると読み込みが遅くなるのは、この混雑が原因であることが多い。',
    knowledgeIds:['wifi'], category:'daily-life',
    question:'家の中でWi-Fiが遅いと感じたとき、何が原因として考えられますか。',
    choices:[], sourceLabel:'', sourceUrl:'', publishedAt:'',
    tags:['Wi-Fi','通信速度'], difficulty:'intro', estimatedReadingSeconds:35, active:true
  }
];

const TECH_STORY_STORAGE_KEYS = { read:'infonavi_techStoryReadState', optout:'infonavi_techStoryOptOut', progress:'infonavi_techStoryProgress' };
let currentTechStoryByContainer = {};

function defaultTechStoryReadState(){ return { readIds:[], lastShownAt:{} }; }

function getTechStoryProgress(){
  try{
    const raw = localStorage.getItem(TECH_STORY_STORAGE_KEYS.progress);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ console.warn('30秒チャレンジの記録を読み込めませんでした', e); return {}; }
}
function saveTechStoryProgress(v){
  try{ localStorage.setItem(TECH_STORY_STORAGE_KEYS.progress, JSON.stringify(v)); }
  catch(e){ console.warn('30秒チャレンジの記録を保存できませんでした', e); }
}
function recordTechStoryProgressView(storyId){
  const p = getTechStoryProgress();
  const prev = p[storyId] || {read:false, canExplain:null};
  p[storyId] = { read:true, canExplain: (prev.canExplain === undefined ? null : prev.canExplain), lastViewedAt: new Date().toISOString() };
  saveTechStoryProgress(p);
}
function setTechStoryCanExplain(storyId, value, containerId){
  const p = getTechStoryProgress();
  const prev = p[storyId] || {read:true};
  p[storyId] = { read:true, canExplain:value, lastViewedAt: new Date().toISOString() };
  saveTechStoryProgress(p);
  const story = currentTechStoryByContainer[containerId];
  const context = containerId === 'tech-story-home' ? 'home' : 'complete';
  if(story) renderTechStoryCard(story, containerId, context);
  if(!value) {
    const container = document.getElementById(containerId);
    const toggleBtn = container && container.querySelector('.story-toggle');
    const body = container && container.querySelector('.story-body');
    if(toggleBtn && body){ body.style.display = 'block'; toggleBtn.textContent = '閉じる ▴'; }
  }
}

function getTechStoryReadState(){
  try{
    const raw = localStorage.getItem(TECH_STORY_STORAGE_KEYS.read);
    return raw ? JSON.parse(raw) : defaultTechStoryReadState();
  }catch(e){ return defaultTechStoryReadState(); }
}
function saveTechStoryReadState(state){
  try{ localStorage.setItem(TECH_STORY_STORAGE_KEYS.read, JSON.stringify(state)); }
  catch(e){ console.warn('コラムの既読状態を保存できませんでした', e); }
}
function getTechStoryOptOut(){
  try{ return localStorage.getItem(TECH_STORY_STORAGE_KEYS.optout) === '1'; }catch(e){ return false; }
}
function setTechStoryOptOut(v){
  try{ localStorage.setItem(TECH_STORY_STORAGE_KEYS.optout, v ? '1' : '0'); }catch(e){}
}

function getActiveTechStories(){ return TECH_STORIES.filter(s => s.active); }
function getTechStoriesByKnowledgeId(knowledgeId){ return getActiveTechStories().filter(s => s.knowledgeIds.includes(knowledgeId)); }
function getUnreadTechStories(){
  const read = getTechStoryReadState().readIds;
  return getActiveTechStories().filter(s => !read.includes(s.id));
}
function markTechStoryAsRead(storyId){
  const st = getTechStoryReadState();
  if(!st.readIds.includes(storyId)) st.readIds.push(storyId);
  saveTechStoryReadState(st);
}
function recordTechStoryShown(storyId){
  const st = getTechStoryReadState();
  st.lastShownAt[storyId] = new Date().toISOString();
  saveTechStoryReadState(st);
}

/* 優先順位: 1) 現在の知識に関連 → 2) 未読 → 3) 最近表示されていない → 4) ランダム */
function selectTechStory(options){
  options = options || {};
  const all = getActiveTechStories();
  if(all.length === 0) return null;

  let pool = all;
  if(options.knowledgeId){
    const related = getTechStoriesByKnowledgeId(options.knowledgeId);
    if(related.length > 0) pool = related;
  }
  if(options.excludeId){
    const filtered = pool.filter(s => s.id !== options.excludeId);
    if(filtered.length > 0) pool = filtered;
  }

  const readState = getTechStoryReadState();
  const unread = pool.filter(s => !readState.readIds.includes(s.id));
  const candidates = unread.length > 0 ? unread : pool;

  const sorted = [...candidates].sort((a,b) => {
    const at = readState.lastShownAt[a.id] || '';
    const bt = readState.lastShownAt[b.id] || '';
    return at.localeCompare(bt);
  });
  const oldest = readState.lastShownAt[sorted[0].id] || '';
  const topGroup = sorted.filter(s => (readState.lastShownAt[s.id] || '') === oldest);
  return topGroup[Math.floor(Math.random() * topGroup.length)];
}

/* 関連する知識項目に問題があればそこへ、無ければ自然な案内をして自由演習へ誘導する */
function openRelatedQuestions(story){
  if(!story) return;
  const workableId = story.knowledgeIds.find(kId => {
    const route = LEARNING_ROUTES[kId];
    return route && route.availableStages && route.availableStages.length > 0 && getQuestionsForKnowledge(kId, getQuestionBank()).length > 0;
  });
  if(workableId){
    startKnowledgeRoutePractice(workableId);
  } else {
    showToast('この内容に関連する問題は準備中です。関連する分野の演習からどうぞ。');
    showPage('practice-select');
  }
}

function showToast(msg){
  let t = document.getElementById('toast-notice');
  if(!t){ t = document.createElement('div'); t.id = 'toast-notice'; t.className = 'toast-notice'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => { t.classList.remove('show'); }, 2600);
}

function renderTechStoryCard(story, containerId, context){
  const container = document.getElementById(containerId);
  if(!container) return;
  if(!story){ container.style.display = 'none'; container.innerHTML = ''; return; }

  currentTechStoryByContainer[containerId] = story;
  recordTechStoryShown(story.id);
  recordTechStoryProgressView(story.id);
  container.style.display = 'block';

  const progress = getTechStoryProgress()[story.id] || {canExplain:null};

  let html = '';
  html += '<button class="story-close" onclick="dismissTechStory(\'' + containerId + '\')">✕</button>';
  html += '<div class="story-eyebrow">教科書の外、だけど中。</div>';
  html += '<div class="story-subtitle">身近な出来事を、情報Ⅰの視点で見てみよう。</div>';
  html += '<div class="story-title">' + story.title + '</div>';
  html += '<p class="story-summary">' + story.summary + '</p>';
  html += '<button class="story-toggle" onclick="toggleTechStoryBody(this)">続きを読む ▾</button>';
  html += '<div class="story-body" style="display:none;">' + story.body + '</div>';
  if(story.question) html += '<div class="story-question">💭 ' + story.question + '</div>';
  html += '<div class="story-tags">' + story.tags.map(t => '<span class="story-tag">#' + t + '</span>').join('') + '</div>';
  html += '<div class="story-actions">';
  html += '<button class="story-btn-secondary" onclick="handleTechStoryLater(\'' + story.id + '\',\'' + containerId + '\')">あとで読む</button>';
  html += '<button class="story-btn-secondary" onclick="handleTechStoryAnother(\'' + containerId + '\',\'' + context + '\')">別の話を見る</button>';
  html += '<button class="story-btn-primary" onclick="handleTechStoryRelated(\'' + story.id + '\')">関連問題に進む</button>';
  html += '</div>';
  html += '<div class="story-selfcheck">';
  html += '<p class="story-selfcheck-q">この出来事を、家族や友達に30秒で説明できますか？</p>';
  html += '<div class="story-selfcheck-btns">';
  html += '<button class="selfcheck-btn' + (progress.canExplain === true ? ' active' : '') + '" onclick="setTechStoryCanExplain(\'' + story.id + '\', true, \'' + containerId + '\')">説明できそう</button>';
  html += '<button class="selfcheck-btn' + (progress.canExplain === false ? ' active' : '') + '" onclick="setTechStoryCanExplain(\'' + story.id + '\', false, \'' + containerId + '\')">もう一度読む</button>';
  html += '</div></div>';
  /* Sprint1: 「今後、演習後にこの表示をしない」チェックボックスは削除。
     カードを閉じる手段は右上の✕（dismissTechStory）のみとする。 */
  container.innerHTML = html;
}

function toggleTechStoryBody(btn){
  const body = btn.nextElementSibling;
  const show = body.style.display === 'none';
  body.style.display = show ? 'block' : 'none';
  btn.textContent = show ? '閉じる ▴' : '続きを読む ▾';
}
function dismissTechStory(containerId){
  const el = document.getElementById(containerId);
  el.style.display = 'none';
  el.innerHTML = '';
}
function handleTechStoryLater(storyId, containerId){
  recordTechStoryShown(storyId);
  dismissTechStory(containerId);
}
function handleTechStoryAnother(containerId, context){
  const current = currentTechStoryByContainer[containerId];
  const opts = { excludeId: current ? current.id : null };
  if(context === 'complete' && window.__lastCompleteKnowledgeId) opts.knowledgeId = window.__lastCompleteKnowledgeId;
  const next = selectTechStory(opts);
  renderTechStoryCard(next, containerId, context);
}
function handleTechStoryRelated(storyId){
  const story = TECH_STORIES.find(s => s.id === storyId);
  markTechStoryAsRead(storyId);
  openRelatedQuestions(story);
}

/* ===================================================================
   外部教材リンク / Core
   具体的なサービス名・URL・対応表はschool-config.js側の設定に置き、
   app.jsには一切ハードコードしない。features.externalResourcesが
   falseの場合、または設定が無い場合は、常に空として安全に動作する
   （関連パネルは自然に非表示になる）。
=================================================================== */
const EXTERNAL_RESOURCES = (CONFIG.features && CONFIG.features.externalResources) ? (CONFIG.externalResources || {}) : {};
const EXTERNAL_RESOURCE_LINKS = (CONFIG.features && CONFIG.features.externalResources) ? (CONFIG.externalResourceLinks || {}) : {};

/* ===================================================================
   参考リンク（REFERENCE_LINKS） / v1.0
   将来、IPA・IT用語辞典 e-Words・総務省・教科書会社の公開ページ等の
   URLをここに設定する。knowledgeIdごとにURLを1つだけ持つ、最小限の構造。
   値が空文字の間は「もっと詳しく調べる」ボタンを表示しない（安全側のデフォルト）。
   ※ Sol Passageは用語辞典そのものを目指さないため、詳しい説明はここから
     外部サイトへ委ね、アプリ内には短い学習カードのみを持つ。
=================================================================== */
const REFERENCE_LINKS = {};
Object.keys(KNOWLEDGE_ITEMS).forEach(id => { REFERENCE_LINKS[id] = ''; }); /* ← 各行のURLはここではなく、教師が個別に値を入れて運用する想定 */

function getReferenceLink(knowledgeId){ return REFERENCE_LINKS[knowledgeId] || ''; }
function renderReferenceLinkButton(knowledgeId){
  const url = getReferenceLink(knowledgeId);
  if(!url) return '';
  return '<a class="ext-link-btn" style="margin-top:8px;" href="' + url + '" target="_blank" rel="noopener noreferrer">もっと詳しく調べる</a>';
}

function getExternalResource(id){ return EXTERNAL_RESOURCES[id] || null; }
function getExternalResourcesForKnowledge(knowledgeId){
  const ids = EXTERNAL_RESOURCE_LINKS[knowledgeId] || [];
  return ids.map(id => getExternalResource(id)).filter(r => r && r.active);
}
/* URL未設定でもエラーにならないよう、その場合はボタンではなく案内文を出す */
function renderExternalResourceButton(resource){
  if(!resource) return '';
  if(!resource.url){
    return '<p class="ext-pending">外部教材へのリンクは準備中です</p>';
  }
  return '<a class="ext-link-btn" href="' + resource.url + '" target="_blank" rel="noopener noreferrer">' + resource.label + '</a>' +
    '<p class="ext-link-note">新しいタブでLife is Tech!を開きます。学習後、このページに戻って確認問題に取り組みましょう。<br>ログイン後、授業で指定された単元を開いてください。</p>';
}

/* ---- ユーザー状態（本来はログインユーザーごとにDBへ保存） ---- */
let knowledgeLevels = {};
let answerHistory = { byKnowledge:{} };
let studyHistory = defaultStudyHistory();
let sessionTurn = 0;

function defaultStudyHistory(){
  return { todayGoalMinutes:10, todayDoneMinutes:0, weekDays:[false,false,false,false,false,false,false], seenIds:[] };
}

const STORAGE_KEYS = {
  levels:'infonavi_knowledgeLevels', history:'infonavi_answerHistory',
  study:'infonavi_studyHistory', turn:'infonavi_sessionTurn'
};

function loadUserState(){
  try{
    const l = localStorage.getItem(STORAGE_KEYS.levels);
    const h = localStorage.getItem(STORAGE_KEYS.history);
    const s = localStorage.getItem(STORAGE_KEYS.study);
    const t = localStorage.getItem(STORAGE_KEYS.turn);
    knowledgeLevels = l ? JSON.parse(l) : {};
    answerHistory = h ? JSON.parse(h) : { byKnowledge:{} };
    studyHistory = s ? JSON.parse(s) : defaultStudyHistory();
    sessionTurn = t ? parseInt(t, 10) : 0;
  }catch(e){
    console.warn('localStorageを読み込めなかったため、メモリ上の初期状態で開始します', e);
    knowledgeLevels = {}; answerHistory = { byKnowledge:{} }; studyHistory = defaultStudyHistory(); sessionTurn = 0;
  }
}

function saveUserState(){
  try{
    localStorage.setItem(STORAGE_KEYS.levels, JSON.stringify(knowledgeLevels));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(answerHistory));
    localStorage.setItem(STORAGE_KEYS.study, JSON.stringify(studyHistory));
    localStorage.setItem(STORAGE_KEYS.turn, String(sessionTurn));
  }catch(e){
    console.warn('localStorageへの保存に失敗しました（プレビュー環境では保護される場合があります）', e);
  }
}

function resetUserState(){
  knowledgeLevels = {};
  answerHistory = { byKnowledge:{} };
  studyHistory = defaultStudyHistory();
  sessionTurn = 0;
  try{ Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k)); }catch(e){}
  saveUserState();
}

function initializeDemoState(){
  knowledgeLevels = {
    'universal-design':80, 'info-design':60,
    'algorithm':65, 'complexity':40, 'binary-search':35, 'flowchart':70,
    'ip-address':70, 'dns':30, 'url':45, 'http':55,
    'histogram':85, 'scatter':40, 'data-utilization':35,
    'binary-place-value':78, 'binary-to-decimal':60
  };
  const now = new Date().toISOString();
  answerHistory = { byKnowledge:{
    'dns':{attempts:2, correctCount:0, wrongCount:2, lastSeenTurn:2, lastAnsweredAt:now, lastCorrect:false, lastWrong:true, mode:'diagnosis', stageProgress:{currentStage:'basic', basicConfirmed:false, correctQuestionIdsByStage:{basic:[],application:[],'common-test-mini':[],integrated:[]}, consecutiveWrongAtStage:1}},
    'scatter':{attempts:1, correctCount:0, wrongCount:1, lastSeenTurn:1, lastAnsweredAt:now, lastCorrect:false, lastWrong:true, mode:'diagnosis', stageProgress:{currentStage:'basic', basicConfirmed:false, correctQuestionIdsByStage:{basic:[],application:[],'common-test-mini':[],integrated:[]}, consecutiveWrongAtStage:1}},
    'complexity':{attempts:2, correctCount:1, wrongCount:1, lastSeenTurn:3, lastAnsweredAt:now, lastCorrect:true, lastWrong:false, mode:'diagnosis', stageProgress:{currentStage:'application', basicConfirmed:true, correctQuestionIdsByStage:{basic:['a1'],application:[],'common-test-mini':[],integrated:[]}, consecutiveWrongAtStage:0}},
    'binary-place-value':{attempts:2, correctCount:2, wrongCount:0, lastSeenTurn:4, lastAnsweredAt:now, lastCorrect:true, lastWrong:false, mode:'diagnosis', stageProgress:{currentStage:'application', basicConfirmed:true, correctQuestionIdsByStage:{basic:['bpv-basic-1','bpv-basic-1'],application:[],'common-test-mini':[],integrated:[]}, consecutiveWrongAtStage:0, lastTransition:{type:'advance', from:'basic', to:'application'}}}
  }};
  sessionTurn = 5;
  studyHistory = { todayGoalMinutes:10, todayDoneMinutes:5, weekDays:[true,true,true,false,false,false,false], seenIds:['t2','n4'] };
  saveUserState();
}

function getQuestionBank(){ return QUESTION_BANK; }
function getKnowledgeItems(){ return KNOWLEDGE_ITEMS; }
function getUserKnowledgeLevels(){ return knowledgeLevels; }
function saveUserKnowledgeLevels(v){ knowledgeLevels = v; }
function getAnswerHistory(){ return answerHistory; }
function saveAnswerHistory(v){ answerHistory = v; }
function getStudyHistory(){ return studyHistory; }
function saveStudyHistory(v){ studyHistory = v; }

/* 管理者向け：知識項目×段階ごとの登録問題数を集計する。生徒画面には表示しない。 */
function getQuestionCoverage(){
  const result = {};
  Object.keys(getKnowledgeItems()).forEach(kId => { result[kId] = {basic:0, application:0, 'common-test-mini':0, integrated:0}; });
  Object.keys(getQuestionBank()).forEach(cat => {
    getQuestionBank()[cat].forEach(q => {
      q.knowledgeIds.forEach(kId => {
        if(result[kId] && result[kId][q.exerciseLevel] !== undefined) result[kId][q.exerciseLevel]++;
      });
    });
  });
  return result;
}
if(typeof window !== 'undefined') window.getQuestionCoverage = getQuestionCoverage; /* 開発者コンソールから確認できるようにしておく */

/* 知識項目ごとの段階別ルート設定を、問題データ（getQuestionCoverage）から自動生成する。
   新しい知識項目・問題を追加しても、このルートは自動で更新される（個別コード追加は不要）。 */
function buildLearningRoutes(){
  const coverage = getQuestionCoverage();
  const routes = {};
  Object.keys(getKnowledgeItems()).forEach(kId => {
    const cov = coverage[kId];
    const availableStages = STAGE_ORDER.filter(s => cov[s] > 0);
    routes[kId] = {
      stages: STAGE_ORDER,
      requiredCorrectPerStage: (ROUTE_OVERRIDES[kId] && ROUTE_OVERRIDES[kId].requiredCorrectPerStage) || REQUIRED_CORRECT_PER_STAGE,
      availableStages: availableStages.length > 0 ? availableStages : ['basic']
    };
  });
  return routes;
}
let LEARNING_ROUTES = {};

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}

function sampleQuestions(cat, n, level){
  let pool = getQuestionBank()[cat];
  if(level) pool = pool.filter(q => q.exerciseLevel === level);
  return shuffle(pool).slice(0, Math.min(n, pool.length));
}

function buildDiagnosisQuestions(){
  let qs = [];
  Object.keys(categories).forEach(cat => { qs = qs.concat(sampleQuestions(cat, 2, 'basic')); });
  return shuffle(qs);
}

function getCategoryLevel(cat){
  const items = Object.values(getKnowledgeItems()).filter(k => k.category === cat);
  const known = items.map(k => getUserKnowledgeLevels()[k.id]).filter(v => v !== undefined && v !== null);
  if(known.length === 0) return null;
  return Math.round(known.reduce((s,v) => s+v, 0) / known.length);
}

function levelInfo(pct){
  if(pct === null || pct === undefined) return {label:'まだ未学習', cls:'lv-none'};
  if(pct >= 75) return {label:'得意', cls:'lv-good'};
  if(pct >= 50) return {label:'あと少し', cls:'lv-mid'};
  return {label:'復習がおすすめ', cls:'lv-low'};
}

function calculateUpdatedKnowledgeLevel(currentLevel, answerResult, answerStats){
  const base = (currentLevel === undefined || currentLevel === null) ? 50 : currentLevel;
  let next = base + (answerResult ? 8 : -10);
  return Math.max(15, Math.min(95, next));
}

/* 段階(basic/application/common-test-mini/integrated)の進み方を管理する。
   ・正解した問題のIDを段階ごとに記録し、requiredCorrectPerStage件たまったら次の段階へ
     （同じ問題を繰り返し正解しても重複カウントしない）
   ・上位段階で誤答しても1回目はすぐに段階を下げず、同じ段階の別問題を提示する
   ・同じ段階で誤答が連続したら一段階下げる（ただしbasicが確認済みならbasicへは戻さない）
   ・basicでの誤答はbasicのまま */
function updateStageProgress(prev, knowledgeId, questionId, level, correct){
  const route = LEARNING_ROUTES[knowledgeId] || {requiredCorrectPerStage:REQUIRED_CORRECT_PER_STAGE, availableStages:['basic']};
  const required = route.requiredCorrectPerStage;
  const order = STAGE_ORDER;

  const prevMap = (prev && prev.correctQuestionIdsByStage) || {basic:[],application:[],'common-test-mini':[],integrated:[]};
  const correctMap = { basic:[...prevMap.basic], application:[...prevMap.application], 'common-test-mini':[...prevMap['common-test-mini']], integrated:[...prevMap.integrated] };

  let basicConfirmed = (prev && prev.basicConfirmed) || false;
  let currentStage = (prev && prev.currentStage) || 'basic';
  let consecutiveWrong = (prev && prev.consecutiveWrongAtStage) || 0;
  let lastTransition = null;

  if(correct){
    if(!correctMap[level].includes(questionId)) correctMap[level].push(questionId);
    consecutiveWrong = 0;
    if(level === 'basic' && correctMap.basic.length >= required) basicConfirmed = true;

    if(level === currentStage && correctMap[level].length >= required){
      const idx = order.indexOf(level);
      let nextIdx = idx + 1;
      while(nextIdx < order.length && !route.availableStages.includes(order[nextIdx])) nextIdx++;
      if(idx < order.length - 1 && nextIdx < order.length){
        currentStage = order[nextIdx];
        lastTransition = { type:'advance', from: level, to: currentStage };
      }
      /* 次の段階の問題がまだ用意されていない場合は、現在の段階に留まる（生徒には自然な表現で案内する） */
    }
  } else {
    consecutiveWrong = (level === currentStage) ? consecutiveWrong + 1 : 1;
    if(level === 'basic'){
      currentStage = 'basic';
      lastTransition = { type:'reset-basic', from: level, to:'basic' };
    } else if(consecutiveWrong >= 2){
      if(basicConfirmed){
        const idx = order.indexOf(level);
        const downIdx = idx - 1;
        const to = (downIdx <= 0) ? level : order[downIdx];
        currentStage = to;
        lastTransition = { type:'stepdown', from: level, to: to };
      } else {
        currentStage = 'basic';
        lastTransition = { type:'reset-basic', from: level, to:'basic' };
      }
      consecutiveWrong = 0;
    } else {
      currentStage = level;
      lastTransition = { type:'retry', from: level, to: level };
    }
  }

  return { currentStage, basicConfirmed, correctQuestionIdsByStage: correctMap, consecutiveWrongAtStage: consecutiveWrong, lastTransition };
}

function getStageForKnowledge(kId, histObj){
  const h = histObj.byKnowledge[kId];
  if(h && h.stageProgress && h.stageProgress.currentStage) return h.stageProgress.currentStage;
  return 'basic';
}

function knowledgeNeedScore(kId, levelsObj, histObj){
  const lvl = levelsObj[kId];
  const item = getKnowledgeItems()[kId];
  let score = 0;
  if(lvl === undefined || lvl === null) score += 3;
  else if(lvl < 50) score += 2;
  else if(lvl < 75) score += 1;
  score += (item.commonTestPriority || 1) * 0.5;
  const h = histObj.byKnowledge[kId];
  if(h){
    if(h.lastWrong) score += 2;
    const stale = sessionTurn - (h.lastSeenTurn === undefined ? -99 : h.lastSeenTurn);
    if(stale > 5) score += 1;
  } else {
    score += 1;
  }
  return score;
}

function getTargetKnowledgeIds(levelsObj, histObj, n){
  return Object.keys(getKnowledgeItems())
    .filter(id => { const l = levelsObj[id]; return l === undefined || l === null || l < 75; })
    .sort((a,b) => knowledgeNeedScore(b, levelsObj, histObj) - knowledgeNeedScore(a, levelsObj, histObj))
    .slice(0, n);
}

function resolvePrerequisiteTarget(knowledgeId, levelsObj, knowledgeItemsObj){
  const visited = new Set();
  let current = knowledgeId;
  while(true){
    if(visited.has(current)) break;
    visited.add(current);
    const item = knowledgeItemsObj[current];
    if(!item || !item.prerequisiteIds || item.prerequisiteIds.length === 0) break;
    const unmet = item.prerequisiteIds.filter(p => {
      const l = levelsObj[p];
      return l === undefined || l === null || l < 50;
    });
    if(unmet.length === 0) break;
    current = unmet.sort((a,b) => (levelsObj[a] ?? -1) - (levelsObj[b] ?? -1))[0];
  }
  return { targetId: current, originalId: knowledgeId, isPrerequisite: current !== knowledgeId };
}

function getQuestionsForKnowledge(knowledgeId, questionBankObj){
  let list = [];
  Object.keys(questionBankObj).forEach(cat => {
    questionBankObj[cat].forEach(q => { if(q.knowledgeIds.includes(knowledgeId)) list.push(q); });
  });
  return list;
}

/* targetIdの「今出題すべき段階の問題プール」を決める。
   その段階の問題がまだ無ければ、一つ前の使用可能な段階へ。
   knowledgeId自体に問題が1問も無ければ、関連知識のうち問題があるものへ振り替える。
   開発者向けの「問題がありません」という表現は生徒には出さない。 */
function resolveQuestionPoolForTarget(targetId, histObj, questionBankObj, knowledgeItemsObj){
  const route = LEARNING_ROUTES[targetId] || {availableStages:['basic']};
  const stage = getStageForKnowledge(targetId, histObj);
  let effectiveId = targetId;
  let effectiveStage = stage;

  if(route.availableStages.length === 0){
    const related = (knowledgeItemsObj[targetId] && knowledgeItemsObj[targetId].relatedIds) || [];
    const fallbackId = related.find(rid => (LEARNING_ROUTES[rid] && LEARNING_ROUTES[rid].availableStages.length > 0));
    if(!fallbackId) return null;
    effectiveId = fallbackId;
    effectiveStage = LEARNING_ROUTES[fallbackId].availableStages[0];
  } else if(!route.availableStages.includes(effectiveStage)){
    const idx = STAGE_ORDER.indexOf(effectiveStage);
    let fallbackIdx = idx - 1;
    while(fallbackIdx >= 0 && !route.availableStages.includes(STAGE_ORDER[fallbackIdx])) fallbackIdx--;
    effectiveStage = fallbackIdx >= 0 ? STAGE_ORDER[fallbackIdx] : route.availableStages[0];
  }

  const pool = getQuestionsForKnowledge(effectiveId, questionBankObj).filter(q => q.exerciseLevel === effectiveStage);
  return { knowledgeId: effectiveId, stage: effectiveStage, redirected: effectiveId !== targetId, pool };
}

function determineReasonType(resolved, levelsObj, histObj, knowledgeItemsObj){
  if(resolved.isPrerequisite) return 'prerequisite';
  const lvl = levelsObj[resolved.targetId];
  if(lvl === undefined || lvl === null) return 'unlearned';
  const h = histObj.byKnowledge[resolved.targetId];
  if(h && h.lastWrong) return 'recentWrong';
  if(h){
    const stale = sessionTurn - (h.lastSeenTurn === undefined ? -99 : h.lastSeenTurn);
    if(stale > 5) return 'notStudiedRecently';
  } else {
    return 'notStudiedRecently';
  }
  const item = knowledgeItemsObj[resolved.targetId];
  if(item && item.commonTestPriority >= 3) return 'highPriority';
  return 'needsReview';
}

const STAGE_ADVANCE_MESSAGES = {
  'basic->application': '基礎が確認できたので、文章問題に進みます',
  'application->common-test-mini': '応用ができたので、共通テスト形式に進みます',
  'common-test-mini->integrated': '共通テスト形式ができたので、総合問題に進みます'
};

function reasonLabel(rec){
  if(rec.stageMessage) return rec.stageMessage;
  const r = rec.recommendationReason;
  switch(r.type){
    case 'prerequisite': return knowledgeTerm(r.originalKnowledgeId) + 'を理解するための準備';
    case 'recentWrong': return '前回の問題をもう一度確認';
    case 'notStudiedRecently': return 'しばらく取り組んでいません';
    case 'unlearned': return 'まだ学習していない内容です';
    case 'highPriority': return '共通テストでよく問われる内容です';
    case 'redirected': return knowledgeTerm(r.originalKnowledgeId) + 'に関連する内容です';
    case 'needsReview': default: return '復習しておきたい内容です';
  }
}

/* おすすめ問題の生成。
   1) 取り組み候補の知識項目を選ぶ → 2) 前提知識をたどって実際の対象を決める
   → 3) 対象知識の現在の段階(stage)に合う問題を探す（無ければ前段階／関連知識へ自然に振り替える）
   → 4) 直近の出題・既に正解済みの問題を避けながら5問そろえる */
function generateRecommendations(levelsObj, histObj, studyHist, knowledgeItemsObj, questionBankObj){
  const candidates = getTargetKnowledgeIds(levelsObj, histObj, 10);
  const resolvedList = candidates.map(id => resolvePrerequisiteTarget(id, levelsObj, knowledgeItemsObj));

  const seenTargets = new Set();
  const dedupedTargets = [];
  resolvedList.forEach(r => { if(!seenTargets.has(r.targetId)){ seenTargets.add(r.targetId); dedupedTargets.push(r); } });

  const result = [];
  const usedQuestionIds = new Set();

  dedupedTargets.forEach(r => {
    if(result.length >= 5) return;
    const resolved = resolveQuestionPoolForTarget(r.targetId, histObj, questionBankObj, knowledgeItemsObj);
    if(!resolved) return;

    const entry = histObj.byKnowledge[resolved.knowledgeId];
    const alreadyCorrectIds = (entry && entry.stageProgress && entry.stageProgress.correctQuestionIdsByStage && entry.stageProgress.correctQuestionIdsByStage[resolved.stage]) || [];

    let fresh = resolved.pool.filter(q => !studyHist.seenIds.includes(q.id) && !usedQuestionIds.has(q.id) && !alreadyCorrectIds.includes(q.id));
    if(fresh.length === 0) fresh = resolved.pool.filter(q => !usedQuestionIds.has(q.id) && !alreadyCorrectIds.includes(q.id));
    if(fresh.length === 0) fresh = resolved.pool.filter(q => !usedQuestionIds.has(q.id));
    if(fresh.length === 0) return;

    const chosen = fresh[Math.floor(Math.random() * fresh.length)];
    usedQuestionIds.add(chosen.id);

    let reasonType = resolved.redirected ? 'redirected' : determineReasonType(r, levelsObj, histObj, knowledgeItemsObj);
    let stageMessage = null;
    const targetEntry = histObj.byKnowledge[r.targetId];
    if(!resolved.redirected && targetEntry && targetEntry.stageProgress && targetEntry.stageProgress.lastTransition){
      const t = targetEntry.stageProgress.lastTransition;
      if(t.type === 'advance') stageMessage = STAGE_ADVANCE_MESSAGES[t.from + '->' + t.to] || '基礎が確認できたので、次の段階に進みます';
      else if(t.type === 'retry') stageMessage = '同じ段階の別の問題で確認します';
      else if(t.type === 'stepdown') stageMessage = '一つ前の段階を確認します';
      else if(t.type === 'reset-basic') stageMessage = '基礎から確認しましょう';
    }
    if(resolved.redirected) stageMessage = 'この知識の基礎は確認できました。次は関連する内容に進みます';

    result.push({
      ...chosen,
      recommendationReason: { type: reasonType, targetKnowledgeId: resolved.knowledgeId, originalKnowledgeId: r.originalId },
      stageMessage: stageMessage
    });
  });

  if(result.length < 5){
    Object.keys(knowledgeItemsObj).forEach(id => {
      if(result.length >= 5) return;
      const qs = getQuestionsForKnowledge(id, questionBankObj).filter(q => !usedQuestionIds.has(q.id));
      if(qs.length > 0){
        usedQuestionIds.add(qs[0].id);
        result.push({...qs[0], recommendationReason:{type:'needsReview', targetKnowledgeId:id, originalKnowledgeId:id}, stageMessage:null});
      }
    });
  }
  return result.slice(0,5);
}

/* ===================================================================
   UI ロジック
=================================================================== */

let quizList = [];
let quizIndex = 0;
let exList = [];
let exIndex = 0;
let exCorrect = 0;
let currentExerciseMode = 'category';
let currentConfirmQuestion = null;
let dictActiveCat = 'all';

function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  window.scrollTo(0,0);
}

function knowledgeTerm(id){ const k = getKnowledgeItems()[id]; return k ? k.term : id; }

function recordAnswer(q, correct, mode){
  sessionTurn++;
  const hist = getAnswerHistory();
  const nowIso = new Date().toISOString();
  q.knowledgeIds.forEach(kId => {
    const prevEntry = hist.byKnowledge[kId] || {attempts:0, correctCount:0, wrongCount:0};
    const stats = {
      attempts: prevEntry.attempts + 1,
      correctCount: prevEntry.correctCount + (correct ? 1 : 0),
      wrongCount: prevEntry.wrongCount + (correct ? 0 : 1),
      lastAnsweredAt: nowIso,
      lastCorrect: correct,
      lastWrong: !correct,
      lastSeenTurn: sessionTurn,
      mode: mode,
      stageProgress: updateStageProgress(prevEntry.stageProgress, kId, q.id, q.exerciseLevel, correct)
    };
    hist.byKnowledge[kId] = stats;
    const levelsObj = getUserKnowledgeLevels();
    levelsObj[kId] = calculateUpdatedKnowledgeLevel(levelsObj[kId], correct, stats);
  });
  saveAnswerHistory(hist);
  const h2 = getStudyHistory();
  if(!h2.seenIds.includes(q.id)) h2.seenIds.push(q.id);
  saveStudyHistory(h2);
  saveUserState();
}

function hasAnyKnowledgeData(){ return Object.keys(getUserKnowledgeLevels()).length > 0; }

function setDisplayMode(done){
  document.getElementById('btn-mode-new').classList.toggle('active', !done);
  document.getElementById('btn-mode-done').classList.toggle('active', done);
  document.getElementById('home-new').style.display = done ? 'none' : 'block';
  document.getElementById('home-done').style.display = done ? 'block' : 'none';
  document.getElementById('home-title').textContent = done
    ? 'おかえりなさい！今日も5問、頑張ろう'
    : '今、何を学べばいい？を3〜5分でわかるようにしよう';
  document.getElementById('home-lead').textContent = done
    ? '前回の学習結果をもとに、今日のおすすめ問題を用意しました。'
    : 'はじめての方は、理解度診断から始めるのがおすすめです。';
}

function updateHomeView(){
  const done = hasAnyKnowledgeData();
  setDisplayMode(done);
  if(done){
    const focus = getTargetKnowledgeIds(getUserKnowledgeLevels(), getAnswerHistory(), 3).map(id => knowledgeTerm(id));
    document.getElementById('done-weak-label').textContent = focus.length > 0 ? ('今日のおすすめ：' + focus.join('・')) : '今日のおすすめ5問';
    renderLevelBars('level-bars');
  }
  renderHistoryWidget();
  renderTechStoryCard(selectTechStory({}), 'tech-story-home', 'home');
}

function goHome(){ updateHomeView(); showPage('home'); }

/* ===================================================================
   匿名ランキング / Core
   氏名・出席番号・ニックネームは一切収集・送信しない。
   ランダムな匿名ID（この端末のブラウザだけに保存）とスコアのみを扱う。

   全体順位の集計にはGitHub Pages単体（静的ファイル＋localStorage）では
   複数端末の記録を集約できないため、共有バックエンド（school-config.js側で
   設定するAPI URL）を利用する想定。
   ランキング機能が無効、またはAPI URLが未設定の間は、全体ランキングを
   取得・送信せず、自分の記録（総合スコア・最高得点・学習回数・過去の記録）
   のみを表示する（エラー表示はしない）。
=================================================================== */
const RANKING_API_URL = (CONFIG.features && CONFIG.features.ranking) ? ((CONFIG.ranking && CONFIG.ranking.apiUrl) || '') : '';

const RANKING_STORAGE_KEYS = { studentId:'infonavi_studentId', stats:'infonavi_rankingStats' };

function getStudentId(){
  try{
    let id = localStorage.getItem(RANKING_STORAGE_KEYS.studentId);
    if(!id){
      id = 'stu_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(RANKING_STORAGE_KEYS.studentId, id);
    }
    return id;
  }catch(e){
    console.warn('匿名IDを保存できませんでした。今回のセッションのみのIDを使用します', e);
    return 'stu_temp_' + Math.random().toString(36).slice(2, 10);
  }
}

function defaultRankingStats(){ return { totalScore:0, sessionsCount:0, bestSessionScore:0, history:[] }; }

function getRankingStats(){
  try{
    const raw = localStorage.getItem(RANKING_STORAGE_KEYS.stats);
    return raw ? JSON.parse(raw) : defaultRankingStats();
  }catch(e){
    console.warn('ランキング記録を読み込めませんでした。記録を初期化します', e);
    return defaultRankingStats();
  }
}
function saveRankingStats(v){
  try{ localStorage.setItem(RANKING_STORAGE_KEYS.stats, JSON.stringify(v)); }
  catch(e){ console.warn('ランキング記録を保存できませんでした', e); }
}

/* 演習セッション終了時に呼び出す。正解数を総合スコアへ積み上げる（学習を続けるほど伸びる指標）。 */
function recordSessionScore(correctCount, totalCount){
  const stats = getRankingStats();
  stats.totalScore += correctCount;
  stats.sessionsCount += 1;
  stats.bestSessionScore = Math.max(stats.bestSessionScore, correctCount);
  stats.history.push({ correct:correctCount, total:totalCount, at:new Date().toISOString() });
  if(stats.history.length > 20) stats.history = stats.history.slice(-20);
  saveRankingStats(stats);
  submitScoreToRanking(stats.totalScore);
}

/* URL未設定・通信失敗のいずれでも生徒画面にはエラーを出さない（console.warnのみ）。 */
function submitScoreToRanking(totalScore){
  if(!RANKING_API_URL) return;
  try{
    fetch(RANKING_API_URL, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ studentId:getStudentId(), score: totalScore })
    }).catch(e => console.warn('ランキングへの送信に失敗しました（通信環境をご確認ください）', e));
  }catch(e){ console.warn('ランキング送信中にエラーが発生しました', e); }
}

async function fetchRankingList(){
  if(!RANKING_API_URL) return null;
  try{
    const res = await fetch(RANKING_API_URL + '?action=list');
    if(!res.ok) throw new Error('response not ok: ' + res.status);
    return await res.json();
  }catch(e){ console.warn('全体ランキングを取得できませんでした', e); return null; }
}
async function fetchSelfRanking(){
  if(!RANKING_API_URL) return null;
  try{
    const res = await fetch(RANKING_API_URL + '?action=self&studentId=' + encodeURIComponent(getStudentId()));
    if(!res.ok) throw new Error('response not ok: ' + res.status);
    return await res.json();
  }catch(e){ console.warn('自分の順位を取得できませんでした', e); return null; }
}

function openRankingPage(){
  showPage('ranking');
  renderRankingPage();
}

async function renderRankingPage(){
  const stats = getRankingStats();
  document.getElementById('rank-self-score').textContent = stats.totalScore;
  document.getElementById('rank-self-best').textContent = stats.bestSessionScore;
  document.getElementById('rank-self-count').textContent = stats.sessionsCount;
  document.getElementById('rank-self-rank').textContent = '-';

  const historyBox = document.getElementById('rank-history-list');
  historyBox.innerHTML = '';
  if(stats.history.length === 0){
    historyBox.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">まだ演習の記録がありません。演習を1セット終えると、ここに記録が残ります。</p>';
  } else {
    [...stats.history].reverse().forEach(h => {
      const row = document.createElement('div');
      row.className = 'rank-history-row';
      const d = new Date(h.at);
      const dateLabel = isNaN(d.getTime()) ? '' : (d.getMonth()+1) + '/' + d.getDate();
      row.innerHTML = '<span>' + h.correct + ' / ' + h.total + ' 問正解</span><span class="rank-history-date">' + dateLabel + '</span>';
      historyBox.appendChild(row);
    });
  }

  const statusNote = document.getElementById('rank-status-note');
  const rankList = document.getElementById('rank-list');

  if(!RANKING_API_URL){
    statusNote.textContent = '全体ランキングは準備中です。あなたの記録はこの端末に保存されています。';
    rankList.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">全体ランキングは準備中です。</p>';
    return;
  }

  statusNote.textContent = '';
  rankList.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">読み込み中…</p>';

  const [selfResult, listResult] = await Promise.all([fetchSelfRanking(), fetchRankingList()]);

  if(selfResult && selfResult.found){
    document.getElementById('rank-self-rank').textContent = selfResult.rank + ' 位';
  } else {
    document.getElementById('rank-self-rank').textContent = '-';
  }

  if(!listResult || !listResult.list){
    rankList.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">全体ランキングを読み込めませんでした。あなたの記録は上に表示されています。</p>';
    return;
  }

  rankList.innerHTML = '';
  const myRank = selfResult && selfResult.found ? selfResult.rank : null;
  listResult.list.forEach(row => {
    const el = document.createElement('div');
    const isMe = myRank !== null && row.rank === myRank;
    el.className = 'rank-row' + (isMe ? ' me' : '');
    el.innerHTML = '<span class="rank-no">' + row.rank + '位</span><span class="rank-name">' + (isMe ? 'あなた' : '生徒') + '</span><span class="rank-score">' + row.score + '</span>';
    rankList.appendChild(el);
  });
}



function onToggleNew(){ resetUserState(); updateHomeView(); }
function onToggleDone(){ initializeDemoState(); updateHomeView(); }
function onResetRecord(){
  if(confirm('学習記録（理解度・履歴・出題記録）をリセットしますか？')){
    resetUserState();
    updateHomeView();
  }
}

function renderHistoryWidget(){
  const h = getStudyHistory();
  const remain = Math.max(0, h.todayGoalMinutes - h.todayDoneMinutes);
  const totalSeg = 5;
  const filledToday = Math.round(Math.min(1, h.todayDoneMinutes / h.todayGoalMinutes) * totalSeg);
  document.getElementById('history-today-squares').textContent = '■'.repeat(filledToday) + '□'.repeat(totalSeg - filledToday);
  document.getElementById('history-today-sub').textContent = remain === 0 && h.todayDoneMinutes > 0 ? '今日の目標達成！' : 'あと' + remain + '分';
  const filledWeek = h.weekDays.filter(Boolean).length;
  document.getElementById('history-week-squares').textContent = '■'.repeat(filledWeek) + '□'.repeat(7 - filledWeek);
  document.getElementById('history-week-sub').textContent = filledWeek + '/7日 学習しました';
}

/* ===== diagnosis ===== */
function startDiagnosisIntro(){ showPage('diagnosis-intro'); }

function beginQuiz(){
  quizList = buildDiagnosisQuestions();
  quizIndex = 0;
  showPage('diagnosis');
  renderQuizQuestion();
}

function renderQuizQuestion(){
  const q = quizList[quizIndex];
  document.getElementById('quiz-progress-fill').style.width = ((quizIndex+1)/quizList.length*100) + '%';
  document.getElementById('quiz-progress-label').textContent = '問 ' + (quizIndex+1) + ' / ' + quizList.length;
  document.getElementById('quiz-question').textContent = q.q;
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-next-btn').disabled = true;
  const box = document.getElementById('quiz-choices');
  box.innerHTML = '';
  q.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = () => answerQuiz(i);
    box.appendChild(btn);
  });
}

function answerQuiz(i){
  const q = quizList[quizIndex];
  const buttons = document.querySelectorAll('#quiz-choices .choice-btn');
  const correct = (i === q.correct);
  buttons.forEach((b, idx) => {
    b.disabled = true;
    if(idx === q.correct) b.classList.add('correct');
    else if(idx === i) b.classList.add('wrong');
  });
  document.getElementById('quiz-feedback').textContent = correct ? '正解！' : '不正解。正しい答えはハイライトされた選択肢です。';
  recordAnswer(q, correct, 'diagnosis');
  document.getElementById('quiz-next-btn').disabled = false;
}

function nextQuestion(){
  quizIndex++;
  if(quizIndex < quizList.length){ renderQuizQuestion(); }
  else { finishDiagnosis(); }
}

function finishDiagnosis(){
  renderLevelBars('result-level-bars');
  const focusIds = getTargetKnowledgeIds(getUserKnowledgeLevels(), getAnswerHistory(), 5);
  const wrap = document.getElementById('result-know-focus');
  wrap.innerHTML = '';
  focusIds.forEach(id => {
    const el = document.createElement('span');
    el.className = 'know-focus-item';
    el.textContent = knowledgeTerm(id);
    el.onclick = () => openDictKnowledge(id);
    wrap.appendChild(el);
  });

  const seenResIds = new Set();
  const linksToShow = [];
  focusIds.forEach(id => {
    getExternalResourcesForKnowledge(id).forEach(r => { if(!seenResIds.has(r.id)){ seenResIds.add(r.id); linksToShow.push(r); } });
  });
  const extPanel = document.getElementById('result-external-panel');
  if(linksToShow.length > 0){
    extPanel.style.display = 'block';
    document.getElementById('result-external-links').innerHTML = linksToShow.map(renderExternalResourceButton).join('');
  } else {
    extPanel.style.display = 'none';
  }

  renderRecommended();
  showPage('diagnosis-result');
}

function renderLevelBars(containerId){
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  Object.keys(categories).forEach(cat => {
    const pct = getCategoryLevel(cat);
    const info = levelInfo(pct);
    const row = document.createElement('div');
    row.className = 'level-row';
    row.innerHTML = '<span class="name">' + categories[cat].icon + ' ' + categories[cat].label + '</span>' +
      '<span class="level-track"><span class="level-fill" style="width:' + (pct === null ? 0 : pct) + '%;"></span></span>' +
      '<span class="level-badge ' + info.cls + '">' + info.label + '</span>';
    el.appendChild(row);
  });
}

function renderRecommended(){
  const list = document.getElementById('result-rec-list');
  list.innerHTML = '';
  const rec = generateRecommendations(getUserKnowledgeLevels(), getAnswerHistory(), getStudyHistory(), getKnowledgeItems(), getQuestionBank());
  rec.forEach((item, i) => {
    const targetCat = getKnowledgeItems()[item.recommendationReason.targetKnowledgeId]?.category || item.category;
    const targetTerm = knowledgeTerm(item.recommendationReason.targetKnowledgeId);
    const row = document.createElement('div');
    row.className = 'rec-item';
    row.innerHTML = '<span class="num">' + (i+1) + '</span><span class="rec-body"><span class="rec-term-row"><span class="rec-term">' + categories[targetCat].icon + ' ' + targetTerm + '</span><span class="rec-level-tag">' + LEVEL_LABELS[item.exerciseLevel] + '</span></span><span class="rec-reason">' + reasonLabel(item) + '</span></span>';
    list.appendChild(row);
  });
}

/* ===== exercise ===== */
function startRecommendedExercise(){
  exList = generateRecommendations(getUserKnowledgeLevels(), getAnswerHistory(), getStudyHistory(), getKnowledgeItems(), getQuestionBank());
  currentExerciseMode = 'recommended';
  startExerciseSession();
}

function startCategoryExercise(cat){
  exList = sampleQuestions(cat, 5);
  currentExerciseMode = 'category';
  startExerciseSession();
}

/* 特定の知識項目を、現在の段階から順番に練習する（自由演習の「段階別に練習する」入口用） */
function startKnowledgeRoutePractice(knowledgeId){
  const resolved = resolveQuestionPoolForTarget(knowledgeId, getAnswerHistory(), getQuestionBank(), getKnowledgeItems());
  let pool = resolved ? resolved.pool : getQuestionsForKnowledge(knowledgeId, getQuestionBank()).filter(q => q.exerciseLevel === 'basic');
  if(pool.length === 0) pool = getQuestionsForKnowledge(knowledgeId, getQuestionBank());
  exList = shuffle(pool).slice(0, Math.min(5, pool.length));
  currentExerciseMode = 'route';
  startExerciseSession();
}

function startExerciseSession(){
  exIndex = 0;
  exCorrect = 0;
  showPage('exercise');
  renderExerciseQuestion();
}

function renderExerciseQuestion(){
  const item = exList[exIndex];
  document.getElementById('ex-cat-tag').textContent = categories[item.category].icon + ' ' + categories[item.category].label;
  document.getElementById('ex-level-tag').textContent = LEVEL_LABELS[item.exerciseLevel] || '基礎';
  document.getElementById('ex-progress-text').textContent = '問 ' + (exIndex+1) + ' / ' + exList.length;
  document.getElementById('ex-question').textContent = item.q;

  const stimulusBox = document.getElementById('ex-stimulus');
  if(item.stimulus){
    let html = '';
    if(item.stimulus.text) html += '<p>' + item.stimulus.text.replace(/\n/g, '<br>') + '</p>';
    if(item.stimulus.table){
      html += '<table class="stim-table"><thead><tr>' + item.stimulus.table.headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
        item.stimulus.table.rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    }
    if(item.stimulus.image) html += '<img src="' + item.stimulus.image + '" style="max-width:100%;border-radius:8px;margin-top:8px;">';
    stimulusBox.innerHTML = html;
    stimulusBox.style.display = 'block';
  } else {
    stimulusBox.style.display = 'none';
    stimulusBox.innerHTML = '';
  }

  document.getElementById('ex-explain').style.display = 'none';
  document.getElementById('ex-learning-card-wrap').style.display = 'none';
  document.getElementById('ex-confirm-wrap').style.display = 'none';
  document.getElementById('ex-next-btn').style.display = 'none';
  document.getElementById('ex-next-btn').textContent = (exIndex === exList.length - 1) ? '完了する' : '次の問題へ';
  const box = document.getElementById('ex-choices');
  box.innerHTML = '';
  item.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = () => answerExercise(i);
    box.appendChild(btn);
  });
}

function chipRow(containerId, ids, cls){
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  ids.forEach(id => {
    const chip = document.createElement('span');
    chip.className = 'know-chip' + (cls ? ' ' + cls : '');
    chip.textContent = knowledgeTerm(id);
    chip.onclick = () => openDictKnowledge(id);
    box.appendChild(chip);
  });
}

function answerExercise(i){
  const item = exList[exIndex];
  const buttons = document.querySelectorAll('#ex-choices .choice-btn');
  const correct = (i === item.correct);
  buttons.forEach((b, idx) => {
    b.disabled = true;
    if(idx === item.correct) b.classList.add('correct');
    else if(idx === i) b.classList.add('wrong');
  });
  const badge = document.getElementById('ex-correct-badge');
  if(correct){ exCorrect++; badge.textContent = '✓ 正解'; badge.className = 'correct-badge badge-correct'; }
  else { badge.textContent = '✕ 不正解'; badge.className = 'correct-badge badge-wrong'; }

  document.getElementById('ex-explain-text').textContent = item.explanation || '';
  chipRow('ex-know-chips', item.knowledgeIds, '');

  const prereqWrap = document.getElementById('ex-prereq-wrap');
  if(item.prerequisiteIds && item.prerequisiteIds.length > 0){
    prereqWrap.style.display = 'block';
    chipRow('ex-prereq-chips', item.prerequisiteIds, 'prereq');
  } else { prereqWrap.style.display = 'none'; }

  const relatedWrap = document.getElementById('ex-related-wrap');
  if(item.relatedKnowledgeIds && item.relatedKnowledgeIds.length > 0){
    relatedWrap.style.display = 'block';
    chipRow('ex-related-chips', item.relatedKnowledgeIds, '');
  } else { relatedWrap.style.display = 'none'; }

  document.getElementById('ex-explain').style.display = 'block';
  document.getElementById('ex-learning-card').innerHTML = buildLearningCardHtml(item.knowledgeIds[0]);
  document.getElementById('ex-learning-card-wrap').style.display = 'block';

  recordAnswer(item, correct, currentExerciseMode);
}

/* 「関連する学習カード」の次に、同じ知識を確認する1問だけの確認問題を出す。
   直前に解いた問題とは別の問題があればそちらを優先し、無ければ同じ問題を再利用する（開発者向けエラーは出さない）。 */
function startConfirmationQuestion(){
  const item = exList[exIndex];
  const kId = item.knowledgeIds[0];
  const basicPool = getQuestionsForKnowledge(kId, getQuestionBank()).filter(q => q.exerciseLevel === 'basic' && q.id !== item.id);
  const anyPool = getQuestionsForKnowledge(kId, getQuestionBank()).filter(q => q.id !== item.id);
  const pool = basicPool.length > 0 ? basicPool : (anyPool.length > 0 ? anyPool : [item]);
  const confirmQ = pool[Math.floor(Math.random() * pool.length)];
  currentConfirmQuestion = confirmQ;

  document.getElementById('ex-learning-card-wrap').style.display = 'none';
  document.getElementById('ex-confirm-wrap').style.display = 'block';

  /* 確認問題が刺激文(表・状況設定)を前提とする問題の場合、その刺激文も表示する。
     以前は問題文だけを表示していたため「このセンサー」「この表」等の指示語が
     何を指すか分からなくなるバグがあった（Sprint1で修正）。 */
  const stimulusBox = document.getElementById('ex-confirm-stimulus');
  if(confirmQ.stimulus){
    let html = '';
    if(confirmQ.stimulus.text) html += '<p>' + confirmQ.stimulus.text.replace(/\n/g, '<br>') + '</p>';
    if(confirmQ.stimulus.table){
      html += '<table class="stim-table"><thead><tr>' + confirmQ.stimulus.table.headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
        confirmQ.stimulus.table.rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
    }
    if(confirmQ.stimulus.image) html += '<img src="' + confirmQ.stimulus.image + '" style="max-width:100%;border-radius:8px;margin-top:8px;">';
    stimulusBox.innerHTML = html;
    stimulusBox.style.display = 'block';
  } else {
    stimulusBox.style.display = 'none';
    stimulusBox.innerHTML = '';
  }

  document.getElementById('ex-confirm-question').textContent = confirmQ.q;
  document.getElementById('ex-confirm-feedback').textContent = '';
  const box = document.getElementById('ex-confirm-choices');
  box.innerHTML = '';
  confirmQ.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = () => answerConfirmation(i);
    box.appendChild(btn);

  });
}

function answerConfirmation(i){
  const q = currentConfirmQuestion;
  const correct = (i === q.correct);
  const buttons = document.querySelectorAll('#ex-confirm-choices .choice-btn');
  buttons.forEach((b, idx) => {
    b.disabled = true;
    if(idx === q.correct) b.classList.add('correct');
    else if(idx === i) b.classList.add('wrong');
  });
  document.getElementById('ex-confirm-feedback').textContent = correct ? '正解！しっかり確認できました。' : '不正解でした。学習カードの内容を振り返ってみましょう。';
  recordAnswer(q, correct, 'confirmation');
  document.getElementById('ex-next-btn').style.display = 'inline-block';
}

function nextExercise(){
  exIndex++;
  if(exIndex < exList.length){ renderExerciseQuestion(); }
  else {
    document.getElementById('complete-correct').textContent = exCorrect + '/' + exList.length;
    const h = getStudyHistory();
    h.todayDoneMinutes = Math.min(h.todayGoalMinutes, h.todayDoneMinutes + exList.length * 2);
    const dayIdx = (new Date().getDay() + 6) % 7;
    h.weekDays[dayIdx] = true;
    saveStudyHistory(h);
    saveUserState();
    recordSessionScore(exCorrect, exList.length);

    /* 「解答後」表示：5問終了時に1回だけ、扱った知識に関連するコラムがあれば表示する。
       毎回の1問ごとには表示しない。オプトアウトしている場合は表示しない。 */
    const coveredKnowledgeIds = [...new Set(exList.flatMap(q => q.knowledgeIds))];
    let completeStory = null;
    if(!getTechStoryOptOut()){
      for(const kId of coveredKnowledgeIds){
        const s = selectTechStory({knowledgeId:kId});
        if(s){ completeStory = s; window.__lastCompleteKnowledgeId = kId; break; }
      }
    }
    renderTechStoryCard(completeStory, 'tech-story-complete', 'complete');

    showPage('complete');
  }
}

function finishAndGoHome(){
  updateHomeView();
  showPage('home');
}

/* ===== 「今回はここまで」 ===== */
/* 現在、保存されない一時的な状態（未採点の問題・確認問題の途中）かどうかを判定する */
function checkUnsavedState(){
  const activePage = document.querySelector('.page.active');
  const pageId = activePage ? activePage.id : '';
  if(pageId === 'page-exercise'){
    const confirmWrap = document.getElementById('ex-confirm-wrap');
    const nextBtn = document.getElementById('ex-next-btn');
    if(confirmWrap.style.display === 'block' && nextBtn.style.display !== 'inline-block'){
      return { unsaved:true, label:'確認問題' };
    }
    const explainWrap = document.getElementById('ex-explain');
    if(explainWrap.style.display !== 'block'){
      return { unsaved:true, label:'今の問題' };
    }
  }
  if(pageId === 'page-diagnosis'){
    const nextBtn = document.getElementById('quiz-next-btn');
    if(nextBtn && nextBtn.disabled){
      return { unsaved:true, label:'診断中の問題' };
    }
  }
  return { unsaved:false, label:'' };
}

function openStopConfirm(){
  const state = checkUnsavedState();
  const panel = document.getElementById('stop-panel');
  let html = '';
  if(!state.unsaved){
    html += '<p class="stop-title">今日はここまでにしますか？</p>';
    html += '<ul class="stop-list"><li>今日の学習記録</li><li>診断結果</li><li>演習履歴</li></ul>';
    html += '<p class="stop-sub">は保存されます。</p>';
    html += '<div class="stop-actions"><button class="secondary-btn" onclick="closeStopConfirm()">続ける</button><button class="cta-btn" onclick="confirmStopLearning()">終了する</button></div>';
  } else {
    html += '<p class="stop-title">現在は' + state.label + 'の途中です。</p>';
    html += '<p class="stop-sub">ここで終了すると、この' + state.label + 'は保存されません。</p>';
    html += '<p class="stop-sub-label">保存される内容</p><ul class="stop-list"><li>学習履歴</li><li>診断結果</li></ul>';
    html += '<p class="stop-sub-label">保存されない内容</p><ul class="stop-list"><li>現在の' + state.label + '</li></ul>';
    html += '<div class="stop-actions"><button class="secondary-btn" onclick="closeStopConfirm()">戻る</button><button class="cta-btn" onclick="confirmStopLearning()">終了する</button></div>';
  }
  panel.innerHTML = html;
  document.getElementById('stop-overlay').classList.add('open');
}
function closeStopConfirm(){ document.getElementById('stop-overlay').classList.remove('open'); }
function confirmStopLearning(){
  closeStopConfirm();
  updateHomeView();
  showPage('home');
}

/* ===== dictionary overlay（知識項目ビューア） ===== */
function openDict(){
  document.getElementById('dict-overlay').classList.add('open');
  document.getElementById('dict-search').value = '';
  dictActiveCat = 'all';
  renderDictCats();
  renderDict();
}
function openDictKnowledge(id){
  document.getElementById('dict-overlay').classList.add('open');
  document.getElementById('dict-search').value = knowledgeTerm(id);
  dictActiveCat = 'all';
  renderDictCats();
  renderDict();
}
function closeDict(){ document.getElementById('dict-overlay').classList.remove('open'); }

function renderDictCats(){
  const row = document.getElementById('dict-cat-row');
  row.innerHTML = '';
  const all = document.createElement('span');
  all.className = 'dict-cat-chip' + (dictActiveCat === 'all' ? ' active' : '');
  all.textContent = 'すべて';
  all.onclick = () => { dictActiveCat = 'all'; renderDictCats(); renderDict(); };
  row.appendChild(all);
  Object.keys(categories).forEach(cat => {
    const chip = document.createElement('span');
    chip.className = 'dict-cat-chip' + (dictActiveCat === cat ? ' active' : '');
    chip.textContent = categories[cat].icon + ' ' + categories[cat].label;
    chip.onclick = () => { dictActiveCat = cat; renderDictCats(); renderDict(); };
    row.appendChild(chip);
  });
}

const KNOWLEDGE_SELFCHECK_STORAGE_KEY = 'infonavi_knowledgeSelfChecks';
function getKnowledgeSelfChecks(){
  try{
    const raw = localStorage.getItem(KNOWLEDGE_SELFCHECK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ console.warn('用語の自己確認の記録を読み込めませんでした', e); return {}; }
}
function saveKnowledgeSelfChecks(v){
  try{ localStorage.setItem(KNOWLEDGE_SELFCHECK_STORAGE_KEY, JSON.stringify(v)); }
  catch(e){ console.warn('用語の自己確認の記録を保存できませんでした', e); }
}
/* 診断の正誤・理解度とは完全に別の記録。正誤判定やレベルアップには一切使用しない、生徒自身の振り返り専用。 */
function setKnowledgeSelfCheck(knowledgeId, value){
  const st = getKnowledgeSelfChecks();
  st[knowledgeId] = { canExplain: value, updatedAt: new Date().toISOString() };
  saveKnowledgeSelfChecks(st);
  renderDict();
}
function renderKnowledgeSelfCheck(knowledgeId){
  const st = getKnowledgeSelfChecks()[knowledgeId] || {canExplain:null};
  let html = '<div class="term-selfcheck">';
  html += '<span class="term-selfcheck-q">この用語を30秒で説明できますか？</span>';
  html += '<div class="story-selfcheck-btns">';
  html += '<button class="selfcheck-btn' + (st.canExplain === true ? ' active' : '') + '" onclick="setKnowledgeSelfCheck(\'' + knowledgeId + '\', true)">説明できる</button>';
  html += '<button class="selfcheck-btn' + (st.canExplain === false ? ' active' : '') + '" onclick="setKnowledgeSelfCheck(\'' + knowledgeId + '\', false)">まだ難しい</button>';
  html += '</div></div>';
  return html;
}

/* 学習カードの共通描画（用語辞典・演習中の「関連する学習カード」の両方から呼び出す）。
   Sol Passageは辞典そのものを目指さないため、内容は最小限に留め、
   詳しい説明は「もっと詳しく調べる」で外部サイトへ委ねる。 */
function buildLearningCardHtml(knowledgeId){
  const k = getKnowledgeItems()[knowledgeId];
  if(!k) return '';
  let html = '<div class="learning-card">';
  html += '<div class="lc-eyebrow">📘 小さな授業</div>';
  html += '<div class="lc-term">' + k.term + '</div>';
  html += '<p class="lc-desc">' + k.shortDescription + '</p>';
  if(k.keyPoint) html += '<div class="lc-row"><span class="lc-label">📌 高校情報Ⅰで覚えるポイント</span><p>' + k.keyPoint + '</p></div>';
  if(k.commonMistake) html += '<div class="lc-row"><span class="lc-label">⚠️ よくある勘違い</span><p>' + k.commonMistake + '</p></div>';
  if(k.example) html += '<div class="lc-row"><span class="lc-label">💡 身近な例</span><p>' + k.example + '</p></div>';
  if(k.whereUsed) html += '<div class="lc-row"><span class="lc-label">📍 どこで使われている？</span><p>' + k.whereUsed + '</p></div>';
  if(k.relatedIds && k.relatedIds.length > 0){
    html += '<div class="lc-row"><span class="lc-label">関連用語</span><div class="chip-list-sm">' + dictChipList(k.relatedIds, '') + '</div></div>';
  }
  const stories = getTechStoriesByKnowledgeId(knowledgeId);
  if(k.miniColumn || stories.length > 0){
    html += '<div class="lc-row lc-column"><span class="lc-label">📎 教科書の外、だけど中。</span>';
    if(k.miniColumn) html += '<p>' + k.miniColumn + '</p>';
    if(stories.length > 0){
      html += '<button class="dict-story-link" onclick="openTechStoryFromDict(\'' + stories[0].id + '\')">続きの話を読む：' + stories[0].title + '</button>';
    }
    html += '</div>';
  }
  html += renderReferenceLinkButton(knowledgeId);
  if(k.takeaway){
    html += '<div class="lc-takeaway"><span>今日覚えたい一言</span><p>' + k.takeaway + '</p></div>';
  }
  html += '</div>';
  return html;
}

/* 用語辞典・演習の学習カードから「教科書の外、だけど中。」を開く。閉じても学習を続けられるよう、トップの表示枠を再利用する。 */
function openTechStoryFromDict(storyId){
  const story = TECH_STORIES.find(s => s.id === storyId);
  closeDict();
  goHome();
  if(story) renderTechStoryCard(story, 'tech-story-home', 'home');
}

function dictChipList(ids, cls){
  return ids.map(id => '<span class="chip-sm' + (cls ? ' ' + cls : '') + '" onclick="openDictKnowledge(\'' + id + '\')">' + knowledgeTerm(id) + '</span>').join('');
}

function renderDict(){
  const kw = document.getElementById('dict-search').value.trim();
  const list = document.getElementById('dict-list');
  list.innerHTML = '';
  const items = Object.values(getKnowledgeItems()).filter(k =>
    (dictActiveCat === 'all' || k.category === dictActiveCat) &&
    (kw === '' || k.term.includes(kw) || k.shortDescription.includes(kw))
  );
  if(items.length === 0){
    list.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">該当する知識項目が見つかりません</p>';
    return;
  }
  items.forEach(k => {
    const row = document.createElement('div');
    row.className = 'dict-term';
    let html = buildLearningCardHtml(k.id);
    html += '<div class="dict-meta">上位カテゴリ：' + categories[k.category].icon + ' ' + categories[k.category].label + '</div>';
    if(k.prerequisiteIds.length > 0){
      html += '<div class="dict-sub"><span class="dict-sub-label">前提となる知識</span><div class="chip-list-sm">' + dictChipList(k.prerequisiteIds, 'prereq') + '</div></div>';
    }
    const extLinks = getExternalResourcesForKnowledge(k.id);
    if(extLinks.length > 0){
      html += '<div class="ext-block">' + extLinks.map(renderExternalResourceButton).join('') + '</div>';
    }
    html += renderKnowledgeSelfCheck(k.id);
    html += '<button class="story-btn-primary lc-confirm-btn" onclick="closeDict(); startKnowledgeRoutePractice(\'' + k.id + '\');">確認問題へ進む</button>';
    row.innerHTML = html;
    list.appendChild(row);
  });
}

/* 教師が生徒機で確認するための隠しパネル。URLに ?test=1 を付けたときだけ表示する。 */
function renderDebugPanel(){
  let params;
  try{ params = new URLSearchParams(window.location.search); }catch(e){ return; }
  if(params.get('test') !== '1') return;

  let storageOk = false;
  try{ localStorage.setItem('__infonavi_test__', '1'); localStorage.removeItem('__infonavi_test__'); storageOk = true; }
  catch(e){ storageOk = false; }

  const urlSet = Object.keys(EXTERNAL_RESOURCES).some(id => EXTERNAL_RESOURCES[id] && EXTERNAL_RESOURCES[id].url);
  const storyCount = TECH_STORIES.length;
  let qCount = 0;
  Object.values(getQuestionBank()).forEach(arr => { qCount += arr.length; });

  let div = document.getElementById('debug-panel');
  if(!div){ div = document.createElement('div'); div.id = 'debug-panel'; div.className = 'debug-panel'; document.body.appendChild(div); }

  function update(){
    div.innerHTML =
      '<b>動作確認</b><br>' +
      'localStorage：' + (storageOk ? '利用可能' : '利用不可') + '<br>' +
      '外部教材URL：' + (urlSet ? '設定済み' : '未設定') + '<br>' +
      '記事数：' + storyCount + '件<br>' +
      '問題数：' + qCount + '件<br>' +
      '画面幅：' + window.innerWidth + 'px<br>' +
      'Mode：' + (CONFIG.mode || 'core') + (CONFIG.editionLabel ? ' / ' + CONFIG.editionLabel : '');
  }
  update();
  window.addEventListener('resize', update);
}

/* サイト名・エディションラベル・フッター文言をCONFIGから反映する（school-config.js未読込時はCore既定値のまま）。 */
function applyBranding(){
  const siteName = CONFIG.siteName || 'Sol Passage';
  const subtitle = CONFIG.editionLabel || CONFIG.siteSubtitle || '';
  const footerText = CONFIG.footerText || siteName;
  document.title = siteName + (CONFIG.editionLabel ? ' | ' + CONFIG.editionLabel : '');
  const nameEl = document.getElementById('brand-name-text');
  const subEl = document.getElementById('brand-sub');
  const footerEl = document.getElementById('site-footer');
  if(nameEl) nameEl.textContent = siteName;
  if(subEl) subEl.textContent = subtitle;
  if(footerEl) footerEl.textContent = footerText;
}

/* ===== init ===== */
LEARNING_ROUTES = buildLearningRoutes();
applyBranding();
loadUserState();
updateHomeView();
renderDebugPanel();
