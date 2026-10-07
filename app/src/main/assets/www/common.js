/**
 * PDF Tools - Shared JavaScript Utilities (common.js)
 * Provides theme toggling, drag-and-drop file upload helpers,
 * toast notifications, byte formatting, and client-side download logic.
 */

// Initialize Theme (Light / Dark)
(function initTheme() {
  const savedTheme = localStorage.getItem('pdf_tools_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('pdf_tools_theme', newTheme);
  updateThemeIcon();
}

/**
 * Updates the theme toggle button icon
 */
function updateThemeIcon() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = isDark
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }

  // Intercept any <a download> clicks for Android WebView compatibility
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a[download]');
    if (target && target.href && target.href.startsWith('blob:') && window.Android && window.Android.saveBlob) {
      e.preventDefault();
      fetch(target.href)
        .then(res => res.blob())
        .then(blob => {
          const filename = target.getAttribute('download') || 'download.pdf';
          triggerDownload(blob, filename, blob.type || 'application/pdf');
        })
        .catch(err => console.error('Error delegating download to Android:', err));
    }
  });
});

/**
 * Displays a non-intrusive toast notification
 * @param {string} message - Message to show
 * @param {'info'|'success'|'error'} type - Notification type
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'error') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else if (type === 'success') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * HTML Escaper
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format raw byte size into human readable string
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Initializes Drag and Drop zone with support for both drag-drop and click-to-browse
 * @param {HTMLElement} dropzoneEl
 * @param {HTMLInputElement} fileInputEl
 * @param {Function} onFilesCallback - Callback receives array of File objects
 */
function setupDropzone(dropzoneEl, fileInputEl, onFilesCallback) {
  if (!dropzoneEl || !fileInputEl) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('dragover');
    }, false);
  });

  dropzoneEl.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      onFilesCallback(Array.from(files));
    }
  });

  dropzoneEl.addEventListener('click', (e) => {
    if (e.target !== fileInputEl) {
      fileInputEl.click();
    }
  });

  fileInputEl.addEventListener('change', () => {
    if (fileInputEl.files && fileInputEl.files.length > 0) {
      onFilesCallback(Array.from(fileInputEl.files));
      fileInputEl.value = ''; // Reset for re-selection
    }
  });
}

/**
 * Trigger client-side file download for generated PDF or image blobs
 * Supports both standard web browser environment and native Android WebView bridge
 * @param {Blob|Uint8Array} data
 * @param {string} filename
 * @param {string} mimeType
 */
function triggerDownload(data, filename, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });

  // Native Android bridge support
  if (window.Android && typeof window.Android.saveBlob === 'function') {
    const reader = new FileReader();
    reader.onloadend = function() {
      const base64data = reader.result.split(',')[1];
      window.Android.saveBlob(base64data, filename, mimeType);
    };
    reader.readAsDataURL(blob);
    return;
  }

  // Standard web browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Configure PDF.js worker if available
 */
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}
