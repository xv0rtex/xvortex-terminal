// Activity Monitor Logic

let processes = [
    { id: 1, name: "windowserver", cpu: 12.5, ram: 15.2 },
    { id: 2, name: "brain.exe", cpu: 85.0, ram: 99.9 },
    { id: 3, name: "coffee.service", cpu: 0.1, ram: 1.2 },
    { id: 4, name: "discord.chat", cpu: 5.3, ram: 8.4 },
    { id: 5, name: "kernel_task", cpu: 4.2, ram: 6.5 },
    { id: 6, name: "java", cpu: 25.4, ram: 35.1 },
    { id: 7, name: "chrome (renderer)", cpu: 18.2, ram: 45.0 }
];

let nextProcessId = 8;
let currentSort = { column: 'cpu', asc: false };

// History for graphs (last 30 data points)
const MAX_HISTORY = 30;
let cpuHistory = Array(MAX_HISTORY).fill(0);
let ramHistory = Array(MAX_HISTORY).fill(0);

// Colors for graphs
const CPU_COLOR = '#0a84ff';
const RAM_COLOR = '#30d158';

function initActivityMonitor() {
    renderProcesses();
    updateGraphs();
    
    // Start interval
    setInterval(tickActivityMonitor, 2000);
}

function renderProcesses() {
    const tbody = document.getElementById('process-tbody');
    if (!tbody) return;
    
    // Sort processes
    let sorted = [...processes].sort((a, b) => {
        let valA = a[currentSort.column];
        let valB = b[currentSort.column];
        
        if (typeof valA === 'string') {
            return currentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return currentSort.asc ? valA - valB : valB - valA;
        }
    });

    tbody.innerHTML = '';
    
    sorted.forEach(p => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.cpu.toFixed(1)}</td>
            <td>${p.ram.toFixed(1)}</td>
            <td>
                <button class="kill-btn" onclick="killProcess(${p.id})">Kill</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function sortProcesses(column) {
    if (currentSort.column === column) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.column = column;
        currentSort.asc = false; // Default descending for numbers
    }
    renderProcesses();
}

function killProcess(id) {
    processes = processes.filter(p => p.id !== id);
    renderProcesses();
}

function handleNewProcessKeyPress(e) {
    if (e.key === 'Enter') {
        startNewProcess();
    }
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
    // Randomly update process values
    processes.forEach(p => {
        // Keep brain.exe high
        if (p.name === 'brain.exe') {
            p.cpu = Math.min(100, Math.max(70, p.cpu + (Math.random() * 10 - 5)));
            p.ram = Math.min(100, Math.max(80, p.ram + (Math.random() * 5 - 2)));
        } else if (p.name === 'coffee.service') {
            p.cpu = Math.max(0, p.cpu + (Math.random() * 2 - 1));
        } else {
            p.cpu = Math.max(0, Math.min(100, p.cpu + (Math.random() * 10 - 5)));
            p.ram = Math.max(0, Math.min(100, p.ram + (Math.random() * 6 - 3)));
        }
    });
    
    renderProcesses();
    
    // Calculate totals
    const totalCpu = Math.min(100, processes.reduce((sum, p) => sum + p.cpu, 0) / (processes.length || 1) * 1.5);
    const totalRam = Math.min(100, processes.reduce((sum, p) => sum + p.ram, 0) / (processes.length || 1) * 1.2);
    
    // Update history
    cpuHistory.push(totalCpu);
    cpuHistory.shift();
    
    ramHistory.push(totalRam);
    ramHistory.shift();
    
    updateGraphs();
}

function updateGraphs() {
    const cpuCanvas = document.getElementById('cpu-canvas');
    const ramCanvas = document.getElementById('ram-canvas');
    const cpuLabel = document.getElementById('cpu-label');
    const ramLabel = document.getElementById('ram-label');
    
    if (!cpuCanvas || !ramCanvas) return;
    
    drawGraph(cpuCanvas, cpuHistory, CPU_COLOR);
    drawGraph(ramCanvas, ramHistory, RAM_COLOR);
    
    if (cpuLabel) cpuLabel.textContent = `System: ${cpuHistory[cpuHistory.length - 1].toFixed(1)}%`;
    if (ramLabel) ramLabel.textContent = `Used: ${ramHistory[ramHistory.length - 1].toFixed(1)}%`;
}

function drawGraph(canvas, data, color) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();
    
    // Draw data
    const step = width / (MAX_HISTORY - 1);
    
    ctx.beginPath();
    ctx.moveTo(0, height - (data[0] / 100 * height));
    
    for (let i = 1; i < data.length; i++) {
        const x = i * step;
        const y = height - (data[i] / 100 * height);
        ctx.lineTo(x, y);
    }
    
    // Style line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Fill area under line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '66'); // 40% opacity
    gradient.addColorStop(1, color + '00'); // 0% opacity
    
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Slight delay to ensure elements are present
    setTimeout(initActivityMonitor, 100);
});
