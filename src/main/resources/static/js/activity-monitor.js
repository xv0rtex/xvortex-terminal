// Activity Monitor Logic

let processes = [
    { id: 1, name: "windowserver",    cpu: 12.5, ram: 15.2 },
    { id: 2, name: "brain.exe",       cpu: 85.0, ram: 99.9 },
    { id: 3, name: "coffee.service",  cpu: 0.1,  ram: 1.2  },
    { id: 4, name: "discord.chat",    cpu: 5.3,  ram: 8.4  },
    { id: 5, name: "kernel_task",     cpu: 4.2,  ram: 6.5  },
    { id: 6, name: "java",            cpu: 25.4, ram: 35.1 },
    { id: 7, name: "chrome",          cpu: 18.2, ram: 45.0 }
];

let nextProcessId = 8;
let currentSort = { column: 'cpu', asc: false };

// History for graphs (last 30 data points)
const MAX_HISTORY = 30;
let cpuHistory = Array(MAX_HISTORY).fill(0);
let ramHistory = Array(MAX_HISTORY).fill(0);

// Colors
const CPU_COLOR = '#0a84ff';
const RAM_COLOR = '#30d158';

function getUsageColor(pct) {
    if (pct >= 70) return '#ff453a';
    if (pct >= 40) return '#ffd60a';
    return '#30d158';
}

function initActivityMonitor() {
    renderProcesses();
    updateGraphs();
    setInterval(tickActivityMonitor, 2000);
}

