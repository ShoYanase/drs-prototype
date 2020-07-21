points_matrix =
/**３対比 */
                    [[[100,0,0,100],
                    [0,100,100,0],
                    [0,100,100,0],
                    [100,0,0,100],
                  ]];

arr_labels = ["Sample1","Sample2","Sample3","Sample4"];

contents = ["ground","ground","ground","claim"]

matrix_label = [];

/**let parag_len = arr_labels.length;
 */

main_network = undefined;
network_arr = {};

network_options = {};
var node_maxwidth = 250;
var node_maxheight = 90;

var flex_threshold_range = [45, 65];
var numberthres = (flex_threshold_range[0]+flex_threshold_range[1])/2;

function make_nodes(parag_len, labels, cont){
  //console.log(parag_len, labels)
    var arr_nodes = new Array();
    for(let i=0; i<parag_len; i++){
        //console.log(labels[i]);
        if(cont[i] == "claim"){
          border_color = '#EF476F';
        }else{
          border_color = '#76eec6';
        }
        arr_nodes.push({
            id: i+1,
            label: labels[i],
            font: {color:'#ffffff'},
            color: {background: '#575f5d',
                    border: border_color
            },
        });
        
    }
    return arr_nodes;
}

function make_edges(matrix, thres){
  if(typeof matrix == "number"){return [];}
  //console.log(matrix, thres);
    parag_len = matrix.length;
    var arr_edges = new Array();
    for(let i=0; i<parag_len; i++){
      let edgecount = 0;
      for(let j=i+1; j<parag_len; j++){
        if(matrix[i][j] >= thres){
          //console.log("edges "+i+j);
          arr_edges.push({
            id: i+"-"+j,
            from: i+1, 
            to: j+1, 
            label: String(matrix[i][j]),
            font: {size: 16},
            color: '#ffffff',
            arrows: {
              to:{
                enabled: true,
                type: 'arrow'
              }
            }
          });
          edgecount++;
        }
        if(edgecount>1){break;}
      }
    }
    return arr_edges;
}

class ExpandingDiv extends HTMLDivElement{
  constructor() {
    super();
    this.setAttribute('class','network');
    this.setAttribute('draggable','false');
    this.setAttribute('ondragstart','drag(event)');
    this.setAttribute('ondragover','allowDrop(event)');
    this.setAttribute('ondrop','drop(event)');
  }
}customElements.define('expanding-div', ExpandingDiv, { extends: 'div' });

