import React, { useContext, useState, useRef, createRef } from 'react';
import Button from "../components/Button";
import Popup from "../components/Popup";
import { StepperContext } from "../context/StepperContext";
import { StoredContext } from '../context/StoredContext';
import { calculateFirstSet, highlightProduction, removeHighlight, removeHighlightAll } from '../utils/utils';
import { TextField, Tooltip } from '@mui/material';
import '../layout/css/LookUpTable.css';

const stepDesc = [
  { 'key': 0, 'msg': 'Please fill the Lockahead-Table according to the following pattern: <production index>, <production index>, ...' },
  { 'key': 1, 'msg': 'Iterate over all productions and insert into the table the production index for each terminal symbol from the First-Set of the production. If it contains an epsilon, add the index also to the terminals from the Follow-Set of the production.' },
  { 'key': 2, 'msg': 'Iterate over all productions and insert into the table the production index for each terminal symbol from the First-Set of the production. If it contains an epsilon, add the index also to the terminals from the Follow-Set of the production.' },
  { 'key': 3, 'msg': 'Done! The Lookahead-Table have been filled.' },
]

var correctTemp = {};
const timeOut = [];
const modifiedList = [];
const prodTodo = [];
var prodIndex = 0;
var lastLhs = undefined;
const lastTerminal = [];

function check(grammar) {
  grammar.nonTerminals.slice(1).forEach((item, index) => {
    if (correctTemp[item] === undefined) {
      correctTemp[item] = [];
      for (let i = 0; i <= grammar.terminals.filter((sym) => sym !== 'ε').length; i++) {
        correctTemp[item].push({ correct: false, error: false, helpertext: "", stepActive: false });
      }
    }
  });
};

/**
 * Calculates the LL(1) parsing table based on the given grammar, first set, follow set, and index map.
 *
 * @param {Object} grammarObj - The grammar object representing the context-free grammar.
 * @param {Object} firstSet - The calculated first sets for the grammar's symbols.
 * @param {Object} followSet - The calculated follow sets for the grammar's non-terminals.
 * @param {Object} indexMap - The map that associates production indexes with their corresponding symbols.
 * @returns {Object} - The LL(1) parsing table with entries representing production indexes.
 */
const calculateLookUpTable = (grammarObj, firstSet, followSet, indexMap) => {
  // LL(1) parsing table
  const parsingTable = {};

  // Initialize the parsing table with empty entries
  grammarObj.nonTerminals.forEach(nonTerminal => {
    parsingTable[nonTerminal] = {};
  });

  // Calculate parsing table entries based on grammar productions
  grammarObj.productions.forEach(({ lhs, rhs }, index) => {
    calculateStep(lhs, rhs, grammarObj, firstSet, followSet, indexMap, index, parsingTable);
  });

  return parsingTable;
}

/**
 * Calculates the parsing table entries for a given production (lhs -> rhs).
 * @param {string} lhs - The left-hand side non-terminal of the production.
 * @param {string[]} rhs - The right-hand side symbols of the production.
 * @param {object} grammarObj - The object representing the grammar.
 * @param {object} firstSet - The calculated first set for the grammar symbols.
 * @param {object} followSet - The calculated follow set for the grammar symbols.
 * @param {object} indexMap - A mapping of production indexes to the corresponding entries in the parsing table.
 * @param {number} index - The index of the production being processed.
 * @param {object} parsingTable - The LL(1) parsing table being constructed.
 */
const calculateStep = (lhs, rhs, grammarObj, firstSet, followSet, indexMap, index, parsingTable) => {
  // Calculate the first set for the right-hand side of the production
  const firstSetTemp = calculateFirstSet(rhs, grammarObj, firstSet);

  // Add entries to the parsing table based on the calculated first set
  firstSetTemp.forEach(terminal => {
    if (terminal !== '') {
      if (parsingTable[lhs][terminal] === undefined) {
        parsingTable[lhs][terminal] = new Set();

      }
      parsingTable[lhs][terminal].add(indexMap[index]);
    }
  });

  // Check if ε (empty) is in the first set, and if so, add follow set entries
  if (firstSetTemp.has('')) {
    const followSetTemp = followSet[lhs];

    followSetTemp.forEach(terminal => {
      if (parsingTable[lhs][terminal] === undefined) {
        parsingTable[lhs][terminal] = new Set();

      }
      parsingTable[lhs][terminal].add(indexMap[index]);
    });
  }
}

