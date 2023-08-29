import React, { useContext, useRef, useState, createRef, useEffect } from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import { StoredContext } from '../context/StoredContext';
import '../layout/css/EnterGrammar.css';
import { TextField } from '@mui/material';
import ReactFlow, { ReactFlowProvider, useNodesState, useEdgesState } from 'reactflow';
import DependencyNode from '../components/DependencyNode';
import DependencyNodeReadOnly from '../components/DependencyNodeReadOnly';
import { stopTimeout, resetCorrectTemp } from '../utils/utils';

const stepDesc = [
  { 'key': 0, 'msg': 'Please enter the First-Sets according to the following pattern: <terminal>, <terminal>, ...' },
  { 'key': 1, 'msg': 'Derive the First-Sets from the dependency graph and start with the nodes that have no dependencies.' },
  { 'key': 2, 'msg': 'Continue with the nodes for which all FirstSets of the dependent nodes are known after the last step. Repeat this step until all nodes have been processed.' },
  { 'key': 3, 'msg': 'Done! All FirstSets have been specified.' },
]

var correctTemp = {};
var cur_id;
const nodesTodo = [];
const timeOut = [];

const nodeTypes = {
  dependencyNode: DependencyNode,
  dependencyNodeReadOnly: DependencyNodeReadOnly
};
const edgeTypes = { type: 'default' };

function setId(id) {
  cur_id = id;
}

/**
 * Initialize the 'correctTemp' object for each non-terminal in the grammar.
 * @param {Object} grammar - The grammar object containing non-terminals and their properties.
 */
function check(grammar) {
  grammar.nonTerminals.map((item) => {
    if (correctTemp[item] === undefined) {
      correctTemp[item] = { correct: false, error: false, helpertext: "wrong elements", stepActive: false }
    };
  });
};

/**
 * Calculate the FIRST set for a given non-terminal in the grammar.
 * @param {Object} grammar - The grammar object containing non-terminals, terminals, and production rules.
 * @param {string} nonTerminal - The non-terminal for which to calculate the FIRST set.
 * @param {Set} nullableSet - A set containing nullable non-terminals in the grammar.
 * @param {Map} calculated - A map to keep track of calculated FIRST sets for non-terminals.
 * @param {Set} firstSetNonTerminal - A set to prevent infinite loops in the case of left recursion.
 * @param {number} step - The current recursion depth or step. Used for debugging and avoiding infinite loops.
 * @returns {Map} - A map containing the calculated FIRST set for the given non-terminal.
 */
function calculateFirstSetSingle(grammar, nonTerminal, nullableSet, calculated = new Map(), firstSetNonTerminal = new Set(), step = 0) {

  if (calculated.get(nonTerminal) === undefined) {
    calculated.set(nonTerminal, new Set());
  };

  const leftRecursiveProd = [];

  // Process each production rule of the non-terminal
  for (const rule of grammar.productions.filter(e => e.lhs === nonTerminal)) {
    for (var i = 0; i < rule.rhs.length; i++) {
      let isEmpty = false;
      const symbol = rule.rhs[i];
      if (grammar.terminals.includes(symbol)) {
        // If the rule starts with ε (empty), add ε to the first set
        calculated.get(nonTerminal).add(symbol);
        break;
      }

      else if (symbol === nonTerminal) {
        // If the rule starts with the same non-terminal, handle left recursion
        leftRecursiveProd.push(rule);
        if (nullableSet.has(symbol)) {
          continue;
        } else {
          break;
        }
      }
      // If the rule starts with a non-terminal symbol
      else {
        if (firstSetNonTerminal.has(symbol)) {
          calculated.set(nonTerminal, new Set([...calculated.get(nonTerminal), ...calculated.get(symbol)]));
          continue;
        };
        firstSetNonTerminal.add(symbol);
        var symbolFirstSet = calculateFirstSetSingle(grammar, symbol, nullableSet, calculated, firstSetNonTerminal, step + 1);
        symbolFirstSet.get(symbol).forEach(terminal => {
          if ((terminal === 'ε') && i < rule.rhs.length - 1) {
            isEmpty = true;
          } else {
            calculated.get(nonTerminal).add(terminal);
          }

        });

        if (!isEmpty) {
          break;
        }
      }
    }
  }
  firstSetNonTerminal.delete(nonTerminal);

  return calculated;
}

