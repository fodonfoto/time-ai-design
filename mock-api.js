/**
 * Mock Chrome APIs for Local Preview
 * This allows the extension UI to be tested in a normal browser tab.
 */

if (typeof chrome === 'undefined' || !chrome.extension) {
    window.chrome = {
        storage: {
            local: {
                get: (keys) => {
                    return new Promise((resolve) => {
                        const result = {};
                        if (typeof keys === 'string') {
                            result[keys] = localStorage.getItem(keys);
                        } else if (Array.isArray(keys)) {
                            keys.forEach(key => result[key] = localStorage.getItem(key));
                        }
                        console.log('📦 [Mock Storage] Get:', keys, result);
                        resolve(result);
                    });
                },
                set: (items) => {
                    return new Promise((resolve) => {
                        for (const [key, value] of Object.entries(items)) {
                            localStorage.setItem(key, value);
                        }
                        console.log('💾 [Mock Storage] Set:', items);
                        resolve();
                    });
                }
            }
        },
        tabs: {
            query: (queryInfo) => {
                return new Promise((resolve) => {
                    console.log('🔍 [Mock Tabs] Query:', queryInfo);
                    // Return a fake tab so the code doesn't crash
                    resolve([{ id: 123, url: 'https://www.figma.com/file/mock' }]);
                });
            },
            sendMessage: (tabId, message) => {
                return new Promise((resolve) => {
                    console.log('📨 [Mock Tabs] Send Message:', message);
                    if (message.type === 'PASTE_DESIGN') {
                        console.log('%c SVG Output (Sent to Content Script):', 'color: green; font-weight: bold;');
                        console.log(message.payload);
                        alert('⚡️ Message sent to Figma (Mock)!\nSee console for details.');
                    }
                    resolve({ status: 'success' });
                });
            }
        },
        runtime: {
            onMessage: {
                addListener: (callback) => {
                    console.log('👂 [Mock Runtime] Listener added');
                }
            }
        }
    };
    console.log('🛠️ Mock Chrome API initialized for local preview');
}
