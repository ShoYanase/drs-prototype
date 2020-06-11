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
    console.log("network dbclk");
    console.log(e.target.parentNode.parentNode);
    e.target.parentNode.parentNode.remove();
    
    let targetId = e.target.id;
    let mainEl = $("#mynetwork > .vis-network");
    
    mainEl.replaceWith($(e.currentTarget));
    main_network = network_arr[targetId];
    eventEdgeDblclicled(main_network);
  });

  function deleteEdgeAction(container){
    main_network.on('click', function(e){
      if(container.getElementsByClassName('vis-button vis-delete').length > 0){
        console.log("vis-delete exist");
      }
    })
  }