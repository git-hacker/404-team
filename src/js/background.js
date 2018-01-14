var ScreenShot = {
    content: document.createElement("canvas"),
    data: '',
    saveScreenshot: function () {
        var image = new Image();
        image.onload = function () {
            var canvas = ScreenShot.content;
            canvas.width = image.width;
            canvas.height = image.height;
            var context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);

            // save the image
            var link = document.createElement('a');
            link.download = "screenshot" + new Date().getTime() + ".png";
            link.href = ScreenShot.content.toDataURL();
            link.click();
            ScreenShot.data = '';
        };
        image.src = ScreenShot.data;
    },

    captureScreen: function () {
        chrome.tabs.captureVisibleTab(null, {
            format: "png",
            quality: 100
        }, function (data) {
            ScreenShot.data = data;
            ScreenShot.saveScreenshot();
        });
    }
};


console.log("background.js executed");
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId);
    switch (msg.command) {
        case "SCREEN_SHOT":
            ScreenShot.captureScreen();
            break;
    }
});