points_matrix =
/**３対比 */
                    [[[100,0,0,100],
                    [0,100,100,0],
                    [0,100,100,0],
                    [100,0,0,100],
                  ]];

arr_labels = ["Sample1","Sample2","Sample3","Sample4"];

matrix_label = [];

/**let parag_len = arr_labels.length;
 */


var node_maxwidth = 250
var node_maxheight = 90

flex_threshold_range = [50, 65];
var numberthres = (flex_threshold_range[0]+flex_threshold_range[1])/2;

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
                    id: i+"-"+j,
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

class ExpandingDiv extends HTMLDivElement{
  constructor() {
    super();
    this.setAttribute('class','network');
    this.setAttribute('draggable','true');
    this.setAttribute('ondragstart','drag(event)');
    this.setAttribute('ondragover','allowDrop(event)');
    this.setAttribute('ondrop','drop(event)');
  }
}customElements.define('expanding-div', ExpandingDiv, { extends: 'div' });

network_arr = {};
selectedEdgeId = {};
function act_mynetwork(labels_, matrix_, thres_, mat_label_,threshold_range){
  let maincontainer = document.getElementById('mynetwork')
  maincontainer.setAttribute('ondragover','allowDrop(event)');
  maincontainer.setAttribute('ondrop','drop(event)');

  if(selectedEdgeId.length >= 1){

  }

  if(Array.isArray(matrix_[0])){
    matarr_len = matrix_.length;
    main_network = visNetwork(labels_, matrix_[0], thres_, mat_label_[0], maincontainer,'100%', '100%');
    var container_boxarr = document.getElementById('network-array');

    
    for(let j=threshold_range[0];j<threshold_range[1];j+=3){
      var el = document.createElement('div', {is : 'expanding-div'});
      el.setAttribute("id", mat_label_[0]+j)
      let network = visNetwork(labels_, matrix_[0], j, mat_label_[0], el, '100%', '100%');
      container_boxarr.appendChild(el);
      network_arr[mat_label_[0]+j] = network;
    }

    for(let i=1;i<matarr_len;i++){
      for(let j=threshold_range[0];j<threshold_range[1];j+=3){
        var el = document.createElement('div', {is : 'expanding-div'});
        el.setAttribute("id", mat_label_[i]+j)
        let network = visNetwork(labels_, matrix_[i], j, mat_label_[i], el, '100%', '100%');
        container_boxarr.appendChild(el);
        network_arr[mat_label_[i]+j] = network;
      }
    }
  } else {main_network = visNetwork(labels_, matrix_, thres_, mat_label_, maincontainer, '100%', '100%');}
  

  function visNetwork(labels, matrix, thres, mat_label, container, height, width) {
    console.log("visNetwork",mat_label);
    let parag_len = labels.length;
    var data = {
      nodes: make_nodes(parag_len, labels),
      edges: make_edges(matrix, thres)
    };
    var options = {
      height: height,
      width: width,
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
    return new vis.Network(container, data, options);
  }

  /**ダブルクリックでエッジ確定 */
  main_network.on("doubleClick", function(params){
    console.log("dblclickevent");
    if (params.edges.length == 1) {
      let edgeId = params.edges[0];
      console.log('エッジ'+edgeId + 'がダブルクリックされました');

      nodeIds = edgeId.split('-');
      if(Array.isArray(matrix_[0])){
          var selectedEdgePoint = points_matrix[0][nodeIds[0]][nodeIds[1]];
      }else{var selectedEdgePoint = points_matrix[nodeIds[0]][nodeIds[1]];}
      selectedEdgeId = {edgeId: selectedEdgePoint};
      clearElements('network-array');
      act_mynetwork(labels_, points_matrix, (selectedEdgePoint+flex_threshold_range[1])/2, mat_label_,[selectedEdgePoint, flex_threshold_range[1]]);
    }
  });
}

function clearElements(elid){
  var element = document.getElementById(elid);
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function ajaxSuccess () {
  /**console.log(this.responseText);*/
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

function enableDrag(el){
  if(el.className == 'network'){
    console.log("drag enable");
    el.setAttribute('draggable','true');
    el.setAttribute('ondragstart','drag(event)');
    el.setAttribute('ondragover','allowDrop(event)');
    el.setAttribute('ondrop','drop(event)');
  }else{
    console.log("drag disable");
    el.setAttribute('draggable','false');
    el.setAttribute('ondragstart','');
    el.setAttribute('ondragover','');
    el.setAttribute('ondrop','');
  }
}

const allowDrop = (event) => {
  event.preventDefault();
}

const drag = (event) => {
  event.dataTransfer.setData('target_id', event.target.id);
}

/** network-array -> mynetwork のドラッグを想定*/
const drop = (event) => {
  event.preventDefault();  
  let drop_target = event.target;
  let drag_target_id = event.dataTransfer.getData('target_id');
  main_network = network_arr[drag_target_id];
  console.log(main_network)
  let drag_target = document.getElementById(drag_target_id);
  let cl_tmp = drop_target.className;
  drop_target.className = drag_target.className;
  drag_target.className = cl_tmp;
  console.log(drag_target);
  let tmp = document.createElement('div');
  drop_target.before(tmp);
  /**drag_target.before(drop_target);*/
  tmp.replaceWith(drag_target);
  enableDrag(drop_target);
  enableDrag(drag_target);
}

$('.network').on("drop dragover", function (e) {
  e.stopPropagation();
  e.preventDefault();
});
