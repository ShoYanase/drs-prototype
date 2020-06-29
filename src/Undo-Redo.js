action_history = [];
deleted_mainnetwork = [];
deleted_network = {};
deleted_network_place = [];
added_edge = [];
swapped_container_placed = [];
swapped_network_id = [];

/**
$('#undo-button').on('click', function(e){
  console.log('undobutton');
  UndoAction();
});
*/

function UndoAction(){
  console.log("UndoAction",action_history);
  let hist = action_history.pop();
  switch(hist){
    case "edgedblclk":
      break;
    case "edgedel":
      break;
    case "swap":
      resetNetworkEvents();
      let main_data = getData(main_network);
      let replaced_data = getData(deleted_mainnetwork.pop());
      network_options = {
        autoResize: true,
        height: "100%",
        width: "100%",
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
          ///***
          hierarchicalRepulsion:{
            nodeDistance: 50,
            springLength: 150,
            damping: 1.0
          },
          repulsion:{
            damping: 1.0
          }
          // */
        },
        manipulation: {
          enabled: false,
          addEdge: function (data, callback) {
              AddEdgeFunc(data, callback);
          }
        }
      };

      let container_boxarr = document.getElementById('network-array');
      let el = document.createElement('div', {is : 'expanding-div'});
      let elementId = swapped_network_id.pop();
      el.setAttribute("id", elementId);
      let container_place = swapped_container_placed.pop();
      let child_len = container_boxarr.children.length;
      if(child_len <= container_place || child_len == 0 || container_place < 0){
        container_boxarr.appendChild(el);
      }else{
        container_boxarr.insertBefore(el,container_boxarr.children.item(container_place));
      }

      let network = new vis.Network(el, main_data, network_options);
      disableHierarchy(network);
      eventEdgeDblclicled(network);
      network_arr[elementId] = network;

      main_network = new vis.Network(maincontainer, replaced_data, network_options);
      disableHierarchy(main_network);
      eventEdgeDblclicled(main_network);
      deleteEdgeAction();
      editEdgeMode();
      break;

    case "edgeadd":
      let edgeId = added_edge.pop();
      console.log("Undo AddEdge ",edgeId);
      main_network.updateEdge(String(edgeId), {id: undefined, hidden: true});
      break;
  }
}


function RedoAction(){

}