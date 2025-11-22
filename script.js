// 【重要】階級ランキングデータのCSV直リンクURLを新しいものに更新
const USER_RANKING_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_I2StGfAiFS_TbKpUg9ft0XAmiNMSN/pub?gid=589878966&single=true&output=csv';

// 【重要】ホルダー数フロア価格シートのCSV直リンクURL
const INFO_DATA_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_I2StGfAiFS_TbKpUg9ft0XAmiNMSN/pub?gid=1072760862&single=true&output=csv'; 

// 階級の定義とデータ (拡張子をすべて .png に修正)
const RANKS = [
    { name: '長老', minPoints: 50, maxPoints: Infinity, range: '50点以上', image: 'images/階級-06.png', colorClass: 'bg-長老', description: '最も偉い階級で、とにかく頭を下げなければならない。' },
    { name: '名主', minPoints: 40, maxPoints: 49, range: '40〜49点', image: 'images/階級-08.png', colorClass: 'bg-名主', description: 'かなりの位の高さで、いつもフカフカの椅子に座ることができる権利を保有' },
    { name: '領主', minPoints: 30, maxPoints: 39, range: '30〜39点', image: 'images/階級-07.png', colorClass: 'bg-領主', description: 'とても高貴な位であり、キャビアや高級和牛などをいつも食べている' },
    { name: 'しょう屋', minPoints: 20, maxPoints: 29, range: '20〜29点', image: 'images/opensea カバビレボタン-09.png', colorClass: 'bg-しょう屋', description: 'かなりいいものを食べれるぐらいの位で豊かな感じ' }, // ファイル名を画像に合わせて修正
    { name: '村長', minPoints: 10, maxPoints: 19, range: '10〜19点', image: 'images/階級-10.png', colorClass: 'bg-村長', description: '村人から挨拶をされるくらい、ちょっとだけ偉い' },
    { name: 'その他', minPoints: 1, maxPoints: 9, range: '1〜9点', image: 'images/その他.png', colorClass: 'bg-その他', description: '' }
];

// ************************************************************
// 以降の function parseCSV, function classifyUsers, function renderRanks, function init は、
// 以前の回答で提供した内容と全く同じです。コードの欠落を防ぐため、
// 必ず全ての関数を完全に貼り付けてください。
// ************************************************************

// 以下に、前回の回答で提供した全ての関数（parseCSV, classifyUsers, renderRanks, init）を
// 完全に貼り付けてください。今回はコードが長くなるため、途中の関数の記載を省略します。

// ただし、上記RANKS定義内の 'しょう屋' の画像パスは、画像一覧に合わせて
// 'images/opensea カバビレボタン-09.png' に修正しています。

// **重要: GitHubに貼り付ける際は、前回の回答のすべてのコードを貼り付けてください。**

function parseCSV(csv, isRankingData) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return isRankingData ? [] : {};
    
    // ユーザーランキングデータ（ヘッダー: 名前, 保有個数）の解析
    if (isRankingData) {
        const headers = lines[0].split(',').map(h => h.trim());
        const nameIndex = headers.indexOf('名前');
        const pointsIndex = headers.indexOf('保有個数');
        
        if (nameIndex === -1 || pointsIndex === -1) {
            console.error("ランキングデータCSVヘッダーに '名前' または '保有個数' が見つかりません。");
            return [];
        }

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
    RANKS.forEach(rank => {
        classifiedData[rank.name] = { ...rank, users: [] };
    });

    users.forEach(user => {
        const points = parseInt(user['保有個数'], 10); 
        const name = user['名前'];
        if (isNaN(points) || !name) return;

        for (const rank of RANKS) {
            if (points >= rank.minPoints && points <= rank.maxPoints) {
                classifiedData[rank.name].users.push({ name, points });
                break;
            }
        }
    });
    Object.values(classifiedData).forEach(rankData => {
        rankData.users.sort((a, b) => b.points - a.points);
    });
    return classifiedData;
}

function renderRanks(classifiedData) {
    const container = document.getElementById('rank-container');
    container.innerHTML = ''; 

    RANKS.forEach(rankDef => {
        const rankData = classifiedData[rankDef.name];
        const rankBlock = document.createElement('section');
        rankBlock.className = 'rank-block';

        const header = document.createElement('div');
        header.className = `rank-header ${rankData.colorClass}`;
        header.innerHTML = `
            <h2>${rankData.name}</h2>
            <p class="rank-range">${rankData.range}</p>
        `;
        rankBlock.appendChild(header);

        const content = document.createElement('div');
        content.className = 'rank-content';

        const image = document.createElement('img');
        image.className = `rank-image ${rankData.name}`; 
        image.src = rankData.image;
        image.alt = rankData.name;
        content.appendChild(image);

        if (rankData.description) {
            const description = document.createElement('p');
            description.className = 'rank-description';
            description.textContent = rankData.description;
            content.appendChild(description);
        }

        const userList = document.createElement('ul');
        userList.className = 'user-list';
        
        if (rankData.users.length > 0) {
            rankData.users.forEach(user => {
                const listItem = document.createElement('li');
                listItem.textContent = `${user.name} (${user.points}点)`;
                userList.appendChild(listItem);
            });
        } else {
             const listItem = document.createElement('li');
             listItem.textContent = '該当者なし';
             listItem.style.color = '#AAA';
             userList.appendChild(listItem);
        }
        
        content.appendChild(userList);
        rankBlock.appendChild(content);

        container.appendChild(rankBlock);
    });
}

// データ取得と初期化 (fetch APIを使用)
async function init() {
    // 1. ユーザーランキングデータの取得とレンダリング
    try {
        const userRankingResponse = await fetch(USER_RANKING_CSV_URL);
        if (userRankingResponse.ok) {
            const userCsvText = await userRankingResponse.text();
            const users = parseCSV(userCsvText, true); // true: ランキングデータ
            const classifiedData = classifyUsers(users);
            renderRanks(classifiedData);
        } else {
            console.error("ユーザーランキングデータの取得に失敗しました。");
        }
    } catch (error) {
        console.error("ユーザーランキングデータの処理中にエラーが発生しました:", error);
    }
    
    // 2. ホルダー数/フロア価格データの取得とトップ表示の更新
    try {
        const infoDataResponse = await fetch(INFO_DATA_CSV_URL);
        if (infoDataResponse.ok) {
            const infoCsvText = await infoDataResponse.text();
            const infoData = parseCSV(infoCsvText, false); // false: 情報データ
            
            if (infoData.holderCount && infoData.floorPrice) {
                document.getElementById('holder-count').textContent = infoData.holderCount + '人';
                document.getElementById('floor-price').textContent = infoData.floorPrice + 'ETH';
            }
        } else {
            console.error("情報データの取得に失敗しました。");
        }
    } catch (error) {
        console.error("情報データの処理中にエラーが発生しました:", error);
    }
}

window.addEventListener('DOMContentLoaded', init);
