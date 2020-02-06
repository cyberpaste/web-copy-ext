
/** 
 * Todo - make video duration valid
 * 
(async function() {
  const duration = await getBlobDuration(data)
  console.log(duration + ' seconds')
})()

async function getBlobDuration(blob) {
  const tempVideoEl = document.createElement('video')

  const durationP = new Promise(resolve =>
    tempVideoEl.addEventListener('loadedmetadata', () => {
      // Chrome bug: https://bugs.chromium.org/p/chromium/issues/detail?id=642012
      if (tempVideoEl.duration === Infinity) {
        tempVideoEl.currentTime = Number.MAX_SAFE_INTEGER
        tempVideoEl.ontimeupdate = () => {
          tempVideoEl.ontimeupdate = null
          resolve(tempVideoEl.duration)
          tempVideoEl.currentTime = 0
        }
      }
      // Normal behavior
      else
        resolve(tempVideoEl.duration)
    }),
  )

  tempVideoEl.src = typeof blob === 'string' || blob instanceof String
    ? blob
    : window.URL.createObjectURL(blob)

  return durationP
}
*/

var data = new Blob([], { type: "video/webm" });
var recorder;

function shutdownReceiver() {
  if (!window.currentStream) {
    return;
  }

  var player = document.getElementById('player');
  player.srcObject = null;
  var tracks = window.currentStream.getTracks();
  for (var i = 0; i < tracks.length; ++i) {
    tracks[i].stop();
  }
  window.currentStream = null;

  document.body.className = 'shutdown';
}

function log(msg) {
  console.log(msg);
}

function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

window.addEventListener('load', function () {
  // Start video play-out of the captured audio/video MediaStream once the page
  // has loaded.
  var player = document.getElementById('player');
  player.addEventListener('canplay', function () {
    this.volume = 0.75;
    this.muted = false;
    this.play();
  });
  player.setAttribute('controls', '1');
  player.srcObject = window.currentStream;

  recorder = new MediaRecorder(player.srcObject);
  recorder.ondataavailable = function (e) {
    data = new Blob([data, e.data], { type: "video/webm" });
  }
  recorder.start();

  // Add onended event listeners. This detects when tab capture was shut down by
  // closing the tab being captured.
  var tracks = window.currentStream.getTracks();
  for (var i = 0; i < tracks.length; ++i) {
    tracks[i].addEventListener('ended', function () {
      console.log('MediaStreamTrack[' + i + '] ended, shutting down...');
      shutdownReceiver();
    });
  }
});

// Shutdown when the receiver page is closed.
window.addEventListener('beforeunload', shutdownReceiver);

document.getElementById('save-video').addEventListener('click', event => {
  if (!window.currentStream) {
    alert('no data to save');
  }
  var tracks = window.currentStream.getTracks();
  tracks.forEach(function (track) {
    track.stop();
  });
  recorder.stop();
  // Wait till the concatenation of Blobs is complete
  wait(5000).then(() => {
    let url = URL.createObjectURL(data);
    let filename = 'RecordedVideo.webm';
    chrome.downloads.download({
      url: url,
      filename: filename,
    });
  });

});
