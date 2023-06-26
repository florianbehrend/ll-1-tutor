import React, {useContext, useState, useRef, createRef}  from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import {StoredContext} from '../context/StoredContext';
import { calculateFirstSet } from '../utils/utils';
import { TextField } from '@mui/material';
import '../layout/LookUpTable.css';

/*E ::= E + T
E ::= T
T ::= T * F
T ::= F
F ::= ( E ) 
F ::= name
F ::= int*/

var correctTemp = {};

const timeOut = [];
const modifiedList = [];

let hasChanged = true;

function check(grammar){
  grammar.nonTerminals.slice(1).forEach((item, index) => {
    if(correctTemp[item] === undefined) {
      correctTemp[item] = [];
      for (let i = 0; i <= grammar.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').length; i++) {
        correctTemp[item].push({correct: false, error: false, helpertext: "wrong elements", stepActive: false});  
      }
    }
  });
  console.log(correctTemp);
};

const calculateLookUpTable = (grammarObj, firstSet, followSet, indexMap) => {
  // LL(1) parsing table
  const parsingTable = {};

  // Initialize the parsing table with empty entries
  grammarObj.nonTerminals.forEach(nonTerminal => {
    parsingTable[nonTerminal] = {};
  });

  grammarObj.productions.forEach(({lhs, rhs}, index) =>{
    const firstSetTemp = calculateFirstSet(rhs, grammarObj, firstSet);

    firstSetTemp.forEach(terminal => {
      if (terminal !== '') {
        if (parsingTable[lhs][terminal] === undefined) {
            parsingTable[lhs][terminal] = new Set();

          } 
          parsingTable[lhs][terminal].add(indexMap[index]);
      }
    });

    console.log(lhs);
    console.log(firstSetTemp);

    if (firstSetTemp.has('')) {
      const followSetTemp = followSet[lhs];
      console.log(followSetTemp);

      followSetTemp.forEach(terminal => {
        console.log(parsingTable[lhs]);
        //if (!parsingTable[lhs].hasOwnProperty(terminal)) {
          console.log("added to " + terminal + ": " + (indexMap[index]));
          if (parsingTable[lhs][terminal] === undefined) {
            parsingTable[lhs][terminal] = new Set();

          } 
          parsingTable[lhs][terminal].add(indexMap[index]);
        //}
      });
    }
    console.log(firstSetTemp);
  });
  console.log(parsingTable);

  return parsingTable;
}

