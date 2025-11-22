// Google Sheetsの公開CSVリンク
// gid=0 : 階級ランキングデータ
const RANKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_l2StGfAiFS_TbKpUg9ftOXAminMSN/pub?gid=0&single=true&output=csv";
// gid=589878966 : ホルダー数とフロア価格データ
const INFO_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_l2StGfAiFS_TbKpUg9ftOXAminMSN/pub?gid=589878966&single=true&output=csv";

// 階級の定義とデータ (画像拡張子.jpg/pngの混在に対応)
const RANK_DETAILS = {
    "長老": { min: 50, max: Infinity, desc: "最も偉い階級で、とにかく頭を下げなければならない。", img: "階級-06.jpg" },
    "名主": { min: 40, max: 49, desc: "かなりの位の高さで、いつもフカフカの椅子に座ることができる権利を保有", img: "階級-08.jpg" },
    "領主": { min: 30, max: 39, desc: "とても高貴な位であり、キャビアや高級和牛などをいつも食べている", img: "階級-07.jpg" },
    "しょう屋": { min: 20, max: 29, desc: "かなりいいものを食べられるくらいの位で豊かな感じ", img: "shouya-09.png" }, // ファイル名修正済み
    "村長": { min: 10, max: 19, desc: "村人から挨拶をされるくらい、ちょっとだけ偉い", img: "階級-10.jpg" }
    // 「その他」の階級は削除済み
};

// 階級データを保持するオブジェクト
let Ranks = {
    "長老": [], "名主": [], "領主": [], "しょう屋": [], "村長": []
};

// --- 初期化関数 (データ取得) ---
function init() {
    
    // 1. 階級ランキングデータの取得
    Tabletop.init({
        key: RANKING_CSV_URL,
        callback: function(data, tabletop) {
            processRankingData(data);
            renderRankBlocks(); // ランキングデータ取得後にブロックを生成
        },
        simpleSheet: true // 1行目をヘッダーとして処理
    });

    // 2. ホルダー数/フロア価格データの取得
    Tabletop.init({
        key: INFO_CSV_URL,
        callback: function(data, tabletop) {
            updateTopInfo(data); // トップ情報を更新
        },
        simpleSheet: true // 1行目をヘッダーとして処理
    });
}

// --- データ処理関数 ---

/**
 * ランキングCSVデータを処理し、Ranksオブジェクトに格納する
 * @param {Array<Object>} data - Tabletopから取得したデータ
 */
function processRankingData(data) {
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const name = row['氏名'] || row['名前']; 
        const count = parseInt(row['保有点数'] || row['保有個数'], 10); 
        
        if (!name || isNaN(count)) continue;

        let rankName = null; // 該当する階級名
        for (const key in RANK_DETAILS) {
            const detail = RANK_DETAILS[key];
            if (count >= detail.min && (detail.max === Infinity || count <= detail.max)) {
                rankName = key;
                break;
            }
        }

        if (rankName && Ranks[rankName]) {
            Ranks[rankName].push({ name, count });
        }
    }
}

/**
 * ホルダー数とフロア価格のCSVデータを処理し、トップ情報を更新する
 * @param {Array<Object>} data - Tabletopから取得したデータ
 */
function updateTopInfo(data) {
    try {
        if (data.length > 0) {
            // スプレッドシートの構造に基づき、値を適切に取得します。
            let holderCount = data[0]['保有者数'] || data[0]['名前'] || '---'; 
            let floorPrice = data[1] ? (data[1]['最安価格'] || data[1]['名前'] || '---') : '---';

            // ★エラー対策: IDを持つ要素が存在するか確認してからtextContentを設定
            const holderEl = document.getElementById('holder-count');
            const priceEl = document.getElementById('floor-price');

            if (holderEl && priceEl) { // 要素がnullではないことを確認
                if (holderCount && holderCount !== '---') {
                    holderEl.textContent = holderCount + '人';
                }
                if (floorPrice && floorPrice !== '---') {
                    priceEl.textContent = floorPrice + 'ETH';
                }
            } else {
                 console.error("エラー回避: 'holder-count' または 'floor-price' 要素がDOMにまだ見つかりません。");
            }
        }
    } catch (error) {
        // エラーをコンソールに出力するだけで、プログラムは停止しない
        console.error("情報データの処理中にエラーが発生しました:", error);
    }
}

// --- HTML生成関数 ---

/**
 * 階級データに基づいてHTMLブロックを生成し、メインコンテナに追加する
 */
function renderRankBlocks() {
    const container = document.getElementById('rank-container');
    
    // 描画前に、トップ情報ブロック以外の内容をクリア
    const topBlock = document.querySelector('.info-block-top');
    if (topBlock) {
        // トップブロックを一時的に保持し、再挿入することでDOM上の位置を維持
        const childrenToKeep = [topBlock];
        container.innerHTML = '';
        childrenToKeep.forEach(child => container.appendChild(child));
    } else {
        container.innerHTML = ''; 
    }

    // 定義済みの階級名の順番でブロックを生成
    for (const rankName of Object.keys(RANK_DETAILS)) {
        const detail = RANK_DETAILS[rankName];
        const users = Ranks[rankName] || [];
        
        // ユーザーリストのHTMLを生成 (保有数順にソート)
        users.sort((a, b) => b.count - a.count);
        const userListHTML = users.map(user => 
            `<li>${user.name} (${user.count}点)</li>`
        ).join('');

        // 該当者がいない場合のメッセージ
        const listContent = users.length > 0 ? userListHTML : '該当者なし';
        
        // 範囲表示のテキストを生成
        const rangeText = `${detail.min}${detail.max === Infinity ? '点以上' : '〜' + detail.max + '点'}`;

        // 階級ブロック全体を生成
        const rankBlockHTML = `
            <div class="rank-block">
                <div class="rank-header bg-${rankName}">
                    <h2>${rankName}</h2>
                    <div class="rank-range">${rangeText}</div>
                </div>
                <div class="rank-content">
                    <img src="images/${detail.img}" alt="${rankName}の画像" class="rank-image ${rankName}">
                    <p class="rank-description">${detail.desc}</p>
                    <ul class="user-list">
                        ${listContent}
                    </ul>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', rankBlockHTML);
    }
}

// ページロードが完了したらinit関数を実行
document.addEventListener('DOMContentLoaded', init);
