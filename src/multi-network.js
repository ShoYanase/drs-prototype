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

var node_maxwidth = 250
var node_maxheight = 90

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
  //console.log(matrix, thres)
    parag_len = matrix.length;
    var arr_edges = new Array();
    for(let i=0; i<parag_len; i++){
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
            }
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

var network_arr = {};
var selectedEdgeId = {};
function act_mynetwork(labels_, matrix_, thres_, mat_label_, threshold_range, content_){
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
      }
    }
  } else {main_network = visNetwork(labels_, matrix_, thres_, mat_label_, maincontainer, '100%', '100%', content_);}

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

  function visNetwork(labels, matrix, thres, mat_label, container, height, width, cont) {
    //console.log("visNetwork",mat_label+"\nthres "+thres);
    let parag_len = labels.length;
    var data = {
      nodes: make_nodes(parag_len, labels, cont),
      edges: make_edges(matrix, thres)
    };
    var options = {
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
          nodeDistance: 9999,
          centralGravity: 0,
          springLength: 1000,
          springConstant: 0
        }
      },
      manipulation: {
        enabled: false,
        addEdge: function (data, callback) {
          //data.id = String(data.from)+"-"+String(data.to), idが重複するとエラーなる
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
    //console.log(Array.from({length: parag_len}, (v, i) => i+1));
    return new vis.Network(container, data, options);
  }
  disableHierarchy(main_network);
  eventEdgeDblclicled(main_network);
  deleteEdgeAction(maincontainer);
  editEdgeMode();

}

/**ダブルクリックでエッジ確定*/
function eventEdgeDblclicled(network){
  network.on("doubleClick", function(params){
    //console.log("dblclickevent");
    if (params.edges.length == 1) {
      let edgeId = params.edges[0];
      //console.log('エッジ'+edgeId + 'がダブルクリックされました');

      /**network.setData({edges: {id: edgeId,color: {color: '#29f6b2'}}});*/

      let index_destroy = -1;
      for(let index_network in network_arr){
        let edge_isexist = network_arr[index_network].getClusteredEdges(edgeId).length;
        if(index_network != 'NaN'){
          if(!edge_isexist){
            clearSingleElement('network-array', index_destroy);
            index_destroy--;
          }
        }
        index_destroy++;
      }
    }
  });
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