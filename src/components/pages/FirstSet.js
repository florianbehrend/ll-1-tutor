import React, {useContext, useRef, useState, createRef, useEffect}  from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import {StoredContext} from '../context/StoredContext';
import '../layout/EnterGrammar.css';
import { TextField } from '@mui/material';
import ReactFlow, { Controls, ReactFlowProvider, useNodesState, useEdgesState} from 'reactflow';
import DependencyNode from '../components/DependencyNode';
import { stopTimeout, resetCorrectTemp } from '../utils/utils';

var correctTemp = {};
const nodesTodo = [];
const timeOut = [];

const nodeTypes = { dependencyNode: DependencyNode};
const edgeTypes = { type: 'default'};

function check(grammar){
  grammar.nonTerminals.map((item) => {
    if (correctTemp[item] === undefined) {
      correctTemp[item] = {correct: false, error: false, helpertext: "wrong elements", stepActive: false}
     } ;
    //console.log(correctTemp);
  });
};

// Function to calculate the first set
function calculateFirstSetTest(grammar, nonTerminal, nullableSet, calculated = new Map(), firstSetNonTerminal = new Set(), step = 0) {
  //console.log(step + " " + nonTerminal);

  if (calculated.get(nonTerminal) === undefined){
    calculated.set(nonTerminal, new Set());
    //console.log(nonTerminal + " undefined");
  };

  const leftRecursiveProd = [];

  // Process each production rule of the non-terminal
  for (const rule of grammar.productions.filter(e => e.lhs === nonTerminal)) {
    console.log(rule);
    for(var i = 0; i<rule.rhs.length; i++){
      let isEmpty = false;
      const symbol = rule.rhs[i];
      if (grammar.terminals.includes(symbol)) {
        //firstSet.add(firstSymbol);
  
        // If the rule starts with ε (empty), add ε to the first set
        calculated.get(nonTerminal).add(symbol); 
        console.log(symbol + " added");
        break;
      }
      
      else if (symbol === nonTerminal){
        //TODO Circle in Grammatik und dann nullable
        leftRecursiveProd.push(rule);
        console.log(leftRecursiveProd);

        console.log(symbol);
           /*if (firstSetNonTerminal.has(symbol)){
            console.log("Visited: ");
            console.log(calculated.get(nonTerminal));
            console.log(calculated.get(symbol));
            calculated.set(nonTerminal, new Set([...calculated.get(nonTerminal), ...calculated.get(symbol)]));
            console.log(calculated.get(nonTerminal));
            continue;
          };
          firstSetNonTerminal.add(symbol);*/
          //console.log(firstSetNonTerminal);
          
          if (nullableSet.has(symbol)){
            continue;
          }else{
            break;
          }
      }
      // If the rule starts with a non-terminal symbol
      else {
          console.log(symbol);
           if (firstSetNonTerminal.has(symbol)){
            console.log("Visited: ");
            console.log(calculated.get(nonTerminal));
            console.log(calculated.get(symbol));
            calculated.set(nonTerminal, new Set([...calculated.get(nonTerminal), ...calculated.get(symbol)]));
            console.log(calculated.get(nonTerminal));
            continue;
          };
          firstSetNonTerminal.add(symbol);
          //console.log(firstSetNonTerminal);
          var symbolFirstSet = calculateFirstSetTest(grammar, symbol, nullableSet, calculated, firstSetNonTerminal, step+1);
          symbolFirstSet.get(symbol).forEach(terminal => {
            if((terminal === 'e' || terminal === 'eps') && i < rule.rhs.length-1){
              console.log("Epls");
              isEmpty = true;
            }else{
              calculated.get(nonTerminal).add(terminal); 
              console.log(terminal + " added from");
            }
            
          });

          if(!isEmpty){
            break;
          }
          
          /*console.log(calculated.get(nonTerminal));
          if (symbolFirstSet.get(symbol).has('e') || symbolFirstSet.get(symbol).has('eps')){
            console.log("Epsilon " + nonTerminal);
            console.log(symbolFirstSet.get(symbol));
            //symbolFirstSet.get(symbol).delete('e');
            console.log(symbolFirstSet.get(symbol));
            console.log(calculated.get(nonTerminal));
            console.log("-------------");
            
          }else{
            console.log("break");
            break;
          }*/
  
      }
    }
    //const firstSymbol = rule.rhs[0];

    // If the rule starts with a terminal symbol, add it to the first set
    

    // If the rule starts with ε (empty), add ε to the first set
    /*if (rule === 'e') {
      calculated.get(nonTerminal).add('ε');
    }*/
    leftRecursiveProd.forEach((lhs, rhs) => {
      
    });

    console.log("done");
  }

  console.log(step);
  firstSetNonTerminal.delete(nonTerminal);
  console.log(firstSetNonTerminal);

  // Process left-recursive production rules
  /*for (const rule of grammar.productions.filter(e => e.lhs == nonTerminal)) {
    if (rule.rhs[0] === nonTerminal) {
      const modifiedRule = rule.slice(1) + nonTerminal; // Remove left-recursive symbol and concatenate the first set of non-terminal
      const modifiedRuleFirstSet = calculateFirstSetTest(modifiedRule, calculated);
      modifiedRuleFirstSet.forEach(terminal => firstSet.add(terminal));
    }
  }*/

  // Cache the calculated first set for future reference
  //calculated[nonTerminal] = firstSet;

  return calculated;
}

