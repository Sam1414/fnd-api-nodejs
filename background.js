// background.js
// browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//     console.log("background: onMessage", message);

//     // Add this line:
//     // sendResponse({ 0});
//     return true;
//     // return Promise.resolve("Dummy response to keep the console quiet");
// });

chrome.runtime.onMessage.addListener(function (rq, sender, sendResponse) {
    // setTimeout to simulate any callback (even from storage.sync)
    setTimeout(function () {
        sendResponse({ status: true });
    }, 1);
    // return true;  // uncomment this line to fix error
});