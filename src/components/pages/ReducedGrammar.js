import React, { useContext, useState, useRef, createRef, useEffect } from 'react';
import Button from "../components/Button";
import { StepperContext } from "../context/StepperContext";
import { StoredContext } from '../context/StoredContext';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const stepDesc = ['Your grammar does not include non-productive and non-reachable productions. You can continue with the next step.',
  'Your grammar contains non-productive and/or non-reachable productions (marked productions). You can go back and edit the grammar or continue. When you continue, these productions are removed from the grammar.',
]
var nonReachable = undefined;
var nonProductive = undefined;
var firstProduction = false;


/**
 * @param grammar - The `grammar` parameter is an object that represents a context-free grammar. 
 * @returns The function `findReachableSymbols` returns a `Set` containing all the reachable symbols in
 * the given grammar.
 */
const findReachableSymbols = (grammar) => {
  const nonTerminals = grammar.nonTerminals;
  const reachable = new Set([grammar.startSymbol]);

  while (true) {
    const symbolsAdded = new Set();

    for (const symbol of reachable) {
      const productions = grammar.productions.filter(x => {
        return x.lhs === symbol;
      });

      for (const production of productions) {
        for (const char of production.rhs) {
          if (nonTerminals.includes(char) && !reachable.has(char)) {
            symbolsAdded.add(char);
          }
        }
      }
    }

    if (symbolsAdded.size === 0) {
      break;
    }

    symbolsAdded.forEach((symbol) => reachable.add(symbol));
  }

  return reachable;
}

/**
 * @param grammar - The `grammar` parameter is an object that represents a context-free grammar. 
 * @returns The function `findNonReachableSymbols` returns an array of non-terminal symbols that are
 * not reachable in the given grammar.
 */
const findNonReachableSymbols = (grammar) => {
  const nonReachable = grammar.nonTerminals;
  const reachable = findReachableSymbols(grammar);

  return nonReachable.filter(sym => !reachable.has(sym));
}

const nonProductiveProductions = new Set();
const productiveProductions = new Set();

/**
 * @param grammar - The `grammar` parameter is an object that represents a context-free grammar. 
 * @returns the set of productive productions.
 */
function getProductiveProductions(grammar) {
  nonProductiveProductions.clear();
  productiveProductions.clear();

  const productiveSymbols = new Set();
  var newProductiveFound = true;

  grammar.productions.slice(0, -1).forEach(prod => nonProductiveProductions.add(prod));

  while (newProductiveFound) {
    newProductiveFound = false;
    nonProductiveProductions.forEach(prod => {
      const { lhs, rhs } = prod;
      var productive = true;
      rhs.forEach(symbol => {
        if (!grammar.terminals.includes(symbol) && !productiveSymbols.has(symbol)) {
          productive = false;
        }
      })
      if (productive) {
        productiveSymbols.add(lhs);
        productiveProductions.add(prod);
        nonProductiveProductions.delete(prod);
        newProductiveFound = true;
      }
    });
  }

  return productiveProductions;
}

/**
 * The function "getNonProductiveProductions" returns a set of non-productive productions given a grammar.
 * @param grammar - The parameter "grammar" represents a context-free grammar
 * @returns the non-productive productions from the given grammar.
 */
function getNonProductiveProductions(grammar) {
  nonProductiveProductions.clear();
  productiveProductions.clear();

  getProductiveProductions(grammar);

  return nonProductiveProductions;
}


