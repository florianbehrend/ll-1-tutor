import React, {useContext, useRef, useState, createRef}  from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import {StoredContext} from '../context/StoredContext';
import '../layout/EnterGrammar.css';
import { TextField } from '@mui/material';

var correctTemp = {};

function check(grammar){
  grammar.nonTerminals.map((item) => {
    if (correctTemp[item] === undefined) {
      correctTemp[item] = {correct: false, error: false, helpertext: "wrong elements"}
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
    for(var i = 0; i<rule.rhs.length; i++){
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
            }else{
              calculated.get(nonTerminal).add(terminal); 
              console.log(terminal + " added from");
            }
            
          });
          
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

  console.log(grammarObj);

  const [solved, setSolved] = useState(false);

  check(grammarObj);
  const [refresh, setRefresh] = useState();

  const elementsRef = useRef(grammarObj.nonTerminals.map(() => createRef()));
  //console.log(elementsRef);

  const handleNext = () => {    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    correctTemp = {};
  };

  //TODO add S as start production and start from this terminal
  const handleCheck = () => {
    const firstSetCheck = new Map();
    const firstSet = calculateFirstSetTest(grammarObj, grammarObj.nonTerminals.includes('S') ? 'S' : grammarObj.nonTerminals[1], nullableSet);
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
    //setCorrect(true);
  };

  const handleSolved = () => {
    setSolved((current) => !current);
    const firstSet = calculateFirstSetTest(grammarObj, grammarObj.nonTerminals.includes('S') ? 'S' : grammarObj.nonTerminals[1], nullableSet);
    console.log(firstSet);
    grammarObj.nonTerminals.slice(1).forEach((nonTerminal, index) => {
      if(firstSet.get(nonTerminal) !== undefined){
        elementsRef.current[index].current.value = [...firstSet.get(nonTerminal)].join(', ');
        correctTemp[nonTerminal].correct = true;
        correctTemp[nonTerminal].error = false;
      }
    });
  };

  //const startProduction = [grammarObj.nonTerminals.includes('S') ? "S' -> S $" : "S' -> " + grammarObj.nonTerminals[1] + " $"];
  const productionList = [/*...startProduction, */...grammar.split("\n")];
  //productionList.push("S' -> " + grammarObj.nonTerminals[1] + " $" );
  const convention = 'Please enter the FirstSets according to the following pattern: <terminal>, <terminal>, ...';

  
  //setCorrect(correctTemp);

  return (
    <div className='w-full'>
        {children}
        <div className='flex'>
          <div className='w-1/3 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll'>
            {productionList.map(item => (
                    <p>{item}</p>
                  ))}
          </div>
          <div className='flex flex-col w-2/3'>
            <p>{convention}</p>
            {grammarObj.nonTerminals.slice(1).map((item, index) => (
              <div className='flex items-center m-2'>
                <p className='w-1/5 px-5 truncate hover:text-clip z-10 hover:overflow-visible'>FIRST ({item})</p>
                <TextField inputRef={elementsRef.current[index]} key={item} className='w-4/5'
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& > fieldset": correctTemp[item].correct ? {borderColor: "#22c55e", borderWidth: 2} : { borderColor: "#2f2f2f", borderWidth: 2},
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
        <div className='flex justify-evenly'>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleCheck}>
            Next Step
          </Button>
          <Button onClick={handleCheck}>
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