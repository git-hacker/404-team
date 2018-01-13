document.write()
(function () {
    var recognizer;

    function setupSpeechRecognition() {
        var recognitionMode = "Interactive", languageOptions = "zh-CN", key = "ec5a64ec335043a2924cee0f839c6e3b";
        if (recognizer != null) {
            RecognizerStop(window.SDK, recognizer);
        }
        console.log("trying to setup speech recognition")
        recognizer = RecognizerSetup(window.SDK, recognitionMode, languageOptions, SDK.SpeechResultFormat['Simple'], key);
    }

// Stop the Recognition.
    function RecognizerStop(SDK, recognizer) {
        // recognizer.AudioSource.Detach(audioNodeId) can be also used here. (audioNodeId is part of ListeningStartedEvent)
        recognizer.AudioSource.TurnOff();
    }

    function RecognizerSetup(SDK, recognitionMode, language, format, subscriptionKey) {

        switch (recognitionMode) {
            case "Interactive" :
                recognitionMode = SDK.RecognitionMode.Interactive;
                break;
            case "Conversation" :
                recognitionMode = SDK.RecognitionMode.Conversation;
                break;
            case "Dictation" :
                recognitionMode = SDK.RecognitionMode.Dictation;
                break;
            default:
                recognitionMode = SDK.RecognitionMode.Interactive;
        }

        var recognizerConfig = new SDK.RecognizerConfig(
            new SDK.SpeechConfig(
                new SDK.Context(
                    new SDK.OS(navigator.userAgent, "Browser", null),
                    new SDK.Device("SpeechSample", "SpeechSample", "1.0.00000"))),
            recognitionMode,
            language, // Supported languages are specific to each recognition mode. Refer to docs.
            format); // SDK.SpeechResultFormat.Simple (Options - Simple/Detailed)


        var useTokenAuth = false;

        var authentication = function () {
            if (!useTokenAuth)
                return new SDK.CognitiveSubscriptionKeyAuthentication(subscriptionKey);

            var callback = function () {
                var tokenDeferral = new SDK.Deferred();
                try {
                    var xhr = new (XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
                    xhr.open('GET', '/token', 1);
                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            tokenDeferral.Resolve(xhr.responseText);
                        } else {
                            tokenDeferral.Reject('Issue token request failed.');
                        }
                    };
                    xhr.send();
                } catch (e) {
                    window.console && console.log(e);
                    tokenDeferral.Reject(e.message);
                }
                return tokenDeferral.Promise();
            };

            return new SDK.CognitiveTokenAuthentication(callback, callback);
        }();
        return SDK.CreateRecognizer(recognizerConfig, authentication);
    }

    function recognizerStart(SDK, recognizer) {
        recognizer.Recognize((event) => {
            /*
             Alternative syntax for typescript devs.
             if (event instanceof SDK.RecognitionTriggeredEvent)
             */
            switch (event.Name) {
                case "RecognitionTriggeredEvent" :
                    UpdateStatus("Initializing");
                    break;
                case "ListeningStartedEvent" :
                    UpdateStatus("Listening");
                    break;
                case "RecognitionStartedEvent" :
                    UpdateStatus("Listening_Recognizing");
                    break;
                case "SpeechStartDetectedEvent" :
                    UpdateStatus("Listening_DetectedSpeech_Recognizing");
                    console.log(JSON.stringify(event.Result)); // check console for other information in result
                    break;
                case "SpeechHypothesisEvent" :
                    console.log(JSON.stringify(event.Result)); // check console for other information in result
                    //执行指令
                    executeInstruction(event.Result);
                    console.log('小陈陈的往下命令')
                    break;
                case "SpeechFragmentEvent" :
                    console.log(JSON.stringify(event.Result)); // check console for other information in result
                    break;
                case "SpeechEndDetectedEvent" :
                    UpdateStatus("Processing_Adding_Final_Touches");
                    console.log(JSON.stringify(event.Result)); // check console for other information in result
                    break;
                case "SpeechSimplePhraseEvent" :
                    break;
                case "SpeechDetailedPhraseEvent" :
                    console.log(JSON.stringify(event.Result, null, 3));
                    break;
                case "RecognitionEndedEvent" :
                    OnComplete();
                    UpdateStatus("Idle");
                    console.log(JSON.stringify(event)); // Debug information
                    break;
                default:
                    console.log(JSON.stringify(event)); // Debug information
            }
        })
            .On(() => {
                    // The request succeeded. Nothing to do here.
                },
                (error) => {
                    console.error(error);
                });
    }

    function OnComplete() {
        // startBtn.disabled = false;
        // stopBtn.disabled = true;
    }

    function UpdateStatus(status) {
        console.log("current status", status);
    }

  var scrolldown_commands = ["向下", "往下", "往下滚", "向下滚", "下"];
  console.log('小陈陈的往下命令')

  function executeInstruction(result) {
    var command = result.Text;
    if (scrolldown_commands.indexOf(command) != -1) {
      scroll(0, 1000)
    }
  }

  function scroll(x, y) {
    window.scrollBy(x, y);
  }

    setupSpeechRecognition();
    recognizerStart(window.SDK, recognizer);
})();

