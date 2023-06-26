import React, {useContext, useState, useRef, createRef}  from 'react';
import Button from "../components/Button";
import { TextField } from '@mui/material';
import { StepperContext } from "../context/StepperContext";
import { StoredContext } from "../context/StoredContext";
import { highlightProduction, stopSteps, resetCorrectTemp, removeHighlight, removeHighlightAll, stopTimeout, calculateFirstSet } from '../utils/utils';

var correctTemp = {};

const timeOut = [];
const modifiedList = [];

const initialFollowSets = {};
let updatedFollowSets = {};
let hasChanged = true;

function check(grammar){
  grammar.nonTerminals.map((item) => {
    if (correctTemp[item] === undefined) {
      correctTemp[item] = {correct: false, error: false, helpertext: "wrong elements", stepActive: false}
     } ;
    //console.log(correctTemp);
  });
};

const Step0 = (initialFollowSets, grammarObj) => {
  // Initialize the follow sets with empty sets for each nonterminal
  grammarObj.nonTerminals.forEach(nonTerminal => {
    initialFollowSets[nonTerminal] = new Set();
  });
  // Step 0: Add $ to FOLLOW(S'), where S' is the start nonterminal
  initialFollowSets["S'"].add('$');
  updatedFollowSets = { ...initialFollowSets };
  hasChanged = true;

}

const Step1 = (grammarObj, firstSet) => {
  hasChanged = false;

  // Step 2: For each production A -> αBβ, add every token in FIRST(β) to FOLLOW(B)
  grammarObj.productions.forEach(({lhs, rhs}) => { 
      for (let i = 0; i < rhs.length; i++) {
        const token = rhs[i];

        if (grammarObj.nonTerminals.includes(token)) {
          const restOfTokens = rhs.slice(i + 1);

          // If there are more tokens after B
          if (restOfTokens.length > 0) {
            const firstSetOfRest = calculateFirstSet(restOfTokens, grammarObj, firstSet);
            const followSetOfB = updatedFollowSets[token];

            const originalFollowSetSize = followSetOfB.size;
            [...firstSetOfRest].filter((symbol) => {return symbol !== ''}).forEach(terminal => followSetOfB.add(terminal));

            if (followSetOfB.size > originalFollowSetSize) {
              updatedFollowSets[token] = followSetOfB;
              console.log(token);
              console.log(updatedFollowSets[token]);
              hasChanged = true;
            }
          }

          // If B is the last token or β contains ε (empty)
          if (i === rhs.length - 1 || calculateFirstSet(rhs.slice(i + 1), grammarObj, firstSet).has('')) {
            const followSetOfA = updatedFollowSets[lhs];
            const followSetOfB = updatedFollowSets[token];

            const originalFollowSetSize = followSetOfB.size;
            followSetOfA.forEach(terminal => followSetOfB.add(terminal));

            if (followSetOfB.size > originalFollowSetSize) {
              updatedFollowSets[token] = followSetOfB;
              console.log(token);
              console.log(updatedFollowSets[token]);
              hasChanged = true;
            }
          }
        }
      }
  });
  console.log(updatedFollowSets);
}

const calculateFollowSets = (grammarObj, firstSet) => {
    Step0(initialFollowSets, grammarObj);
    console.log("Calculating -------------------------------");
    while (hasChanged) {
      Step1(grammarObj, firstSet);
    }
    console.log(updatedFollowSets);
    return updatedFollowSets;
};