var selectedEdgeId = {};
function act_mynetwork(labels_, matrix_, thres_, mat_label_, threshold_range, content_){
  resetNetworkEvents();
  deleted_network = {};
  
  $('#network-array').addClass('active');
  $('#network-array-button').addClass('active');
  maincontainer = document.getElementById('mynetwork');
  
  maincontainer.setAttribute('ondragover','allowDrop(event)');
  maincontainer.setAttribute('ondrop','drop(event)');

  if(Array.isArray(matrix_[0])){
    matarr_len = matrix_.length;
    main_network = visNetwork(labels_, matrix_[0], thres_, mat_label_[0], maincontainer,'100%', '100%', content_);
    disableHierarchy(main_network);
    //editedEdgeOptions(main_network);
    var container_boxarr = document.getElementById('network-array');
    
    for(let j=threshold_range[0];j<threshold_range[1];j+=3){
      var el = document.createElement('div', {is : 'expanding-div'});
      el.setAttribute("id", mat_label_[0]+j);
      let network = visNetwork(labels_, matrix_[0], j, mat_label_[0], el, '100%', '100%', content_);
      disableHierarchy(network);
      //editedEdgeOptions(network);
      container_boxarr.appendChild(el);
      network_arr[mat_label_[0]+j] = network;
      eventEdgeDblclicled(network);
      //editEdgeMode(network);
    }

    for(let i=1;i<matarr_len;i++){
      for(let j=threshold_range[0];j<threshold_range[1];j+=3){
        var el = document.createElement('div', {is : 'expanding-div'});
        el.setAttribute("id", mat_label_[i]+j);
        let network = visNetwork(labels_, matrix_[i], j, mat_label_[i], el, '100%', '100%', content_);
        disableHierarchy(network);
        //editedEdgeOptions(network);
        container_boxarr.appendChild(el);
        network_arr[mat_label_[i]+j] = network;
        eventEdgeDblclicled(network);
        //editEdgeMode(network);
      }
    }
  } else {
    main_network = visNetwork(labels_, matrix_, thres_, mat_label_, maincontainer, '100%', '100%', content_);
  }


  function visNetwork(labels, matrix, thres, mat_label, container, height, width, cont) {
    //console.log("visNetwork",mat_label+"\nthres "+thres);
    let parag_len = labels.length;
    var data = {
      nodes: make_nodes(parag_len, labels, cont),
      edges: make_edges(matrix, thres)
    };
    network_options = {
      autoResize: true,
      height: height,
      width: width,
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD",
          sortMethod: "directed",
          levelSeparation: node_maxheight +20,
          nodeSpacing: node_maxwidth
        }
      },
      edges: {
        font: {
          size: 16
        },
        widthConstraint: {
          maximum: node_maxwidth
        },
        color: {color: '#76eec6'},
        arrows: {
            to:{
                enabled: true,
                type: 'arrow'
            }
        }
      },
      nodes: {
        shape: 'box',
        widthConstraint: {
          maximum: node_maxwidth
        },
        color:{
          highlight:{
            border:'#9AFDE8',
            background: '#575f5d'
          }
        }
      },
      physics: {
        enabled: true,
        hierarchicalRepulsion:{
          centralGravity: 0.0,
          springLength: 500,
          springConstant: 0.01,

          nodeDistance: 50,
          springLength: 150,
          damping: 1.0
        },
        repulsion:{
          damping: 1.0
        }
      },
      manipulation: {
        enabled: false,
        addEdge: function (data, callback) {
          AddEdgeFunc(data, callback);
        }
      }
    };
    //console.log(Array.from({length: parag_len}, (v, i) => i+1));
    return new vis.Network(container, data, network_options);
  }
  //console.log(main_network);
  //console.log(network_arr);
  disableHierarchy(main_network);
  eventEdgeDblclicled(main_network);
  NetworkContext();
  deleteEdgeAction();
  editEdgeMode();
}

function disableHierarchy(network){
  network.on('startStabilizing', function(e){
    network.setOptions({
      layout:{
        hierarchical: false
      },
      physics:{
        enabled: false
      }
    });
  });
}

function resetNetworkEvents(){
  $('#delete-button').off('click',);
  $('#edit-button').off('click',);
}

function appendSentences(sentences){
  let parent_container = document.getElementById('sentences-array');
  for(let inner in sentences){
    let nodeId = parseInt(inner, 10)+1;
    var el = document.createElement('button');
    el.setAttribute('class', 'text_display_child');
    el.setAttribute('id', nodeId);
    el.innerHTML = sentences[inner];
    parent_container.appendChild(el);
    $('#sentences-array > button').on('click', function(){
      //console.log("_text_display_child clicked")
      let id = $(this).attr('id');
      //console.log("text_display_child clicked"+id);
      $('#target').attr('value', id);
      main_network.selectNodes([id]);
    });
  }
}

/**HTMLの要素 子配列を初期化 */
function clearElements(elid){
  var element = document.getElementById(elid);
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
/**HTMLの要素 任意の子を削除 */
function clearSingleElement(elid, index){
  var element = document.getElementById(elid);
  //console.log(element.childNodes.item(index));
  if(element.childNodes.item(index)){
    element.removeChild(element.childNodes.item(index));
  }
}

//$('#network-array-button').on('click', function(){
//  console.log('button click');
//  $('#network-array').toggleClass('active');
//  $('#network-array-button').toggleClass('active');
//});