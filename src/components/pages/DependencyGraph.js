import React, {useContext, useRef, useState, useCallback, useEffect, createRef}  from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import {StoredContext} from '../context/StoredContext';
import ReactFlow, { Controls, MarkerType, ReactFlowProvider, addEdge, useNodesState, useEdgesState, updateEdge} from 'reactflow';
import 'reactflow/dist/style.css';
import '../layout/DependencyGraph.css';
import AddNodes from '../components/AddNodes';
import DependencyNode from '../components/DependencyNode';
import dagre from 'dagre';
import NullableTable from '../components/NullableTable';
import {highlightProduction, removeHighlight, removeHighlightAll, stopSteps} from '../utils/utils';

const initialNodes = [];

const initialEdges = [];

const stepDesc = [
  {'key': 0, 'msg': 'Create the Variable Dependency Graph for this grammar. Mark the nodes with a double click if they can be evaluated to epsilon. In addition, enter the terminal symbols in the text fields with which the nonterminals can start.'},
  {'key': 1, 'msg': 'Step 1: Mark each node where the nonterminal can be empty.'},
  {'key': 2, 'msg': 'Step 2: Add all the dependencies of the nonterminals. A nonterminal is dependent on other nonterminals if they come first on the right side of production.\nIf this nonterminal is empty, there may be another dependency on subsequent nonterminals.'},
  {'key': 3, 'msg': 'Step 3: No new nullable nonterminals are found in step 2, the Nullable-Set contains all the nullable nonterminals in your grammar.'},
  {'key': 4, 'msg': 'Done! All dependencies and start terminals have been specified.'},
]

const nodeTypes = { dependencyNode: DependencyNode};
const edgeTypes = { type: 'default'};

const timeOut = [];
const modifiedList = [];

//return for every production the dependency/first symbol and mark if it ist terminal/nonterminal
const getDependency = (grammarObj, nullableSet, rhs) => {
  //console.log(rhs);
  //stepStateRunning = true;
  const dependency = [];
  rhs.every((symbol) => {
    if(grammarObj.terminals.includes(symbol)){
      dependency.push({symbol: symbol, isNonTerminal: false});
      return false; //isNonTerminal
    } else if(!nullableSet.has(symbol)){
      dependency.push({symbol: symbol, isNonTerminal: true});
      return false; //isNonTerminal
    }else {
      dependency.push({symbol: symbol, isNonTerminal: true});
      return true;
    }
  });
  return dependency;
}

const getDependencies = (grammarObj, nullableSet) => {
  const dependencies = new Map();
  const label = new Map();
  grammarObj.productions.forEach(({lhs, rhs}) => {
    if(!dependencies.has(lhs)){
      dependencies.set(lhs, new Set());
      label.set(lhs, new Set());
    }
    const depTemp = getDependency(grammarObj, nullableSet, rhs);
    depTemp.forEach(({symbol, isNonTerminal}) => {
      if(isNonTerminal){
        dependencies.get(lhs).add(symbol);
      }else{
        if (symbol !== 'e' && symbol !== 'eps') {
          label.get(lhs).add(symbol);
        }
      }
    })
    //console.log(dependencies);
    //console.log(label);
  })
  return [dependencies, label];
}

