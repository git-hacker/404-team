(function () {
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
                cmd.action(this, cmd.index, text);
            }
        }
    };

    function scroll() {
        var top = $(window).scrollTop();
        $("html,body").animate({scrollTop: top + 500}, 300)
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

    // setupSpeechRecognition();
    // recognizerStart(window.SDK, recognizer);

    var mode = 'Interactive';
    var lang = 'zh-CN';
    var key = '18c3a34b7da34116a4761a896b7fcd79';
    var fish = new BabelFish({mode: mode, language: lang, key: key});
    fish.start();
    fish.addCommands([
        {
            index: ["向下", "往下", "往下滚", "向下滚", "下"],
            action: function (i, cmd) {
                scroll();
            }
        },
        {
            index: ["字体放大", "放大", "大"],
            action: function (i, cmd) {
                increaseFontSize(4);
            }
        },
        {
            index: ["字体减小", "减小", "小"],
            action: function (i, cmd) {
                decreaseFontSize(4);
            }
        }
    ]);
})();