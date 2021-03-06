var BCLS = (function(window, document) {
  var videoTableBody = document.getElementById('videoTableBody'),
    getPreviousVideos = document.getElementById('getPreviousVideos'),
    getNextVideos = document.getElementById('getNextVideos'),
    addCaptions = document.getElementById('addCaptions'),
    selectAll = document.getElementById('selectAll'),
    statusMessages = document.getElementById('statusMessages'),
    totalVideos = 0,
    totalVideoSets = 0,
    nextVideoSet = 0,
    diCallNumber = 0,
    totalDiCalls = 0,
    // placeholder for a collection of checkboxes we'll get later
    checkBoxes,
    // place holder for the array of selected video ids
    selectedVideos = [],
    /**
     * since i don't have captions per video, i'm just adding
     * sample captions to all videos
     * note i'm adding English and Spanish both in case you do
     * multilanguage
     */
    text_tracks = [{
      url: 'https://solutions.brightcove.com/bcls/assets/vtt/sample.vtt',
      srclang: 'en',
      kind: 'captions',
      label: 'English',
      default: 'true'
    }, {
      url: 'https://solutions.brightcove.com/bcls/assets/vtt/sample-es.vtt',
      srclang: 'es',
      kind: 'captions',
      label: 'Español',
      default: 'false'
    }],
    /**
     * in case this is for a multi-user environment
     * with multiple accounts, I'm simulating
     * user/account information obtained from some backend system
     */
    customer_id = 'customer1',
    brightcoveAccountId = '1485884786001';

  /**
   * event listeners
   */
  // initial operations on page load
  window.addEventListener('load', function() {
    // get the video count and load the first set immediately
    disableButton(getPreviousVideos);
    createRequest('getVideoCount');
    createRequest('getVideos');
  });
  // get next set of videos
  getNextVideos.addEventListener('click', function() {
    // get the next video set
    statusMessages.textContent = '';
    enableButton(getPreviousVideos);
    nextVideoSet++;
    if (nextVideoSet === (totalVideoSets - 1)) {
      disableButton(getNextVideos);
    }
    createRequest('getVideos');
  });
  // get previous set of videos
  getPreviousVideos.addEventListener('click', function() {
    // get the next video set
    statusMessages.textContent = '';
    enableButton(getNextVideos);
    nextVideoSet--;
    if (nextVideoSet === 0) {
      disableButton(getPreviousVideos);
    }
    createRequest('getVideos');
  });
  // add captions to selected videos
  addCaptions.addEventListener('click', function() {
    // add captions to selected videos
    getSelectedCheckboxes(checkBoxes, selectedVideos);
    totalDiCalls = selectedVideos.length;
    statusMessages.textContent = 'Adding captions...';
    createRequest('addCaptions');
  });
  // select all videos in the current set
  selectAll.addEventListener('change', function() {
    if (selectAll.checked) {
      selectAllCheckboxes(checkBoxes);
    } else if (!selectAll.checked) {
      deselectAllCheckboxes(checkBoxes);
    }
  });

  /**
   * getSelectedCheckboxes returns an array of the values
   * of checked checkboxes
   * @param {htmlElementCollection} checkboxCollection a collection of the checkbox elements, usually gotten by document.getElementsByName()
   * @param {Array} targetArray the array to store the values in
   * @returns {Array} the target array
   */
  function getSelectedCheckboxes(checkboxCollection, targetArray) {
    var i,
      iMax = checkboxCollection.length;
    for (i = 0; i < iMax; i += 1) {
      if (checkboxCollection[i].checked) {
        targetArray.push(checkboxCollection[i].value);
      }
    }
  }

  /**
   * Enable a button
   * @param {htmlElement} el the button
   */
  function enableButton(el) {
    el.removeAttribute('disabled');
    el.setAttribute('style', 'cursor:pointer;opacity:1;');
  }

  /**
   * Disable a button
   * @param {htmlElement} el the button
   */
  function disableButton(el) {
    el.setAttribute('disabled', 'disabled');
    el.setAttribute('style', 'cursor:not-allowed;opacity:.7;');
  }

  /**
   * selects all checkboxes in a collection
   * of checked checkboxes
   * @param {htmlElementCollection} checkboxCollection a collection of the checkbox elements, usually gotten by document.getElementsByName()
   */
  function selectAllCheckboxes(checkboxCollection) {
    var i,
      iMax = checkboxCollection.length;
    for (i = 0; i < iMax; i += 1) {
      checkboxCollection[i].setAttribute('checked', 'checked');
    }
  }

  /**
   * deselects all checkboxes in a collection
   * of checked checkboxes
   * @param {htmlElementCollection} checkboxCollection a collection of the checkbox elements, usually gotten by document.getElementsByName()
   */
  function deselectAllCheckboxes(checkboxCollection) {
    var i,
      iMax = checkboxCollection.length;
    for (i = 0; i < iMax; i += 1) {
      checkboxCollection[i].removeAttribute('checked');
    }
  }

  /**
   * createRequest sets up requests, send them to makeRequest(), and handles responses
   * @param  {string} type the request type
   */
  function createRequest(type) {
    var options = {},
      cmsBaseURL = 'https://cms.api.brightcove.com/v1/accounts/' + brightcoveAccountId,
      diBaseURL = 'https://ingest.api.brightcove.com/v1/accounts/' + brightcoveAccountId,
      endpoint,
      responseDecoded,
      limit = 20,
      requestBody = {},
      track,
      i,
      iMax;

    options.customer_id = customer_id;
    options.account_id = brightcoveAccountId;
    options.proxyURL = 'https://solutions.brightcove.com/bcls/bcls-proxy/brightcove-learning-proxy-v2.php';
    switch (type) {
      case 'getVideoCount':
        endpoint = '/counts/videos';
        options.url = cmsBaseURL + endpoint;
        options.requestType = 'GET';
        makeRequest(options, function(response) {
          responseDecoded = JSON.parse(response);
          totalVideos = parseInt(responseDecoded.count);
          totalVideoSets = Math.ceil(totalVideos / limit);
        });
        break;
      case 'getVideos':
        endpoint = '/videos?limit=' + limit + '&offset=' + (nextVideoSet * limit);
        options.url = cmsBaseURL + endpoint;
        options.requestType = 'GET';
        makeRequest(options, function(response) {
          var video,
            tr,
            td,
            br,
            input,
            img,
            txt,
            docFragment = document.createDocumentFragment();
          // parse the response
          responseDecoded = JSON.parse(response);
          // inject the table rows for the videos
          iMax = responseDecoded.length;
          for (i = 0; i < iMax; i++) {
            video = responseDecoded[i];
            if (video.id) {
              tr = document.createElement('tr');
              // checkbox cell
              td = document.createElement('td');
              input = document.createElement('input');
              input.setAttribute('type', 'checkbox');
              input.setAttribute('id', video.id);
              input.setAttribute('name', 'videoSelect');
              input.setAttribute('value', video.id);
              td.appendChild(input);
              tr.appendChild(td);
              // thumbnail cell
              if (video.images && video.images.thumbnail) {
                td = document.createElement('td');
                img = document.createElement('img');
                img.setAttribute('src', video.images.thumbnail.src);
                img.setAttribute('alt', video.name);
                td.appendChild(img);
                tr.appendChild(td);
              } else {
                td = document.createElement('td');
                txt = document.createTextNode('(no image)');
                td.appendChild(txt);
                tr.appendChild(td);
              }
              // add title cell
              td = document.createElement('td');
              txt = document.createTextNode(video.name);
              td.appendChild(txt);
              br = document.createElement('br');
              td.appendChild(br);
              txt = document.createTextNode(video.description);
              td.appendChild(txt);
              tr.appendChild(td);
              // append this row to the doc fragment
              docFragment.appendChild(tr);
            }
          }
          // clear the table body and append the doc fragment to the table body
          videoTableBody.innerHTML = '';
          videoTableBody.appendChild(docFragment);
          // get a reference to the checkbox collection
          checkBoxes = document.getElementsByName('videoSelect');
        });
        break;
      case 'addCaptions':
        endpoint = '/videos/' + selectedVideos[diCallNumber] + '/ingest-requests';
        options.url = diBaseURL + endpoint;
        options.requestType = 'POST';
        requestBody.text_tracks = [];
        iMax = text_tracks.length;
        for (i = 0; i < iMax; i++) {
          track = text_tracks[i];
          // note that default must be a boolean, so no quotes around the value
          requestBody.text_tracks[i] = {};
          requestBody.text_tracks[i].url = track.url;
          requestBody.text_tracks[i].srclang = track.srclang;
          requestBody.text_tracks[i].kind = track.kind;
          requestBody.text_tracks[i].label = track.label;
          requestBody.text_tracks[i].default = track.default;
        }
        options.requestBody = JSON.stringify(requestBody);
        makeRequest(options, function(response) {
          responseDecoded = JSON.parse(response);
          diCallNumber++;
          if (diCallNumber < totalDiCalls) {
            createRequest('addCaptions');
          } else {
            statusMessages.textContent = 'Captions added to ' + totalDiCalls + ' videos';
            deselectAllCheckboxes(checkBoxes);
          }
        });
        break;
      default:
        // shouldn't be here
        console.log('somehow got to default case');
    }
  }

  /**
   * send API request to the proxy
   * @param  {Object} options for the request
   * @param  {String} options.url the full API request URL
   * @param  {String="GET","POST","PATCH","PUT","DELETE"} requestData [options.requestType="GET"] HTTP type for the request
   * @param  {String} options.proxyURL proxyURL to send the request to
   * @param  {String} options.client_id client id for the account (default is in the proxy)
   * @param  {String} options.client_secret client secret for the account (default is in the proxy)
   * @param  {JSON} [options.requestBody] Data to be sent in the request body in the form of a JSON string
   * @param  {Function} [callback] callback function that will process the response
   */
  function makeRequest(options, callback) {
    var httpRequest = new XMLHttpRequest(),
      response,
      proxyURL = options.proxyURL,
      // response handler
      getResponse = function() {
        try {
          if (httpRequest.readyState === 4) {
            if (httpRequest.status >= 200 && httpRequest.status < 300) {
              response = httpRequest.responseText;
              // some API requests return '{null}' for empty responses - breaks JSON.parse
              if (response === '{null}') {
                response = null;
              }
              // return the response
              callback(response);
            } else {
              alert('There was a problem with the request. Request returned ' + httpRequest.status);
            }
          }
        } catch (e) {
          alert('Caught Exception: ' + e);
        }
      };
    /**
     * set up request data
     * the proxy used here takes the following request body:
     * JSON.stringify(options)
     */
    // set response handler
    httpRequest.onreadystatechange = getResponse;
    // open the request
    httpRequest.open('POST', proxyURL);
    // set headers if there is a set header line, remove it
    // open and send request
    httpRequest.send(JSON.stringify(options));
  }

})(window, document);