export default function ReducedGrammar({ children, className, containerClassName, ...props }) {

  const { activeStep, setActiveStep } = useContext(StepperContext);
  const { grammarObj } = useContext(StoredContext);

  const [solved, setSolved] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const productionRef = useRef(grammarObj.productions.slice(0, -1).map(() => createRef()));
  const textRef = useRef();
  const iconRef = useRef();
  const warningRef = useRef();

  /**
 * Handles the click event for the "Next" button, incrementing the activeStep if the firstProduction is true.
 */
  const handleNext = () => {
    setActiveStep(activeStep + 1);
    firstProduction = false;
  };

  /**
* Handles the click event for the "Back" button, decrementing the activeStep if the firstProduction is false.
*/
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    firstProduction = false;
  };


  /**
   * Handles the click event for the "Remove" button, removing non-reachable and non-productive productions from the grammar.
   */
  const handleRemove = () => {
    iconRef.current.style.transition = "transform 1.0s";
    iconRef.current.style.transformStyle = "preserve-3d";
    setRefresh(true);

    
    /* The code is filtering the `grammarObj.productions` array to remove non-reachable and
    non-productive productions from the grammar. */
    grammarObj.productions = grammarObj.productions.filter(prod => {
      if (nonReachable.includes(prod.lhs)) {
        return false;
      } else if (nonProductive.has(prod)) {
        return false;
      } else {
        if (prod.lhs === grammarObj.firstSymbol) {
          firstProduction = true;
        }
        return true;
      }
    })

    if (!firstProduction) {
      warningRef.current.classList.remove('invisible');
    }

    //update grammarObj
    grammarObj.nonTerminals = ["S'"];
    grammarObj.productions.forEach(({ lhs, rhs }) => {
      if (!grammarObj.nonTerminals.includes(lhs)) {
        grammarObj.nonTerminals.push(lhs);
      }
    });

    grammarObj.terminals.length = 0;
    grammarObj.productions.forEach(({ lhs, rhs }) => {
      rhs.forEach(symbol => {
        if (!grammarObj.nonTerminals.includes(symbol) && !grammarObj.terminals.includes(symbol) && symbol !== '$') {
          grammarObj.terminals.push(symbol);
        }
      })
    })
  }

/* The `useEffect` hook is used to rotate the icon. */
  useEffect(() => {
    if (refresh) {
      iconRef.current.style.transform = "rotateY(180deg)";
      setTimeout(() => { setSolved(true); iconRef.current.style.transform = "rotateY(0deg)"; }, 500)
    }
  }, [refresh]);

/* The `useEffect` hook is used to update the styling of the productions based on whether they are non-productive or non-reachable. */
  useEffect(() => {
    nonReachable = findNonReachableSymbols(grammarObj);
    nonProductive = getNonProductiveProductions(grammarObj);

    nonProductive.forEach(prod => {
      productionRef.current[[...grammarObj.productions].indexOf(prod)].current.classList.add("text-sky-500", "font-bold");
    })

    grammarObj.productions.forEach((prod, index) => {
      if (nonReachable.includes(prod.lhs)) {
        productionRef.current[index].current.classList.add("text-sky-500", "font-bold");
      }
    })

    if (nonReachable.length === 0 && nonProductive.size === 0) {
      setSolved(true);
      firstProduction = true;
      textRef.current.textContent = stepDesc[0];
    } else {
      textRef.current.textContent = stepDesc[1];
    }
  }, [productionRef]);

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='flex h-full'>
        <div className='w-1/3 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll'>
          {grammarObj.productions.slice(0, -1).map((item, index) => (
            <p key={item.lhs + item.rhs} ref={productionRef.current[index]}>{item.lhs + " -> " + item.rhs.join(" ")}</p>
          ))}
        </div>
        <div className='w-2/3 border-2 border-solid rounded-lg border-color ml-2 p-2 h-full grid items-center'>
          <div className='mb-1 p-2 flex items-center flex-col' >
            <div className='h-1/5 w-1/5' ref={iconRef}>
              {solved ? <FontAwesomeIcon className='w-full h-full' icon={faCheckCircle} color='#22c55e' />
                : <FontAwesomeIcon className='w-full h-full' icon={faTimesCircle} color='#ef4444' />}
            </div>
            <p ref={textRef} className='whitespace-pre-line font-bold w-3/5 m-5'></p>
            <p ref={warningRef} className='whitespace-pre-line font-bold w-3/5 m-5 text-red-500 invisible'>All Productions of your start symbol were removed. Please check your grammar or use a different one.</p>
          </div>
        </div>
      </div>
      <div>
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
          Back
        </Button>
        {solved ? <Button onClick={handleNext} className={!firstProduction && "opacity-50"} variant="contained" sx={{ mt: 3, ml: 1 }} disabled={!firstProduction}>Next</Button>
          : <Button onClick={handleRemove}>Remove</Button>}
      </div>
    </div>
  )
}