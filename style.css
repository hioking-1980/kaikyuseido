// Google スプレッドシートのキー
const SPREADSHEET_KEY = '1OYnaYgpY-K9JwU-DGIu8aJ72URl91CLLyxiNDNd-n_g';

// 階級の定義とデータ (最新版)
const RANKS = [
    {
        name: '長老', 
        minPoints: 50, 
        maxPoints: Infinity, 
        range: '50点以上', 
        image: 'images/階級-06.jpg', 
        colorClass: 'bg-長老', 
        description: '最も偉い階級で、とにかく頭を下げなければならない。'
    },
    {
        name: '名主', 
        minPoints: 40, 
        maxPoints: 49, 
        range: '40〜49点', 
        image: 'images/階級-08.jpg', 
        colorClass: 'bg-名主', 
        description: 'かなりの位の高さで、いつもフカフカの椅子に座ることができる権利を保有'
    },
    {
        name: '領主', 
        minPoints: 30, 
        maxPoints: 39, 
        range: '30〜39点', 
        image: 'images/階級-07.jpg', 
        colorClass: 'bg-領主', 
        description: 'とても高貴な位であり、キャビアや高級和牛などをいつも食べている'
    },
    {
        name: 'しょう屋', 
        minPoints: 20, 
        maxPoints: 29, 
        range: '20〜29点', 
        image: 'images/階級-09.jpg', // 正しいファイル名
        colorClass: 'bg-しょう屋', 
        description: 'かなりいいものを食べれるぐらいの位で豊かな感じ'
    },
    {
        name: '村長', 
        minPoints: 10, 
        maxPoints: 19, 
        range: '10〜19点', 
        image: 'images/階級-10.jpg', 
        colorClass: 'bg-村長', 
        description: '村人から挨拶をされるくらい、ちょっとだけ偉い'
    },
    {
        name: 'その他', 
        minPoints: 1, 
        maxPoints: 9, 
        range: '1〜9点', 
        image: 'images/その他.png', 
        colorClass: 'bg-その他', 
        description: '' 
    }
];

// ユーザーデータを階級に分類する関数
function classifyUsers(users) {
    const classifiedData = {};
    RANKS.forEach(rank => {
        classifiedData[rank.name] = {
            ...rank,
            users: []
        };
    });

    users.forEach(user => {
        // スプレッドシートのヘッダーが「保有個数」と「名前」であることを想定
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

    // 各階級内のユーザーを点数順にソート（降順）
    Object.values(classifiedData).forEach(rankData => {
        rankData.users.sort((a, b) => b.points - a.points);
    });

    return classifiedData;
}

// HTML要素を生成して挿入する関数
function renderRanks(classifiedData) {
    const container = document.getElementById('rank-container');
    container.innerHTML = ''; 

    RANKS.forEach(rankDef => {
        const rankData = classifiedData[rankDef.name];

        const rankBlock = document.createElement('section');
        rankBlock.className = 'rank-block';

        // 階級ヘッダー
        const header = document.createElement('div');
        header.className = `rank-header ${rankData.colorClass}`;
        header.innerHTML = `
            <h2>${rankData.name}</h2>
            <p class="rank-range">${rankData.range}</p>
        `;
        rankBlock.appendChild(header);

        // 階級コンテンツ
        const content = document.createElement('div');
        content.className = 'rank-content';

        // 画像
        const image = document.createElement('img');
        image.className = `rank-image ${rankData.name}`; 
        image.src = rankData.image;
        image.alt = rankData.name;
        content.appendChild(image);

        // 説明文
        if (rankData.description) {
            const description = document.createElement('p');
            description.className = 'rank-description';
            description.textContent = rankData.description;
            content.appendChild(description);
        }

        // ユーザーリスト
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

// Tabletop.js の初期化とデータ取得
function init() {
    Tabletop.init({
        key: SPREADSHEET_KEY,
        callback: function(data, tabletop) {
            // スプレッドシートの最初のシート（Sheet1を想定）のデータを取得
            const users = tabletop.sheets('Sheet1').elements; 
            
            // データを分類
            const classifiedData = classifyUsers(users);
            
            // HTMLにレンダリング
            renderRanks(classifiedData);
        },
        simpleSheet: true 
    });
}

// ページロード時に実行
window.addEventListener('DOMContentLoaded', init);
