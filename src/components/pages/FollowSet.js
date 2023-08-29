import React, { useContext, useState, useRef, createRef } from 'react';
import Button from "../components/Button";
import { TextField } from '@mui/material';
import { StepperContext } from "../context/StepperContext";
import { StoredContext } from "../context/StoredContext";
import { highlightProduction, stopSteps, resetCorrectTemp, removeHighlight, removeHighlightAll, stopTimeout, calculateFirstSet } from '../utils/utils';

const stepDesc = [
  { 'key': 0, 'msg': 'Please enter the FollowSet according to the following pattern: <terminal>, <terminal>, ...' },
  { 'key': 1, 'msg': 'Add $ to FOLLOW(S), where S is the start nonterminal.' },
  {
    'key': 2, 'msg': 'Iterate over the productions and add the symbols according to the following rules:\n\n' +
      '1. If there is a production A → αBβ, then add every token that is in FIRST(β) to FOLLOW(B). (Do not add ε to FOLLOW(B)\n' +
      '2. If there is a production A → αB, then add all members of FOLLOW(A) to FOLLOW(B).\n' +
      '3. If there is a production A → αBβ where FIRST(β) contains ε, then add all members of FOLLOW(A) to FOLLOW(B).\n\n' +
      'Repeat this step until no more new symbols have been added to a follow set.'
  },
  { 'key': 3, 'msg': 'Done! All FollowSets have been specified.' },
]

var correctTemp = {};

const timeOut = [];
const modifiedList = [];

const initialFollowSets = {};
let updatedFollowSets = {};
let hasChanged = true;

function check(grammar) {
  grammar.nonTerminals.map((item) => {
    if (correctTemp[item] === undefined) {
      correctTemp[item] = { correct: false, error: false, helpertext: "wrong elements", stepActive: false }
    };
  });
};

/**
 * Initializes the initial follow sets for each nonterminal and performs Step 0 of the algorithm.
 * 
 * @param {Object} initialFollowSets - The initial follow sets object.
 * @param {Object} grammarObj - The grammar object containing grammar details.
 * @returns {void}
 */
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

/**
 * Performs Step 1 of the follow set calculation algorithm.
 * 
 * @param {Object} grammarObj - The grammar object containing grammar details.
 * @param {Object} firstSet - The first set for the grammar symbols.
 * @returns {void}
 */
const Step1 = (grammarObj, firstSet) => {
  hasChanged = false;

  // Step 1: For each production A -> αBβ, add every token in FIRST(β) to FOLLOW(B)
  grammarObj.productions.forEach(({ lhs, rhs }) => {
    for (let i = 0; i < rhs.length; i++) {
      const token = rhs[i];

      if (grammarObj.nonTerminals.includes(token)) {
        const restOfTokens = rhs.slice(i + 1);

        // If there are more tokens after B
        if (restOfTokens.length > 0) {
          const firstSetOfRest = calculateFirstSet(restOfTokens, grammarObj, firstSet);
          const followSetOfB = updatedFollowSets[token];

          const originalFollowSetSize = followSetOfB.size;
          [...firstSetOfRest].filter((symbol) => { return symbol !== '' }).forEach(terminal => followSetOfB.add(terminal));

          if (followSetOfB.size > originalFollowSetSize) {
            updatedFollowSets[token] = followSetOfB;
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
            hasChanged = true;
          }
        }
      }
    }
  });
}

/**
 * Calculates the follow sets using the follow set calculation algorithm.
 * 
 * @param {Object} grammarObj - The grammar object containing grammar details.
 * @param {Object} firstSet - The first set for the grammar symbols.
 * @returns {Object} The calculated follow sets.
 */
const calculateFollowSets = (grammarObj, firstSet) => {
  Step0(initialFollowSets, grammarObj);

  // Perform Step 1 repeatedly until no changes are observed
  while (hasChanged) {
    Step1(grammarObj, firstSet);
  }
  return updatedFollowSets;
};

