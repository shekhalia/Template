const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. Firebase Admin Initialization (V1 API using Service Account)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://gamestore-f35a7-default-rtdb.firebaseio.com" // Aapka Realtime Database URL
        });
        console.log('Firebase Admin successfully initialized.');
    } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', e);
    }
} else {
    console.log('Notice: FIREBASE_SERVICE_ACCOUNT secret set nahi hai.');
}

const gamesFilePath = path.join(__dirname, 'games.json');
if (!fs.existsSync(gamesFilePath)) {
    console.error('Error: games.json file nahi mili!');
    process.exit(1);
}

const games = JSON.parse(fs.readFileSync(gamesFilePath, 'utf8'));
console.log(`Total ${games.length} games successfully load ho chuke hain.`);

function createGameCard(game) {
    const logoPath = game.logo && (game.logo.startsWith('http://') || game.logo.startsWith('https://'))
        ? game.logo
        : `/logo/${game.logo || 'default.png'}`;

    const pkgUrl = `/package/${game.pkg_id}/`;
    
    return `
    <a class="featured__item" href="${pkgUrl}">
        <article class="featured__card">
            <div class="featured__thumb-wrap">
                <img class="featured__thumb" src="${logoPath}" alt="${game.game_name}" loading="lazy" decoding="async" width="180" height="180">
            </div>
            <h3 class="featured__name">${game.game_name}</h3>
        </article>
    </a>`;
}

function createRankGameCard(game, index) {
    const logoPath = game.logo && (game.logo.startsWith('http://') || game.logo.startsWith('https://'))
        ? game.logo
        : `/logo/${game.logo || 'default.png'}`;

    const pkgUrl = `/package/${game.pkg_id}/`;
    const rankClass = index < 3 ? `rank-${index + 1}` : '';
    
    return `
    <a class="rank-item" href="${pkgUrl}">
        <div class="rank-num ${rankClass}">${index + 1}</div>
        <div class="rank-thumb">
            <img src="${logoPath}" alt="${game.game_name}" width="50" height="50" loading="lazy" decoding="async">
        </div>
        <div class="rank-main">
            <div class="rank-title">${game.game_name}</div>
        </div>
    </a>`;
}

