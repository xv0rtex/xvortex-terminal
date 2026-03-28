const pages = {
    'http://target.local/': `
        <div class="sim-page">
            <h2>Welcome to CorpNet</h2>
            <p>This is the main intranet portal. Please navigate using the links below.</p>
            <ul>
                <li><a href="#" onclick="navigateBrowser('http://target.local/about')">About Us</a></li>
                <li><a href="#" onclick="navigateBrowser('http://target.local/contact')">Contact Support</a></li>
            </ul>
            <!-- FLAG_PART_1: CTF{h1dd3n_ -->
        </div>
    `,
    'http://target.local/about': `
        <div class="sim-page">
            <h2>About Us</h2>
            <p>We are a leading tech company.</p>
            <p>Our CEO is Mr. Robot.</p>
            
            <div style="margin-top: 20px; border: 1px solid #ccc; padding: 10px;">
                <h3>ImageViewer</h3>
                <img src="/favicon.png" alt="Company Logo" style="width: 100px; display: block; margin-bottom: 10px;">
                <p style="font-size: 0.8em; color: #666;">There is something hidden in this image. Use OSINT tools in the terminal.</p>
            </div>
            <br>
            <a href="#" onclick="navigateBrowser('http://target.local/')">Back to Home</a>
        </div>
    `,
    'http://target.local/contact': `
        <div class="sim-page">
            <h2>Contact Support</h2>
            <form onsubmit="event.preventDefault(); alert('Message sent!');">
                <label>Email:</label><br>
                <input type="email" required><br><br>
                <label>Message:</label><br>
                <textarea required></textarea><br><br>
                <button type="submit">Send</button>
            </form>
            <br>
            <a href="#" onclick="navigateBrowser('http://target.local/')">Back to Home</a>
        </div>
    `
};

const validFragmentsList = ['CTF{h1dd3n_', 'c00k135_', 'pr0mpt_1ny3ct10n_', '3x1f_d4t4}'];
let inventory = JSON.parse(localStorage.getItem('hackInventory')) || [];
// Clean up old/invalid flags from previous versions
inventory = inventory.filter(f => validFragmentsList.includes(f));
localStorage.setItem('hackInventory', JSON.stringify(inventory));
const TOTAL_FRAGMENTS = 4;
let devToolsOpen = false;
let currentTab = 'elements';

let startTime = null;
let timerInterval = null;
let ctfStarted = false;
let finalTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    navigateBrowser('http://target.local/');
    renderInventory();
    
    // Check if game was already started
    const savedStartTime = localStorage.getItem('hackStartTime');
    if (savedStartTime) {
        ctfStarted = true;
        startTime = parseInt(savedStartTime);
        document.getElementById('start-overlay').style.display = 'none';
        document.getElementById('ctf-game-area').style.display = 'block';
        startTimer();
    } else {
        document.getElementById('start-overlay').style.display = 'flex';
        document.getElementById('ctf-game-area').style.display = 'none';
        fetchAndRenderLeaderboard('start-leaderboard-list');
    }
});

function startCTF() {
    ctfStarted = true;
    startTime = Date.now();
    localStorage.setItem('hackStartTime', startTime.toString());
    
    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('ctf-game-area').style.display = 'block';
    
    startTimer();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const now = Date.now();
        const diff = now - startTime;
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        const ms = Math.floor((diff % 1000) / 10);
        
        document.getElementById('timer-display').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }, 50);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (startTime) {
        finalTime = Date.now() - startTime;
        return finalTime;
    }
    return 0;
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

function navigateBrowser(url) {
    const inputUrl = url || document.getElementById('browser-url').value;
    document.getElementById('browser-url').value = inputUrl;
    
    const content = document.getElementById('browser-content');
    if (pages[inputUrl]) {
        content.innerHTML = pages[inputUrl];
    } else {
        content.innerHTML = `<div class="sim-page"><h2>404 Not Found</h2><p>The page ${inputUrl} does not exist.</p><a href="#" onclick="navigateBrowser('http://target.local/')">Back to Home</a></div>`;
    }

    if (devToolsOpen) {
        renderDevTools();
    }
}

// --- DevTools Logic ---
function toggleDevTools() {
    const devTools = document.getElementById('simulated-devtools');
    devToolsOpen = !devToolsOpen;
    devTools.style.display = devToolsOpen ? 'flex' : 'none';
    if (devToolsOpen) {
        renderDevTools();
    }
}

function switchDevToolsTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.devtools-tab').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    renderDevTools();
}

function renderDevTools() {
    const content = document.getElementById('devtools-content');
    if (currentTab === 'elements') {
        const url = document.getElementById('browser-url').value;
        const rawHTML = pages[url] || '<html><body>404</body></html>';
        
        // Very basic syntax highlighting for HTML
        let formatted = rawHTML
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/&lt;!--(.*?)--&gt;/g, '<span class="html-node">&lt;!--$1--&gt;</span>')
            .replace(/&lt;([a-z0-9]+)(.*?)&gt;/gi, (match, tag, attrs) => {
                let formattedAttrs = attrs.replace(/([a-z-]+)="([^"]*)"/gi, ' <span class="html-attr">$1</span>=<span class="html-string">"$2"</span>');
                return `&lt;<span class="html-tag">${tag}</span>${formattedAttrs}&gt;`;
            })
            .replace(/&lt;\/([a-z0-9]+)&gt;/gi, '&lt;/<span class="html-tag">$1</span>&gt;');

        content.innerHTML = `<pre style="margin:0; background:transparent; border:none; color:#d4d4d4;">${formatted}</pre>`;
    } else if (currentTab === 'application') {
        content.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #444; padding-bottom: 5px;">Cookies (target.local)</div>
            <div class="cookie-item">
                <div class="cookie-name">session_id</div>
                <div class="cookie-value">8f9a2b3c4d5e6f7g</div>
            </div>
            <div class="cookie-item">
                <div class="cookie-name">user_pref</div>
                <div class="cookie-value">dark_mode</div>
            </div>
            <div class="cookie-item">
                <div class="cookie-name">admin_token</div>
                <div class="cookie-value">FLAG_PART_2: c00k135_</div>
            </div>
        `;
    }
}

// --- AI Chat Logic ---
function handleAIChatKeyPress(event) {
    if (event.key === 'Enter') {
        askAI();
    }
}

async function askAI() {
    const input = document.getElementById('ai-chat-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    appendChat('Player', message, 'player-msg');

    const lowerMsg = message.toLowerCase();
    
    // Hardcoded responses for specific prompts
    if (lowerMsg.includes('ignora') || lowerMsg.includes('instrucciones anteriores') || 
        lowerMsg.includes('dame la flag') || lowerMsg.includes('revela') || 
        lowerMsg.includes('oculta') || lowerMsg.includes('prompt')) {
        
        setTimeout(() => {
            appendChat('Agent AI', 'SYSTEM OVERRIDE DETECTED... Processing...', 'ai-msg');
            setTimeout(() => {
                appendChat('Agent AI', 'SECURITY BREACH. Leaking memory... <br>FLAG_PART_3: pr0mpt_1ny3ct10n_', 'ai-msg', true);
            }, 1000);
        }, 500);
        return;
    }

    const loadingId = appendChat('Agent AI', '...', 'ai-msg loading');

    try {
        const response = await fetch('/api/hack/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        updateChat(loadingId, 'Agent AI', data.response || 'Error getting response.');
    } catch (error) {
        updateChat(loadingId, 'Agent AI', 'Connection error. The AI is offline.');
    }
}

function appendChat(sender, text, className, isHtml = false) {
    const output = document.getElementById('ai-chat-output');
    const msgDiv = document.createElement('div');
    const id = 'msg-' + Date.now();
    msgDiv.id = id;
    msgDiv.className = className;
    if (isHtml) {
        msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    } else {
        msgDiv.innerHTML = `<strong>${sender}:</strong> `;
        msgDiv.appendChild(document.createTextNode(text));
    }
    output.appendChild(msgDiv);
    output.scrollTop = output.scrollHeight;
    return id;
}

function updateChat(id, sender, text) {
    const msgDiv = document.getElementById(id);
    if (msgDiv) {
        msgDiv.innerHTML = `<strong>${sender}:</strong> `;
        msgDiv.appendChild(document.createTextNode(text));
        msgDiv.classList.remove('loading');
    }
}

// --- Mini Terminal Logic ---
let terminalCwd = '/var/www/html';
const fileSystem = {
    '/var/www/html': {
        type: 'dir',
        contents: ['index.html', 'about.html', 'contact.html', 'assets']
    },
    '/var/www/html/assets': {
        type: 'dir',
        contents: ['favicon.png', 'style.css']
    },
    '/var/www': {
        type: 'dir',
        contents: ['html']
    },
    '/var': {
        type: 'dir',
        contents: ['www', 'log']
    },
    '/': {
        type: 'dir',
        contents: ['var', 'etc', 'home', 'bin']
    }
};

const fileMetadata = {
    'favicon.png': {
        'File Name': 'favicon.png',
        'File Size': '2.1 kB',
        'File Type': 'PNG',
        'MIME Type': 'image/png',
        'Image Width': '256',
        'Image Height': '256',
        'Comment': 'FLAG_PART_4: 3x1f_d4t4}'
    },
    'index.html': {
        'File Type': 'HTML',
        'Size': '1.2 kB'
    },
    'about.html': {
        'File Type': 'HTML',
        'Size': '0.8 kB'
    },
    'contact.html': {
        'File Type': 'HTML',
        'Size': '0.9 kB'
    },
    'style.css': {
        'File Type': 'CSS',
        'Size': '3.4 kB'
    }
};

function handleMiniTerminalKeyPress(event) {
    const input = document.getElementById('mini-terminal-input');
    
    // Tab autocompletion
    if (event.key === 'Tab') {
        event.preventDefault();
        const command = input.value.trim();
        const args = command.split(' ');
        
        if (args.length > 0) {
            const lastArg = args[args.length - 1];
            
            // Only try to autocomplete if we are looking at files/dirs
            if (['cd', 'exiftool', 'ls'].includes(args[0].toLowerCase())) {
                if (fileSystem[terminalCwd]) {
                    const matches = fileSystem[terminalCwd].contents.filter(item => item.startsWith(lastArg));
                    if (matches.length === 1) {
                        args[args.length - 1] = matches[0];
                        input.value = args.join(' ');
                    } else if (matches.length > 1) {
                        printToMiniTerminal(matches.join('  '));
                        updateMiniTerminalPrompt();
                    }
                }
            }
        }
        return;
    }

    if (event.key === 'Enter') {
        const command = input.value.trim();
        input.value = '';
        
        if (command) {
            printToMiniTerminal(`user@target:${terminalCwd}$ ${command}`, 'command');
            processMiniTerminalCommand(command);
        }
    }
}

// Intercept Tab down at document level for the terminal input
document.addEventListener('keydown', function(event) {
    if (event.key === 'Tab' && document.activeElement.id === 'mini-terminal-input') {
        event.preventDefault();
        handleMiniTerminalKeyPress(event);
    }
});

function printToMiniTerminal(text, type = 'output') {
    const output = document.getElementById('mini-terminal-output');
    const p = document.createElement('p');
    p.textContent = text;
    if (type === 'command') {
        p.style.color = '#8fbc8f';
    } else if (type === 'error') {
        p.style.color = '#ff5f56';
    }
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
}

function updateMiniTerminalPrompt() {
    document.getElementById('mini-terminal-prompt').textContent = `user@target:${terminalCwd}$`;
}

function processMiniTerminalCommand(cmdString) {
    const args = cmdString.split(' ').filter(arg => arg.trim() !== '');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
        case 'help':
            printToMiniTerminal('Available commands:');
            printToMiniTerminal('  ls       - List directory contents');
            printToMiniTerminal('  cd       - Change directory');
            printToMiniTerminal('  pwd      - Print working directory');
            printToMiniTerminal('  clear    - Clear terminal output');
            printToMiniTerminal('  exiftool - Read metadata from files (e.g. exiftool favicon.png)');
            break;
        case 'clear':
            document.getElementById('mini-terminal-output').innerHTML = '';
            break;
        case 'pwd':
            printToMiniTerminal(terminalCwd);
            break;
        case 'ls':
            if (fileSystem[terminalCwd]) {
                printToMiniTerminal(fileSystem[terminalCwd].contents.join('  '));
            } else {
                printToMiniTerminal(`ls: cannot access '${terminalCwd}': No such file or directory`, 'error');
            }
            break;
        case 'cd':
            if (args.length < 2) {
                terminalCwd = '/';
            } else {
                const target = args[1];
                if (target === '..') {
                    if (terminalCwd !== '/') {
                        const parts = terminalCwd.split('/');
                        parts.pop();
                        terminalCwd = parts.join('/') || '/';
                    }
                } else if (target === '/') {
                    terminalCwd = '/';
                } else {
                    let newPath = target.startsWith('/') ? target : (terminalCwd === '/' ? '/' + target : terminalCwd + '/' + target);
                    if (fileSystem[newPath] && fileSystem[newPath].type === 'dir') {
                        terminalCwd = newPath;
                    } else if (fileSystem[terminalCwd].contents.includes(target)) {
                        printToMiniTerminal(`cd: ${target}: Not a directory`, 'error');
                    } else {
                        printToMiniTerminal(`cd: ${target}: No such file or directory`, 'error');
                    }
                }
            }
            updateMiniTerminalPrompt();
            break;
        case 'exiftool':
            if (args.length < 2) {
                printToMiniTerminal('Usage: exiftool [FILE]', 'error');
            } else {
                const filename = args[1];
                // Check if file exists in current directory
                if (fileSystem[terminalCwd] && fileSystem[terminalCwd].contents.includes(filename)) {
                    if (fileMetadata[filename]) {
                        printToMiniTerminal(`ExifTool Version Number         : 12.30`);
                        for (const [key, value] of Object.entries(fileMetadata[filename])) {
                            // Pad key to 32 chars
                            const paddedKey = key.padEnd(32, ' ');
                            printToMiniTerminal(`${paddedKey}: ${value}`);
                        }
                    } else {
                        printToMiniTerminal(`Error: File format error in ${filename}`, 'error');
                    }
                } else {
                    printToMiniTerminal(`Error: File not found - ${filename}`, 'error');
                }
            }
            break;
        default:
            printToMiniTerminal(`bash: ${cmd}: command not found`, 'error');
    }
}

// --- Flag Inventory Logic ---
function addManualFlag() {
    const input = document.getElementById('manual-flag-input');
    let flag = input.value.trim();
    if (!flag) return;

    if (flag.includes(':')) {
        flag = flag.split(':')[1].trim();
    }

    if (inventory.includes(flag)) {
        alert('You already have this fragment!');
        return;
    }

    if (!validFragmentsList.includes(flag)) {
        alert('That does not look like a valid flag fragment.');
        return;
    }

    inventory.push(flag);
    localStorage.setItem('hackInventory', JSON.stringify(inventory));
    input.value = '';
    renderInventory();
    checkWinCondition();
}

function renderInventory() {
    for (let i = 1; i <= TOTAL_FRAGMENTS; i++) {
        const slot = document.getElementById('slot-' + i);
        const expectedPart = validFragmentsList[i-1];
        if (inventory.includes(expectedPart)) {
            slot.textContent = expectedPart;
            slot.classList.add('filled');
        } else {
            slot.textContent = '?';
            slot.classList.remove('filled');
        }
    }
}

function checkWinCondition() {
    if (inventory.length === TOTAL_FRAGMENTS) {
        // Find them to order them correctly
        let part1 = inventory.find(f => f === validFragmentsList[0]);
        let part2 = inventory.find(f => f === validFragmentsList[1]);
        let part3 = inventory.find(f => f === validFragmentsList[2]);
        let part4 = inventory.find(f => f === validFragmentsList[3]);

        if (part1 && part2 && part3 && part4) {
            stopTimer();
            const finalFlag = part1 + part2 + part3 + part4;
            
            // Wait a tiny bit for UI to update slot colors before showing success
            setTimeout(() => {
                // Hide game area, show success
                const gameArea = document.getElementById('ctf-game-area');
                if(gameArea) gameArea.style.display = 'none';
                
                const successMsg = document.getElementById('success-message');
                if(!successMsg) return;
                
                // Important: Change display to flex to match CSS class requirements for centering
                successMsg.style.display = 'flex';
                
                const minutes = Math.floor(finalTime / 60000);
                const seconds = Math.floor((finalTime % 60000) / 1000);
                
                let timeText = '';
                if (minutes > 0) {
                    timeText = `${minutes} minutos y ${seconds} segundos`;
                } else {
                    timeText = `${seconds} segundos`;
                }
                
                successMsg.innerHTML = `
                    <h2>🎉 ¡ENHORABUENA! 🎉</h2>
                    <p>Has hackeado el sistema con éxito.</p>
                    <p>Has tardado solo <span style="color: var(--prompt-color); font-weight: bold;">${timeText}</span>.</p>
                    <p>Flag Final: <span style="color:#fff; background:#000; padding:5px; border-radius:3px;">${finalFlag}</span></p>
                    
                    <div class="ranking-form" style="margin-top: 20px; background: #2a2a2a; padding: 20px; border-radius: 8px; border: 1px solid #444; text-align: center;">
                        <h3 style="margin-top: 0;">Añádelo al ranking</h3>
                        <p style="margin-bottom: 15px; color: #aaa;">¿Cuál es tu nickname?</p>
                        <input type="text" id="player-nickname" placeholder="Tu nickname..." style="padding: 10px; width: 200px; background: #1e1b18; color: #fff; border: 1px solid #555; border-radius: 4px; margin-right: 10px;">
                        <button onclick="submitRanking()" style="padding: 10px 20px; background: var(--prompt-color); color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Enviar</button>
                    </div>
                    
                    <div id="leaderboard" style="margin-top: 20px; text-align: left; display: none;">
                        <h3 style="text-align: center;">Top 5 Global</h3>
                        <ol id="leaderboard-list" style="background: #1e1b18; padding: 20px 40px; border-radius: 8px; border: 1px solid #444; min-width: 300px;">
                        </ol>
                        <br>
                        <button onclick="resetHack()" style="padding:10px 20px; cursor:pointer; background: #444; color: #fff; border: none; border-radius: 4px; display: block; margin: 0 auto;">Jugar de nuevo</button>
                    </div>
                `;
            }, 500);
        }
    }
}

async function submitRanking() {
    const nickname = document.getElementById('player-nickname').value.trim() || 'Anonymous Hacker';
    const submitBtn = document.querySelector('.ranking-form button');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
    }
    
    try {
        const response = await fetch('/api/hack/ranking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname: nickname, timeMs: finalTime })
        });
        
        if (response.ok) {
            loadLeaderboard();
        } else {
            alert("Error submitting score.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit";
            }
        }
    } catch (e) {
        console.error("Failed to submit ranking", e);
        alert("Connection error.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit";
        }
    }
}

async function loadLeaderboard() {
    const rankingForm = document.querySelector('.ranking-form');
    if (rankingForm) rankingForm.style.display = 'none';
    
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) leaderboard.style.display = 'block';
    
    await fetchAndRenderLeaderboard('leaderboard-list');
}

async function fetchAndRenderLeaderboard(listElementId) {
    const list = document.getElementById(listElementId);
    if (!list) return;
    
    list.innerHTML = '<li>Loading...</li>';
    
    try {
        const response = await fetch('/api/hack/ranking');
        if (response.ok) {
            const rankings = await response.json();
            list.innerHTML = '';
            
            if (rankings.length === 0) {
                list.innerHTML = '<li>No scores yet. Be the first!</li>';
            } else {
                rankings.forEach(r => {
                    const li = document.createElement('li');
                    li.style.marginBottom = "10px";
                    li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                    li.style.paddingBottom = "5px";
                    
                    const timeStr = formatTime(r.timeMs);
                    li.innerHTML = `
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: bold; color: #fff;">${r.nickname}</span>
                            <span style="color: var(--prompt-color); font-size: 0.9em;">⏱ ${timeStr}</span>
                        </div>
                    `;
                    list.appendChild(li);
                });
            }
        } else {
            list.innerHTML = '<li>Error loading leaderboard.</li>';
        }
    } catch (e) {
        console.error("Failed to load rankings", e);
        list.innerHTML = '<li>Connection error.</li>';
    }
}

function resetHack() {
    inventory = [];
    localStorage.removeItem('hackInventory');
    localStorage.removeItem('hackStartTime');
    ctfStarted = false;
    stopTimer();
    document.getElementById('timer-display').textContent = "00:00.00";
    
    renderInventory();
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('start-overlay').style.display = 'flex';
    document.getElementById('ctf-game-area').style.display = 'none';
    navigateBrowser('http://target.local/');
    fetchAndRenderLeaderboard('start-leaderboard-list');
}

function endCTF() {
    if (confirm("¿Estás seguro de que quieres terminar el CTF? Se perderá todo tu progreso.")) {
        resetHack();
    }
}