export default function FollowSet ({children, className, containerClassName,  ...props}) {

  const {activeStep, setActiveStep} = useContext(StepperContext);
  const {grammar, setGrammar} = useContext(StoredContext);
  const {grammarObj, setGrammarObj} = useContext(StoredContext);
  const {nullableSet, setNullableSet} = useContext(StoredContext);
  const {firstSet, setFirstSet} = useContext(StoredContext);
  const {followSet, setFollowSet} = useContext(StoredContext);

  const [stepState, setStepState] = useState(0);
  const [solved, setSolved] = useState(false);
  const [stepStateRunning, setStepStateRunning] = useState(false);
  const [refresh, setRefresh] = useState();
  const [refreshRow, setRefreshRow] = useState(-1);
  check(grammarObj);

  const elementsRef = useRef(grammarObj.nonTerminals.map(() => createRef()));
  const productionRef = useRef(grammarObj.productions.map(() => createRef()));
  const productionFieldRef = useRef();
  const firstSetRef = useRef();
  const hasChangedRef = useRef();

  const handleNext = () => {    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    correctTemp = {};
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    correctTemp = {};
    stopTimeout(timeOut);
  };

  const handleCheck = () => {
    const followSetCheck = new Map();
    const followSet = calculateFollowSets(grammarObj, firstSet);
    console.log("Follow Set: ");
    console.log(followSet);
    var solvedCorrect = true;
    grammarObj.nonTerminals.forEach((nonTerminal, index) => {
      followSetCheck.set(nonTerminal, elementsRef.current[index].current.value.split(", ").map((symbol) => symbol.trim()).filter(x => x !== ""));
      console.log(nonTerminal);
      if(followSet[nonTerminal] !== undefined){
        const difference = new Set([...followSet[nonTerminal]].filter(x => !followSetCheck.get(nonTerminal).includes(x)));
        var correct = false;
        if (followSet[nonTerminal].size > followSetCheck.get(nonTerminal).length) {
          correctTemp[nonTerminal].helpertext = "too few elements";
          setSolved(false);
        } else if(followSet[nonTerminal].size < followSetCheck.get(nonTerminal).length){
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
      setFollowSet(followSet);
    }
  }

  const handleSolved = () => {
    setSolved((current) => !current);
    const followSet = calculateFollowSets(grammarObj, firstSet);
    grammarObj.nonTerminals.forEach((nonTerminal, index) => {
      if(followSet[nonTerminal] !== undefined){
        elementsRef.current[index].current.value = [...followSet[nonTerminal]].join(', ');
        correctTemp[nonTerminal].correct = true;
        correctTemp[nonTerminal].error = false;
      }
    });
    setFollowSet(followSet);
    setStepState(2);
    removeHighlightAll(productionRef);
  }
  
  const handleStep = () => {
    setStepStateRunning(true);
    if(stepState === 0 || !hasChanged) {setStepState(stepState+1)};
    console.log(stepState);
    var counter = 0;
    //const [dependencies, label] = getDependencies(grammarObj, nullableSet);
    stopSteps(productionRef, modifiedList, timeOut);
    resetCorrectTemp(correctTemp);

    switch (stepState) {
      case 0:
        Step0(initialFollowSets, grammarObj);
        counter++;
        timeOut.push(setTimeout(() => {
          const index = grammarObj.productions.length-1;
          elementsRef.current[0].current.value = [...updatedFollowSets["S'"]].join(', ');
          correctTemp["S'"].stepActive = true;
          setRefreshRow(1);
          highlightProduction(productionRef.current[index], 0, index, productionFieldRef, timeOut);
          modifiedList.push(index);
          timeOut.push(setTimeout(() => {removeHighlight(productionRef, modifiedList); correctTemp["S'"].stepActive = false; setRefreshRow(0); setStepStateRunning(false);}, 1000));
        }, counter * 1000));
        break;
      case 1:
        //TODO die Produktionen rausnehmen, die das Follow Set nicht verändert haben
        counter++;
        hasChanged = false;
        console.log(new Date().getTime());
        // Step 2: For each production A -> αBβ, add every token in FIRST(β) to FOLLOW(B)
        grammarObj.productions.forEach(({lhs, rhs}, index) => {
          console.log(counter);
          //timeOut.push(setTimeout(() => { 
            console.log(new Date().getTime());
            console.log(counter);
            for (let i = 0; i < rhs.length; i++) {
              timeOut.push(setTimeout(() => { 
              const token = rhs[i];
              console.log(rhs + " " + token);
              highlightProduction(productionRef.current[index], 0, index, productionFieldRef, timeOut);
              modifiedList.push(index);
              timeOut.push(setTimeout(() => {removeHighlight(productionRef, modifiedList);}, 900));

              if (grammarObj.nonTerminals.includes(token)) {
                const restOfTokens = rhs.slice(i + 1);
      
                // If there are more tokens after B
                if (restOfTokens.length > 0) {
                  const firstSetOfRest = calculateFirstSet(restOfTokens, grammarObj, firstSet);
                  const followSetOfB = updatedFollowSets[token];
                  
                  //timeOut.push(setTimeout(() => {firstSetRef.current.textContent = "First Set of -> " + restOfTokens.join(" ") + " : { " + [...firstSetOfRest].join(", ") + " }";}, counter * 1000));
                  firstSetRef.current.textContent = "First Set of -> " + restOfTokens.join(" ") + " : { " + [...firstSetOfRest].join(", ") + " }";

                  const originalFollowSetSize = followSetOfB.size;
                  [...firstSetOfRest].filter((symbol) => {return symbol !== ''}).forEach(terminal => followSetOfB.add(terminal));
      
                  if (followSetOfB.size > originalFollowSetSize) {
                    console.log(token + " has Changed " + rhs);
                    console.log([...followSetOfB].join(", "));
                    updatedFollowSets[token] = followSetOfB;
                    hasChanged = true;
                    elementsRef.current[grammarObj.nonTerminals.indexOf(token)].current.value = [...followSetOfB].join(', ');
                    console.log(followSetOfB);
                    correctTemp[token].stepActive = true;
                    timeOut.push(setTimeout(() => {correctTemp[token].stepActive = false; setRefreshRow(index-1);}, 1000));
                    setRefreshRow(index);
                  }
                }
      
                // If B is the last token or β contains ε (empty)
                if (i === rhs.length - 1 || calculateFirstSet(rhs.slice(i + 1), grammarObj, firstSet).has('')) {

                  const followSetOfA = updatedFollowSets[lhs];
                  const followSetOfB = updatedFollowSets[token];

                  firstSetRef.current.textContent = "Follow Set of -> " + lhs + " : { " + [...followSetOfA].join(", ") + " }";
      
                  const originalFollowSetSize = followSetOfB.size;
                  followSetOfA.forEach(terminal => followSetOfB.add(terminal));
      
                  if (followSetOfB.size > originalFollowSetSize) {
                    updatedFollowSets[token] = followSetOfB;
                    hasChanged = true;
                    elementsRef.current[grammarObj.nonTerminals.indexOf(token)].current.value = [...followSetOfB].join(', ');
                    console.log(followSetOfB);
                    correctTemp[token].stepActive = true;
                    timeOut.push(setTimeout(() => {correctTemp[token].stepActive = false; setRefreshRow(index-1);}, 1000));
                    setRefreshRow(index*-1);
                  }
                }
              }else {
                firstSetRef.current.textContent = "Token skipped: " + token;
                console.log("Token skipped: " + token);
              }
              },counter * 1000));
              counter++;
            }
            //counter++;
          //},counter * 1000));
          //counter++;
        });

        timeOut.push(setTimeout(() => {
          /*Step1(grammarObj, firstSet);
          Object.entries(updatedFollowSets).forEach(([nonTerminal, set], index) => {
            elementsRef.current[index].current.value = [...set].join(', ');
          })*/
          console.log(hasChanged);
          hasChangedRef.current.textContent = "Follow-Set has changed: " + hasChanged;
          if(!hasChanged){
            timeOut.push(setTimeout(() => {
              handleCheck();
              setStepState(stepState+1);
            }, 1000));
          }
        }, counter * 1000));
        timeOut.push(setTimeout(() => {setStepStateRunning(false);}, counter * 1000));
        break;
      default:
        reset();
        break;
    }
  }

  const reset = () => {
    setStepStateRunning(false);
    setStepState(0);
    //stopSteps(productionRef, modifiedList, timeOut);
    setSolved(false);
    //removeHighlight(productionRef, modifiedList);
    elementsRef.current.forEach((textInput) => textInput.current.value = "");
    Object.entries(correctTemp).forEach(([nonTerminal, item]) => {
      item.correct = false; 
      item.error = false;
      item.stepActive = false;
    });
    updatedFollowSets = {};
  }


  const convention = 'Please enter the FollowSet according to the following pattern: <terminal>, <terminal>, ...';
  const startProduction = [grammarObj.nonTerminals.includes('S') ? "S' -> S $" : "S' -> " + grammarObj.nonTerminals[1] + " $"];
  const productionList = [...startProduction, ...grammar.split("\n")];

  return (
    <div className='flex flex-col w-full h-full'>
        {children}
        <div className='flex h-full'>
          <div className='w-1/3'>
              <div className='w-full h-1/2 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll' ref={productionFieldRef}>
                  {grammarObj.productions.map((item, index) => (
                        <p key={item.lhs + item.rhs} ref={productionRef.current[index]}>{item.lhs + " -> " + item.rhs.join(" ")}</p>
                    ))}
              </div>
              <div className='h-1/2 pt-1 overflow-y-scroll '>
              {grammarObj.nonTerminals.slice(1).map((item, index) => (
                <div className='flex my-2 text-left border-2 border-solid rounded-sm border-color'>
                  <p className='w-full px-1 truncate hover:text-clip z-10 hover:overflow-visible'>FIRST ({item}): {[...firstSet.get(item)].join(", ")}</p>
                </div>
              ))}
              </div>
            </div>
          
          <div className='flex flex-col w-2/3'>
            <p>{convention}</p>
            {grammarObj.nonTerminals.map((item, index) => (
              <div className='flex items-center m-2'>
                <p className='w-1/5 px-5 truncate hover:text-clip z-10 hover:overflow-visible'>FOLLOW ({item})</p>
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
            <p ref={firstSetRef}>First Set: </p>
            <p ref={hasChangedRef}></p>
          </div>
        </div>
        <div className='mt-2'>
            <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
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