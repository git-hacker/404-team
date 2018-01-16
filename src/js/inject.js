var $INJECT_INSTANCE = (function () {
    var BabelFish = function (opt) {

        if (typeof opt === 'undefined') {
            opt = {};
        }
        if (!opt.mode) {
            opt.mode = "Interactive";
        }
        if (!opt.language) {
            opt.language = "zh-CN";
        }
        if (!opt.key) {
            opt.key = "18c3a34b7da34116a4761a896b7fcd79";
        }

        this.mode = opt.mode;
        this.lang = opt.language;
        this.format = "Simple";
        this.key = opt.key;
        this.working = false;

        this.recognizer;
        this.commands = {};
        this.keyword_inputs = [];

        BabelFish.prototype.addCommands = function (commands) {
            if (Array.isArray(commands)) {
                for (var k = 0; k < commands.length; k++) {
                    _addCommand(this.commands, commands[k]);
                }
            } else {
                _addCommand(this.commands, commands);
            }
        };

        function _addCommand(commands, cmd) {
            for (var i = 0; i < cmd.index.length; i++) {
                var keyword = cmd.index[i];
                commands[keyword] = {index: i, action: cmd.action};
            }
        }

        BabelFish.prototype.start = function () {
            if (this.working && this.recognizer) {
                this.RecognizerStop(window.SDK, this.recognizer);
            }
            this.recognizer = this.RecognizerSetup(window.SDK, this.mode, this.lang, this.format, this.key);

            this.working = true;
            this.RecognizerStart(window.SDK, this.recognizer);
        };

        BabelFish.prototype.stop = function () {
            if (this.working) {
                console.log("shutting down...");
                this.RecognizerStop(window.SDK, this.recognizer);
                this.working = false;
                this.recognizer = null;
                this.commands = {};
            }
        };

        BabelFish.prototype.pause = function () {
            this.working = false;
        };

        BabelFish.prototype.resume = function () {
            this.working = true;
        };

        BabelFish.prototype.RecognizerSetup = function (SDK, recognitionMode, language, format, subscriptionKey) {
            var recognizerConfig = new SDK.RecognizerConfig(
                new SDK.SpeechConfig(
                    new SDK.Context(
                        new SDK.OS(navigator.userAgent, "Browser", null),
                        new SDK.Device("SpeechSample", "SpeechSample", "1.0.00000"))),
                recognitionMode, // SDK.RecognitionMode.Interactive  (Options - Interactive/Conversation/Dictation)
                language, // Supported languages are specific to each recognition mode Refer to docs.
                format); // SDK.SpeechResultFormat.Simple (Options - Simple/Detailed)

            // Alternatively use SDK.CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) for token auth
            var authentication = new SDK.CognitiveSubscriptionKeyAuthentication(subscriptionKey);

            return SDK.CreateRecognizer(recognizerConfig, authentication);
        };

        BabelFish.prototype.RecognizerStart = function (SDK, recognizer) {
            var _this = this;
            recognizer.Recognize(function (event) {
                switch (event.Name) {
                    case "RecognitionTriggeredEvent" :
                        _this.UpdateStatus("Initializing");
                        break;
                    case "ListeningStartedEvent" :
                        _this.UpdateStatus("Listening");
                        break;
                    case "RecognitionStartedEvent" :
                        _this.UpdateStatus("Listening_Recognizing");
                        break;
                    case "SpeechStartDetectedEvent" :
                        _this.UpdateStatus("Listening_DetectedSpeech_Recognizing");
                        console.log(JSON.stringify(event.Result)); // check console for other information in result
                        break;
                    case "SpeechHypothesisEvent" :
                        _this.UpdateRecognizedHypothesis(event.Result.Text);
                        console.log(JSON.stringify(event.Result)); // check console for other information in result
                        break;
                    case "SpeechFragmentEvent" :
                        _this.UpdateRecognizedHypothesis(event.Result.Text);
                        console.log(JSON.stringify(event.Result)); // check console for other information in result
                        break;
                    case "SpeechEndDetectedEvent" :
                        _this.OnSpeechEndDetected();
                        _this.UpdateStatus("Processing_Adding_Final_Touches");
                        console.log(JSON.stringify(event.Result)); // check console for other information in result
                        break;
                    case "SpeechSimplePhraseEvent" :
                        _this.UpdateRecognizedPhrase(JSON.stringify(event.Result, null, 3));

                        break;
                    case "SpeechDetailedPhraseEvent" :
                        _this.UpdateRecognizedPhrase(JSON.stringify(event.Result, null, 3));
                        break;
                    case "RecognitionEndedEvent" :
                        _this.RecognizerStart(window.SDK, recognizer);
                        _this.OnComplete();
                        _this.UpdateStatus("Idle");
                        console.log(JSON.stringify(event)); // Debug information
                        break;
                }
            });
        }

        BabelFish.prototype.RecognizerStop = function (SDK, recognizer) {
            // recognizer.AudioSource.Detach(audioNodeId) can be also used here. (audioNodeId is part of ListeningStartedEvent)
            recognizer.AudioSource.TurnOff();
        }

        BabelFish.prototype.UpdateStatus = function (status) {
//        $("#result").append("<div>status</div>");
        }

        BabelFish.prototype.UpdateRecognizedHypothesis = function (text) {
            if (!this.working) {
                return;
            }
            // $("#result").append("<div>" + text + "</div>");
            this.keyword_inputs.push(text);
        }

        BabelFish.prototype.OnSpeechEndDetected = function () {
//        stopBtn.disabled = true;
        }

        BabelFish.prototype.UpdateRecognizedPhrase = function (json) {
//        hypothesisDiv.innerHTML = "";
//        phraseDiv.innerHTML += json + "\n";
        }

        BabelFish.prototype.OnComplete = function () {
            if (!this.working) {
                return;
            }

            var result = [];
            var last = this.keyword_inputs.pop();
            result.push(last);

            while (this.keyword_inputs.length > 0) {
                var keyword = this.keyword_inputs.pop();
                if (last.indexOf(keyword) !== -1) {
                    continue;// command has the same meaning ignored
                }
                last = keyword;
                result.push(keyword);//otherwise...
            }

            for (var i = 0; i < result.length; i++) {
                var text = result[i];

                var cmd = this.commands[text];
                if (!cmd) {
                    continue;
                }
                cmd.action(cmd.index, text);
            }
        }
    };

    function scrollDown() {
        var top = $(window).scrollTop();
        $("html,body").animate({scrollTop: top + 500}, 300)
    }

    function scrollUp() {
        var top = $(window).scrollTop();
        $("html,body").animate({scrollTop: top - 500}, 300)
    }

    function increaseFontSize(multiplier) {
        var fontSize = parseInt($("body").css("font-size"));
        $("body").css('font-size', Math.min(fontSize + multiplier, 60));
        console.log($("body").css("font-size"));
    }

    function decreaseFontSize(multiplier) {
        var fontSize = parseInt($("body").css("font-size"));
        $("body").css('font-size', Math.max(12, fontSize - multiplier));
        console.log($("body").css("font-size"));
    }

    function screenShot() {
        window.postMessage({ type: "VOCAL_COMMAND", text: "SCREEN_SHOT" }, "*");
    }
    // setupSpeechRecognition();
    // recognizerStart(window.SDK, recognizer);

    var cache_anchors = [];
    var _current_select_index = -1;

    function cache_anchor() {
        cache_anchors = [];
        _current_select_index = -1;

        var _cache_anchor_index = 0;
        $.each($("body  a"), function () {
            $(this).attr("data-vocal-assistant-anchor", _cache_anchor_index);
            cache_anchors.push({offset: $(this).offset().top, index: _cache_anchor_index++});
        });
        cache_anchors.sort(function (a1, a2) {
            var o = a1.offset - a2.offset;
            return o === 0 ? a1.index - a2.index : o;
        });
    }

    cache_anchor();

    var mode = 'Interactive';
    var lang = 'zh-CN';
    var key = '18c3a34b7da34116a4761a896b7fcd79';
    var fish = new BabelFish({mode: mode, language: lang, key: key});
    fish.start();
    fish.addCommands([
        {
            index: ["下", "down"],
            action: function (i, cmd) {
                scrollDown();
            }
        },
        {
            index: ["上", "up"],
            action: function (i, cmd) {
                scrollUp();
            }
        },
        {
            index: ["大", "bigger"],
            action: function (i, cmd) {
                increaseFontSize(4);
                cache_anchor();
            }
        },
        {
            index: ["小", "smaller"],
            action: function (i, cmd) {
                decreaseFontSize(4);
                cache_anchor();
            }
        }, {
            index: ["跳转"],
            action: function (i, cmd) {
                var _page_offset = $(document).scrollTop();
                var _search_index = search(cache_anchors, _page_offset);
                if (_search_index >= 0) {
                    _current_select_index = _search_index;
                    $("a[data-vocal-assistant-anchor='" + cache_anchors[_search_index].index + "']").css({
                        "background-color": "#000",
                        "color": "#fff"
                    });
                    // window.location.href = $("a[data-vocal-assistant-anchor='" + _search_index + "']").attr('href');
                }
                // $("a[data-vocal-assistant-anchor='14']").trigger('click');
            }
        },
        {
            index: ['上一个', '下一个'],
            action: function (i, cmd) {
                if (_current_select_index === -1) {
                    return;
                }
                switch (i) {
                    case 0:
                        $("a[data-vocal-assistant-anchor='" + cache_anchors[_current_select_index].index + "']").css({
                            "background-color": "#aaa",
                            "color": "#000"
                        });
                        _current_select_index = Math.max(0, _current_select_index - 1);
                        $("a[data-vocal-assistant-anchor='" + cache_anchors[_current_select_index].index + "']").css({
                            "background-color": "#000",
                            "color": "#fff"
                        });
                        break;
                    case 1:
                        $("a[data-vocal-assistant-anchor='" + cache_anchors[_current_select_index].index + "']").css({
                            "background-color": "#aaa",
                            "color": "#000"
                        });
                        _current_select_index = Math.min(cache_anchors.length - 1, _current_select_index + 1);
                        $("a[data-vocal-assistant-anchor='" + cache_anchors[_current_select_index].index + "']").css({
                            "background-color": "#000",
                            "color": "#fff"
                        });
                        break;
                }
            }
        },
        {
            index: ['返回', '后退'],
            action: function (i, cmd) {
                window.history.back();
            }
        }, {
            index: ['确定', '是的', '是', '没错'],
            action: function (i, cmd) {
                if (_current_select_index !== -1) {
                    window.location.href = $("a[data-vocal-assistant-anchor='" + cache_anchors[_current_select_index].index + "']").attr('href');
                }
            }
        },
        {
            index:["截屏", "截图"],
            action: function (i, cmd) {
                screenShot()
            }
        }
    ]);

    function search(arr, data) {
        for (var i = 0; i < arr.length - 1; i++) {
            if (arr[i].offset <= data && arr[i + 1].offset >= data) {
                return i;
            }
        }
        return -1;
    }

    function binSearch(arr, data) {
        var upperBound = arr.length - 1;
        var lowerBound = 0;
        while (lowerBound <= upperBound) {
            var mid = Math.floor((lowerBound + upperBound) / 2);
            if (arr[mid].offset < data) {
                if (arr[mid + 1].offset && arr[mid + 1].offset > data) {

                }
                lowerBound = mid + 1;
            } else if (arr[mid].offset > data) {
                upperBound = mid - 1;
            }
            else {
                return mid;
            }
        }
        return -1;
    }

    return fish;
})();