export default function FollowSet({ children }) {

  const { setActiveStep } = useContext(StepperContext);
  const { grammarObj } = useContext(StoredContext);
  const { firstSet } = useContext(StoredContext);
  const { setFollowSet } = useContext(StoredContext);

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

  /**
   * Function to handle the "Next" button click
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
    correctTemp = {};
    stopTimeout(timeOut);
  };

  /**
  * Handles the checking of follow sets and updates the UI based on the results.
  */
  const handleCheck = () => {
    const followSetCheck = new Map();
    const followSet = calculateFollowSets(grammarObj, firstSet);
    // Initialize a variable to track whether all follow sets are correct
    var solvedCorrect = true;
    
    // Iterate over each non-terminal symbol in the grammar
    grammarObj.nonTerminals.forEach((nonTerminal, index) => {
      // Parse user input for follow set into an array and filter out empty strings
      followSetCheck.set(nonTerminal, elementsRef.current[index].current.value.split(", ").map((symbol) => symbol.trim()).filter(x => x !== ""));
      
      if (followSet[nonTerminal] !== undefined) {
        const difference = new Set([...followSet[nonTerminal]].filter(x => !followSetCheck.get(nonTerminal).includes(x)));
        var correct = false;

        // Check if the sizes of follow sets match
        if (followSet[nonTerminal].size > followSetCheck.get(nonTerminal).length) {
          correctTemp[nonTerminal].helpertext = "too few elements";
          setSolved(false);
        } else if (followSet[nonTerminal].size < followSetCheck.get(nonTerminal).length) {
          correctTemp[nonTerminal].helpertext = "too many elements";
          setSolved(false);
        } else {
          // Check if the calculated and user-provided follow sets match
          correct = difference.size === 0;
        }

        correctTemp[nonTerminal].error = !correct;
        correctTemp[nonTerminal].correct = correct;
        if (!correct) {
          solvedCorrect = false;
        }
        setRefresh(!refresh);
      }
    });

    // Set the overall solved status and update the follow sets if correct
    setSolved(solvedCorrect);
    if (solvedCorrect) {
      setFollowSet(followSet);
    }
  }

  /**
 * Handles the solved state by toggling it and updating follow sets.
 */
  const handleSolved = () => {
    
    setSolved((current) => !current);
    const followSet = calculateFollowSets(grammarObj, firstSet);

    // Update UI elements and correctTemp based on follow sets
    grammarObj.nonTerminals.forEach((nonTerminal, index) => {
      if (followSet[nonTerminal] !== undefined) {
        elementsRef.current[index].current.value = [...followSet[nonTerminal]].join(', ');
        correctTemp[nonTerminal].correct = true;
        correctTemp[nonTerminal].error = false;
      }
    });

    setFollowSet(followSet);

    // Update step state and UI elements
    setStepState(3);
    removeHighlightAll(productionRef);
    hasChangedRef.current.textContent = "";
    firstSetRef.current.textContent = "";
    
    // Stop any ongoing timeouts
    stopTimeout(timeOut);
  }

  /**
  * Handles the step-by-step execution of the follow set calculation algorithm.
  */
  const handleStep = () => {
    // Time delay for each step in milliseconds
    const timeOutSec = 2000;

    setStepStateRunning(true);

    // Initialize variables for step handling
    if (stepState === 0 || !hasChanged) { setStepState(stepState + 1) };
    var counter = 0;
    stopSteps(productionRef, modifiedList, timeOut);
    resetCorrectTemp(correctTemp);
    hasChangedRef.current.textContent = "";

    // Handle each step based on the current step state
    switch (stepState) {
      case 0:
        setStepStateRunning(false);
        setStepState(1);
        break;
      case 1:
        Step0(initialFollowSets, grammarObj);
        counter++;

        timeOut.push(setTimeout(() => {
          const index = grammarObj.productions.length - 1;
          //set value of textfield of Follow(S')
          elementsRef.current[0].current.value = [...updatedFollowSets["S'"]].join(', ');
          correctTemp["S'"].stepActive = true;
          setRefreshRow(1);
          highlightProduction(productionRef.current[index], 0, index, productionFieldRef, timeOut);
          modifiedList.push(index);
          timeOut.push(setTimeout(() => { removeHighlight(productionRef, modifiedList); correctTemp["S'"].stepActive = false; setRefreshRow(0); setStepStateRunning(false); setStepState(2); }, 1000));
        }, counter * timeOutSec));

        break;
      case 2:
        counter++;
        hasChanged = false;

        // Loop through all productions in the grammar
        // Step 1: For each production A -> αBβ, add every token in FIRST(β) to FOLLOW(B)
        grammarObj.productions.forEach(({ lhs, rhs }, index) => {
          // Loop through all tokens of the production
          for (let i = 0; i < rhs.length; i++) {
            timeOut.push(setTimeout(() => {
              const token = rhs[i];
              highlightProduction(productionRef.current[index], 0, index, productionFieldRef, timeOut);
              modifiedList.push(index);
              timeOut.push(setTimeout(() => { removeHighlight(productionRef, modifiedList); }, timeOutSec * 0.9));

              if (grammarObj.nonTerminals.includes(token)) {
                const restOfTokens = rhs.slice(i + 1);

                // If there are more tokens after B
                if (restOfTokens.length > 0) {
                  const firstSetOfRest = calculateFirstSet(restOfTokens, grammarObj, firstSet);
                  const followSetOfB = updatedFollowSets[token];

                  firstSetRef.current.textContent = "First Set of " + restOfTokens.join(" ") + " : { " + [...firstSetOfRest].join(", ") + " }";

                  //add all tokens, except empty string
                  const originalFollowSetSize = followSetOfB.size;
                  [...firstSetOfRest].filter((symbol) => { return symbol !== '' }).forEach(terminal => followSetOfB.add(terminal));

                  //update follow set
                  if (followSetOfB.size > originalFollowSetSize) {
                    updatedFollowSets[token] = followSetOfB;
                    hasChanged = true;
                    elementsRef.current[grammarObj.nonTerminals.indexOf(token)].current.value = [...followSetOfB].join(', ');
                    correctTemp[token].stepActive = true;
                    timeOut.push(setTimeout(() => { correctTemp[token].stepActive = false; setRefreshRow(index - 1); }, timeOutSec));
                    setRefreshRow(index);
                  }
                }

                // If B is the last token or β contains ε (empty)
                if (i === rhs.length - 1 || calculateFirstSet(rhs.slice(i + 1), grammarObj, firstSet).has('')) {

                  const followSetOfA = updatedFollowSets[lhs];
                  const followSetOfB = updatedFollowSets[token];

                  firstSetRef.current.textContent = "Follow Set of " + lhs + " : { " + [...followSetOfA].join(", ") + " }";

                  const originalFollowSetSize = followSetOfB.size;
                  followSetOfA.forEach(terminal => followSetOfB.add(terminal));

                  if (followSetOfB.size > originalFollowSetSize) {
                    updatedFollowSets[token] = followSetOfB;
                    hasChanged = true;
                    elementsRef.current[grammarObj.nonTerminals.indexOf(token)].current.value = [...followSetOfB].join(', ');
                    correctTemp[token].stepActive = true;
                    timeOut.push(setTimeout(() => { correctTemp[token].stepActive = false; setRefreshRow(index - 1); }, timeOutSec));
                    setRefreshRow(index * -1);
                  }
                }
              } else {
                firstSetRef.current.textContent = "Token skipped: " + token;
              }
            }, counter * timeOutSec));
            counter++;
          }
        });

        //check if follow set has changed
        timeOut.push(setTimeout(() => {
          hasChangedRef.current.textContent = "Follow-Set has changed: " + hasChanged;
          if (!hasChanged) {
            timeOut.push(setTimeout(() => {
              handleCheck();
              setStepState(stepState + 1);
            }, timeOutSec));
          }
        }, counter * timeOutSec));

        timeOut.push(setTimeout(() => { setStepStateRunning(false); }, counter * timeOutSec));
        break;
      default:
        reset();
        break;
    }
  }

    /**
   * The `reset` function resets the state and visual appearance of the application.
   * It clears the input of the textfields.
   */
  const reset = () => {
    setStepStateRunning(false);
    setStepState(0);
    setSolved(false);
    elementsRef.current.forEach((textInput) => textInput.current.value = "");
    Object.entries(correctTemp).forEach(([nonTerminal, item]) => {
      item.correct = false;
      item.error = false;
      item.stepActive = false;
    });
    updatedFollowSets = {};
    firstSetRef.current.textContent = "";
    hasChangedRef.current.textContent = "";
  }

  return (
    <div className='flex flex-col w-full h-full'>
      {children}
      <div className='border-2 border-solid rounded-lg border-color mb-1 p-2'>
        <p className='whitespace-pre-line'>{stepDesc[stepState].msg}</p>
      </div>
      <div className='flex h-full'>
        <div className='w-1/3'>
          <div className='w-full h-1/2 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll' ref={productionFieldRef}>
            {grammarObj.productions.map((item, index) => (
              <p key={item.lhs + item.rhs} ref={productionRef.current[index]}>{
                item.lhs === "S'" ? item.lhs + " -> " + item.rhs[0] : item.lhs + " -> " + item.rhs.join(" ")}</p>
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
          {grammarObj.nonTerminals.map((item, index) => (
            <div className='flex items-center m-2'>
              <p className='w-1/5 px-5 truncate hover:text-clip z-10 hover:overflow-visible'>FOLLOW ({item})</p>
              <TextField inputRef={elementsRef.current[index]} key={item} className='w-4/5'
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& > fieldset": correctTemp[item].correct ? { borderColor: "#22c55e", borderWidth: 2 } : correctTemp[item].stepActive ? { borderColor: "#0ea5e9", borderWidth: 2 } : { borderColor: "#2f2f2f", borderWidth: 2 },
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
          <p ref={firstSetRef}></p>
          <p ref={hasChangedRef}></p>
        </div>
      </div>
      <div className='mt-2'>
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
          Back
        </Button>
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleStep} disabled={stepStateRunning}>
          {stepState !== 3 ? (stepStateRunning ? 'Running...' : stepState === 0 ? 'Start Step-by-Step' : 'Next Step') : 'Restart'}
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