function calculateFirstSet(grammarObj, nullableSet){
  let firstSetTemp = new Map();
  grammarObj.nonTerminals.slice(1).forEach(nonTerminal => {
    const firstSet = calculateFirstSetTest(grammarObj, nonTerminal, nullableSet);
    firstSetTemp = new Map([...firstSetTemp, ...firstSet]);
    console.log(nonTerminal + " ------------------------------------");
    console.log(firstSet);
    console.log(firstSetTemp);
  })
  return firstSetTemp;
}

// Usage example:
/*const grammar = {
  nonTerminals: ['X', 'T', 'S', 'R'],
  terminals: ['q', '#', 'p', 'o', 'm'],
  productions: [
    { lhs: 'X', rhs: ['T', 'n', 'S'] },
    { lhs: 'X', rhs: ['R', 'm'] },
    { lhs: 'T', rhs: ['q'] },
    { lhs: 'T', rhs: ['#'] },
    { lhs: 'S', rhs: ['p'] },
    { lhs: 'S', rhs: ['#'] },
    { lhs: 'R', rhs: ['o', 'm'] },
    { lhs: 'R', rhs: ['S', 'T'] },
  ],
};*/

//const firstSet = calculateFirstSet(grammar);
//console.log(firstSet);

export default function FirstSet ({children, className, containerClassName,  ...props}) {

  const {activeStep, setActiveStep} = useContext(StepperContext);
  const {grammar, setGrammar} = useContext(StoredContext);
  const {grammarObj, setGrammarObj} = useContext(StoredContext);
  const {nullableSet, setNullableSet} = useContext(StoredContext);
  const {firstSet, setFirstSet} = useContext(StoredContext);
  const {storedNodes, setStoredNodes} = useContext(StoredContext);
  const {storedEdges, setStoredEdges} = useContext(StoredContext);

  const [solved, setSolved] = useState(false);

  check(grammarObj);
  const [refresh, setRefresh] = useState();

  const elementsRef = useRef(grammarObj.nonTerminals.slice(1).map(() => createRef()));
  //console.log(elementsRef);

  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(storedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storedEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [stepState, setStepState] = useState(0);
  const [stepStateRunning, setStepStateRunning] = useState(false);

  const handleNext = () => {    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    correctTemp = {};
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    nodesTodo.length = 0;
    correctTemp = {};
  };

  //TODO add S as start production and start from this terminal
  const handleCheck = () => {
    const firstSetCheck = new Map();
    const firstSet = calculateFirstSet(grammarObj, nullableSet);
    console.log("First Set: ");
    console.log(firstSet);
    var solvedCorrect = true;
    grammarObj.nonTerminals.slice(1).forEach((nonTerminal, index) => {
      firstSetCheck.set(nonTerminal, elementsRef.current[index].current.value.split(", ").map((symbol) => symbol.trim()));
      console.log(nonTerminal);
      if(firstSet.get(nonTerminal) !== undefined){
        const difference = new Set([...firstSet.get(nonTerminal)].filter(x => !firstSetCheck.get(nonTerminal).includes(x)));
        var correct = false;
        console.log("Length: " + firstSet.get(nonTerminal).size);
        console.log(firstSet.get(nonTerminal));
        console.log("Length Check: " + firstSetCheck.get(nonTerminal).length);
        console.log(firstSetCheck.get(nonTerminal));
        if (firstSet.get(nonTerminal).size > firstSetCheck.get(nonTerminal).length) {
          correctTemp[nonTerminal].helpertext = "too few elements";
          setSolved(false);
        } else if(firstSet.get(nonTerminal).size < firstSetCheck.get(nonTerminal).length){
          correctTemp[nonTerminal].helpertext = "too many elements";
          setSolved(false);
        } else {
          correct = difference.size === 0;
        }
        correctTemp[nonTerminal].error = !correct;
        correctTemp[nonTerminal].correct = correct;
        if (!correct) {
          solvedCorrect = false;
        }
        //console.log(correctTemp);
        setRefresh(!refresh);
      }
      //console.log(correct);
    });
    setSolved(solvedCorrect);
    if(solvedCorrect){
      setFirstSet(firstSet);
    }
    //setCorrect(true);
  };

  const handleSolved = () => {
    resetNodes();
    stopTimeout(timeOut);
    setStepStateRunning(false);
    setSolved((current) => !current);
    const firstSet = calculateFirstSet(grammarObj, nullableSet);
    //const firstSet = calculateFirstSetTest(grammarObj, grammarObj.nonTerminals.includes('S') ? 'S' : grammarObj.nonTerminals[1], nullableSet);
    console.log(firstSet);
    grammarObj.nonTerminals.slice(1).forEach((nonTerminal, index) => {
      if(firstSet.get(nonTerminal) !== undefined){
        elementsRef.current[index].current.value = [...firstSet.get(nonTerminal)].join(', ');
        correctTemp[nonTerminal].correct = true;
        correctTemp[nonTerminal].error = false;
      }
    });
    setFirstSet(firstSet);
    setStepState(2);
  };

  const handleStep = () => {
    setStepStateRunning(true);
    console.log("TODO: ");
    console.log(nodesTodo);
    if(nodesTodo.length === 0) {setStepState(stepState+1)};
    console.log(stepState);
    var counter = 0;
    resetNodes();
    resetCorrectTemp(correctTemp);
    //const [dependencies, label] = getDependencies(grammarObj, nullableSet);
    //stopSteps(productionRef, modifiedList, timeOut);
    const tempNodes = new Set(grammarObj.nonTerminals.slice(1));

    switch (stepState) {
      case 0:
        //Nodes without dependency on other nodes
        
        edges.forEach((edge) => {
          if(edge.target !== edge.source){
            tempNodes.delete(edge.target);
          }
        });
        console.log(tempNodes);
        edges.forEach((edge) => {
          if(tempNodes.has(edge.source)){
            !nodesTodo.includes(edge.target) && nodesTodo.push(edge.target);
          }
        });
        nodes.filter((node) => tempNodes.has(node.id)).forEach((node) => {
          console.log(node);
          timeOut.push(setTimeout(() => {elementsRef.current[node.data.index].current.value = (node.data.active ? "e, " : "") + node.data.ref.current.value;}, counter * 1000));
          highlightNode(node.data.index, counter);
          counter++;
        });
        timeOut.push(setTimeout(() => {setStepStateRunning(false);}, counter * 1000));
        console.log(nodesTodo);
        break;
      case 1:
        nodes.filter((node) => nodesTodo.includes(node.id)).forEach((node) => {
          console.log(node);
          elementsRef.current[node.data.index].current.value = (node.data.active ? "e, " : "") + node.data.ref.current.value;
          edges.filter((edge) => edge.target === node.id && edge.target !== edge.source).forEach((edge) => {
            console.log(edge);
            //const test = new Set([...elementsRef.current[node.data.index].current.value.split(", "), ...elementsRef.current[nodes.find((node) => node.id === edge.source).data.index].current.value.split(", ").filter(x => x !== "e" && x !== "eps")]);
            timeOut.push(setTimeout(() => {
              const test = new Set([...elementsRef.current[node.data.index].current.value.split(", ").filter((str) => str !== ""), ...elementsRef.current[nodes.find((node) => node.id === edge.source).data.index].current.value.split(", ").filter(x => x !== "e" && x !== "eps")]);
              elementsRef.current[node.data.index].current.value = [...test].join(", ");
            }, counter * 1000));
            highlightNode(node.data.index, counter);
          });
          counter++;
        });

        console.log(nodes);
        
        let index = nodesTodo.length;
        while(index > 0){
          const id = nodesTodo.shift();
          edges.forEach((edge) => {
            if(id === edge.source && edge.target !== edge.source){
              !nodesTodo.includes(edge.target) && nodesTodo.push(edge.target);
            }
          });
          index--;
        }

        if(nodesTodo.length === 0){
          timeOut.push(setTimeout(() => {
            handleCheck();
            setStepState(stepState+1);
            resetNodes();
          }, counter * 1000));
        }
        timeOut.push(setTimeout(() => {setStepStateRunning(false);}, counter * 1000));
        break;
      default:
        reset();
        break;
    }

    
  }

  async function highlightNode(index, counter) {
    timeOut.push(setTimeout(() => {
      //nodes[index].data.active = true;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data.index === index) {
            // it's important that you create a new object here
            // in order to notify react flow about the change
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

  const reset = () => {
    setStepStateRunning(false);
    setStepState(0);
    //stopSteps(productionRef, modifiedList, timeOut);
    setSolved(false);
    elementsRef.current.forEach((textInput) => textInput.current.value = "");
    resetCorrectTemp(correctTemp);
    resetNodes();
    nodesTodo.length = 0;
  }

  const resetNodes = () => {
    setNodes((nds) =>
      nds.map((node) => {
          node.data = {
            ...node.data,
            stepActive: false,
          };
          //console.log(node.id);
          correctTemp[node.id].stepActive = false;
        return node;
      })
    );
  }

  //const startProduction = [grammarObj.nonTerminals.includes('S') ? "S' -> S $" : "S' -> " + grammarObj.nonTerminals[1] + " $"];
  const productionList = [/*...startProduction, */...grammar.split("\n")];
  //productionList.push("S' -> " + grammarObj.nonTerminals[1] + " $" );
  const convention = 'Please enter the FirstSets according to the following pattern: <terminal>, <terminal>, ...';

  useEffect(() => {
    nodes.forEach((node) => {
      if(node.data.ref.current !== null){
        node.data.ref.current.value = node.data.text;
        node.data.ref.current.disabled = true;
        node.data.disabled = true;
      }
      console.log(node.data.ref.current);
    });
  }, [reactFlowInstance]);

  //setCorrect(correctTemp);

  return (
    <div className='flex flex-col w-full h-full'>
        {children}
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
          <div className='flex flex-col w-2/3'>
            <p>{convention}</p>
            {grammarObj.nonTerminals.slice(1).map((item, index) => (
              <div className='flex items-center m-2'>
                <p className='w-1/5 px-5 truncate hover:text-clip z-10 hover:overflow-visible'>FIRST ({item})</p>
                <TextField inputRef={elementsRef.current[index]} key={item} className='w-4/5'
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& > fieldset": correctTemp[item].correct ? {borderColor: "#22c55e", borderWidth: 2} : correctTemp[item].stepActive ?  {borderColor: "#0ea5e9", borderWidth: 2} : {borderColor: "#2f2f2f", borderWidth: 2},
                    },
                    "& .MuiOutlinedInput-root:hover": { 
                      "& > fieldset": { borderColor: "#fde047", borderWidth: 3},
                    },
                  }}
                  variant="outlined"
                  error={correctTemp[item].error ? true : false}
                  helperText={correctTemp[item].error ? correctTemp[item].helpertext : ""}
                  />
              </div>
            ))}
          </div>
        </div>
        <div className=''>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleStep} disabled={stepStateRunning}>
                {stepState!==2 ? (stepStateRunning ? 'Running...' : 'Next Step') : 'Restart'}
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