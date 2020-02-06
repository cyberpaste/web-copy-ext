# Web-copy-ext chrome extension

Get web page Screenshot, Console Logs, Record tab, HAR log and save all the page sources.

## Installation

1) Clone this repo and extract the sources
2) Visit the link ``` chrome://extensions/  ```
3) Make sure developer mode checkbox is on
4) Click on button 'load unpacked' and select the extension directory

## Usage

### Screenshot

To get page screenshot you need click on a extension icon at the top of the page
and fill the checkbox field 'Screenshop' and click on a button 'Get snapshot'.

### Console Logs

To get page console output you need click on a extension icon at the top of the page
and fill the checkbox field 'Console Logs' and click on a button 'Get snapshot'.

### HAR log

Before you start you need to open devtools page (right click + inspect) and refresh page with
active devtools.
To get page network request log you need click on a extension icon at the top of the page
and fill the checkbox field 'HAR log' and click on a button 'Get snapshot'

### Save page

You need to do open devtools page first and refresh page with active devtools.
To get source files you need click on a extension icon at the top of the page
and fill the checkbox field 'Save page' and click on a button 'Get snapshot'.
You will find page sources in download folder.

Please note: 
1) This will only copy GET and POST requiests from network devtools page.
2) The resulting html output is not filtered, so if there are some external links or absolute paths, you need to update the sources manually to make it work.

Possible bugs:
1) Wrong website headers may result to a wrong file extension

### Record Tab

You need to click on a button 'Record Tab'
This will open page 'Tab recording' with live stream of your tab and if you see the tab contents in a video, this means the recording started and you can return to your tab.

When you finished working with the tab and you want to download the recorded video, you need to visit 'Tab recording' page and press 'Save' button.

Please note:
1) Only content inside window is recorded