// Firebase Notification Function using Realtime Database Tokens
async function sendFirebaseNotification(game) {
    if (!admin.apps.length) {
        console.log('Notice: Firebase app initialized nahi hai, notification skip ki ja rahi hai.');
        return false;
    }

    try {
        const db = admin.database();
        const snapshot = await db.ref('fcm_tokens').once('value');
        if (!snapshot.exists()) {
            console.log('Database mein koi FCM token nahi mila.');
            return false;
        }

        const tokens = [];
        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            if (data && data.token) {
                tokens.push(data.token);
            }
        });

        if (tokens.length === 0) {
            console.log('Token list empty hai.');
            return false;
        }

        const domain = process.env.SITE_DOMAIN || 'https://gamestore-200.pages.dev'; 
        const logoPath = game.logo && (game.logo.startsWith('http://') || game.logo.startsWith('https://'))
            ? game.logo
            : `${domain}/logo/${game.logo || 'default.png'}`;

        const pkgUrl = `${domain}/package/${game.pkg_id}/`;

        const message = {
            notification: {
                title: "New Game Launched!",
                body: `${game.game_name} is now live. Play now!`
            },
            webpush: {
                notification: {
                    icon: logoPath,
                    click_action: pkgUrl
                },
                fcmOptions: {
                    link: pkgUrl
                }
            },
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Notifications successfully sent for: ${game.game_name}. Success count: ${response.successCount}`);
        return true;
    } catch (error) {
        console.error(`Error sending notification request for ${game.game_name}:`, error);
        return false;
    }
}

async function main() {
    // 1. Update Homepage (index.html)
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        let indexHtml = fs.readFileSync(indexPath, 'utf8');
        const newReleases = games.filter(g => g.new_release).slice(0, 24);
        const newReleaseHtml = newReleases.map(createGameCard).join('\n');

        if (indexHtml.includes('<!-- GAMES_START -->') && indexHtml.includes('<!-- GAMES_END -->')) {
            indexHtml = indexHtml.replace(
                /<!-- GAMES_START -->[\s\S]*?<!-- GAMES_END -->/,
                `<!-- GAMES_START -->\n${newReleaseHtml}\n<!-- GAMES_END -->`
            );
            fs.writeFileSync(indexPath, indexHtml, 'utf8');
            console.log('Homepage (index.html) successfully update ho gaya hai!');
        }
    }

    // 2. Update Category Pages
    const uniqueCategories = [...new Set(games.map(g => String(g.category || '').trim()))].filter(Boolean);
    uniqueCategories.forEach(cat => {
        const catPath = path.join(__dirname, cat, 'index.html');
        if (fs.existsSync(catPath)) {
            let catHtml = fs.readFileSync(catPath, 'utf8');
            const catGames = games.filter(g => String(g.category || '').trim() === cat && g.new_release).slice(0, 24);
            const catGamesHtml = catGames.map(createGameCard).join('\n');

            if (catHtml.includes('<!-- GAMES_START -->') && catHtml.includes('<!-- GAMES_END -->')) {
                catHtml = catHtml.replace(
                    /<!-- GAMES_START -->[\s\S]*?<!-- GAMES_END -->/,
                    `<!-- GAMES_START -->\n${catGamesHtml}\n<!-- GAMES_END -->`
                );
                fs.writeFileSync(catPath, catHtml, 'utf8');
                console.log(`Category page (${cat}/index.html) successfully update ho gaya hai!`);
            }
        }
    });

    // 3. Update Package Pages
    games.forEach(game => {
        const pkgDir = path.join(__dirname, 'package', game.pkg_id);
        const pkgHtmlPath = path.join(pkgDir, 'index.html');
        
        if (fs.existsSync(pkgHtmlPath)) {
            let pkgContent = fs.readFileSync(pkgHtmlPath, 'utf8');

            const top12New = games.filter(g => g.new_release).slice(0, 12);
            const newHtml = top12New.map(createGameCard).join('\n');

            const category4 = games.filter(g => String(g.category || '').trim() === String(game.category || '').trim() && g.pkg_id !== game.pkg_id).slice(0, 4);
            const cat4Html = category4.map(createGameCard).join('\n');

            const top12Popular = games.filter(g => g.popular).slice(0, 12);
            const popHtml = top12Popular.map((g, idx) => createRankGameCard(g, idx)).join('\n');

            let updated = false;

            if (pkgContent.includes('<!-- NEW_12_START -->') && pkgContent.includes('<!-- NEW_12_END -->')) {
                pkgContent = pkgContent.replace(/<!-- NEW_12_START -->[\s\S]*?<!-- NEW_12_END -->/, `<!-- NEW_12_START -->\n${newHtml}\n<!-- NEW_12_END -->`);
                updated = true;
            }
            if (pkgContent.includes('<!-- CAT_4_START -->') && pkgContent.includes('<!-- CAT_4_END -->')) {
                pkgContent = pkgContent.replace(/<!-- CAT_4_START -->[\s\S]*?<!-- CAT_4_END -->/, `<!-- CAT_4_START -->\n${cat4Html}\n<!-- CAT_4_END -->`);
                updated = true;
            }
            if (pkgContent.includes('<!-- POP_12_START -->') && pkgContent.includes('<!-- POP_12_END -->')) {
                pkgContent = pkgContent.replace(/<!-- POP_12_START -->[\s\S]*?<!-- POP_12_END -->/, `<!-- POP_12_START -->\n${popHtml}\n<!-- POP_12_END -->`);
                updated = true;
            }

            if (updated) {
                fs.writeFileSync(pkgHtmlPath, pkgContent, 'utf8');
            }
        }
    });

    // 4. Handle Firebase Notifications & Database Tracking (sent_games in Firebase)
    if (admin.apps.length) {
        const db = admin.database();
        const sentSnapshot = await db.ref('sent_games').once('value');
        const sentGamesData = sentSnapshot.exists() ? sentSnapshot.val() : {};

        for (const game of games) {
            // Agar game new_release: true hai AUR Firebase database me pehle se sent nahi hai
            if (game.new_release && !sentGamesData[game.pkg_id]) {
                console.log(`Naya game mila notification ke liye: ${game.game_name} (${game.pkg_id})`);
                
                const success = await sendFirebaseNotification(game);
                if (success) {
                    // Turant Firebase Database me save kar do taaki dobara notification na jaye
                    await db.ref(`sent_games/${game.pkg_id}`).set(true);
                    console.log(`Firebase Realtime Database me save ho gaya: ${game.pkg_id}`);
                }
            }
        }
    }

    console.log('Build process 100% successfully complete ho gaya hai!');
}

main();
