(function(){
    'use strict';
    
    let notifySettings = null;
    let sessionSent = false;
    
    // Загружаем настройки
    async function loadSettings() {
        try {
            const api = (window.TG_NOTIFY_API || '/tg_notify_track.php').replace(/\/+$/, '');
            const response = await fetch(`${api}?action=getSettings`, { mode: 'cors', credentials: 'omit' });
            const data = await response.json();
            if (data && data.ok) {
                notifySettings = data.settings;
            }
        } catch(e) {}
    }
    
    // Отправляем событие
    async function trackEvent(type, details = {}) {
        if (!notifySettings) return;

        // Проверяем включен ли нужный тип уведомлений
        if (type === 'visit' && notifySettings.notify_visits !== '1') return;
        if (type === 'download' && notifySettings.notify_downloads !== '1') return;
        if (type === 'link' && notifySettings.notify_links !== '1') return;

        const fd = new FormData();
        fd.append('action', 'track');
        fd.append('type', type);
        fd.append('url', window.location.href);
        fd.append('page_title', document.title);
        fd.append('referrer', document.referrer);
        fd.append('domain', location.hostname); // ← домен экспорт‑сайта

        // Добавляем детали события
        for (let key in details) {
            fd.append(key, details[key]);
        }

        try {
            const api = (window.TG_NOTIFY_API || '/tg_notify_track.php').replace(/\/+$/, '');
            await fetch(api, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                body: fd
            });
        } catch(e) {}
    }
    
    // Отслеживаем посещение
    function trackVisit() {
        if (!sessionSent) {
            trackEvent('visit');
            sessionSent = true;
        }
    }
    
    // Отслеживаем клики по кнопкам-файлам
    function trackFileButtons() {
        document.addEventListener('click', function(e) {
            const fileBtn = e.target.closest('.el.filebtn a, .el.Filebtn a, .bf-filebtn');
            if (fileBtn) {
                const fileName = fileBtn.getAttribute('download') || fileBtn.dataset.fileName || 'unknown';
                const fileUrl = fileBtn.href;
                trackEvent('download', {
                    file_name: fileName,
                    file_url: fileUrl
                });
            }
        });
    }
    
    // Отслеживаем клики по кнопкам-ссылкам
    function trackLinkButtons() {
        document.addEventListener('click', function(e) {
            const linkBtn = e.target.closest('.el.linkbtn a, .el.Linkbtn a, .bl-linkbtn');
            if (linkBtn && linkBtn.href && linkBtn.href !== '#') {
                const linkText = linkBtn.textContent.trim();
                const linkUrl = linkBtn.href;
                trackEvent('link', {
                    link_text: linkText,
                    link_url: linkUrl
                });
            }
        });
    }
    
    // Инициализация
    loadSettings().then(() => {
        if (notifySettings) {
            trackVisit();
            trackFileButtons();
            trackLinkButtons();
        }
    });
})();