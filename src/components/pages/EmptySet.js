import React, { useContext, useState, useRef, createRef } from 'react';
import Button from "../components/Button";
import Popup from '../components/Popup';
import { StepperContext } from "../context/StepperContext";
import { StoredContext } from '../context/StoredContext';
import NullableTable from '../components/NullableTable';
import { highlightProduction, highlightCheckbox, stopSteps, highlightOpacity, removeHighlightOpacity } from '../utils/utils';

const stepDesc = [
    { 'key': 0, 'msg': 'Please check the boxes if the nonterminal is empty.' },
    { 'key': 1, 'msg': 'For each production rule in your grammar, check if the right-hand side of the rule consists solely of epsilon. If it does, add the left-hand side nonterminal to the Empty-Set.' },
    { 'key': 2, 'msg': 'Repeat the following step until no new empty nonterminals are found:\nFor each production rule in your grammar where the right side consists only of nonterminals, check if all the nonterminals on the right-hand side are already in the Empty-Set. If they are, add the left-hand side nonterminal to the Empty-Set.' },
    { 'key': 3, 'msg': 'Done! No new empty attributes are found, the Empty-Set contains all the empty nonterminals in your grammar.' },
]
const modifiedList = [];
const timeOut = [];
let newNullableNonterminalsFound = false;

/**
 * The `getEmptyProduction` function finds and returns the indices of productions that have an empty right-hand side ('ε').
 * @param {object} grammarObj - The `grammarObj` parameter is an object that represents a grammar.
 * @param {Set} nullableSet - The `nullableSet` parameter is a Set that stores the nullable non-terminal symbols.
 * @returns {Array} - An array containing the indices of productions with an empty right-hand side and updates the `nullableSet` with the nullable non-terminal symbols found.
 */
const getEmptyProduction = (grammarObj, nullableSet = new Set()) => {
    const emptyProductions = [];
    grammarObj.productions.forEach((item, index) => {
        if (item.rhs[0] === 'ε') {
            emptyProductions.push(index);
            nullableSet.add(grammarObj.productions[index].lhs);
        }
    });
    return emptyProductions;
}

/**
 * The `findEmptyProduction` function finds new nullable non-terminal symbols in the grammar by checking if their productions consist of only nullable non-terminals.
 * @param {Set} nullableSet - The `nullableSet` parameter is a Set that stores the nullable non-terminal symbols.
 * @param {object} grammarObj - The `grammarObj` parameter is an object that represents a grammar.
 * @param {boolean} newNullableNonterminalsFound - The `newNullableNonterminalsFound` parameter is a boolean flag to track if new nullable non-terminal symbols are found during the iteration.
 * @returns {boolean} - Returns true if new nullable non-terminal symbols are found, and false otherwise.
 */
