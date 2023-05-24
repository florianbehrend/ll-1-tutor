import React, {useContext, useState, useRef, createRef}  from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import {StoredContext} from '../context/StoredContext';
import CheckBox from '../components/Checkbox';

const stepDesc = [
    {'key': 0, 'msg': 'Please check the boxes if the nonterminal is nullable.'},
    {'key': 1, 'msg': 'Step 1: For each production rule in your grammar, check if the right-hand side of the rule consists solely of epsilon. If it does, add the left-hand side nonterminal to the Nullable set.'},
    {'key': 2, 'msg': 'Step 2: Repeat the following step until no new nullable nonterminals are found:\na. For each production rule in your grammar where the right side consists only of nonterminals, check if all the nonterminals on the right-hand side are already in the Nullable set. If they are, add the left-hand side nonterminal to the Nullable set.'},
    {'key': 3, 'msg': 'Done! No new nullable nonterminals are found in step 2, the Nullable-Set contains all the nullable nonterminals in your grammar.'},
]
const modifiedList = [];
const timeOut = [];
let newNullableNonterminalsFound = true;
//let stepStateRunning = false;
const nullableSet = new Set();

const getEmptyProduction = (grammarObj, nullableSet = new Set()) => {
    //console.log(grammarObj);
    //stepStateRunning = true;
    const emptyProductions = [];
    grammarObj.productions.forEach((item, index) => {
        if(item.rhs[0] === 'e' ||  item.rhs[0] === 'eps'){
            emptyProductions.push(index);
            nullableSet.add(grammarObj.productions[index].lhs);
        }
    });
    console.log("-----------");
    console.log(nullableSet);
    return emptyProductions;
}

const findEmptyProduction = (nullableSet, grammarObj, newNullableNonterminalsFound = false) => {
    console.log(nullableSet);
    grammarObj.productions.forEach(({lhs, rhs}) => {
        if (!nullableSet.has(lhs)) {
          const isNullable = rhs.every((symbol) =>
            grammarObj.terminals.includes(symbol) ? false : nullableSet.has(symbol)
          );

          if (isNullable) {
            nullableSet.add(lhs);
            newNullableNonterminalsFound = true;
          }
        }
      });
    return newNullableNonterminalsFound;
}

const calculateNullable = (grammarObj, nullableSet) => {
    console.log("Calc");
    console.log(nullableSet);
    let newNonterminalsFound = true
    getEmptyProduction(grammarObj, nullableSet);
    // Step 3: Find new nullable nonterminals
    while (newNonterminalsFound) {
        newNonterminalsFound = findEmptyProduction(nullableSet, grammarObj);    
    }
    //findEmptyProduction(nullableSet, grammarObj);
    console.log(nullableSet);
    return nullableSet;
}

function iterateProductions(grammarObj, productionRef, checkBoxRef) {
    let counter = 1;
    //stepStateRunning = true;
    newNullableNonterminalsFound = false;
    grammarObj.productions.slice(0, -1).forEach(({lhs, rhs}, index) => {
        const consistOfNonterminal = rhs.every((symbol) =>
            grammarObj.terminals.includes(symbol) ? false : true
          );
        if(consistOfNonterminal) {
            if(!nullableSet.has(lhs)){
                const isNullable = rhs.every((symbol) =>
                    nullableSet.has(symbol)
                );
                if (isNullable) {
                    nullableSet.add(lhs);
                    newNullableNonterminalsFound = true;
                    highlightProduction(productionRef.current[index], counter, "text-green-500");
                    highlightCheckbox(checkBoxRef.current[grammarObj.nonTerminals.indexOf(lhs)-1], counter);
                }
                highlightProduction(productionRef.current[index], counter);
                counter++;
                modifiedList.push(index);
            }
        }
    });
    return counter;
}

async function highlightProduction(productionRef, counter, color="text-sky-500"){
    timeOut.push(setTimeout(() => productionRef.current.classList.add(color, "font-bold"), counter * 1000));
    //productionRef.current.classList.add("text-sky-500", "font-bold");
}

async function highlightCheckbox(checkBoxRef, counter){
    timeOut.push(setTimeout(() => checkBoxRef.current.checked = true, counter * 1000));
}

function removeHighlight(productionRef){
    modifiedList.forEach(index => {
        productionRef.current[index].current.classList.remove("text-sky-500", "text-green-500", "font-bold");
    });
    modifiedList.length = 0;
}

function stopSteps(productionRef){
    timeOut.forEach(timeout => {
        clearTimeout(timeout);
    });
    removeHighlight(productionRef);
    timeOut.length = 0;
    //stepStateRunning = false;
}


