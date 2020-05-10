function make_nodes(parag_len, labels){
  console.log(parag_len, labels)
    var arr_nodes = new Array();
    for(let i=0; i<parag_len; i++){
        console.log(labels[i]);
        arr_nodes.push({
            id: i+1,
            label: labels[i],
            font: {color:'#ffffff'},
            color: {background: '#575f5d',
                    border: '#76eec6'
            },
        });
    }
    return arr_nodes;
}

function make_edges(matrix, thres){
  if(typeof matrix == "number"){return [];}
  console.log(matrix, thres)
    parag_len = matrix.length;
    var arr_edges = new Array();
    for(let i=0; i<parag_len; i++){
        for(let j=i+1; j<parag_len; j++){
            if(matrix[i][j] >= thres){
                arr_edges.push({
                    from: i+1, 
                    to: j+1, 
                    label: String(matrix[i][j]),
                    font: {size: 10},
                    color: '#76eec6',
                    arrows: {
                        to:{
                            enabled: true,
                            type: 'arrow'
                        }
                    }
                });
            }
        }
    }
    return arr_edges;
}

points_matrix =
/**３対比 */
                    [[0,0,0,100],
                    [0,0,100,0],
                    [0,100,0,0],
                    [100,0,0,0],
                  ];

arr_labels = ["Sample","Sample","Sample","Sample"];

matrix_label = [];

/**let parag_len = arr_labels.length;
 */
let numberthres = 60;

let node_maxwidth = 250
let node_maxheight = 90

function act_mynetwork(labels_, matrix_, thres_, mat_label_){
  if(Array.isArray(matrix_[0])){

  } else {visNetwork(labels_, matrix_, thres_, mat_label_, 'mynetwork');}
  

  function visNetwork(labels, matrix, thres, mat_label, elid) {
    console.log(matrix);
    let parag_len = labels.length;
    var container = document.getElementById(elid);
    var data = {
      nodes: make_nodes(parag_len, labels),
      edges: make_edges(matrix, thres)
    };
    var options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD",
          sortMethod: "directed",
          levelSeparation: node_maxheight + 30,
          nodeSpacing: node_maxwidth
        }
      },
      edges: {
        font: {
          size: 16
        },
        widthConstraint: {
          maximum: node_maxwidth
        }
      },
      nodes: {
        shape: 'box',
        widthConstraint: {
          maximum: node_maxwidth
        }
      },
      physics: {
        enabled: true
      },
      manipulation: {
        enabled: true,
        addEdge: function (data, callback) {
          data.label = String(matrix[data.from][data.to]),
            data.color = '#ffffff',
            data.arrows = {
              to: {
                enabled: true,
                type: 'arrow'
              }
            };
          callback(data);
        }
      }
    };
    var network = new vis.Network(container, data, options);
  }
}



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
      points_matrix = obj.matrix;
      matrix_label = obj.matrix_label;
    }
  }
  
}