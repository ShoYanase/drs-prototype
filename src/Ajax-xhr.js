/**
function ajaxSuccess () {
  console.log(this.responseText);
}

function AJAXSubmit (oFormElement) {
  if (!oFormElement.action) { return; }
  var oReq = new XMLHttpRequest();
  oReq.onload = ajaxSuccess;
  if (oFormElement.method.toLowerCase() === "post") {
    oReq.open("post", oFormElement.action);
    XMLHttpRequest.withCredentials = true;
    XMLHttpRequest.responseType = 'json';
    oReq.send(new FormData(oFormElement));
  } else {
    var oField, sFieldType, nFile, sSearch = "";
    for (var nItem = 0; nItem < oFormElement.elements.length; nItem++) {
      oField = oFormElement.elements[nItem];
      if (!oField.hasAttribute("name")) { continue; }
      sFieldType = oField.nodeName.toUpperCase() === "INPUT" ?
          oField.getAttribute("type").toUpperCase() : "TEXT";
      if (sFieldType === "FILE") {
        for (nFile = 0; nFile < oField.files.length;
            sSearch += "&" + escape(oField.name) + "=" + escape(oField.files[nFile++].name));
      } else if ((sFieldType !== "RADIO" && sFieldType !== "CHECKBOX") || oField.checked) {
        sSearch += "&" + escape(oField.name) + "=" + escape(oField.value);
      }
    }
    oReq.open("get", oFormElement.action.replace(/(?:\?.*)?$/, sSearch.replace(/^&/, "?")), true);
    oReq.send(null);  
  }

  oReq.onreadystatechange = function() {
    if (oReq.readyState === 4) {
      res = oReq.response;
      obj = JSON.parse(res);
      arr_labels = obj.paragraph;
      points_matrix = obj.matrix[0];
      console.log(arr_labels, points_matrix);
    }
  }
}
**/

function ajaxSuccess () {
  //console.log(this.responseText);
}

function AJAXSubmit (oFormElement) {
  var oReq = new XMLHttpRequest();
  let data =  new FormData(oFormElement)
  oReq.onload = ajaxSuccess;
  oReq.open("post", "http://127.0.0.1:5000/point_matrix");
  XMLHttpRequest.withCredentials = true;
  XMLHttpRequest.responseType = 'json';
  oReq.send(data);

  oReq.onreadystatechange = function() {
    generatefromReq(oReq)
  }
}

function AJAXSubmit_notform (oReqElement) {
  var oReq = new XMLHttpRequest();
  let sendData = new FormData(document.getElementById('subform'))
  console.log(sendData);
  oReq.onload = ajaxSuccess;
  oReq.open("post", "http://127.0.0.1:5000/split_parag");
  XMLHttpRequest.withCredentials = true;
  XMLHttpRequest.responseType = 'json';
  oReq.send(sendData);
  oReq.onreadystatechange = function() {
    generatefromReq(oReq)
  }
}

function generatefromReq(req){
  if (req.readyState === 4) {
    res = req.response;
    obj = JSON.parse(res);
    arr_labels = obj.paragraph;
    points_matrix = obj.matrix;
    matrix_label = obj.matrix_label;
    contents = obj.content;
    sentences_full = obj.sentences_full;
    console.log(sentences_full);
    let thres = $('#numberthres').val();
    clearElements('network-array');
    clearElements('sentences-array');
    appendSentences(sentences_full);
    act_mynetwork(arr_labels, points_matrix, thres, matrix_label, flex_threshold_range, contents);
  }
}