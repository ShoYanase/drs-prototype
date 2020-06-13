   function enableDrag(el){
    if(el.className == 'network'){
      //console.log("drag enable");
      el.setAttribute('draggable','faise'/**('true') */);
      el.setAttribute('ondragstart','drag(event)');
      el.setAttribute('ondragover','allowDrop(event)');
      el.setAttribute('ondrop','drop(event)');
    }else{
      //console.log("drag disable");
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
  
  /** network-array -> mynetwork のドラッグ*/
  const drop = (event) => {
    event.preventDefault();  
    let drop_target = event.target;
    let drag_target_id = event.dataTransfer.getData('target_id');
    main_network = network_arr[drag_target_id];
  
    //console.log(main_network)
    eventEdgeDblclicled(main_network);
  
    let drag_target = document.getElementById(drag_target_id);
    let cl_tmp = drop_target.className;
    drop_target.className = drag_target.className;
    drag_target.className = cl_tmp;
    //console.log(drag_target);
    let tmp = document.createElement('div');
    drop_target.before(tmp);
    /**drag_target.before(drop_target);*/
    tmp.replaceWith(drag_target);
    enableDrag(drop_target);
    enableDrag(drag_target);
  }
  
  /**
  $('.network').on("drop dragover", function (e) {
    e.stopPropagation();
    e.preventDefault();
  });
*/

  //ダブルクリックでもスワップ

  $(document).on("dblclick", '.network > .vis-network', function (e) {
    //console.log("network dbclk");
    //console.log(e.target.parentNode.parentNode);
    e.target.parentNode.parentNode.remove();
    
    let targetId = e.target.id;
    let mainEl = $("#mynetwork > .vis-network");
    
    mainEl.replaceWith($(e.currentTarget));
    main_network = network_arr[targetId];
    eventEdgeDblclicled(main_network);
  });

  function deleteEdgeAction(container){
    $('#delete-button').on('click', function(){
      edgeList = main_network.getSelectedEdges().filter(function (x, i, self) {
        return self.indexOf(x) === i;
      });
      //console.log(edgeList);
      for(selectedEdges in edgeList){
        let edgeId = main_network.getSelectedEdges()[selectedEdges];
        console.log(main_network.getSelectedEdges()[selectedEdges]);

        let index_destroy = 0;
        for(let index_network in network_arr){
          let edge_isexist = network_arr[index_network].getClusteredEdges(edgeId).length;
          console.log(index_network, edge_isexist, index_destroy);
          if(index_network != 'NaN'){
            if(edge_isexist){
              clearSingleElement('network-array', index_destroy);
              index_destroy--;
            }
          }
          index_destroy++;
        }
        main_network.updateEdge(edgeId, {id: undefined, hidden: true});
      }
    });
  }

  f_editMode = false;
  function editEdgeMode(){
    $('#edit-button').on('click', function(){
      //console.log('editbutton clicked',f_editMode);
      if(!f_editMode){
        $('#edit-button').css({'background-image':'linear-gradient(180deg, #888888, #888888)', 'border': '1px solid var(--neon-border-color)'});
        main_network.addEdgeMode();
        main_network.on('release', function(){
          main_network.addEdgeMode();
        });
        f_editMode = true;
      }else{
        main_network.off('release',);
        main_network.disableEditMode();
        $('#edit-button').css({'background-image':'linear-gradient(180deg, white, white)', 'border': '1px solid var(--dark-border-color)'});
        f_editMode = false;
      }
    });
  }