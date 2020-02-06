// Can use
// chrome.devtools.*
// chrome.extension.*

// most likely this will run when devtools opens
var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});


function parseURL(url) {
    var parser = document.createElement('a'),
        searchObject = {},
        queries, split, i;
    parser.href = url;
    queries = parser.search.replace(/^\?/, '').split('&');
    for (i = 0; i < queries.length; i++) {
        split = queries[i].split('=');
        searchObject[split[0]] = split[1];
    }
    let pathname = parser.pathname;
    let filename = parser.pathname.substring(parser.pathname.lastIndexOf('/') + 1);
    let path = pathname.replace(filename, '');
    let isfile = false;
    let re = /(?:\.([^.]+))?$/;
    let extension = re.exec(filename)[1]
    if (filename.indexOf('.') > -1) {
        isfile = true;
    }
    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: pathname,
        search: parser.search,
        filename: filename,
        path: path,
        searchObject: searchObject,
        hash: parser.hash,
        isfile: isfile,
        extension: extension
    };
}



(function createChannel() {
    //Create a port with background page for continous message communication
    var port = chrome.extension.connect({
        name: "Another Communication" //Given a Name
    });

    // Listen to messages from the background page
    port.onMessage.addListener(function (message) {
        if (message.action === "downloadHARlog") {
            chrome.devtools.network.getHAR(
                (harLog) => {
                    let updatedHarLog = {};
                    // this makes it readable by Chrome Dev Tools
                    updatedHarLog.log = harLog;
                    let harBLOB = new Blob([JSON.stringify(updatedHarLog)]);
                    let url = URL.createObjectURL(harBLOB);
                    chrome.downloads.download({
                        url: url,
                    });
                }
            );
        }

        if (message.action === "savePage") {
            chrome.devtools.network.getHAR(
                (harLog) => {
                    let updatedHarLog = {};
                    updatedHarLog.log = harLog;

                    harLog.entries.forEach(function (resource) {

                        let parsedUrl = parseURL(resource.request.url);

                        if (parsedUrl.filename == '' || parsedUrl.isfile != true) {
                            parsedUrl.pathname = parsedUrl.pathname + '/index.html';
                        }

                        if (parsedUrl.pathname.indexOf('?') > -1) {
                            parsedUrl.pathname = parsedUrl.pathname.
                                substring(0, parsedUrl.pathname.indexOf("?"));
                        }

                        var filename = parsedUrl.host + parsedUrl.pathname;
                        var url = resource.request.url;

                        query = {
                            url: url,
                            exists: true,
                            state: 'complete'
                        }

                        if (resource.request.method === "GET") {
                            downloaded = chrome.downloads.search(query, function (downloadItems) {
                                if (downloadItems.length == 0 && filename.length < 250) {
                                    chrome.downloads.download({
                                        url: url,
                                        filename: filename,
                                    });
                                }
                            });
                        }

                        if (resource.request.method === "POST") {
                            downloaded = chrome.downloads.search(query, function (downloadItems) {
                                if (downloadItems.length == 0 && filename.length < 250) {
                                    fetch(url, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': resource.request.postData.mimeType,
                                        },
                                        body: resource.request.postData.text,
                                    }).then(response => response.text()).then(result => {
                                        let resultBLOB = new Blob([result]);
                                        let url = URL.createObjectURL(resultBLOB);
                                        chrome.downloads.download({
                                            url: url,
                                            filename: filename,
                                        });
                                    })
                                }
                            });
                        }
                    });
                });

        }


    });

}());