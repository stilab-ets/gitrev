
chrome.runtime.onInstalled.addListener(() => {
    console.log('onInstalled...');
});

chrome.bookmarks.onCreated.addListener(() => {
    console.log('onCreated...');
});

const clientId = "841342fed95586ded8a1";
// New code
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'authenticate') {
        const redirectUri = chrome.identity.getRedirectURL('auth');
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,public_repo`;

        chrome.identity.launchWebAuthFlow({
            'url': authUrl,
            'interactive': true
        }, function (responseUrl) {
            if (chrome.runtime.lastError) {
                sendResponse({error: chrome.runtime.lastError});
                return;
            }
            const url = new URL(responseUrl);
            const code = url.searchParams.get('code');
            sendResponse({code: code});
        });
    }
    return true;  // To ensure async sendResponse works
});