/**
 * Calculate the First Set for all non-terminals in the given grammar.
 * @param {Object} grammarObj - The grammar object containing non-terminals, terminals, and productions.
 * @param {Set} nullableSet - A set containing nullable symbols in the grammar.
 * @returns {Map} - A Map containing the First Set for each non-terminal in the grammar.
 */
function calculateFirstSet(grammarObj, nullableSet) {
  let firstSetTemp = new Map();

  grammarObj.nonTerminals.slice(1).forEach(nonTerminal => {
    const firstSet = calculateFirstSetSingle(grammarObj, nonTerminal, nullableSet);
    firstSetTemp = new Map([...firstSetTemp, ...firstSet]);
  })

  return firstSetTemp;
}

export default function FirstSet({ children }) {

  const { setActiveStep } = useContext(StepperContext);
  const { grammar } = useContext(StoredContext);
  const { grammarObj } = useContext(StoredContext);
  const { nullableSet } = useContext(StoredContext);
  const { setFirstSet } = useContext(StoredContext);
  const { storedNodes } = useContext(StoredContext);
  const { storedEdges } = useContext(StoredContext);

  const [solved, setSolved] = useState(false);

  check(grammarObj);
  const [refresh, setRefresh] = useState();

  const elementsRef = useRef(grammarObj.nonTerminals.slice(1).map(() => createRef()));

  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes] = useNodesState(storedNodes);
  const [edges] = useEdgesState(storedEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [stepState, setStepState] = useState(0);
  const [stepStateRunning, setStepStateRunning] = useState(false);

  /**
   * FunFunction to handle the "Next" button click
   */
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    correctTemp = {};
  };

  /**
   * Function to handle the "Back" button click
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    nodesTodo.length = 0;
    correctTemp = {};
  };

  /**
 * Check the correctness of the user's input for the first sets and update the UI accordingly.
 */
  const handleCheck = () => {
    const firstSetCheck = new Map();
    const firstSet = calculateFirstSet(grammarObj, nullableSet);
    var solvedCorrect = true;

    grammarObj.nonTerminals.slice(1).forEach((nonTerminal, index) => {
      // Store the user's input for the current non-terminal in the 'firstSetCheck' Map.
      firstSetCheck.set(nonTerminal, elementsRef.current[index].current.value.split(", ").map((symbol) => symbol.trim()));

      if (firstSet.get(nonTerminal) !== undefined) {
        // Find the difference between the actual first set and the user's input for the current non-terminal.
        const difference = new Set([...firstSet.get(nonTerminal)].filter(x => !firstSetCheck.get(nonTerminal).includes(x)));
        var correct = false;

        if (firstSet.get(nonTerminal).size > firstSetCheck.get(nonTerminal).length) {
          correctTemp[nonTerminal].helpertext = "too few elements";
          setSolved(false);
        } else if (firstSet.get(nonTerminal).size < firstSetCheck.get(nonTerminal).length) {
          correctTemp[nonTerminal].helpertext = "too many elements";
          setSolved(false);
        } else {
          correct = difference.size === 0;
        }

        correctTemp[nonTerminal].error = !correct;
        correctTemp[nonTerminal].correct = correct;
        correctTemp[nonTerminal].disabled = correct;

        if (!correct) {
          solvedCorrect = false;
        }
        setRefresh(!refresh);
      }
    });

    setSolved(solvedCorrect);

    // If all inputs are correct, update the first sets state.
    if (solvedCorrect) {
      setFirstSet(firstSet);
    }
  };

  /**
 * function to handle the "Solve" button click.
 */
  const handleSolved = () => {
    resetNodes();
    stopTimeout(timeOut);
    setStepStateRunning(false);
    setSolved((current) => !current);

    const firstSet = calculateFirstSet(grammarObj, nullableSet);
    grammarObj.nonTerminals.slice(1).forEach((nonTerminal, index) => {
      if (firstSet.get(nonTerminal) !== undefined) {
        elementsRef.current[index].current.value = [...firstSet.get(nonTerminal)].join(', ');
        correctTemp[nonTerminal].correct = true;
        correctTemp[nonTerminal].error = false;
      }
    });

    setFirstSet(firstSet);
    setStepState(3);
  };

  /**
 * Handle the step-by-step processing of nodes and edges based on the current step state.
 */
  const handleStep = () => {
    setStepStateRunning(true);
    var counter = 0;
    resetNodesStep();
    const tempNodes = new Set(grammarObj.nonTerminals.slice(1));

    switch (stepState) {
      case 0:
        // Perform actions for step 0.
        setStepState(1);
        setStepStateRunning(false);
        break;
      case 1:
        //Nodes without dependency on other nodes

        //delete all Nodes with self-edge
        edges.forEach((edge) => {
          if (edge.target !== edge.source) {
            tempNodes.delete(edge.target);
          }
        });

        edges.forEach((edge) => {
          if (tempNodes.has(edge.source)) {
            !nodesTodo.includes(edge.target) && nodesTodo.push(edge.target);
          }
        });

        //highlight all nodes without dependency
        nodes.filter((node) => tempNodes.has(node.id)).forEach((node) => {
          timeOut.push(setTimeout(() => { elementsRef.current[node.data.index].current.value = (node.data.active ? node.data.ref.current.value === "" ? "ε" : "ε, " : "") + node.data.ref.current.value; }, counter * 1000));
          highlightNode(node.data.index, counter);
          counter++;
        });

        timeOut.push(setTimeout(() => { setStepStateRunning(false); setStepState(2); }, counter * 1000));
        break;
      case 2:
        //Nodes which has been processed before and are dependent on them
        nodes.filter((node) => nodesTodo.includes(node.id)).forEach((node) => {
          elementsRef.current[node.data.index].current.value = (node.data.active ? node.data.ref.current.value === "" ? "ε" : "ε, " : "") + node.data.ref.current.value;
          edges.filter((edge) => edge.target === node.id && edge.target !== edge.source).forEach((edge) => {
            timeOut.push(setTimeout(() => {
              const test = new Set([...elementsRef.current[node.data.index].current.value.split(", ").filter((str) => str !== ""), ...elementsRef.current[nodes.find((node) => node.id === edge.source).data.index].current.value.split(", ").filter(x => x !== "ε")]);
              elementsRef.current[node.data.index].current.value = [...test].join(", ");
            }, counter * 1000));
            highlightNode(node.data.index, counter);
          });
          counter++;
        });

        let index = nodesTodo.length;
        while (index > 0) {
          const id = nodesTodo.shift();
          edges.forEach((edge) => {
            if (id === edge.source && edge.target !== edge.source) {
              !nodesTodo.includes(edge.target) && nodesTodo.push(edge.target);
            }
          });
          index--;
        }

        //all nodes done
        if (nodesTodo.length === 0) {
          timeOut.push(setTimeout(() => {
            handleCheck();
            setStepState(stepState + 1);
            resetNodes();
          }, counter * 1000));
        }
        timeOut.push(setTimeout(() => { setStepStateRunning(false); }, counter * 1000));
        break;
      default:
        reset();
        break;
    }


  }

  /**
 * Asynchronously highlights a node by setting its 'stepActive' property to 'true' after a specified delay.
 *
 * @param {number} index - The index of the node to be highlighted.
 * @param {number} counter - The delay (in seconds) before highlighting the node.
 */
  async function highlightNode(index, counter) {
    timeOut.push(setTimeout(() => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data.index === index) {
            node.data = {
              ...node.data,
              stepActive: true,
            };
            correctTemp[node.id].stepActive = true;
          }

          return node;
        })
      );
    }, counter * 1000));
  }


  /**
 * The `reset` function resets the state and visual appearance of the application.
 * It clears the input of the textfields and resets the nodes to their initial states.
 */
  const reset = () => {
    setStepStateRunning(false);
    setStepState(0);
    setSolved(false);
    elementsRef.current.forEach((textInput) => textInput.current.value = "");
    resetCorrectTemp(correctTemp);
    resetNodes();
    nodesTodo.length = 0;
    cur_id = undefined;
  }

  /**
  * The `resetNodes` function resets the state and attributes of the dependency graph nodes.
  */
  const resetNodes = () => {
    setNodes((nds) =>
      nds.map((node) => {
        node.data = {
          ...node.data,
          stepActive: false,
          stepDone: false,
        };
        correctTemp[node.id].stepActive = false;
        return node;
      })
    );
  }

  /**
* The `resetNodesStep` function resets the state and attributes of the dependency graph nodes 
* and makes this node transparent. 
*/
  const resetNodesStep = () => {
    setNodes((nds) =>
      nds.map((node) => {
        node.data = {
          ...node.data,
          stepDone: node.data.stepActive || node.data.stepDone,
          stepActive: false,
        };
        correctTemp[node.id].stepActive = false;
        correctTemp[node.id].correct = node.data.stepDone;
        return node;
      })
    );
  }

  const productionList = [...grammar.split("\n")];

  /**
   * set nodes attributes, when reactflow canvas has been initialised
   */
  useEffect(() => {
    nodes.forEach((node) => {
      if (node.data.ref.current !== null) {
        node.data.ref.current.value = node.data.text;
        node.data.ref.current.disabled = true;
        node.data.disabled = true;
        node.data.stepDone = false;
      }
    });
  }, [reactFlowInstance]);

   /**
   * The `insertEpsilon` function inserts the epsilon symbol (ε) at the current cursor position in a text
   * input field.
   */
   const insertEpsilon = () => {
    console.log(cur_id);
    if(cur_id !== undefined){
      cur_id.target.value = cur_id.target.value + 'ε';
    }
    //const text = grammarRef.current.value;
    //grammarRef.current.value = text.slice(0, grammarRef.current.selectionStart) + 'ε' + text.slice(grammarRef.current.selectionStart)
    //handleChange();
  }


  return (
    <div className='flex flex-col w-full h-full'>
      {children}
      <div className='border-2 border-solid rounded-lg border-color mb-1 p-2'>
        <p className='whitespace-pre-line'>{stepDesc[stepState].msg}</p>
      </div>
      <div className='flex h-full'>
        <div className='w-1/3'>
          <div className='h-1/2 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll'>
            {productionList.map(item => (
              <p>{item}</p>
            ))}
          </div>
          <div className='h-1/2 border-2 border-solid rounded-bl-lg border-color mt-1'>
            <ReactFlowProvider>
              <div className="reactflow-wrapper h-full" ref={reactFlowWrapper}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onInit={setReactFlowInstance}
                  snapToGrid
                  fitView
                  nodesDraggable={false}
                  nodesConnectable={false}
                  nodesFocusable={false}
                  zoomOnDoubleClick={false}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  deleteKeyCode={null}
                >
                </ReactFlow>
              </div>
            </ReactFlowProvider>
          </div>
        </div>
        <div className='flex flex-col items-center w-2/3'>
          {grammarObj.nonTerminals.slice(1).map((item, index) => (
            <div className='flex items-center m-2 w-full'>
              <p className='w-1/5 px-5 truncate hover:text-clip z-10 hover:overflow-visible' key={'$First' + item}>FIRST ({item})</p>
              <TextField inputRef={elementsRef.current[index]} key={item} className='w-4/5' onBlur={setId}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& > fieldset": correctTemp[item].stepActive ? { borderColor: "#0ea5e9", borderWidth: 2 } : { borderColor: "#2f2f2f", borderWidth: 2 },
                  },
                  "& .MuiOutlinedInput-root.Mui-disabled": {
                    "& > fieldset": correctTemp[item].correct ? { borderColor: "#22c55e", borderWidth: 2 } : { borderColor: "#2f2f2f", borderWidth: 2 },
                  },
                  "& .MuiOutlinedInput-root:hover": {
                    "& > fieldset": { borderColor: "#fde047", borderWidth: 3 },
                  },
                }}
                variant="outlined"
                error={correctTemp[item].error ? true : false}
                helperText={correctTemp[item].error ? correctTemp[item].helpertext : ""}
                disabled={correctTemp[item].correct || stepState !== 0}
              />
            </div>
          ))}
          <Button className='' onClick={insertEpsilon}>ε</Button>
        </div>
      </div>
      <div className=''>
        <Button onClick={handleBack}>
          Back
        </Button>
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleStep} disabled={stepStateRunning}>
          {stepState !== 3 ? (stepStateRunning ? 'Running...' : stepState === 0 ? 'Start Step-by-Step' : 'Next Step') : 'Restart'}
        </Button>
        <Button className={solved && stepState !== 0 && "opacity-50"} variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleCheck} disabled={stepState !== 0}>
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