console.log("content.js executed");
window.addEventListener("message", function (event) {
    // We only accept messages from ourselves
    if (event.source != window)
        return;

    if (event.data.type && (event.data.type == "VOCAL_COMMAND")) {
        console.log("Content script received command: " + event.data.text);
        chrome.runtime.sendMessage({command: event.data.text}, function (response) {
            console.log("Response: ", response);
        });
    }
}, false);