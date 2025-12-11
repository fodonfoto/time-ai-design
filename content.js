// content.js - Runs on Figma website
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PASTE_DESIGN') {
        const { payload } = request;

        // Copy code to clipboard
        navigator.clipboard.writeText(payload).then(() => {
            console.log('✓ SVG copied to clipboard');

            // Show notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #0f6f47;
                color: white;
                padding: 16px 20px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 99999;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                font-weight: 500;
            `;
            notification.textContent = '✓ SVG copied! Paste (Ctrl+V) directly into Figma';
            document.body.appendChild(notification);

            setTimeout(() => notification.remove(), 3000);
            sendResponse({ status: 'success' });
        }).catch(err => {
            console.error('Copy failed:', err);
            sendResponse({ status: 'error', message: err.message });
        });
    }
});
