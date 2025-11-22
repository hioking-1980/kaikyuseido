// Google Sheetsの公開CSVリンク (最新のGIDを反映)
const RANKING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_l2StGfAiFS_TbKpUg9ftOXAminMSN/pub?gid=589878966&single=true&output=csv"; 
const INFO_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_l2StGfAiFS_TbKpUg9ftOXAminMSN/pub?gid=1072760862&single=true&output=csv"; 

// 階級の定義とデータ
const RANK_DETAILS = {
    "長老": { min: 50, max: Infinity, desc: "最も偉い階級で、とにかく頭を下げなければならない。", img: "階級-06.png" },
    "名主": { min: 40, max: 49, desc: "かなりの位の高さで、いつもフカフカの椅子に座ることができる権利を保有", img: "階級-08.png" },
    "領主": { min: 30, max: 39, desc: "とても高貴な位であり、キャビアや高級和牛などをいつも食べている", img: "階級-07.png" },
    "しょう屋": { min: 20, max: 29, desc: "かなりいいものを食べられるくらいの位で豊かな感じ", img: "shouya-09.png" },
    "村長": { min: 10, max: 19, desc: "村人から挨拶をされるくらい、ちょっとだけ偉い。", img: "階級-10.png" }
};


// --- データ処理関数 (CSVを解析する) ---
function parseCSV(csv, isRankingData) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return isRankingData ? [] : {};
    
    // ユーザーランキングデータ（ヘッダー: 名前, 保有個数）の解析
    if (isRankingData) {
        const headers = lines[0].split(',').map(h => h.trim());
        const nameIndex = headers.indexOf('名前');
        const pointsIndex = headers.indexOf('保有個数');
        
        if (nameIndex === -1 || pointsIndex === -1) return [];

        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length > pointsIndex && values[nameIndex] && values[pointsIndex]) {
                users.push({ '名前': values[nameIndex], '保有個数': values[pointsIndex] });
            }
        }
        return users;
    } 
    
    // ホルダー数/フロア価格データ（セル位置: B3, B4）の解析
    else {
        if (lines.length >= 4) { 
            const holderRow = lines[2].split(',').map(v => v.trim()); 
            const floorRow = lines[3].split(',').map(v => v.trim());   
            
            return {
                holderCount: holderRow[1] || '',
                floorPrice: floorRow[1] || ''
            };
        }
        return {};
    }
}

function classifyUsers(users) {
    const classifiedData = {};
    Object.keys(RANK_DETAILS).forEach(key => { classifiedData[key] = { ...RANK_DETAILS[key], users: [] }; });

    users.forEach(user => {
        const points = parseInt(user['保有個数'], 10); 
        const name = user['名前'];
        if (isNaN(points) || !name) return;

        let rankName = null;
        for (const key in RANK_DETAILS) {
            const detail = RANK_DETAILS[key];
            if (points >= detail.min && (detail.max === Infinity || points <= detail.max)) {
                rankName = key;
                break;
            }
        }
        if (rankName && classifiedData[rankName]) {
            classifiedData[rankName].users.push({ name, points });
        }
    });
    return classifiedData;
}

function updateTopInfo(infoData) {
    try {
        const holderEl = document.getElementById('holder-count');
        const priceEl = document.getElementById('floor-price');

        if (holderEl && priceEl) { 
            if (infoData.holderCount) {
                holderEl.textContent = infoData.holderCount + '人';
            }
            if (infoData.floorPrice) {
                priceEl.textContent = infoData.floorPrice + 'ETH';
            }
        }
    } catch (error) {
        console.error("情報データの処理中にエラーが発生しました:", error);
    }
}

// --- HTML生成関数 (前回の完全版) ---
function renderRankBlocks(classifiedData) {
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
        const users = classifiedData[rankName].users || [];
        
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
