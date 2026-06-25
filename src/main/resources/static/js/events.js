(function () {
    let eventsLoaded = false;
    let eventsData = [];

    const content = document.getElementById('events-content');
    const grid = document.getElementById('events-grid');
    if (!content || !grid) return;

    grid.innerHTML = '<p class="events-loading">Loading events...</p>';

    // Observe when the events window becomes visible
    const observer = new MutationObserver(() => {
        const win = document.getElementById('events-window');
        if (win && !win.classList.contains('closed') && !eventsLoaded) {
            loadEvents();
        }
    });

    const eventsWin = document.getElementById('events-window');
    if (eventsWin) {
        observer.observe(eventsWin, { attributes: true, attributeFilter: ['class'] });
    }

    function loadEvents() {
        eventsLoaded = true;
        fetch('/api/events')
            .then(res => res.json())
            .then(events => {
                eventsData = events;
                showGrid();
            })
            .catch(() => {
                grid.innerHTML = '<p style="color: var(--error-color); text-align: center; padding: 40px 0;">Error loading events.</p>';
            });
    }

    function formatDate(fechaArr) {
        if (Array.isArray(fechaArr)) {
            const [y, m, d] = fechaArr;
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return String(d).padStart(2, '0') + ' ' + months[m - 1] + ' ' + y;
        }
        if (typeof fechaArr === 'string') {
            const parts = fechaArr.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return parts[2] + ' ' + months[parseInt(parts[1]) - 1] + ' ' + parts[0];
            }
        }
        return '';
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Grid View ──

    function showGrid() {
        // Remove detail view if present
        const detail = content.querySelector('.events-detail');
        if (detail) detail.remove();

        // Ensure header and grid are visible
        let header = content.querySelector('.events-header');
        if (!header) {
            header = document.createElement('div');
            header.className = 'events-header';
            content.insertBefore(header, grid);
        }
        header.style.display = '';
        header.innerHTML = `
            <h2>> ls -l ./eventos/</h2>
            <span class="events-count">${eventsData.length} evento${eventsData.length !== 1 ? 's' : ''} encontrado${eventsData.length !== 1 ? 's' : ''}</span>
        `;

        grid.style.display = '';

        if (!eventsData || eventsData.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-color); text-align: center; padding: 40px 0;">No events found.</p>';
            return;
        }

        const itemsHtml = eventsData.map((ev, i) => `
            <div class="timeline-item" style="animation-delay: ${i * 0.06}s" data-tag="${escapeHtml(ev.tag || '')}" data-index="${i}">
                <div class="event-card">
                    <div class="event-card-img">
                        <div class="event-card-name">${escapeHtml(ev.nombre)}</div>
                        ${ev.imagen
                            ? `<img src="/eventos/images/${escapeHtml(ev.imagen)}" alt="${escapeHtml(ev.nombre)}" onerror="this.outerHTML='<div class=\\'event-card-img-placeholder\\'>📅</div>'">`
                            : '<div class="event-card-img-placeholder">📅</div>'
                        }
                    </div>
                    <div class="event-term-lines">
                        <div class="term-line"><span class="term-prompt">$</span><span class="term-key">location</span><span class="term-eq">=</span><span class="term-val">"${escapeHtml(ev.ubicacion)}"</span></div>
                        <div class="term-line term-desc"><span class="term-prompt">#</span><span class="term-comment">${escapeHtml(ev.descripcion)}</span></div>
                    </div>
                </div>
                <div class="timeline-node">
                    <span class="timeline-dot"></span>
                </div>
                <div class="timeline-date">${formatDate(ev.fecha)}</div>
            </div>
        `).join('');

        grid.innerHTML = `<div class="timeline-items"><div class="timeline-track"></div>${itemsHtml}</div>`;

        // Attach click handlers
        grid.querySelectorAll('.timeline-item[data-tag]').forEach(item => {
            const tag = item.dataset.tag;
            if (tag) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => showDetail(parseInt(item.dataset.index)));
            }
        });

        // Start at the latest event (leftmost)
        grid.scrollLeft = 0;
    }

    // Translate vertical wheel scroll into horizontal scroll over the timeline
    grid.addEventListener('wheel', (e) => {
        // Only intercept when the grid is visible (not on detail view)
        if (grid.style.display === 'none') return;
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (delta === 0) return;
        e.preventDefault();
        // Multiplier for snappier feel; line-mode (deltaMode 1) reports small values
        const factor = e.deltaMode === 1 ? 30 : 2.5;
        grid.scrollLeft += delta * factor;
    }, { passive: false });

    // ── Detail View ──

    function showDetail(index) {
        const ev = eventsData[index];
        if (!ev || !ev.tag) return;

        // Hide grid and header
        grid.style.display = 'none';
        const header = content.querySelector('.events-header');
        if (header) header.style.display = 'none';

        // Remove existing detail
        const old = content.querySelector('.events-detail');
        if (old) old.remove();

        const detail = document.createElement('div');
        detail.className = 'events-detail';
        detail.innerHTML = `
            <div class="events-detail-header">
                <button class="events-back-btn" id="events-back-btn">← Back</button>
                <div class="events-detail-info">
                    <h2>${escapeHtml(ev.nombre)}</h2>
                    <span class="events-detail-meta">${escapeHtml(ev.ubicacion)} · ${formatDate(ev.fecha)}</span>
                    ${ev.descripcion ? `<p class="events-detail-description">${escapeHtml(ev.descripcion)}</p>` : ''}
                </div>
            </div>
            <div class="events-detail-posts">
                <p class="events-loading">Cargando charlas...</p>
            </div>
        `;
        content.appendChild(detail);

        detail.querySelector('#events-back-btn').addEventListener('click', showGrid);

        // Fetch posts for this tag
        fetch('/api/events/' + encodeURIComponent(ev.tag) + '/posts')
            .then(res => res.json())
            .then(posts => renderPosts(detail.querySelector('.events-detail-posts'), posts))
            .catch(() => {
                detail.querySelector('.events-detail-posts').innerHTML =
                    '<p style="color: var(--error-color);">Error loading posts.</p>';
            });
    }

    function renderPosts(container, posts) {
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p class="events-no-posts">No hay charlas registradas para este evento todavía.</p>';
            return;
        }

        container.innerHTML = posts.map((p, i) => {
            const url = (p.type === 'proyects' ? '/proyectos/' : '/blog/') + p.id;
            return `
                <a href="${url}" class="event-post-card" style="animation-delay: ${i * 0.06}s" onclick="ensureTerminalOpen()">
                    <div class="event-post-date">${formatDate(p.date)}</div>
                    <div class="event-post-body">
                        <h3>${escapeHtml(p.title)}</h3>
                        <p>${escapeHtml(p.excerpt)}</p>
                    </div>
                    <div class="event-post-arrow">→</div>
                </a>
            `;
        }).join('');
    }

})();
