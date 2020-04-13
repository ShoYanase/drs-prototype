function make_first_nodes(parag_len, arr_labels){
    var arr_nodes = new Array();
    for(let i=0; i<parag_len; i++){
        console.log(arr_labels[i]);
        arr_nodes.push({
            id: i+1,
            label: arr_labels[i],
            font: {color:'#544851'},
            color: {background: '#EDE1E1',
                    border: '#544851'
            },
        });
    }
    return arr_nodes;
}

function make_first_edges(points_matrix, thres){
    parag_len = points_matrix.length;
    var arr_edges = new Array();
    for(let i=0; i<parag_len; i++){
        for(let j=i+1; j<parag_len; j++){
            if(points_matrix[i][j] >= thres){
                arr_edges.push({
                    from: i+1, 
                    to: j+1, 
                    label: String(points_matrix[i][j]),
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

console.log("sample-nodes");

let points_matrix =
/**３対比 */
/*                    [[50,65,54,53,52,51,52,49,48,49],
                    [65,50,55,64,53,52,53,50,49,50],
                    [54,55,50,65,54,53,54,57,50,51],
                    [53,64,65,50,65,54,55,52,51,52],
                    [52,53,54,65,50,65,56,53,52,53],
                    [51,52,53,54,65,50,77,54,53,54],
                    [52,53,54,55,56,77,50,50,49,53],
                    [49,50,57,52,53,54,50,50,65,56],
                    [48,49,50,51,52,53,49,65,50,67],
                    [49,50,51,52,53,54,53,56,67,50]];
**/
/**３転換 */
                    [[50,65,14,13,12,11,12,,9,,8,,9]
                    ,[65,50,15,14,13,12,13,10,,9,10]
                    ,[14,15,50,55,54,53,54,57,50,51]
                    ,[13,14,55,50,65,54,55,52,51,52]
                    ,[12,13,54,65,50,65,56,53,52,53]
                    ,[11,12,53,54,65,50,77,54,53,54]
                    ,[12,13,54,55,56,77,50,50,49,53]
                    ,[,9,10,57,52,53,54,50,50,65,56]
                    ,[,8,,9,50,51,52,53,49,65,50,67]
                    ,[,9,10,51,52,53,54,53,56,67,50]];
let arr_labels = ["図26、図27より、バッファサイズが大きくなる程実行時間が短くなることがわかる.",
                "さらに、それぞれの近似曲線より、バッファサイズをx、実行時間をyとすると、両者の関係はy=a/x(aはある特定の定数)という方程式で近似的に表せることができ、実行時間はバッファサイズに反比例していることがわかる.",
                "また図27より、read、writeによる実装よりも、fread、fwriteによる実装の方が実行時間が速いことがわかる.",
                "実行時間がバッファサイズに反比例したのは、次のような理由が考えられる.",
                "cでは、ファイルの内容がバッファサイズごとに読み取り・書き込みが行われる.",
                "その処理の回数はバッファサイズに反比例する.",
                "よって読み取り・書き込みの回数が増えることによって実行時間が増えると考えられる.",
                "read、writeによる実装よりも、fread、fwriteによる実装の方が実行時間が速いのには、以下のような理由が考えられる.",
                "cは、両者とも同じバッファサイズで実行しているが、システムコールread、write関数の呼び出し回数が大きく違う.",
                "これによって両者の実行時間の違いが出ていると考えられる."];
let parag_len = arr_labels.length;
let thres = 60;
let node_maxwidth = 250
let node_maxheight = 90

var container = document.getElementById('mynetwork');
var data = {
  nodes: make_first_nodes(parag_len, arr_labels),
  edges: make_first_edges(points_matrix, thres)
};
var options = {
  layout: {
    hierarchical: {
      enabled: true,
      direction: "UD",
      sortMethod: "directed",
      levelSeparation: node_maxheight+30,
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
      data.label = String(points_matrix[data.from][data.to]),
      data.arrows = {
        to:{
            enabled: true,
            type: 'arrow'
        }
      }
      callback(data);
    }
  }
};
var network = new vis.Network(container, data, options);