function renderProcesses() {
    const tbody = document.getElementById('process-tbody');
    if (!tbody) return;

    let sorted = [...processes].sort((a, b) => {
        let valA = a[currentSort.column];
        let valB = b[currentSort.column];
        if (typeof valA === 'string') {
            return currentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return currentSort.asc ? valA - valB : valB - valA;
    });

    tbody.innerHTML = '';

    sorted.forEach(p => {
        const tr = document.createElement('tr');
        const cpuColor = getUsageColor(p.cpu);
        const ramColor = getUsageColor(p.ram);

        tr.innerHTML = `
            <td>${p.name}</td>
            <td>
                <div class="usage-cell">
                    <span style="color: ${cpuColor}">${p.cpu.toFixed(1)}</span>
                    <div class="usage-bar">
                        <div class="usage-fill" style="width: ${Math.min(100, p.cpu).toFixed(1)}%; background: ${cpuColor}"></div>
                    </div>
                </div>
            </td>
            <td>
                <div class="usage-cell">
                    <span style="color: ${ramColor}">${p.ram.toFixed(1)}</span>
                    <div class="usage-bar">
                        <div class="usage-fill" style="width: ${Math.min(100, p.ram).toFixed(1)}%; background: ${ramColor}"></div>
                    </div>
                </div>
            </td>
            <td>
                <button class="kill-btn" onclick="killProcess(${p.id})">Kill</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    updateSortHeaders();
    updateStatusBar();
}

function updateSortHeaders() {
    const cols = { name: 'Process Name', cpu: '% CPU', ram: '% Memory' };
    Object.entries(cols).forEach(([col, label]) => {
        const th = document.getElementById(`sort-${col}`);
        if (!th) return;
        if (currentSort.column === col) {
            th.textContent = `${label} ${currentSort.asc ? '↑' : '↓'}`;
        } else {
            th.textContent = `${label} ↕`;
        }
    });
}

function updateStatusBar() {
    const countEl  = document.getElementById('am-proc-count');
    const cpuAvgEl = document.getElementById('am-cpu-avg');
    const ramAvgEl = document.getElementById('am-ram-avg');
    if (!countEl) return;

    const n = processes.length;
    const avgCpu = n ? processes.reduce((s, p) => s + p.cpu, 0) / n : 0;
    const avgRam = n ? processes.reduce((s, p) => s + p.ram, 0) / n : 0;

    countEl.textContent  = `${n} process${n !== 1 ? 'es' : ''}`;
    cpuAvgEl.textContent = `CPU avg: ${avgCpu.toFixed(1)}%`;
    ramAvgEl.textContent = `RAM avg: ${avgRam.toFixed(1)}%`;
}

function sortProcesses(column) {
    if (currentSort.column === column) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.column = column;
        currentSort.asc = false;
    }
    renderProcesses();
}

function killProcess(id) {
    processes = processes.filter(p => p.id !== id);
    renderProcesses();
}

function handleNewProcessKeyPress(e) {
    if (e.key === 'Enter') startNewProcess();
}

function startNewProcess() {
    const input = document.getElementById('new-process-name');
    const name = input.value.trim();

    if (name) {
        processes.push({
            id: nextProcessId++,
            name: name,
            cpu: Math.random() * 20,
            ram: Math.random() * 15
        });
        input.value = '';
        renderProcesses();
    }
}

function tickActivityMonitor() {
    processes.forEach(p => {
        if (p.name === 'brain.exe') {
            p.cpu = Math.min(100, Math.max(70, p.cpu + (Math.random() * 10 - 5)));
            p.ram = Math.min(100, Math.max(80, p.ram + (Math.random() * 5  - 2)));
        } else if (p.name === 'coffee.service') {
            p.cpu = Math.max(0, p.cpu + (Math.random() * 2 - 1));
        } else {
            p.cpu = Math.max(0, Math.min(100, p.cpu + (Math.random() * 10 - 5)));
            p.ram = Math.max(0, Math.min(100, p.ram + (Math.random() * 6  - 3)));
        }
    });

    renderProcesses();

    const n = processes.length || 1;
    const totalCpu = Math.min(100, processes.reduce((s, p) => s + p.cpu, 0) / n * 1.5);
    const totalRam = Math.min(100, processes.reduce((s, p) => s + p.ram, 0) / n * 1.2);

    cpuHistory.push(totalCpu);
    cpuHistory.shift();
    ramHistory.push(totalRam);
    ramHistory.shift();

    updateGraphs();
}

function updateGraphs() {
    const cpuCanvas = document.getElementById('cpu-canvas');
    const ramCanvas = document.getElementById('ram-canvas');
    if (!cpuCanvas || !ramCanvas) return;

    drawGraph(cpuCanvas, cpuHistory, CPU_COLOR);
    drawGraph(ramCanvas, ramHistory, RAM_COLOR);

    const cpuVal = cpuHistory[cpuHistory.length - 1];
    const ramVal = ramHistory[ramHistory.length - 1];

    const cpuBadge = document.getElementById('cpu-badge');
    const ramBadge = document.getElementById('ram-badge');

    if (cpuBadge) {
        cpuBadge.textContent = cpuVal.toFixed(1) + '%';
        cpuBadge.className = 'am-badge' + (cpuVal >= 70 ? ' red' : cpuVal >= 40 ? ' yellow' : '');
    }
    if (ramBadge) {
        ramBadge.textContent = ramVal.toFixed(1) + '%';
        ramBadge.className = 'am-badge' + (ramVal >= 70 ? ' red' : ramVal >= 40 ? ' yellow' : '');
    }
}

function drawGraph(canvas, data, color) {
    // Sync intrinsic canvas size to its rendered CSS size
    const container = canvas.parentElement;
    if (container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0) canvas.width  = w;
        if (h > 0) canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Grid lines at 25%, 50%, 75%
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
        const y = (H / 4) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
    }
    ctx.stroke();

    // Data line
    const step = W / (MAX_HISTORY - 1);

    ctx.beginPath();
    ctx.moveTo(0, H - (data[0] / 100 * H));
    for (let i = 1; i < data.length; i++) {
        ctx.lineTo(i * step, H - (data[i] / 100 * H));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill area under line
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, color + '44');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.fill();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initActivityMonitor, 150);
});
