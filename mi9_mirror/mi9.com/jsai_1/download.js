document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('apkDownloadBtn');
    var statusBox = document.getElementById('apkDownloadStatus');
    var fallback = document.getElementById('apkDownloadFallback');
    var title = document.getElementById('apkDownloadStatusTitle');
    var text = document.getElementById('apkDownloadStatusText');
    var fallbackText = document.getElementById('apkDownloadFallbackText');
    var fallbackLink = document.getElementById('apkDownloadFallbackLink');
    var generatorBox = document.getElementById('genlinkapk');

    if (!btn || !statusBox || !fallback || !title || !text || !fallbackText || !fallbackLink) {
        return;
    }

    var clicked = false;
    var source = (btn.getAttribute('data-download-source') || '').toLowerCase();
    var isDownloader = (source === 'downloader');

    fallback.style.display = 'none';

    function scrollToGenerator() {
        if (!generatorBox) return;

        generatorBox.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        var genButton = generatorBox.querySelector('#genlink');
        if (genButton) {
            setTimeout(function () {
                try {
                    genButton.focus({ preventScroll: true });
                } catch (e) {
                    genButton.focus();
                }
            }, 500);
        }
    }

    btn.addEventListener('click', function (e) {
        if (clicked) return;
        clicked = true;

        btn.style.display = 'none';
        statusBox.style.display = 'block';
        fallback.style.display = 'none';

        if (isDownloader) {
            e.preventDefault();

            title.textContent = 'Generate your download link';
            text.textContent = 'This file is not available as a direct download. Please use the downloader below.';
            fallbackText.textContent = 'If the downloader is not visible,';
            fallbackLink.textContent = 'jump to downloader';

            setTimeout(function () {
                fallback.style.display = 'block';
            }, 800);

            setTimeout(function () {
                scrollToGenerator();
            }, 250);

            return;
        }

        title.textContent = 'Preparing your download';
        text.textContent = 'Your file should start downloading automatically.';
        fallbackText.textContent = 'If nothing happens,';
        fallbackLink.textContent = 'tap here to try again';

        setTimeout(function () {
            fallback.style.display = 'block';
        }, 2500);
    });

    fallbackLink.addEventListener('click', function (e) {
        if (!isDownloader || !generatorBox) return;

        e.preventDefault();
        scrollToGenerator();
    });
});

(function () {
    var openers = document.querySelectorAll('.mi9-trusted-badge');

    function openModal(modal) {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'false');
        modal.style.display = 'flex';
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        modal.style.display = 'none';
    }

    openers.forEach(function (opener) {
        opener.addEventListener('click', function (e) {
            e.preventDefault();
            var id = opener.getAttribute('data-modal-target');
            var modal = document.getElementById(id);
            openModal(modal);
        });
    });

    document.addEventListener('click', function (e) {
        if (e.target.closest('[data-close]')) {
            var modal = e.target.closest('.trusted-modal');
            closeModal(modal);
        }
    });

    document.querySelectorAll('.trusted-backdrop').forEach(function (bg) {
        bg.addEventListener('click', function () {
            closeModal(bg.closest('.trusted-modal'));
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.trusted-modal[aria-hidden="false"]').forEach(function (modal) {
                closeModal(modal);
            });
        }
    });
})();