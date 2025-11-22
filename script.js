// Google Sheetsの公開CSVリンク (最新のGIDを反映)
const RANKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_l2StGfAiFS_TbKpUg9ftOXAminMSN/pub?gid=589878966&single=true&output=csv"; 
const INFO_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_l2StGfAiFS_TbKpUg9ftOXAminMSN/pub?gid=1072760862&single=true&output=csv"; 

// 階級の定義とデータ (最終のファイル名に修正)
const RANK_DETAILS = {
    "長老": { min: 50, max: Infinity, desc: "最も偉い階級で、とにかく頭を下げなければならない。", img: "choro-06.png" }, 
    "名主": { min: 40, max: 49, desc: "かなりの位の高さで、いつもフカフカの椅子に座ることができる権利を保有", img: "meish-08.png" },
    "領主": { min: 30, max: 39, desc: "とても高貴な位であり、キャビアや高級和牛などをいつも食べている", img: "ryoushu-07.png" },
    "しょう屋": { min: 20, max: 29, desc: "かなりいいものを食べられるくらいの位で豊かな感じ", img: "shouya-09.png" },
    "村長": { min: 10, max: 19, desc: "村人から挨拶をされるくらい、ちょっとだけ偉い。", img: "soncho-10.png" } 
};

// --- データ処理関数 (CSVを解析する) ---
function parseCSV(csv, isRankingData) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return isRankingData ? [] : {};
    
    // ユーザーランキングデータ（GID=589878966）の解析
    if (isRankingData) {
        const headers = lines[0].split(',').map(h => h.trim());
        // '名前'または'氏名'を探す
        const nameIndex = headers.findIndex(h => h === '氏名' || h === '名前');
        // '保有個数'または'保有点数'を探す
        const pointsIndex = headers.findIndex(h => h === '保有点数' || h === '保有個数');
        
        if (nameIndex === -1 || pointsIndex === -1) {
            console.error("ランキングCSV: 必要なヘッダー ('名前'または'保有個数') が見つかりません。");
            return [];
        }

        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const name = values[nameIndex];
            const count = parseInt(values[pointsIndex], 10);
            
            // 名前があり、個数が有効な数値であれば追加
            if (name && !isNaN(count)) {
                users.push({ name, count });
            }
        }
        return users;
    } 
    
    // ホルダー数/フロア価格データ（GID=1072760862）の解析
    else {
        // CSVの3行目と4行目から値を取得（B列 = インデックス1）
        if (lines.length >= 4) { 
            const holderRow = lines[2].split(',').map(v => v.trim()); 
            const floorRow = lines[3].split(',').map(v => v.trim());   
            
            return {
                holderCount: holderRow[1] || '---',
                floorPrice: floorRow[1] || '---'
            };
        }
        return {};
    }
}

function classifyUsers(users) {
    const classifiedData = {};
    // 階級オブジェクトを初期化
    Object.keys(RANK_DETAILS).forEach(key => { classifiedData[key] = { ...RANK_DETAILS[key], users: [] }; });

    users.forEach(user => {
        const count = user.count;
        const name = user.name;
        if (isNaN(count) || !name) return;

        let rankName = null;
        for (const key in RANK_DETAILS) {
            const detail = RANK_DETAILS[key];
            // 階級範囲の判定
            if (count >= detail.min && (detail.max === Infinity || count <= detail.max)) {
                rankName = key;
                break;
            }
        }
        if (rankName && classifiedData[rankName]) {
            classifiedData[rankName].users.push({ name, count });
        }
    });
    return classifiedData;
}

function updateTopInfo(infoData) {
    try {
        const holderEl = document.getElementById('holder-count');
        const priceEl = document.getElementById('floor-price');

        if (holderEl && priceEl) { 
            // データが存在する場合のみ更新
            if (infoData.holderCount && infoData.holderCount !== '---') {
                holderEl.textContent = infoData.holderCount + '人';
            }
            if (infoData.floorPrice && infoData.floorPrice !== '---') {
                priceEl.textContent = infoData.floorPrice + 'ETH';
            }
        }
    } catch (error) {
        console.error("情報データの処理中にエラーが発生しました:", error);
    }
}

function renderRankBlocks(classifiedData) {
    const container = document.getElementById('rank-container');
    const topBlock = document.querySelector('.info-block-top');
    
    // トップ情報ブロックのみを残して、以前挿入されたランキングをクリア
    if (container && topBlock) {
        let child = container.lastElementChild;
        while (child) {
            if (child !== topBlock) {
                container.removeChild(child);
            }
            child = container.lastElementChild;
        }
    } else {
         // rank-containerが見つからない場合は終了
        return;
    }

    // 定義済みの階級名の順番でブロックを生成
    for (const rankName of Object.keys(RANK_DETAILS)) {
        const detail = RANK_DETAILS[rankName];
        const users = classifiedData[rankName].users || [];
        
        // 保有数が多い順にソート
        users.sort((a, b) => b.count - a.count);
        
        const userListHTML = users.map(user => 
            `<li>${user.name} (${user.count}点)</li>`
        ).join('');

        const listContent = users.length > 0 ? userListHTML : '該当者なし';
        const rangeText = `${detail.min}${detail.max === Infinity ? '点以上' : '〜' + detail.max + '点'}`;

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

// --- データ取得と初期化 (fetch APIを使用) ---
async function init() {
    
    // 1. ユーザーランキングデータの取得とレンダリング
    try {
        const rankingResponse = await fetch(RANKING_CSV_URL);
        const rankingCsvText = await rankingResponse.text();
        const users = parseCSV(rankingCsvText, true); 
        const classifiedData = classifyUsers(users);
        renderRankBlocks(classifiedData);
    } catch (error) {
        console.error("ユーザーランキングデータの処理中にエラーが発生しました:", error);
    }
    
    // 2. ホルダー数/フロア価格データの取得とトップ表示の更新
    try {
        const infoResponse = await fetch(INFO_CSV_URL);
        const infoCsvText = await infoResponse.text();
        const infoData = parseCSV(infoCsvText, false);
        updateTopInfo(infoData);
    } catch (error) {
        console.error("情報データの処理中にエラーが発生しました:", error);
    }
}

// ページロードが完了したらinit関数を実行
document.addEventListener('DOMContentLoaded', init);
