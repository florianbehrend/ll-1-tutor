import React, { useContext, useRef, useState, useCallback, useEffect, createRef } from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import { StoredContext } from '../context/StoredContext';
import ReactFlow, { Controls, MarkerType, ReactFlowProvider, addEdge, useNodesState, useEdgesState, updateEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import '../layout/css/DependencyGraph.css';
import DependencyNode from '../components/DependencyNode';
import dagre from 'dagre';
import NullableTable from '../components/NullableTable';
import { highlightProduction, stopSteps } from '../utils/utils';

// Initial state of the graph
const initialNodes = [];
const initialEdges = [];

// Description of each step in the graph creation process
const stepDesc = [
  { 'key': 0, 'msg': 'Create the Variable Dependency Graph for this grammar. \nMark the nodes with a double click if they can be evaluated to epsilon. \nIn addition, enter the terminal symbols in the text fields with which the nonterminals can start (use the following pattern: <terminal>, <terminal>, ...). \nAlso connect the nodes to show the dependencies of the nonterminals (A is dependent on B: B -> A).' },
  { 'key': 1, 'msg': 'Mark each node where the nonterminal can be empty.' },
  { 'key': 2, 'msg': 'Add all the dependencies of the nonterminals. A nonterminal is dependent on other nonterminals if they come first on the right side of production.\nIf this nonterminal is empty, there may be another dependency on subsequent nonterminals.' },
  { 'key': 3, 'msg': 'Enter the terminal symbols in the text fields with which the nonterminals can start. Use the following pattern: <terminal>, <terminal>, ... ' },
  { 'key': 4, 'msg': 'Done! All dependencies and start terminals have been specified.' },
]

// Node types for ReactFlow visualization
const nodeTypes = { dependencyNode: DependencyNode };
const edgeTypes = { type: 'default' };

const timeOut = [];
const modifiedList = [];

/**
 * Get the dependencies and labels of symbols in the right-hand side of a production.
 * @param {object} grammarObj - The grammar object containing the grammar information.
 * @param {Set} nullableSet - A Set containing nullable non-terminals.
 * @param {Array} rhs - An array containing symbols on the right-hand side of a production.
 * @returns {Array} An array containing objects representing the dependencies and labels of the symbols.
 * Each object has two properties: 'symbol' (the symbol itself) and 'isNonTerminal' (a boolean indicating if it's a non-terminal).
 */
const getDependency = (grammarObj, nullableSet, rhs) => {
  const dependency = [];
  rhs.every((symbol) => {
    if (grammarObj.terminals.includes(symbol)) {
      dependency.push({ symbol: symbol, isNonTerminal: false });
      return false; //isNonTerminal
    } else if (!nullableSet.has(symbol)) {
      dependency.push({ symbol: symbol, isNonTerminal: true });
      return false; //isNonTerminal
    } else {
      dependency.push({ symbol: symbol, isNonTerminal: true });
      return true;
    }
  });
  return dependency;
}

/**
 * Get the dependencies and labels of non-terminals in the grammar.
 * @param {object} grammarObj - The grammar object containing the grammar information.
 * @param {Set} nullableSet - A Set containing nullable non-terminals.
 * @returns {Array} An array containing two maps: 'dependencies' and 'label'.
 * The 'dependencies' map stores the dependencies of non-terminals as a Map of Sets.
 * The 'label' map stores the labels of non-terminals as a Map of Sets.
 */
const getDependencies = (grammarObj, nullableSet) => {
  const dependencies = new Map();
  const label = new Map();
  grammarObj.productions.forEach(({ lhs, rhs }) => {
    if (!dependencies.has(lhs)) {
      dependencies.set(lhs, new Set());
      label.set(lhs, new Set());
    }
    const depTemp = getDependency(grammarObj, nullableSet, rhs);
    depTemp.forEach(({ symbol, isNonTerminal }) => {
      if (isNonTerminal) {
        dependencies.get(lhs).add(symbol);
      } else {
        if (symbol !== 'ε') {
          label.get(lhs).add(symbol);
        }
      }
    })
  })
  return [dependencies, label];
}

export default function DependencyGraph() {

  const { setActiveStep } = useContext(StepperContext);
  const { grammarObj } = useContext(StoredContext);
  const { nullableSet } = useContext(StoredContext);
  const { activeRow, setActiveRow } = useContext(StoredContext);
  const { setStoredNodes } = useContext(StoredContext);
  const { setStoredEdges } = useContext(StoredContext);

  const [stepState, setStepState] = useState(0);
  const [solved, setSolved] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [refreshLayout, setRefreshLayout] = useState();
  const [refreshRow, setRefreshRow] = useState(-1);
  const [stepStateRunning, setStepStateRunning] = useState(false);

  const checkBoxRef = useRef(grammarObj.nonTerminals.slice(1).map(() => createRef()));
  const textInputRef = useRef(grammarObj.nonTerminals.slice(1).map(() => createRef()));
  const productionRef = useRef(grammarObj.productions.slice(0, -1).map(() => createRef()));
  const textRef = useRef();
  const productionFieldRef = useRef();
  const edgeUpdateSuccessful = useRef(true);
  const errorRef = useRef();
  const errorRefEmpty = useRef();
  const errorRefMany = useRef();
  const errorRefWrong = useRef();


  /**
  * Utility function to generate unique node IDs
  */  let id = 0;
  const getId = () => `node_${id++}`;


  /**
   * FunFunction to handle the "Next" button click
   */
  const handleNext = () => {
    if (handleCheck()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      nodes.forEach(node => {
        node.data.text = node.data.ref.current.value;
      });
      setStoredEdges(edges);
      setStoredNodes(nodes);
    }
  };

  /**
   * Function to handle the "Back" button click
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    nullableSet.clear();
    setActiveRow([]);
  };

  /**
   * ReactFlow instance and its handlers for edge creation/update
   */
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

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


  /**
   * Drag and drop handlers for nodes
   */
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
  };

  /**
  * Function to reset the graph and the step state.
  */
  const reset = () => {
    setStepStateRunning(false);
    setStepState(0);
    stopSteps(productionRef, modifiedList, timeOut);
    setSolved(false);
    setEdges(initialEdges);
    textInputRef.current.forEach((textInput) => textInput.current.value = "");
    setNodes((nds) =>
      nds.map((node) => {
        node.data = {
          ...node.data,
          active: false,
        };
        node.data.ref.current.classList.remove("dependency-label-false", "dependency-label-correct");
        return node;
      })
    );
    setActiveRow(activeRow.map(() => { return false }));
    setRefreshRow(-1);
  }

  /**
 * Handles the step-by-step execution of actions and animations related to a grammar.
 */
  const handleStep = () => {
    setStepStateRunning(true);
    var counter = 0;
    stopSteps(productionRef, modifiedList, timeOut);

    switch (stepState) {
      case 0:
        // Perform actions for step 0.
        setStepState(stepState + 1);
        setStepStateRunning(false);
        // Disable nodes.
        nodes.forEach((node) => {
          if (node.data.ref.current !== null) {
            node.data.ref.current.disabled = true;
            node.data.disabled = true;
          }
        });
        break;
      case 1:
        // Highlight specific rows in the table based on the 'nullableSet'.
        grammarObj.nonTerminals.slice(1).forEach((symbol, index) => {
          if (nullableSet.has(symbol)) {
            highlightRow(index, counter);
            counter++;
          }
        });
        timeOut.push(setTimeout(() => { setStepStateRunning(false); setStepState(stepState + 1); }, counter * 1000));
        break;
      case 2:
        // Initialize 'activeRow' to mark non-terminals as active or inactive.
        setActiveRow(grammarObj.nonTerminals.slice(1).map(() => false));
        var highlighted = false;

        grammarObj.productions.slice(0, -1).forEach((prod, index) => {
          prod.rhs.every((symbol) => {
            if (grammarObj.terminals.includes(symbol)) {
              return false; //isNonTerminal
            } else if (!nullableSet.has(symbol)) {
              // Handle non-nullable symbols.
              highlightProduction(productionRef.current[index], counter, index, productionFieldRef, timeOut);
              highlighted = true;
              timeOut.push(setTimeout(() => {
                addEdgeToGraph(prod.lhs, symbol);
              }, counter * 1000));

              return false; //isNonTerminal
            } else {
              highlightProduction(productionRef.current[index], counter, index, productionFieldRef, timeOut);
              highlighted = true;
              timeOut.push(setTimeout(() => {
                addEdgeToGraph(prod.lhs, symbol);
              }, counter * 1000));
              return true;
            }
          });
          if (highlighted) { counter++; modifiedList.push(index); };
          highlighted = false;
        });

        timeOut.push(setTimeout(() => { setStepStateRunning(false); setRefresh(!refresh); setStepState(stepState + 1); }, counter * 1000));

        break;
      case 3:
        setActiveRow(grammarObj.nonTerminals.slice(1).map(() => false));
        const tempNonterminals = [...grammarObj.nonTerminals];
        var highlighted = false;

        grammarObj.productions.slice(0, -1).forEach((prod, index) => {
          const inputIndex = tempNonterminals.indexOf(prod.lhs) - 1;

          prod.rhs.every((symbol) => {
            if (grammarObj.terminals.includes(symbol)) {
              if (symbol !== 'ε') {
                highlightProduction(productionRef.current[index], counter, index, productionFieldRef, timeOut);
                highlighted = true;
                timeOut.push(setTimeout(() => { textInputRef.current[inputIndex].current.value = textInputRef.current[inputIndex].current.value === "" ? symbol : textInputRef.current[inputIndex].current.value + ", " + symbol }, counter * 1000));
              }
              return false; //isNonTerminal
            } else if (!nullableSet.has(symbol)) {
              return false; //isNonTerminal
            } else {
              highlightProduction(productionRef.current[index], counter, index, productionFieldRef, timeOut);
              highlighted = true;
              return true;
            }
          });
          if (highlighted) { counter++; modifiedList.push(index); };
          highlighted = false;
        });

        timeOut.push(setTimeout(() => { setStepStateRunning(false); setRefresh(!refresh); setStepState(stepState + 1); handleCheck(); }, counter * 1000));

        break;
      default:
        reset();
        break;
    }

  }

  /**
 * Asynchronously highlights a row in a table.
 *
 * @param {number} index - The index of the row to be highlighted.
 * @param {number} counter - A counter to control the delay of the highlighting effect.
 */
  async function highlightRow(index, counter) {
    timeOut.push(setTimeout(() => {
      activeRow[index] = true;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data.index === index) {
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

  /**
 * Function to add an edge to the dependency graph.
 * @param {string} target - The id of the target node where the edge connects.
 * @param {string} key - The id of the source node from where the edge originates.
 */
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

  /**
   * function to handle the "Solve" button click.
   */
  const handleSolved = () => {
    reset();
    setStepStateRunning(false);
    setStepState(4);
    setSolved(true);

    errorRefEmpty.current.hidden = true;
    errorRef.current.hidden = true;
    errorRefMany.current.hidden = true;
    errorRefWrong.current.hidden = true;

    setEdges(initialEdges);

    const [dependencies, label] = getDependencies(grammarObj, nullableSet);
    dependencies.forEach((value, key) => {
      if (key !== grammarObj.startSymbol) {
        value.forEach((target) => {
          addEdgeToGraph(key, target);
        });
      }
    });
    setNodes((nds) =>
      nds.map((node, index) => {
        if (label.get(node.id).size >= 1) {
          textInputRef.current[index].current.value = [...label.get(node.id)].join(', ');
        } else {
          textInputRef.current[index].current.value = '';
        }
        if (nullableSet.has(node.id)) {
          node.data = {
            ...node.data,
            active: true,
          };
        };
        return node;
      })
    );
    setRefresh(!refresh);
  };

  //auto align nodes when refresh changes
  useEffect(() => {
    setNodes(createGraphLayout(nodes, edges));
    setRefreshLayout(!refreshLayout);
  }, [refresh]);

  //auto fit view when refreshLayout changes
  useEffect(() => {
    if (reactFlowInstance !== null) {
      reactFlowInstance.fitView()
    };
  }, [refreshLayout]);

  /**
  * Function to check the correctness of user inputs.
  * @returns {boolean} True if all inputs are correct, otherwise false.
  */
  const handleCheck = () => {
    const [dependencies, label] = getDependencies(grammarObj, nullableSet);

    var solvedCorrect = true;
    var correct = true;

    const errorNodesEmpty = [];
    const errorNodesFirstTooMany = [];
    const errorNodesFirstTooFew = [];
    const errorNodesFirstWrong = [];

    // Iterate over each non-terminal node in the graph to validate the user inputs
    grammarObj.nonTerminals.slice(1).forEach((symbol, index) => {
      nodes[index].data.ref.current.classList.remove("dependency-label-false", "dependency-label-correct");

      // Retrieve the user input for the current non-terminal node
      const userInput = textInputRef.current[index].current.value.split(", ").map((symbol) => symbol.trim()).filter((symbol) => symbol !== "");
      // Find the difference between the expected labels and the user input for the current non-terminal
      const difference = new Set([...label.get(symbol)].filter(x => !userInput.includes(x)));

      // Check if the number of labels for the current non-terminal node matches the user input
      if (label.get(symbol).size > userInput.length) {
        setSolved(false);
        nodes[index].data.ref.current.classList.add("dependency-label-false");
        errorNodesFirstTooFew.push(symbol);
        correct = false;
      } else if (label.get(symbol).size < userInput.length) {
        setSolved(false);
        nodes[index].data.ref.current.classList.add("dependency-label-false");
        errorNodesFirstTooMany.push(symbol);
        correct = false;
      } else {
        // Check if the nullable marker matches the user's selection
        if (!(nullableSet.has(symbol) === nodes[index].data.active)) {
          errorNodesEmpty.push(symbol);
        }
        if (difference.size === 0) {
          nodes[index].data.ref.current.classList.add("dependency-label-correct");
        } else {
          nodes[index].data.ref.current.classList.add("dependency-label-false");
          errorNodesFirstWrong.push(symbol);
          correct = false;
        }
      }

    })

    // Update error messages based on validation results
    if (errorNodesEmpty.length === 0) {
      errorRefEmpty.current.hidden = true;
    } else {
      errorRefEmpty.current.hidden = false;
      errorRefEmpty.current.textContent = "Check following nodes if you marked them as empty: " + errorNodesEmpty.join(", ");
    }

    if (errorNodesFirstWrong.length === 0) {
      errorRefWrong.current.hidden = true;
    } else {
      errorRefWrong.current.hidden = false;
      errorRefWrong.current.textContent = "Check terminals of nodes (contains wrong elements): " + errorNodesFirstWrong.join(", ");
    }

    if (errorNodesFirstTooFew.length === 0) {
      errorRef.current.hidden = true;
    } else {
      errorRef.current.hidden = false;
      errorRef.current.textContent = "Check terminals of nodes (too few elements): " + errorNodesFirstTooFew.join(", ");
    }

    if (errorNodesFirstTooMany.length === 0) {
      errorRefMany.current.hidden = true;
    } else {
      errorRefMany.current.hidden = false;
      errorRefMany.current.textContent = "Check terminals of nodes (too many elements): " + errorNodesFirstTooMany.join(", ");
    }

    // Check the correctness of the dependencies between nodes
    if (correct) {
      const totalEdges = [...dependencies.values()].slice(0, -1).reduce(function (acc, dependency) {
        return acc + dependency.size;
      }, 0);
      if (totalEdges !== edges.length) {
        correct = false;
        errorRefMany.current.hidden = false;
        if (totalEdges < edges.length) {
          errorRefMany.current.textContent = "Check dependencies of nodes (too many edges)";
        } else {
          errorRefMany.current.textContent = "Check dependencies of nodes (too few edges)";
        }
      } else {
        correct = edges.every((edge) => {
          const correctEdge = dependencies.get(edge.target).has(edge.source);
          if (!correctEdge) {
            errorRefMany.current.hidden = false;
            errorRefMany.current.textContent = "Check dependencies of nodes (wrong edge): " + edge.source + " -> " + edge.target;
          }
          dependencies.get(edge.target).delete(edge.source);
          return correctEdge;
        })

      }
    }
    // Set the overall correctness state of the graph creation process
    if (!correct) {
      solvedCorrect = false;
    } else {
      setStepState(4);
    }
    setSolved(solvedCorrect);
    return solvedCorrect;
  }

  /**
  * ReactFlow instance initialization function.
  * @param {object} reactFlowInstance - The ReactFlow instance object
  */
  const setReactFlowInstanceInit = (reactFlowInstance) => {
    let x = 10;
    let y = 10;
    let nodesInit = initialNodes;
    setReactFlowInstance(reactFlowInstance);
    grammarObj.nonTerminals.slice(1).forEach((symbol, index) => {
      const position = {
        x: x += 50,
        y: y,
      };
      const newNode = {
        id: symbol,
        type: 'dependencyNode',
        position,
        data: { label: `${symbol}`, ref: textInputRef.current[index], text: "", active: false, index: index, disabled: false, stepActive: false },
      };

      nodesInit = nodesInit.concat(newNode);
    });
    setNodes(nodesInit);
    setNodes(createGraphLayout(nodesInit, edges));
  };

  /**
   * Function to create the graph layout using dagre library.
   * @param {Array} flowNodeStates - Array of nodes in the graph
   * @param {Array} flowEdgeStates - Array of edges in the graph
   * @returns {Array} Array of nodes with their positions for visualization
   */
  const createGraphLayout = (flowNodeStates, flowEdgeStates) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ nodesep: 25, align: 'DL', rankdir: 'RL' });

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

    dagre.layout(g);

    return flowNodeStates.map((nodeState) => {
      const node = g.node(nodeState.id);
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

  //set checkboxes after rendering
  useEffect(() => {
    grammarObj.nonTerminals.slice(1).forEach((item, index) => {
      if (nullableSet.has(item)) {
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
            <NullableTable classNameContainer='border-2 border-solid rounded-lg border-color' classNameTable='w-full p-2' grammarObj={grammarObj} checkBoxRef={checkBoxRef} active={activeRow} editable={false} />
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
                onEdgeUpdate={onEdgeUpdate}
                onEdgeUpdateStart={onEdgeUpdateStart}
                onEdgeUpdateEnd={onEdgeUpdateEnd}
                nodesDraggable={!solved && stepState === 0}
                nodesConnectable={!solved && stepState === 0}
                nodesFocusable={!solved && stepState === 0}
                edgesUpdatable={!solved && stepState === 0}
                zoomOnDoubleClick={!solved && stepState === 0}
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
          {stepState !== 4 ? (stepStateRunning ? 'Running...' : stepState === 0 ? 'Start Step-by-Step' : 'Next Step') : 'Restart'}
        </Button>

        <Button className={stepState !== 0 && "opacity-50"} variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleCheck} disabled={stepState !== 0}>
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