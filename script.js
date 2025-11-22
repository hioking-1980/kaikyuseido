// Google Sheetsの公開CSVリンク (最新のGIDを反映)
const RANKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_l2StGfAiFS_TbKpUg9ftOXAminMSN/pub?gid=589878966&single=true&output=csv"; 
const INFO_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_l2StGfAiFS_TbKpUg9ftOXAminMSN/pub?gid=1072760862&single=true&output=csv"; 

// 階級の定義とデータ
const RANK_DETAILS = {
    "長老": { min: 50, max: Infinity, desc: "最も偉い階級で、とにかく頭を下げなければならない。", img: "階級-06.jpg" },
    "名主": { min: 40, max: 49, desc: "かなりの位の高さで、いつもフカフカの椅子に座ることができる権利を保有", img: "階級-08.jpg" },
    "領主": { min: 30, max: 39, desc: "とても高貴な位であり、キャビアや高級和牛などをいつも食べている", img: "階級-07.jpg" },
    "しょう屋": { min: 20, max: 29, desc: "かなりいいものを食べられるくらいの位で豊かな感じ", img: "shouya-09.png" },
    "村長": { min: 10, max: 19, desc: "村人から挨拶をされるくらい、ちょっとだけ偉い。", img: "階級-10.jpg" }
};

let Ranks = {
    "長老": [], "名主": [], "領主": [], "しょう屋": [], "村長": []
};

// --- 初期化関数 (データ取得) ---
function init() {
    
    // 1. 階級ランキングデータの取得
    // Tabletop.jsがindex.htmlで読み込まれている前提
    Tabletop.init({
        key: RANKING_CSV_URL,
        callback: function(data, tabletop) {
            processRankingData(data);
            renderRankBlocks(); // ランキングデータ取得後にブロックを生成
        },
        simpleSheet: true 
    });

    // 2. ホルダー数/フロア価格データの取得
    Tabletop.init({
        key: INFO_CSV_URL,
        callback: function(data, tabletop) {
            updateTopInfo(data); // トップ情報を更新
        },
        simpleSheet: true 
    });
}

// --- データ処理関数 ---

function processRankingData(data) {
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const name = row['氏名'] || row['名前']; 
        const count = parseInt(row['保有点数'] || row['保有個数'], 10); 
        
        if (!name || isNaN(count)) continue;

        let rankName = null;
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

function updateTopInfo(data) {
    try {
        if (data.length > 0) {
            let holderCount = data[0]['保有者数'] || data[0]['名前'] || '---'; 
            let floorPrice = data[1] ? (data[1]['最安価格'] || data[1]['名前'] || '---') : '---';

            const holderEl = document.getElementById('holder-count');
            const priceEl = document.getElementById('floor-price');

            if (holderEl && priceEl) { 
                if (holderCount && holderCount !== '---') {
                    holderEl.textContent = holderCount + '人';
                }
                if (floorPrice && floorPrice !== '---') {
                    priceEl.textContent = floorPrice + 'ETH';
                }
            }
        }
    } catch (error) {
        console.error("情報データの処理中にエラーが発生しました:", error);
    }
}

// --- HTML生成関数 (完全なコード) ---

function renderRankBlocks() {
    const container = document.getElementById('rank-container');
    
    // トップ情報ブロック以外の内容をクリア
    const topBlock = document.querySelector('.info-block-top');
    if (topBlock) {
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
