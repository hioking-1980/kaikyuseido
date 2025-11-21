// 【重要】ここに、ご提示いただいたCSVの直リンクURLを貼り付けます
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7lXTJViUKW_BaGSR0Kmku33fn7zpnusbQhVKa4o6Hb2Ahk_I2StGfAiFS_TbKpUg9ft0XAmiNMSN/pub?output=csv'; 

// 階級の定義とデータ (前回と同じ確定版)
const RANKS = [
    { name: '長老', minPoints: 50, maxPoints: Infinity, range: '50点以上', image: 'images/階級-06.jpg', colorClass: 'bg-長老', description: '最も偉い階級で、とにかく頭を下げなければならない。' },
    { name: '名主', minPoints: 40, maxPoints: 49, range: '40〜49点', image: 'images/階級-08.jpg', colorClass: 'bg-名主', description: 'かなりの位の高さで、いつもフカフカの椅子に座ることができる権利を保有' },
    { name: '領主', minPoints: 30, maxPoints: 39, range: '30〜39点', image: 'images/階級-07.jpg', colorClass: 'bg-領主', description: 'とても高貴な位であり、キャビアや高級和牛などをいつも食べている' },
    { name: 'しょう屋', minPoints: 20, maxPoints: 29, range: '20〜29点', image: 'images/階級-09.jpg', colorClass: 'bg-しょう屋', description: 'かなりいいものを食べれるぐらいの位で豊かな感じ' },
    { name: '村長', minPoints: 10, maxPoints: 19, range: '10〜19点', image: 'images/階級-10.jpg', colorClass: 'bg-村長', description: '村人から挨拶をされるくらい、ちょっとだけ偉い' },
    { name: 'その他', minPoints: 1, maxPoints: 9, range: '1〜9点', image: 'images/その他.png', colorClass: 'bg-その他', description: '' }
];

// CSVデータを解析してユーザー配列を生成する関数
function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== ''); // 空行を除去
    if (lines.length === 0) return [];
    
    // ヘッダー行を解析 (名前, 保有個数)
    const headers = lines[0].split(',').map(h => h.trim());
    const nameIndex = headers.indexOf('名前');
    const pointsIndex = headers.indexOf('保有個数');
    
    if (nameIndex === -1 || pointsIndex === -1) {
        console.error("CSVヘッダーに '名前' または '保有個数' が見つかりません。");
        return [];
    }

    const users = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length > pointsIndex) {
            users.push({
                '名前': values[nameIndex],
                '保有個数': values[pointsIndex]
            });
        }
    }
    return users;
}

// ユーザーデータを階級に分類する関数
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

// HTML要素を生成して挿入する関数
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