const findEmptyProduction = (nullableSet, grammarObj, newNullableNonterminalsFound = false) => {
    grammarObj.productions.forEach(({ lhs, rhs }) => {
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

/**
 * The `calculateNullable` function calculates the nullable non-terminals in the given grammar.
 * @param {object} grammarObj - The `grammarObj` parameter is an object that represents a grammar.
 * @param {Set} nullableSet - The `nullableSet` parameter is a Set that stores the nullable non-terminal symbols.
 * @returns {Set} - A Set containing the nullable non-terminal symbols found in the grammar.
 */
const calculateNullable = (grammarObj, nullableSet) => {
    let newNonterminalsFound = true
    getEmptyProduction(grammarObj, nullableSet);
    while (newNonterminalsFound) {
        newNonterminalsFound = findEmptyProduction(nullableSet, grammarObj);
    }
    return nullableSet;
}

/**
 * The `iterateProductions` function iterates over the productions of the grammar and checks if there are any new nullable non-terminals.
 * @param {object} grammarObj - The `grammarObj` parameter is an object that represents a grammar.
 * @param {Array} productionRef - The `productionRef` parameter is an array of React refs used to access the DOM elements of the productions.
 * @param {Array} checkBoxRef - The `checkBoxRef` parameter is an array of React refs used to access the DOM elements of the checkboxes.
 * @param {Set} nullableSet - The `nullableSet` parameter is a Set that stores the nullable non-terminal symbols.
 * @returns {number} - The counter representing the number of iterations performed during the check for nullable non-terminals.
 */
function iterateProductions(grammarObj, productionRef, checkBoxRef, nullableSet) {
    let counter = 1;
    newNullableNonterminalsFound = false;

    grammarObj.productions.slice(0, -1).forEach(({ lhs, rhs }, index) => {
        const consistOfNonterminal = rhs.every((symbol) =>
            grammarObj.terminals.includes(symbol) ? false : true
        );

        if (consistOfNonterminal) {
            if (!nullableSet.has(lhs)) {
                const isNullable = rhs.every((symbol) => {
                    return nullableSet.has(symbol);
                });
                //highlight production and checkbox
                if (isNullable) {
                    nullableSet.add(lhs);
                    newNullableNonterminalsFound = true;
                    highlightProduction(productionRef.current[index], counter, index, undefined, timeOut, "text-green-500");
                    highlightCheckbox(checkBoxRef.current[grammarObj.nonTerminals.indexOf(lhs) - 1], counter, timeOut);
                }
                highlightProduction(productionRef.current[index], counter, index, undefined, timeOut);
                counter++;
                modifiedList.push(index);
            }
        }
    });
    return counter;
}

export default function EmptySet() {

    const { setActiveStep } = useContext(StepperContext);
    const { grammarObj } = useContext(StoredContext);
    const { nullableSet, setNullableSet } = useContext(StoredContext);
    const { setActiveRow } = useContext(StoredContext);

    const [stepState, setStepState] = useState(0);
    const [solved, setSolved] = useState(false);
    const [refresh, setRefresh] = useState();
    const [stepStateRunning, setStepStateRunning] = useState(false);

    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const checkBoxRef = useRef(grammarObj.nonTerminals.slice(1).map(() => createRef()));
    const productionRef = useRef(grammarObj.productions.slice(0, -1).map(() => createRef()));
    const textRef = useRef();

    const openPopup = () => {
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
    };

    /**
     * The function `handleNext` updates various state variables and flags to move to the next step in a
     * process.
     */
    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setNullableSet(nullableSet);
        setStepStateRunning(false);
        setActiveRow(grammarObj.nonTerminals.slice(1).map(() => false));
    };

    /**
     * The function `handleBack` decreases the active step and resetting variables.
     */
    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        nullableSet.clear();
        setStepStateRunning(false);
        newNullableNonterminalsFound = false;
    };

    /**
   * The `handleCheck` function checks whether the user-selected nullable non-terminals match the actual nullable non-terminals,
   * and updates the visual appearance of the checkboxes. 
   */
    const handleCheck = () => {
        const nullableSetChecked = new Set();

        // Calculate the actual nullable non-terminals using the `calculateNullable` function.
        const nullableSet = calculateNullable(grammarObj, nullableSetChecked);

        let solvedCorrect = true;

        grammarObj.nonTerminals.slice(1).forEach((symbol, index) => {
            if ((nullableSet.has(symbol) && checkBoxRef.current[index].current.checked) || (!nullableSet.has(symbol) && !checkBoxRef.current[index].current.checked)) {
                // If the selection is correct, update the visual appearance of the checkbox to show a green border.
                checkBoxRef.current[index].current.classList.add("accent-green-500", "border-green-500");
                checkBoxRef.current[index].current.classList.remove("accent-yellow-200");
            } else {
                // If the selection is incorrect, update the visual appearance of the checkbox to show a red border and set solvedCorrect to false.
                checkBoxRef.current[index].current.classList.add("accent-red-500", "border-red-500");
                checkBoxRef.current[index].current.classList.remove("accent-yellow-200");
                solvedCorrect = false;
            }
        });

        setSolved(solvedCorrect);

        if (solvedCorrect) {
            setStepState(stepDesc.length - 1);
            setNullableSet(nullableSet);
        }
    };

    /**
   * The `handleStep` function handles the steps of grammar processing based on the current `stepState`.
   * It updates the state, performs grammar processing, and highlights productions and checkboxes
   * accordingly.
   */
    const handleStep = () => {
        // Set stepStateRunning to true to start the grammar processing.
        setStepStateRunning(true);

        // Stop any running steps, clear modifiedList and timeOut.
        stopSteps(productionRef, modifiedList, timeOut);

        highlightOpacity(grammarObj, productionRef, nullableSet);

        switch (stepState) {
            case 0:
                // Step 0: Update state for the next step.
                setStepStateRunning(false);
                setStepState(1);
                break;

            case 1:
                // Step 1: Find and highlight empty productions and update state.
                let counter = 1;
                const emptyProduction = getEmptyProduction(grammarObj, nullableSet);
                emptyProduction.forEach((index) => {
                    highlightProduction(productionRef.current[index], counter, index, undefined, timeOut, "text-green-500");
                    modifiedList.push(index);
                    counter++;
                });

                if (emptyProduction.length >= 1) {
                    newNullableNonterminalsFound = true;
                }

                // Highlight checkboxes for nullable non-terminals.
                counter = 1;
                nullableSet.forEach((item) => {
                    highlightCheckbox(checkBoxRef.current[grammarObj.nonTerminals.indexOf(item) - 1], counter, timeOut);
                    counter++;
                });

                // Set a timeout to update the state after highlighting productions and checkboxes.
                timeOut.push(
                    setTimeout(() => {
                        setStepStateRunning(false);
                        setRefresh(!refresh);
                        setStepState(2);
                    }, counter * 1000)
                );
                break;

            case 2:
                // Step 2: Iterate productions and update state accordingly.
                if (newNullableNonterminalsFound) {
                    const highestIndex = iterateProductions(grammarObj, productionRef, checkBoxRef, nullableSet);
                    timeOut.push(
                        setTimeout(() => {
                            setStepStateRunning(false);
                        }, highestIndex * 1000)
                    );
                }

                // If there are no more new nullable non-terminals move to Step 3.
                if (!(stepState <= 2 && newNullableNonterminalsFound)) {
                    setStepState(3);
                    handleCheck();
                }
                break;

            case 3:
                // Step 3: Reset the state and visual appearance of the application.
                reset();
                return;
        }

        textRef.current.innerText = stepDesc[stepState].msg;
    };

    /**
     * The `handleSolved` function is a callback function that handles the completion of the current step.
     */
    const handleSolved = () => {
        setStepStateRunning(false);
        stopSteps(productionRef, modifiedList, timeOut);
        setSolved((current) => !current);

        // Calculate the nullable set of non-terminals
        const nullableSetChecked = new Set();
        const nullableSet = calculateNullable(grammarObj, nullableSetChecked);

        // Update the checkboxes and their styles based on nullable non-terminals
        grammarObj.nonTerminals.slice(1).forEach((item, index) => {
            if (nullableSet.has(item)) {
                checkBoxRef.current[index].current.checked = true;
            } else {
                checkBoxRef.current[index].current.checked = false;
            }
            checkBoxRef.current[index].current.classList.add("accent-green-500", "border-green-500");
            checkBoxRef.current[index].current.classList.remove("accent-yellow-200", "accent-red-500", "border-red-500");
        });

        // Set the state to the last step and update the nullable set
        setStepState(stepDesc.length - 1);
        setNullableSet(nullableSet);
        handleCheck();
    };

    /**
   * The `checkedChange` function updates the checkbox's visual style based on its checked state and highlights or removes opacity
   * from productions based on the corresponding nullable set.
   * @param {Event} event - The `event` parameter contains information about the event.
   */
    const checkedChange = (event) => {
        event.target.classList.remove("accent-red-500", "border-red-500", "accent-green-500", "border-green-500");
        event.target.classList.add("accent-yellow-200");

        if (event.target.checked) {
            highlightOpacity(grammarObj, productionRef, new Set(event.target.accessKey));
        } else {
            removeHighlightOpacity(grammarObj, productionRef, new Set(event.target.accessKey));
        }
    };

    /**
   * The `reset` function resets the state and visual appearance of the application related to the
   * grammar processing. It clears the nullable set, resets the step state, and updates the appearance
   * of checkboxes and productions to their initial states.
   */
    const reset = () => {
        setStepStateRunning(false);
        setStepState(0);
        setSolved(false);

        // Clear the nullable set to remove previously calculated nullable non-terminals.
        nullableSet.clear();

        // Reset the visual appearance of productions.
        productionRef.current.forEach((item) => {
            item.current.classList.remove("text-sky-500", "font-bold", "opacity-50");
        });

        // Reset the visual appearance of checkboxes.
        checkBoxRef.current.forEach((item) => {
            item.current.checked = false;
            item.current.classList.remove("accent-red-500", "border-red-500", "accent-green-500", "border-green-500");
            item.current.classList.add("accent-yellow-200");
        });
    };

    return (
        <div className='flex flex-col w-full h-full'>
            <div className='border-2 border-solid rounded-lg border-color mb-1 p-2 flex justify-center items-center'>
                <p ref={textRef} className='whitespace-pre-line w-11/12'>{stepDesc[stepState].msg}</p>
                <div className='w-1/12'>
                    <button onClick={openPopup} className='border-2 border-solid text-yellow-200 w-10 h-10 rounded-lg text-xl font-bold'>?</button>
                    {isPopupOpen && <Popup onClose={closePopup} title={"Empty Attribute"}
                     text={"A nonterminal symbol within a context-free grammar that can derive (or expand to) an empty string, also known as the epsilon (ε) production is called empty."}/>}
                </div>
            </div>
            <div className='flex h-full'>
                <div className='w-1/3 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll'>
                    {grammarObj.productions.slice(0, -1).map((item, index) => (
                        <p key={index} ref={productionRef.current[index]}>{item.lhs + " -> " + item.rhs.join(" ")}</p>
                    ))}
                </div>
                <div className='w-2/3 border-2 border-solid rounded-lg border-color ml-2 p-2 h-full'>
                    <NullableTable grammarObj={grammarObj} checkBoxRef={checkBoxRef} checkedChange={checkedChange} editable={stepState === 0} active={grammarObj.nonTerminals.slice(1).map(() => false)} />
                    {<div className='flex justify-evenly mt-5'>
                        <p>{"Nullable-Set: "}<span className='font-bold'>{"(" + [...nullableSet].join(", ") + ")"}</span></p>
                        {<p>{"New Empty-Attribute found: "}<span className='font-bold'>{"" + newNullableNonterminalsFound}</span></p>}
                    </div>}
                </div>
            </div>
            <div>
                <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
                    Back
                </Button>
                <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleStep} disabled={stepStateRunning}>
                    {stepState !== stepDesc.length - 1 ? (stepStateRunning ? 'Running...' : stepState === 0 ? 'Start Step-by-Step' : 'Next Step') : 'Restart'}
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