export default function DependencyGraph ({children, className, containerClassName,  ...props}) {

  const {activeStep, setActiveStep} = useContext(StepperContext);
  const {grammar, setGrammar} = useContext(StoredContext);
  const {grammarObj, setGrammarObj} = useContext(StoredContext);
  const {nullableSet, setNullableSet} = useContext(StoredContext);
  const {activeRow, setActiveRow} = useContext(StoredContext);
  const {storedNodes, setStoredNodes} = useContext(StoredContext);
  const {storedEdges, setStoredEdges} = useContext(StoredContext);

  const [stepState, setStepState] = useState(0);
  const [solved, setSolved] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [refreshLayout, setRefreshLayout] = useState();
  const [refreshRow, setRefreshRow] = useState(-1);
  const [stepStateRunning, setStepStateRunning] = useState(false);

  const checkBoxRef = useRef(grammarObj.nonTerminals.slice(1).map(() => createRef()));
  const textInputRef = useRef(grammarObj.nonTerminals.slice(1).map(() => createRef()));
  const productionRef = useRef(grammarObj.productions.slice(0,-1).map(() => createRef()));
  const textRef = useRef();
  const productionFieldRef = useRef();
  const edgeUpdateSuccessful = useRef(true);
  const errorRef = useRef();
  const errorRefEmpty = useRef();
  const errorRefMany = useRef();
  const errorRefWrong = useRef();

  let id = 0;
  const getId = () => `node_${id++}`;

  const handleNext = () => { 
    
    if(handleCheck()){
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      nodes.forEach(node => {
        node.data.text = node.data.ref.current.value;
      });
      setStoredEdges(edges);
      setStoredNodes(nodes);
    }   
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    nullableSet.clear();
    setActiveRow([]);
  };

  const productionList = [...grammar.split("\n")];

  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  //const onConnect = useCallback((params) => {setEdges((eds) => addEdge(params, eds));});
  const onConnect = (params) => setEdges((eds) => {
    var edge = {
      id: params.source + "-" + params.sourceHandle + "-" + params.target + "-" + params.targetHandle,
      source: params.source ?? '',
      target: params.target ?? '',
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#fef08a',
      },
    };
    return addEdge(edge, eds);
  });

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    edgeUpdateSuccessful.current = true;
    setEdges((els) => updateEdge(oldEdge, newConnection, els));
  }, []);

  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }

    edgeUpdateSuccessful.current = true;
  }, []);

  //TODO https://reactflow.dev/docs/examples/edges/custom-edge/
  //https://reactflow.dev/docs/api/nodes/handle/
  //https://reactflow.dev/docs/guides/custom-nodes/

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    //event.dataTransfer.effectAllowed = 'move';
  };

  const reset = () => {
    setStepStateRunning(false);
    setStepState(0);
    stopSteps(productionRef, modifiedList, timeOut);
    setSolved(false);
    //removeHighlight(productionRef, modifiedList);
    setEdges(initialEdges);
    textInputRef.current.forEach((textInput) => textInput.current.value = "");
    setNodes((nds) =>
        nds.map((node) => {
            // it's important that you create a new object here
            // in order to notify react flow about the change
            node.data = {
              ...node.data,
              active: false,
            };
            node.data.ref.current.classList.remove("dependency-label-false", "dependency-label-correct");
          return node;
        })
      );
    setActiveRow(activeRow.map(() => {return false}));
    //removeHighlightAll(productionRef);
    console.log(activeRow);
    setRefreshRow(-1);
  }

  const handleStep = () => {
    //console.log(stepState);
    //TODO remove everything from checked (error message and color)
    setStepStateRunning(true);
    if(stepState <= 4) {setStepState(stepState+1)};
    var counter = 0;
    //const [dependencies, label] = getDependencies(grammarObj, nullableSet);
    stopSteps(productionRef, modifiedList, timeOut);

    switch (stepState) {
      case 0:
        grammarObj.nonTerminals.slice(1).forEach((symbol, index) => {
          if(nullableSet.has(symbol)){
            highlightRow(index, counter);
            counter++;
          }
          //console.log(index);
        });
        timeOut.push(setTimeout(() => {setStepStateRunning(false);}, counter * 1000));
        break;
      case 1:
        //setStepState(stepState+1);
        setActiveRow(grammarObj.nonTerminals.slice(1).map(() => false));
        var highlighted = false;

        grammarObj.productions.slice(0, -1).forEach((prod, index) => {
          prod.rhs.every((symbol) => {
            if(grammarObj.terminals.includes(symbol)){
              //dependency.push({symbol: symbol, isNonTerminal: false});
              //highlightProduction(productionRef.current[index], counter, index, productionFieldRef);
              //counter++;
              return false; //isNonTerminal
            } else if(!nullableSet.has(symbol)){
              //dependency.push({symbol: symbol, isNonTerminal: true});
              highlightProduction(productionRef.current[index], counter, index, productionFieldRef, timeOut);
              highlighted = true;
              timeOut.push(setTimeout(() => {
                addEdgeToGraph(prod.lhs, symbol);
              }, counter * 1000));
              
              return false; //isNonTerminal
            }else {
              //dependency.push({symbol: symbol, isNonTerminal: true});
              highlightProduction(productionRef.current[index], counter, index, productionFieldRef, timeOut);
              highlighted = true;
              timeOut.push(setTimeout(() => {
                addEdgeToGraph(prod.lhs, symbol);
              }, counter * 1000));
              return true;
            }
          });
          if(highlighted){counter++; modifiedList.push(index);};
          highlighted = false;
        });
        timeOut.push(setTimeout(() => {setStepStateRunning(false); setRefresh(!refresh)}, counter * 1000));
        
        break;
      case 2:
        //console.log(productionFieldRef);
        setActiveRow(grammarObj.nonTerminals.slice(1).map(() => false));
        const tempNonterminals = [...grammarObj.nonTerminals];
        var highlighted = false;
        grammarObj.productions.slice(0, -1).forEach((prod, index) => {
          const inputIndex = tempNonterminals.indexOf(prod.lhs)-1;

          prod.rhs.every((symbol) => {
            if(grammarObj.terminals.includes(symbol)){
              //dependency.push({symbol: symbol, isNonTerminal: false});
              if(symbol !== 'e' && symbol !== 'eps'){
                //counter++;
                highlightProduction(productionRef.current[index], counter, index, productionFieldRef, timeOut);
                highlighted = true;
                timeOut.push(setTimeout(() => {textInputRef.current[inputIndex].current.value = textInputRef.current[inputIndex].current.value === "" ? symbol : textInputRef.current[inputIndex].current.value + ", " + symbol}, counter * 1000));
              }
              return false; //isNonTerminal
            } else if(!nullableSet.has(symbol)){
              //dependency.push({symbol: symbol, isNonTerminal: true});
              return false; //isNonTerminal
            }else {
              //dependency.push({symbol: symbol, isNonTerminal: true});
              highlightProduction(productionRef.current[index], counter, index, productionFieldRef, timeOut);
              highlighted = true;
              //counter++;
              return true;
            }
          });
          if(highlighted){counter++; modifiedList.push(index);};
          highlighted = false;
        });
        timeOut.push(setTimeout(() => {setStepStateRunning(false); setRefresh(!refresh)}, counter * 1000));
        break;
      default:
        reset();
        break;
    }
    
    
    //console.log(textRef.current);
    //setEdges([]);
    //setNodes(createGraphLayout(nodes, edges));
    //reactFlowInstance.fitView();
  }

  async function highlightRow(index, counter) {
    timeOut.push(setTimeout(() => {activeRow[index] = true;
      //nodes[index].data.active = true;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data.index === index) {
            // it's important that you create a new object here
            // in order to notify react flow about the change
            node.data = {
              ...node.data,
              active: true,
            };
          }

          return node;
        })
      );
      setRefreshRow(index);
    }, counter * 1000));
  }

  const addEdgeToGraph = (target, key) => {
    const edge = {
      id: `${key}-${target}`,
      source: key,
      target: target,
      sourceHandle: 'c',
      targetHandle: target === key ? 'a' : 'd',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#fef08a',
      },
    };
    setEdges((eds) => addEdge(edge, eds));
  }

  const handleSolved = () => {
    reset();
    setStepStateRunning(false);
    //stopSteps(productionRef, modifiedList);
    //console.log(nullableSet);
    setStepState(4);
    setSolved(true);

    errorRefEmpty.current.hidden = true;
    errorRef.current.hidden = true;
    errorRefMany.current.hidden = true;
    errorRefWrong.current.hidden = true;


    setEdges(initialEdges);

    const [dependencies, label] = getDependencies(grammarObj, nullableSet);
    dependencies.forEach((value, key) => {
      if(key !== grammarObj.startSymbol){
        value.forEach((target) => {
          addEdgeToGraph(key, target);
        });
      }
    });
    setNodes((nds) =>
        nds.map((node, index) => {
          if(label.get(node.id).size >= 1){
            textInputRef.current[index].current.value = [...label.get(node.id)].join(', ');
          }else {
            textInputRef.current[index].current.value = '';
          }
          if(nullableSet.has(node.id)){
            node.data = {
              ...node.data,
              active: true,
            };
          };
          return node;
        })
      );
    /*nodes.forEach((node, index) => {
     
    });*/
    setRefresh(!refresh);
  };

  useEffect(() => {
    setNodes(createGraphLayout(nodes, edges));
    setRefreshLayout(!refreshLayout);
  }, [refresh]);

  useEffect(() => {
    if(reactFlowInstance !== null){
      reactFlowInstance.fitView()
    };
  }, [refreshLayout]);

  //TODO Löschen von Nodes verhindern

  const handleCheck = () => {
    //setNodes(createGraphLayout(nodes, edges));
    //reactFlowInstance.fitView();
    const [dependencies, label] = getDependencies(grammarObj, nullableSet);
    var solvedCorrect = true;
    var correct = true;
    const errorNodesEmpty = [];
    const errorNodesFirstTooMany = [];
    const errorNodesFirstTooFew = [];
    const errorNodesFirstWrong = [];

    grammarObj.nonTerminals.slice(1).forEach((symbol, index) => {
      nodes[index].data.ref.current.classList.remove("dependency-label-false", "dependency-label-correct");
      //console.log(nodes[index].data.active);
      //when field is empty
      if(label.get(symbol).size === 0){
        //label.get(symbol).add("");
      }
      const userInput = textInputRef.current[index].current.value.split(", ").map((symbol) => symbol.trim()).filter((symbol) => symbol !== "");
      const difference = new Set([...label.get(symbol)].filter(x => !userInput.includes(x)));
      
      console.log(label.get(symbol));
      console.log(userInput);
      console.log(difference);
      if (label.get(symbol).size > userInput.length) {
        //correctTemp[nonTerminal].helpertext = "too few elements";
        setSolved(false);
        nodes[index].data.ref.current.classList.add("dependency-label-false");
        errorNodesFirstTooFew.push(symbol);
        console.log("Häää");
        correct = false;
      } else if(label.get(symbol).size < userInput.length){
        //correctTemp[nonTerminal].helpertext = "too many elements";
        setSolved(false);
        nodes[index].data.ref.current.classList.add("dependency-label-false");
        errorNodesFirstTooMany.push(symbol);
        console.log("too many");
        correct = false;
      } else {
        //Bicondition to check nullable marker
        if (!(nullableSet.has(symbol) === nodes[index].data.active)) {
          errorNodesEmpty.push(symbol);
          console.log("Empty missing");
        }
        if(difference.size === 0){
          nodes[index].data.ref.current.classList.add("dependency-label-correct");
        }else{
          nodes[index].data.ref.current.classList.add("dependency-label-false");
          errorNodesFirstWrong.push(symbol);
          correct = false;
        }
        console.log("correct");
      }

      //Check Text vier teilen - NUllable fehlt / Input zu kurz / Input zu lang / Kanten zu wenig/ viel


      //correctTemp[nonTerminal].error = !correct;
      //correctTemp[nonTerminal].correct = correct;
      
      //console.log(correctTemp);
    })

    if(errorNodesEmpty.length === 0){
      errorRefEmpty.current.hidden = true;
    }else{
      errorRefEmpty.current.hidden = false;
      errorRefEmpty.current.textContent = "Check following nodes if you marked them as empty: " + errorNodesEmpty.join(", ");
    }

    if(errorNodesFirstWrong.length === 0){
      errorRefWrong.current.hidden = true;
    }else{
      errorRefWrong.current.hidden = false;
      errorRefWrong.current.textContent = "Check terminals of nodes (contains wrong elements): " + errorNodesFirstWrong.join(", ");
    }

    if(errorNodesFirstTooFew.length === 0){
      errorRef.current.hidden = true;
    }else{
      errorRef.current.hidden = false;
      errorRef.current.textContent = "Check terminals of nodes (too few elements): " + errorNodesFirstTooFew.join(", ");
    }

    if(errorNodesFirstTooMany.length === 0){
      errorRefMany.current.hidden = true;
    }else{
      errorRefMany.current.hidden = false;
      errorRefMany.current.textContent = "Check terminals of nodes (too many elements): " + errorNodesFirstTooMany.join(", ");
    }
    

    console.log(correct);
    if(correct) {
      const totalEdges = [...dependencies.values()].slice(0,-1).reduce(function (acc, dependency) {
        return acc + dependency.size;
      }, 0);
      console.log("Eigentlich nicht");
    if(totalEdges !== edges.length){
      correct = false;
      errorRefMany.current.hidden = false;
      if(totalEdges < edges.length){
        errorRefMany.current.textContent = "Check dependencies of nodes (too many edges)";
      }else{
        errorRefMany.current.textContent = "Check dependencies of nodes (too few edges)";
      }
    }else{
      correct = edges.every((edge) => {
        console.log(edge);
        const correctEdge = dependencies.get(edge.target).has(edge.source);
        if(!correctEdge){
          errorRefMany.current.hidden = false;
          errorRefMany.current.textContent = "Check dependencies of nodes (wrong edge): " + edge.source + " -> " + edge.target;
        }
        dependencies.get(edge.target).delete(edge.source);
        return correctEdge;
      })

      /*edges.forEach((edge) => {
        console.log(edge);
        correct = dependencies.get(edge.target).has(edge.source);
        dependencies.get(edge.target).delete(edge.source);
        console.log(correct);
      })*/
    }
  }



    if (!correct) {
      solvedCorrect = false;
    }
    setSolved(solvedCorrect);
    console.log("Solved: " + solvedCorrect);
    return solvedCorrect;
  }

  const setReactFlowInstanceInit = (reactFlowInstance) => {
    let x = 10;
    let y = 10;
    let nodesInit = initialNodes;
     setReactFlowInstance(reactFlowInstance);
     grammarObj.nonTerminals.slice(1).forEach((symbol, index) => {
      const position = {
        x: x+=50,
        y: y,
      };
      const newNode = {
        id: symbol,
        type: 'dependencyNode',
        position,
        data: { label: `${symbol}`, ref: textInputRef.current[index], text: "", active: false, index: index, disabled: false, stepActive: false},
      };

      nodesInit = nodesInit.concat(newNode);
    });
    setNodes(nodesInit);
    //console.log(createGraphLayout(nodesInit));
    setNodes(createGraphLayout(nodesInit, edges));
  };

  const createGraphLayout = (flowNodeStates, flowEdgeStates) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({nodesep: 25, align: 'DL', rankdir: 'RL' });
  
    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(() => ({}));
  
    flowNodeStates.forEach((node) => {
      g.setNode(node.id, {
        label: node.id,
        width: 50,
        height: 50,
      });
    });

    flowEdgeStates && flowEdgeStates.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    console.log(g);
  
    dagre.layout(g);

    console.log(g);
  
    return flowNodeStates.map((nodeState) => {
      const node = g.node(nodeState.id);
      console.log(nodeState);
      return {
        ...nodeState,
        position: {
          // The position from dagre layout is the center of the node.
          // Calculating the position of the top left corner for rendering.
          x: node.x - node.width / 2,
          y: node.y - node.height / 2,
        },
      };
    });
  };

  useEffect(() => {
    grammarObj.nonTerminals.slice(1).forEach((item, index) => {
      if(nullableSet.has(item)){
          checkBoxRef.current[index].current.checked = true;
      }
  });
  })

 

  return (
    <div className='flex flex-col w-full h-full'>
        <div className='border-2 border-solid rounded-lg border-color mb-1 p-2'> 
            <p ref={textRef} className='whitespace-pre-line'>{stepDesc[stepState].msg}</p>
        </div>
         <div className='flex h-full'>
            <div className='w-1/3'>
              <div className='w-full h-1/2 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll' ref={productionFieldRef}>
                  {grammarObj.productions.slice(0, -1).map((item, index) => (
                        <p key={item.lhs + item.rhs} ref={productionRef.current[index]}>{item.lhs + " -> " + item.rhs.join(" ")}</p>
                    ))}
              </div>
              <div className='h-1/2 pt-1 overflow-y-scroll'>
                <NullableTable classNameTable='border-2 border-solid rounded-lg border-color' className='w-full p-2' grammarObj={grammarObj} checkBoxRef={checkBoxRef} active={activeRow} editable={false}/>
              </div>
            </div>
            <div className='w-2/3 border-2 border-solid rounded-r-lg border-color ml-2 h-9/10'>
                <ReactFlowProvider>
                  <div className="reactflow-wrapper h-full" ref={reactFlowWrapper}>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      onInit={setReactFlowInstanceInit}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragStart={onDragStart}
                      snapToGrid
                      onEdgeUpdate={onEdgeUpdate }
                      onEdgeUpdateStart={onEdgeUpdateStart}
                      onEdgeUpdateEnd={onEdgeUpdateEnd}
                      nodesDraggable={!solved}
                      nodesConnectable={!solved}
                      nodesFocusable={!solved}
                      edgesUpdatable={!solved}
                      zoomOnDoubleClick={!solved}
                      fitView
                      nodeTypes={nodeTypes}
                      edgeTypes={edgeTypes}
                      deleteKeyCode={null}
                    >
                      <Controls />
                    </ReactFlow>
                  </div>
                </ReactFlowProvider>
                <div className='h-1/10 items-center flex justify-center flex-col text-xs m-1'>
                  <p ref={errorRefEmpty} className='text-red-500' hidden={true}>Mistake</p>
                  <p ref={errorRefWrong} className='text-red-500' hidden={true}>Mistake 2</p>
                  <p ref={errorRefMany} className='text-red-500' hidden={true}>Mistake 3</p>
                  <p ref={errorRef} className='text-red-500' hidden={true}>Mistake 4</p>
                </div>
              {//<AddNodes/>
              }
            </div>
         </div>
         <div className='mt-2'>
            <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
            Back
            </Button>
            <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleStep} disabled={stepStateRunning}>
                {stepState!==4 ? (stepStateRunning ? 'Running...' : 'Next Step') : 'Restart'}
            </Button> 
            
            <Button className={solved && "opacity-50"} variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleCheck} disabled={solved}>
            Check
            </Button>
            {solved
            ? <Button onClick={handleNext}>Next</Button>
            : <Button onClick={handleSolved}>Solve</Button>     
            }
        </div>
    </div>
  )
}