export default function LookUpTable({ children }) {

  const { setActiveStep } = useContext(StepperContext);
  const { grammarObj } = useContext(StoredContext);
  const { firstSet } = useContext(StoredContext);
  const { followSet } = useContext(StoredContext);
  const { parsingTable, setParsingTable } = useContext(StoredContext);

  const [solved, setSolved] = useState(false);
  const [refresh, setRefresh] = useState();
  const [stepState, setStepState] = useState(0);
  const [stepStateRunning, setStepStateRunning] = useState(false);

  const productionRef = useRef(grammarObj.productions.map(() => createRef()));
  const tableRef = useRef(grammarObj.nonTerminals.slice(1).map(() => grammarObj.terminals.map(() => createRef())));
  tableRef.current.forEach(x => x.push(createRef()));
  const tableRefVert = useRef(grammarObj.terminals.map(() => grammarObj.nonTerminals.slice(1).map(() => createRef())));
  tableRefVert.current.push(grammarObj.nonTerminals.slice(1).map(() => createRef()));
  const productionFieldRef = useRef();
  const firstSetRef = useRef();
  const followSetRef = useRef();
  const errorRef = useRef();
  const errorRefLess = useRef();
  const errorRefMuch = useRef();

  const verticalTable = grammarObj.terminals.length >= grammarObj.nonTerminals.length;
  check(grammarObj);

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => {
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  /**
   * Function to handle the "Next" button click
   */
  const handleNext = () => {
    if (handleCheck()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      reset();
      correctTemp = {};
    }
  };

  /**
   * Function to handle the "Back" button click
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    reset();
    correctTemp = {};
  };

  /**
   * Handles the completion of solving the LL(1) parsing table.
   */
  const handleSolved = () => {
    reset();
    const lookUpTable = calculateLookUpTable(grammarObj, firstSet, followSet, indexMap);

    // Populate the input cells of the parsing table with the calculated values
    Object.keys(lookUpTable).slice(1).forEach((nonTerminal, index) => {
      Object.keys(lookUpTable[nonTerminal]).forEach((terminal) => {
        const ind = terminal === '$' ? grammarObj.terminals.filter((sym) => sym !== 'ε').length : grammarObj.terminals.filter((sym) => sym !== 'ε').indexOf(terminal);
        if (verticalTable) {
          tableRefVert.current[ind][index].current.value = [...lookUpTable[nonTerminal][terminal]].join(", ");
        } else {
          tableRef.current[index][ind].current.value = [...lookUpTable[nonTerminal][terminal]].join(", ");
        }
      })
    });

    // Set the parsing table as solved and update the state
    setSolved(true);
    setParsingTable(lookUpTable);
    setStepState(3);
    handleCheck();
  };

  /**
   * Checks the correctness of the user-entered parsing table against the calculated lookup table.
   * Updates the correctness status and error flags for each cell in the parsing table.
   * @returns {boolean} Whether the user-entered parsing table is correct.
   */
  const handleCheck = () => {
    const lookUpTableCheck = {};
    const lookUpTable = calculateLookUpTable(grammarObj, firstSet, followSet, indexMap);
    let solvedCorrect = true;

    // Create an array of terminals with ε filtered out
    const terminalsTemp = grammarObj.terminals.filter((sym) => sym !== 'ε');
    terminalsTemp.push("$");

    let errorMuch = "";
    let errorLess = "";
    let error = "";

    // Iterate through each non-terminal and terminal combination
    grammarObj.nonTerminals.slice(1).forEach((nonTerminal, index) => {
      lookUpTableCheck[nonTerminal] = {};

      terminalsTemp.forEach((terminal) => {
        // Initialize the lookup table check for the current non-terminal and terminal
        if (lookUpTable[nonTerminal][terminal] === undefined) { lookUpTable[nonTerminal][terminal] = new Set() }

        // Determine the index for the terminal
        const ind = terminal === '$' ? grammarObj.terminals.filter((sym) => sym !== 'ε').length : grammarObj.terminals.filter((sym) => sym !== 'ε').indexOf(terminal);

        // Retrieve user-entered values from the parsing table cells
        if (verticalTable) {
          lookUpTableCheck[nonTerminal][terminal] = new Set(tableRefVert.current[ind][index].current.value.split(", ").map((symbol) => symbol.trim()).filter(x => x !== "").map((symbol) => parseInt(symbol)));
        } else {
          lookUpTableCheck[nonTerminal][terminal] = new Set(tableRef.current[index][ind].current.value.split(", ").map((symbol) => symbol.trim()).filter(x => x !== "").map((symbol) => parseInt(symbol)));
        }

        // Find the difference between the calculated lookup table and the user-entered values
        const difference = new Set([...lookUpTableCheck[nonTerminal][terminal]].filter(x => !lookUpTable[nonTerminal][terminal].has(x)));

        // Check correctness
        var correct = false;
        if (lookUpTable[nonTerminal][terminal].size > lookUpTableCheck[nonTerminal][terminal].size) {
          setSolved(false);
          errorLess !== "" && (errorLess = errorLess + ", ");
          errorLess = errorLess + "[[" + nonTerminal + "],[" + terminal + "]]";
          correctTemp[nonTerminal][ind].helpertext = "missing elements";
        } else if (lookUpTable[nonTerminal][terminal].size < lookUpTableCheck[nonTerminal][terminal].size) {
          setSolved(false);
          errorMuch !== "" && (errorMuch = errorMuch + ", ");
          errorMuch = errorMuch + "[[" + nonTerminal + "],[" + terminal + "]]";
          correctTemp[nonTerminal][ind].helpertext = "too many elements";
        } else {
          correct = difference.size === 0;
          if (!correct) {
            error !== "" && (error = error + ", ");
            error = error + "[[" + nonTerminal + "],[" + terminal + "]]";
            correctTemp[nonTerminal][ind].helpertext = "wrong elements";
          }
        }
        correctTemp[nonTerminal][ind].error = !correct;
        correctTemp[nonTerminal][ind].correct = correct;

        if (!correct) {
          solvedCorrect = false;
        }
        setRefresh(!refresh);
      })
    });

    // Update the correctness status and parsing table if solved correctly
    setSolved(solvedCorrect);
    if (solvedCorrect) {
      setParsingTable(lookUpTable);
    } else {
      error !== "" && (errorRef.current.textContent = "Wrong content of field: " + error);
      errorMuch !== "" && (errorRefMuch.current.textContent = "Too many elements: " + errorMuch);
      errorLess !== "" && (errorRefLess.current.textContent = "Too less elements: " + errorLess);
    }
    return solvedCorrect;
  };

  /**
   * Handles the parsing step process, including highlighting productions and updating the parsing table.
   * Manages the different stages of the parsing process.
   */
  const handleStep = () => {
    setStepStateRunning(true);
    removeHighlight(productionRef, modifiedList);
    removeTableHighlight();

    // If there are no more productions to process and it's the first step, move to the next step state
    if (prodTodo.length === 0 && stepState === 1) { setStepState(stepState + 1) };
    followSetRef.current.textContent = "";
    errorRef.current.textContent = "";
    errorRefLess.current.textContent = "";
    errorRefMuch.current.textContent = "";

    switch (stepState) {
      case 0:
        setStepStateRunning(false);
        setStepState(1);
        reset(1);

        // Enqueue all productions for processing
        grammarObj.productions.forEach((prod) => {
          prodTodo.push(prod);
        });
        // Initialize the parsing table with empty entries
        grammarObj.nonTerminals.forEach(nonTerminal => {
          parsingTable[nonTerminal] = {};
        });
        break;

      case 1:
        const { lhs, rhs } = prodTodo.shift();

        // Process production only if it's not the starting symbol "S'"
        if (lhs !== "S'") {
          lastLhs = lhs;
          const index = grammarObj.nonTerminals.slice(1).indexOf(lhs);

          const firstSetTemp = calculateFirstSet(rhs, grammarObj, firstSet);
          firstSetRef.current.textContent = "First Set of Production " + lhs + " -> " + rhs.join(" ") + " : " + [...firstSetTemp].map(x => x === "" ? 'ε' : x).join(", ");

          // Populate the parsing table entries based on the First Set
          firstSetTemp.forEach(terminal => {
            if (terminal !== '') {
              if (parsingTable[lhs][terminal] === undefined) {
                parsingTable[lhs][terminal] = new Set();
              }
              parsingTable[lhs][terminal].add(indexMap[prodIndex]);
            }
          });

          // If ε is in the First Set, consider the Follow Set too
          if (firstSetTemp.has('')) {
            const followSetTemp = followSet[lhs];

            followSetRef.current.textContent = "Follow Set of Production " + lhs + " -> " + rhs.join(" ") + " : " + [...followSetTemp].map(x => x === "" ? 'ε' : x).join(", ");

            // Populate the parsing table entries based on the Follow Set
            followSetTemp.forEach(terminal => {
              if (parsingTable[lhs][terminal] === undefined) {
                parsingTable[lhs][terminal] = new Set();

              }
              parsingTable[lhs][terminal].add(indexMap[index]);
              firstSetTemp.add(terminal);
            });
          }

          // Update the parsing table entries for the current production
          firstSetTemp.forEach(terminal => {
            if (terminal !== '') {
              const ind = terminal === '$' ? grammarObj.terminals.filter((sym) => sym !== 'ε').length : grammarObj.terminals.filter((sym) => sym !== 'ε').indexOf(terminal);

              if (verticalTable) {
                tableRefVert.current[ind][index].current.value = [...parsingTable[lhs][terminal]].join(", ");
              } else {
                tableRef.current[index][ind].current.value = [...parsingTable[lhs][terminal]].join(", ");
              }
              correctTemp[lhs][ind].stepActive = true;
              setRefresh(!refresh);
              lastTerminal.push(terminal);
            }
          })
        }

        // Highlight the current production and add it to the modified list
        highlightProduction(productionRef.current[prodIndex], 0, prodIndex, productionFieldRef, timeOut);
        modifiedList.push(prodIndex);
        prodIndex++;

        if (prodTodo.length === 0) { setStepState(stepState + 1) };
        break;

      case 2:
        handleCheck();
        setStepState(stepState + 1);
        break;
      default:
        reset();
        break;
    }
    setStepStateRunning(false);
  };

  /**
   * Removes highlighting from the parsing table cells associated with the last visited non-terminal and terminals.
   * Clears the stepActive flag from correctTemp.
   */
  const removeTableHighlight = () => {
    lastTerminal.forEach(terminal => {
      // Determine the index for the terminal
      const ind = terminal === '$' ? grammarObj.terminals.filter((sym) => sym !== 'ε').length : grammarObj.terminals.filter((sym) => sym !== 'ε').indexOf(terminal);
      correctTemp[lastLhs][ind].stepActive = false;
    })
    setRefresh(!refresh);
  }

  /**
   * Resets the parsing and visualization state.
   *
   * @param {number} [state=0] - The state to set after reset.
   */
  const reset = (state = 0) => {
    setStepStateRunning(false);
    setStepState(state);

    // Clear highlights and correctness indicators
    removeHighlightAll(productionRef);
    removeTableHighlight();
    grammarObj.nonTerminals.slice(1).forEach((item) => {
      correctTemp[item].map(x => { x.correct = false; x.error = false; x.helpertext = ""; x.stepActive = false; });
    });

    setRefresh(!refresh);
    setSolved(false);

    // Clear parsing table values
    if (parsingTable !== undefined) {
      Object.keys(parsingTable).slice(1).forEach((nonTerminal, index) => {
        Object.keys(parsingTable[nonTerminal]).forEach((terminal) => {
          const ind = terminal === '$' ? grammarObj.terminals.filter((sym) => sym !== 'ε').length : grammarObj.terminals.filter((sym) => sym !== 'ε').indexOf(terminal);
          console.log(verticalTable);
          console.log(tableRefVert);
          console.log(tableRef);
          console.log(ind);
          console.log(index);
          console.log(terminal);
          console.log(grammarObj.terminals);
          console.log(parsingTable);
          if (verticalTable) {
            tableRefVert.current[ind][index].current.value = "";
          } else {
            tableRef.current[index][ind].current.value = "";
          }
        })
      });
    }

    // Clear production-related variables
    prodTodo.length = 0;
    prodIndex = 0;
    lastLhs = undefined;
    lastTerminal.length = 0;

    firstSetRef.current.textContent = "";
    followSetRef.current.textContent = "";
    errorRef.current.textContent = "";
    errorRefLess.current.textContent = "";
    errorRefMuch.current.textContent = "";
  }

  const indexMap = [];

  return (
    <div className='flex flex-col w-full h-full'>
      {children}
      <div className='border-2 border-solid rounded-lg border-color mb-1 p-2 flex justify-center items-center'>
        <p className='whitespace-pre-line w-11/12'>{stepDesc[stepState].msg}</p>
        <div className='w-1/12'>
          <button onClick={openPopup} className='border-2 border-solid text-yellow-200 w-10 h-10 rounded-lg text-xl font-bold'>?</button>
          {isPopupOpen && <Popup onClose={closePopup} title={"Lookahead Table"}
            text={'A lookahead table also known as "LL(1) parsing table," is a data structure used in syntax analysis of context-free grammars, particularly for predictive parsing. It assists in determining the appropriate production rule to apply during the parsing process based on the current nonterminal being expanded and the current input symbol (lookahead).' +
              "\n\n1.\t\tFor each production rule of a nonterminal A:\nFor each terminal symbol 'a' in the FIRST set of A's production rule, add the production rule to the cell corresponding to the row of A and the column of 'a' in the lookahead table.\n" +
              "\n2.\t\tIf ε is in the FIRST set of a nonterminal A, for each terminal symbol 'b' in the FOLLOW set of A, add the production rule to the cell corresponding to the row of A and the column of 'b' in the lookahead table."} />}
        </div>
      </div>
      <div className='flex h-full'>
        <div className='w-1/3'>
          <div className='h-1/3 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll' ref={productionFieldRef}>
            {(() => {
              let rows = [];
              let lastNonTerminal = "";
              let index = -1;
              indexMap.length = 0;
              for (let i = 0; i < grammarObj.productions.length; i++) {
                const item = grammarObj.productions[i];
                index = item.lhs !== lastNonTerminal && lastNonTerminal !== "" ? 0 : index += 1;
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
          <div className='flex items-center justify-center overflow-scroll m-2'>
            <table className='border '>
              {!verticalTable && <thead>
                <tr class="border-b bg-zinc-800">
                  <th className='border-r'>Nonterminal</th>
                  {grammarObj.terminals.filter((sym) => sym !== 'ε').map((item, index) => (
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
                    <td className='nonTerminal-table flex justify-center'><p>{item}</p></td>
                    {grammarObj.terminals.filter((sym) => sym !== 'ε').map((sym, ind) => (
                      <Tooltip title={correctTemp[item][ind].error ? correctTemp[item][ind].helpertext : "[[" + item + "],[" + sym + "]]"}>
                        <td className='border-r border-l'><TextField sx={{
                          "& .MuiOutlinedInput-root:hover": {
                            "& > fieldset": { borderColor: "#fde047", borderWidth: 1 },
                          },
                          "& .MuiOutlinedInput-root.Mui-disabled": {
                            "& > fieldset": correctTemp[item][ind].correct ? { borderColor: "#22c55e", borderWidth: 2 } : { borderColor: "#2f2f2f", borderWidth: 2 },
                          },
                          "& .MuiOutlinedInput-root": {
                            "& > fieldset": correctTemp[item][ind].correct ? { borderColor: "#22c55e", borderWidth: 1 } : correctTemp[item][ind].stepActive ? { borderColor: "#0ea5e9", borderWidth: 1 } : {},
                          },
                        }} inputRef={tableRef.current[index][ind]}
                          error={correctTemp[item][ind].error ? true : false}
                          disabled={correctTemp[item][ind].correct || stepState !== 0}
                        /></td>
                      </Tooltip>
                    ))}
                    <Tooltip title={correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].error ? correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].helpertext : "[[" + item + "],[$]]"}>

                      <td className='border-r border-l'><TextField sx={{
                        "& .MuiOutlinedInput-root:hover": {
                          "& > fieldset": { borderColor: "#fde047", borderWidth: 1 },
                        },
                        "& .MuiOutlinedInput-root.Mui-disabled": {
                          "& > fieldset": correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].correct ? { borderColor: "#22c55e", borderWidth: 2 } : { borderColor: "#2f2f2f", borderWidth: 2 },
                        },
                        "& .MuiOutlinedInput-root": {
                          "& > fieldset": correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].correct ? { borderColor: "#22c55e", borderWidth: 1 } : correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].stepActive ? { borderColor: "#0ea5e9", borderWidth: 1 } : {},
                        },
                      }} inputRef={tableRef.current[index][grammarObj.terminals.filter((sym) => sym !== 'ε').length]}
                        error={correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].error ? true : false}
                        disabled={correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].correct || stepState !== 0}

                      /></td>
                    </Tooltip>

                  </tr>
                ))}
              </tbody>}
              {verticalTable && <tbody>
                {grammarObj.terminals.filter((sym) => sym !== 'ε').map((sym, index) => (
                  <tr class="border-b  ">
                    <td className='nonTerminal-table flex justify-center'><p>{sym}</p></td>
                    {grammarObj.nonTerminals.slice(1).map((item, ind) => (
                      <Tooltip title={correctTemp[item][index].error ? correctTemp[item][index].helpertext : "[[" + item + "],[" + sym + "]]"}>

                        <td className='border-r border-l'><TextField sx={{
                          "& .MuiOutlinedInput-root:hover": {
                            "& > fieldset": { borderColor: "#fde047", borderWidth: 1 },
                          },
                          "& .MuiOutlinedInput-root.Mui-disabled": {
                            "& > fieldset": correctTemp[item][index].correct ? { borderColor: "#22c55e", borderWidth: 2 } : { borderColor: "#2f2f2f", borderWidth: 2 },
                          },
                          "& .MuiOutlinedInput-root": {
                            "& > fieldset": correctTemp[item][index].correct ? { borderColor: "#22c55e", borderWidth: 1 } : correctTemp[item][index].stepActive ? { borderColor: "#0ea5e9", borderWidth: 1 } : {},
                          },
                        }} inputRef={tableRefVert.current[index][ind]}
                          error={correctTemp[item][index].error ? true : false}
                          disabled={correctTemp[item][index].correct || stepState !== 0}
                        /></td>
                      </Tooltip>

                    ))}
                  </tr>
                ))}
                <tr class="border-b  ">
                  <td className='nonTerminal-table flex justify-center'><p>$</p></td>
                  {grammarObj.nonTerminals.slice(1).map((item, ind) => (
                    <Tooltip title={correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].error ? correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].helpertext : "[[" + item + "],[$]]"}>

                      <td className='border-r border-l'><TextField sx={{
                        "& .MuiOutlinedInput-root:hover": {
                          "& > fieldset": { borderColor: "#fde047", borderWidth: 1 },
                        },
                        "& .MuiOutlinedInput-root.Mui-disabled": {
                          "& > fieldset": correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].correct ? { borderColor: "#22c55e", borderWidth: 2 } : { borderColor: "#2f2f2f", borderWidth: 2 },
                        },
                        "& .MuiOutlinedInput-root": {
                          "& > fieldset": correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].correct ? { borderColor: "#22c55e", borderWidth: 1 } : correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].stepActive ? { borderColor: "#0ea5e9", borderWidth: 1 } : {},
                        },
                      }} inputRef={tableRefVert.current[grammarObj.terminals.filter((sym) => sym !== 'ε').length][ind]}
                        error={correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].error ? true : false}
                        disabled={correctTemp[item][grammarObj.terminals.filter((sym) => sym !== 'ε').length].correct || stepState !== 0}
                      /></td>
                    </Tooltip>

                  ))}
                </tr>
              </tbody>}
            </table>

          </div>
          <p ref={firstSetRef}></p>
          <p ref={followSetRef} className='mb-2'></p>
          <p ref={errorRefLess} className='text-red-500 mb-2'></p>
          <p ref={errorRefMuch} className='text-red-500 mb-2'></p>
          <p ref={errorRef} className='text-red-500'></p>
        </div>
      </div>
      <div className='mt-2'>
        <Button onClick={handleBack}>
          Back
        </Button>
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleStep} disabled={stepStateRunning}>
          {stepState !== 3 ? (stepState === 0 ? 'Start  Step-by-Step' : (stepStateRunning ? 'Running...' : 'Next Step')) : 'Restart'}
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