export default function NullableSet ({children, className, containerClassName,  ...props}) {

  const {activeStep, setActiveStep} = useContext(StepperContext);
  //const {grammar, setGrammar} = useContext(StoredContext);
  const {grammarObj, setGrammarObj} = useContext(StoredContext);
  const [stepState, setStepState] = useState(0);
  const [solved, setSolved] = useState(false);
  const [refresh, setRefresh] = useState();
  const [stepStateRunning, setStepStateRunning] = useState(false);


  const checkBoxRef = useRef(grammarObj.nonTerminals.slice(1).map(() => createRef()));
  const productionRef = useRef(grammarObj.productions.slice(0,-1).map(() => createRef()));
  const textRef = useRef();

  const handleNext = () => {    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    nullableSet.clear();
    setStepStateRunning(false);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    nullableSet.clear();
    setStepStateRunning(false);
    newNullableNonterminalsFound = true;
  };

  const handleCheck = () => {
    const nullableSetChecked = new Set();
    const nullableSet = calculateNullable(grammarObj, nullableSetChecked);
    var solvedCorrect = true;

    grammarObj.nonTerminals.slice(1).forEach((symbol, index) => {
        if ((nullableSet.has(symbol) && checkBoxRef.current[index].current.checked) || (!nullableSet.has(symbol) && !checkBoxRef.current[index].current.checked)){
            console.log("Schon richtig... " + symbol);
            checkBoxRef.current[index].current.classList.add("accent-green-500", "border-green-500");
        }else {
            checkBoxRef.current[index].current.classList.add("accent-red-500", "border-red-500");
            console.log("Schon falsch...");
            solvedCorrect = false;
        }
    });
    setSolved(solvedCorrect);
    if (solvedCorrect) {setStepState(stepDesc.length-1)};
    console.log("State: " + stepState);
  }

  const handleStep = () => {
    console.log(stepState);
    setStepStateRunning(true);
    stopSteps(productionRef);
    if(!newNullableNonterminalsFound || stepState < 2) {setStepState(stepState+1)};

    switch (stepState === 0 || stepState === 1 ? stepState+1 : stepState) {
        case 1:
            let counter = 1;
            getEmptyProduction(grammarObj, nullableSet).forEach(index => {
                highlightProduction(productionRef.current[index], counter, "text-green-500");
                //productionRef.current[index].current.classList.add("text-sky-500", "font-bold");
                modifiedList.push(index);
                counter++;
            });
            counter = 1;
            nullableSet.forEach(item => {
                highlightCheckbox(checkBoxRef.current[grammarObj.nonTerminals.indexOf(item)-1], counter);
                counter++;
            });
            timeOut.push(setTimeout(() => {setStepStateRunning(false); setRefresh(!refresh)}, counter * 1000));
            break;
        case 2:
            console.log(newNullableNonterminalsFound);
            const highestIndex = iterateProductions(grammarObj, productionRef, checkBoxRef);
            console.log("Works??? 1")
            timeOut.push(setTimeout(() => {console.log(stepStateRunning); setStepStateRunning(false); console.log("Works???")}, highestIndex * 1000));
            console.log("High: " + highestIndex);
            //setRefresh(true);
            if(stepState <= 2 && newNullableNonterminalsFound){
                //setStepState(2);
                console.log("eigentlich");
            }else{
                setStepState(3);
            };
            break;
        case 3:
            reset();
            return;
    }
    console.log(stepState);
    textRef.current.innerText = stepDesc[stepState].msg;
    //console.log(textRef.current);
  }

  const handleSolved = () => {
    setStepStateRunning(false);
    stopSteps(productionRef);
    setSolved((current) => !current);
    const nullableSetChecked = new Set();
    const nullableSet = calculateNullable(grammarObj, nullableSetChecked);
    grammarObj.nonTerminals.slice(1).forEach((item, index) => {
        if(nullableSet.has(item)){
            checkBoxRef.current[index].current.checked = true;
        }else{
            checkBoxRef.current[index].current.checked = false;
        };
        checkBoxRef.current[index].current.classList.add("accent-green-500", "border-green-500");
    });
    //console.log(nullableSet);
    setStepState(stepDesc.length-1);
  };

  const checkedChange = (event) => {
    event.target.classList.remove("accent-red-500", "border-red-500", "accent-green-500", "border-green-500");
  }

  const reset = () => {
    setStepStateRunning(false);
    setStepState(0);
    setSolved(false);
    nullableSet.clear();
    productionRef.current.forEach(item => {
        item.current.classList.remove("text-sky-500", "font-bold");
    })
    checkBoxRef.current.forEach(item => {
        item.current.checked = false;
        item.current.classList.remove("accent-red-500", "border-red-500", "accent-green-500", "border-green-500");
    })
  }



  //const productionList = [...grammar.split("\n")];
  const convention = 'Please check the boxes if the nonterminal is nullable.';

  return (
    <div className='flex flex-col w-full h-full'>
         <div className='flex h-full'>
            <div className='w-1/3 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll'>
                {grammarObj.productions.slice(0, -1).map((item, index) => (
                        <p key={item.lhs + item.rhs} ref={productionRef.current[index]}>{item.lhs + " -> " + item.rhs.join(" ")}</p>
                    ))}
            </div>
            <div className='w-2/3 border-2 border-solid rounded-lg border-color ml-2 p-2 h-full'>
                <p ref={textRef} className='whitespace-pre-line'>{stepDesc[stepState].msg}</p>
                <div className='flex items-center justify-center m-2'>
                    <table className='border'>
                    <thead>
                        <tr class="border-b bg-zinc-800">
                            <th className='border-r'>Nonterminal</th>
                            <th>isEmpty?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grammarObj.nonTerminals.slice(1).map((item, index) => (
                            <tr class="border-b bg-zinc-800">
                                <td className='max-h-6 flex justify-center border-r'><p>{item}</p></td>
                                <td className='max-h-6'><CheckBox inputRef={checkBoxRef.current[index]} onClick={checkedChange}/></td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                    
                </div>
                {!solved && <div className='flex justify-evenly'>
                    <p>{"Nullable-Set: (" + [...nullableSet].join(", ") + ")"}</p>
                    {<p>{"new nullable nonterminals found: " + newNullableNonterminalsFound}</p>}
                </div>}
            </div>
         </div>
        <div>
            <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
            Back
            </Button>
            <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleStep}>
                {stepState!==stepDesc.length-1 ? (stepStateRunning ? 'Running...' : 'Next Step') : 'Restart'}
            </Button> 
            
            <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleCheck}>
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