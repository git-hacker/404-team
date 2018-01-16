function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, (tabs) => {
        var tab = tabs[0];

        var url = tab.url;

        console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(url);
    });

}

document.addEventListener('DOMContentLoaded', () => {
    getCurrentTabUrl((url) => {
        var start = document.getElementById('start');
        var stop = document.getElementById('stop');

        if (url && url.startsWith("http:")) {
            alert("暂只支持https的网站");
            return;
        }
        start.addEventListener('click', () => {
            chrome.tabs.executeScript({
                file: 'lib/speech.sdk.bundle.js'
            }, function (result) {
                chrome.tabs.executeScript({file: 'lib/jquery.min.js'},
                    function (result) {
                        chrome.tabs.executeScript({
                            file: 'js/inject.js'
                        });
                        start.disabled = true;
                        stop.disabled = false;
                    });
            });
        });
        stop.addEventListener('click', ()=> {
            chrome.tabs.executeScript({
                code: 'if($INJECT_INSTANCE){' +
                '$INJECT_INSTANCE.stop();' +
                '}'
            }, function (result) {
                start.disabled = false;
                stop.disabled = true;
            })
        });
    });
});