export default function LookUpTable ({children, className, containerClassName,  ...props}) {

  const {activeStep, setActiveStep} = useContext(StepperContext);
  const {grammar, setGrammar} = useContext(StoredContext);
  const {grammarObj, setGrammarObj} = useContext(StoredContext);
  const {firstSet, setFirstSet} = useContext(StoredContext);
  const {followSet, setFollowSet} = useContext(StoredContext);
  const {parsingTable, setParsingTable} = useContext(StoredContext);

  const [solved, setSolved] = useState(false);
  const [refresh, setRefresh] = useState();
  const [stepState, setStepState] = useState(0);
  const [stepStateRunning, setStepStateRunning] = useState(false);

  const productionRef = useRef(grammarObj.productions.map(() => createRef()));
  const tableRef = useRef(grammarObj.nonTerminals.slice(1).map(() => grammarObj.terminals.map(() => createRef())));
  const tableRefVert = useRef(grammarObj.terminals.map(() => grammarObj.nonTerminals.slice(1).map(() => createRef())));

  const verticalTable = grammarObj.terminals.length >= grammarObj.nonTerminals.length;
  check(grammarObj);

  const handleNext = () => {    
    if (handleCheck()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      correctTemp = {};
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    correctTemp = {};
  };

  const handleSolved = () => {
    const lookUpTable = calculateLookUpTable(grammarObj, firstSet, followSet, indexMap);
    console.log(tableRefVert);
  
    Object.keys(lookUpTable).slice(1).forEach((nonTerminal, index) => {
      console.log(nonTerminal);
      console.log(lookUpTable[nonTerminal]);
      Object.keys(lookUpTable[nonTerminal]).forEach((terminal) => {
        console.log(terminal);
        console.log(grammarObj.terminals);
        const ind = terminal === '$' ? grammarObj.terminals.length-1 : grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').indexOf(terminal);
        console.log(ind);
        console.log(index);
        console.log(tableRefVert.current[ind]);
        if (verticalTable) {
          tableRefVert.current[ind][index].current.value = [...lookUpTable[nonTerminal][terminal]].join(", ");
        }else {
          tableRef.current[index][ind].current.value = [...lookUpTable[nonTerminal][terminal]].join(", ");
        }
      })
    });
    setSolved(true);
    setParsingTable(lookUpTable);
    console.log(tableRefVert);
  };

  const handleCheck = () => {
    const lookUpTableCheck = {};
    const lookUpTable = calculateLookUpTable(grammarObj, firstSet, followSet, indexMap);
    var solvedCorrect = true;
    const terminalsTemp =  grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps');
    terminalsTemp.push("$");
    console.log(terminalsTemp);
    //TODO Bug mit epsilon in ind
    grammarObj.nonTerminals.slice(1).forEach((nonTerminal, index) => {
        lookUpTableCheck[nonTerminal] = {};

        terminalsTemp.forEach((terminal) => {
          if(lookUpTable[nonTerminal][terminal] === undefined) {lookUpTable[nonTerminal][terminal] = new Set()}
          const ind = terminal === '$' ? grammarObj.terminals.length-1 : grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').indexOf(terminal);
          if (verticalTable) {
            lookUpTableCheck[nonTerminal][terminal] = new Set(tableRefVert.current[ind][index].current.value.split(", ").map((symbol) => symbol.trim()).filter(x => x !== "").map((symbol) => parseInt(symbol)));
          }else {
            lookUpTableCheck[nonTerminal][terminal] = new Set(tableRef.current[index][ind].current.value.split(", ").map((symbol) => symbol.trim()).filter(x => x !== "").map((symbol) => parseInt(symbol)));      
          }
          const difference = new Set([...lookUpTableCheck[nonTerminal][terminal]].filter(x => !lookUpTable[nonTerminal][terminal].has(x)));
          console.log(difference);
          var correct = false;
          if (difference.size === 0) {
            console.log(nonTerminal);
            console.log(terminal);
            console.log(lookUpTable[nonTerminal][terminal]);
            console.log(lookUpTableCheck[nonTerminal][terminal]);
            console.log(lookUpTable);
          }
          

          if (lookUpTable[nonTerminal][terminal].size > lookUpTableCheck[nonTerminal][terminal].size) {
            //correctTemp[nonTerminal].helpertext = "too few elements";
            console.log("too few elements");
            setSolved(false);
          } else if(lookUpTable[nonTerminal][terminal].size < lookUpTableCheck[nonTerminal][terminal].size){
            //correctTemp[nonTerminal].helpertext = "too many elements";
            console.log("too many elements");          
            setSolved(false);
          } else {
            correct = difference.size === 0;
          }
          correctTemp[nonTerminal][ind].error = !correct;
          //correctTemp[nonTerminal].correct = correct;
          console.log(correct);
          if (!correct) {
            solvedCorrect = false;
          }
          setRefresh(!refresh);
        })
    });


    console.log(lookUpTableCheck);
    console.log(correctTemp);
    setSolved(solvedCorrect);
    if(solvedCorrect){
      setParsingTable(lookUpTable);
    }
    return solvedCorrect;
  };

  const handleStep = () => {

  };

  const convention = 'Please fill the Lockahead-Table according to the following pattern: <production index>, <production index>, ...';
  const productionList = [/*...startProduction, */...grammar.split("\n")];
  const indexMap = [];

  return (
    <div className='flex flex-col w-full h-full'>
      {children}
        <div className='flex h-full'>
          <div className='w-1/3'>
            <div className='h-1/3 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll'>
              {(() => {
                  let rows = [];
                  let lastNonTerminal = "";
                  let index = -1;
                  indexMap.length = 0;
                  for (let i = 0; i < grammarObj.productions.length; i++) {
                    const item = grammarObj.productions[i];
                    index = item.lhs !== lastNonTerminal && lastNonTerminal !== "" ? 0 : index+=1;
                    rows.push(<><p key={item.lhs + item.rhs} ref={productionRef.current[i]}>{index}: {item.lhs + " -> " + item.rhs.join(" ")}</p></>);
                    lastNonTerminal = item.lhs;
                    indexMap.push(index);
                  }
                  return rows;
                })()}
              </div>
              <div className='h-1/3 mt-1 overflow-y-scroll'>
                {grammarObj.nonTerminals.slice(1).map((item, index) => (
                  <div className='flex my-2 text-left border-2 border-solid rounded-sm border-color'>
                    <p className='w-full px-1 truncate hover:text-clip z-10 hover:overflow-visible'>FIRST ({item}): {[...firstSet.get(item)].join(", ")}</p>
                  </div>
                ))}
              </div>
              <div className='h-1/3 mt-1 overflow-y-scroll'>
                {grammarObj.nonTerminals.slice(1).map((item, index) => (
                  <div className='flex my-2 text-left border-2 border-solid rounded-sm border-color'>
                    <p className='w-full px-1 truncate hover:text-clip z-10 hover:overflow-visible'>FOLLOW ({item}): {[...followSet[item]].join(", ")}</p>
                  </div>
                ))}
              </div>
            </div>
          <div className='flex flex-col w-2/3'>
            <p>{convention}</p>
            <div className='flex items-center justify-center overflow-scroll m-2'>
                <table className='border '>
                {!verticalTable && <thead>
                    <tr class="border-b bg-zinc-800">
                        <th className='border-r'>Nonterminal</th>
                        {grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').map((item, index) => (
                          <th className='border-r'>{item}</th>
                        ))}
                        <th className='border-r'>$</th>
                    </tr>
                </thead>}
                {verticalTable && <thead>
                    <tr class="border-b bg-zinc-800">
                        <th className='border-r'>Terminals</th>
                        {grammarObj.nonTerminals.slice(1).map((item, index) => (
                          <th className='border-r' id={index}>{item}</th>
                        ))}
                    </tr>
                </thead>}
                {!verticalTable && <tbody>
                    {grammarObj.nonTerminals.slice(1).map((item, index) => (
                        <tr class="border-b  ">
                            <td className='nonTerminal-table flex justify-center border-r'><p>{item}</p></td>
                            {grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').map((sym, ind) => (
                              <td className='border-r'><TextField  sx={{
                                "& .MuiOutlinedInput-root:hover": { 
                                  "& > fieldset": { borderColor: "#fde047", borderWidth: 1},
                                },
                              }} inputRef={tableRef.current[index][ind]}
                              error={correctTemp[item][ind].error ? true : false}
                              /></td>
                            ))}
                            <td className='border-r'><TextField sx={{
                                "& .MuiOutlinedInput-root:hover": { 
                                  "& > fieldset": { borderColor: "#fde047", borderWidth: 1},
                                },
                              }} inputRef={tableRef.current[index][grammarObj.terminals.length-1]}
                              error={correctTemp[item][grammarObj.terminals.length-1].error ? true : false}
                              /></td>
                        </tr>
                    ))}
                </tbody>}
                {verticalTable && <tbody>
                    {grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').map((item, index) => (
                        <tr class="border-b  ">
                            <td className='nonTerminal-table flex justify-center border-r'><p>{item}</p></td>
                            {grammarObj.nonTerminals.slice(1).map((item, ind) => (
                              <td className='border-r'><TextField  sx={{
                                "& .MuiOutlinedInput-root:hover": { 
                                  "& > fieldset": { borderColor: "#fde047", borderWidth: 1},
                                },
                              }} inputRef={tableRefVert.current[index][ind]}
                              error={correctTemp[item][index].error ? true : false}
                              /></td>
                            ))}
                        </tr>
                    ))}
                    <tr class="border-b  ">
                            <td className='nonTerminal-table flex justify-center border-r'><p>$</p></td>
                            {grammarObj.nonTerminals.slice(1).map((item, ind) => (
                              <td className='border-r'><TextField  sx={{
                                "& .MuiOutlinedInput-root:hover": { 
                                  "& > fieldset": { borderColor: "#fde047", borderWidth: 1},
                                },
                              }} inputRef={tableRefVert.current[grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').length][ind]}
                              error={correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').length].error ? true : false}
                              /></td>
                            ))}
                        </tr>
                </tbody>}
                </table>
                
            </div>
          </div>
        </div>
        <div className='mt-2'>
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