// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
// 
// Can use:
// chrome.tabs.*
// chrome.extension.*



var receiver = null;
var version = "1.0";

var openCount = 0;
var isDevToolsOpen = false;

/** events for tab capture */
function playCapturedStream(stream) {
    if (!stream) {
        console.error('Error starting tab capture: ' +
            (chrome.runtime.lastError.message || 'UNKNOWN'));
        return;
    }
    if (receiver != null) {
        receiver.close();
    }
    receiver = window.open('html/receiver.html');
    receiver.currentStream = stream;

}

function testCapture() {
    console.log('Test with method capture().');
    chrome.tabCapture.capture({
        video: true, audio: true,
        videoConstraints: {
            mandatory: {
                minWidth: 16,
                minHeight: 9,
                maxFrameRate: 60,
            },
        },
    },

        function (stream) {

            if (!stream) {
                console.error('Error starting tab capture: ' +
                    (chrome.runtime.lastError.message || 'UNKNOWN'));
                return;
            }
            if (receiver != null) {
                receiver.close();
            }
            receiver = window.open('html/receiver.html');
            receiver.currentStream = stream;

        });
}

function testGetMediaStreamId() {
    console.log('Test with method getMediaStreamId().');
    chrome.tabCapture.getMediaStreamId(function (streamId) {
        if (typeof streamId !== 'string') {
            console.error('Failed to get media stream id: ' +
                (chrome.runtime.lastError.message || 'UNKNOWN'));
            return;
        }

        navigator.webkitGetUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            }
        },
            function (stream) {
                playCapturedStream(stream);
            },
            function (error) {
                console.error(error);
            })
    });
}

/** end */

// When devtools opens, this gets connected
chrome.extension.onConnect.addListener(function (port) {
    var extensionListener = function (message, sender, sendResponse) {

        if (["downloadHARlog", "savePage"].includes(message.action)) {
            port.postMessage(message);
        } else {
            sendResponse(message);
        }
    }

    // Listens to messages sent from the panel
    chrome.extension.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function (port) {
        chrome.extension.onMessage.removeListener(extensionListener);
    });
});

var gTabId;
var logData = [];

function onEvent(debuggeeId, message, params) {
    if (gTabId != debuggeeId.tabId)
        return;

    logData.push(params)
}

function onAttach(tabId) {
    gTabId = tabId;
    if (chrome.runtime.lastError) {
        return;
    }

    // use Log.enable and go from there
    chrome.debugger.sendCommand({ tabId: tabId }, "Log.enable");
    chrome.debugger.onEvent.addListener(onEvent);

    setTimeout(() => {
        let harBLOB = new Blob([JSON.stringify(logData)]);

        let url = URL.createObjectURL(harBLOB);

        chrome.downloads.download({
            url: url
        });

        // cleanup after downloading file
        chrome.debugger.sendCommand({ tabId: tabId }, "Log.disable");
        chrome.debugger.detach({ tabId: tabId });
        gTabId = undefined;
        logData = [];

    }, 1000);

}

// Always return true for async connections for chrome.runtime.onConnect.addListener
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name == "devtools-page") {
        if (openCount == 0) {
            isDevToolsOpen = true
            // alert("DevTools window opening.");
        }
        openCount++;

        port.onDisconnect.addListener(function (port) {
            openCount--;
            if (openCount == 0) {
                isDevToolsOpen = false
            }
        });
    }
    return true;
});

// messages from popup.js
// Always return true for async connections for chrome.runtime.onConnect.addListener
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    let info = {}
    info.request = JSON.stringify(request)
    info.sender = JSON.stringify(sender)
    info.sendResponse = JSON.stringify(sendResponse)

    if (request.action === "getDevToolsStatus") {
        // response needs to be in JSON format
        sendResponse({ data: isDevToolsOpen })
    } else if (request.action === "getConsoleLog") {

        chrome.debugger.attach({ tabId: request.tabId }, version,
            onAttach.bind(null, request.tabId));
    } else if (request.directive === "popup-click") {
        chrome.storage.local.get(['tabCaptureMethod'], function (result) {
            if (result.tabCaptureMethod == 'streamId') {
                testGetMediaStreamId();
            } else {
                testCapture();
            }
        });
    }
    return true;
});

