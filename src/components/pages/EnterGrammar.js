import React, { useContext, useRef, useState } from 'react';
import Button from "../components/Button";
import TextField from '@mui/material/TextField';
import { StepperContext } from "../context/StepperContext";
import '../layout/css/EnterGrammar.css';
import { StoredContext } from '../context/StoredContext';

export default function EnterGrammar() {

  const conventionList = [
    { 'key': 1, 'conv': 'Write each production rule in a separate line' },
    { 'key': 2, 'conv': '| is used as delimiter' },
    { 'key': 3, 'conv': 'Use \'->\' or \'=\' as arrow' },
    { 'key': 4, 'conv': '(Non-)Terminals can have multiple characters, use any whitespace to delimit (Non-)Terminals' },
    { 'key': 5, 'conv': 'S\' -> <Startsymbol> $ is added for initialising the construction' },
    { 'key': 6, 'conv': 'S is always considered as Startsymbol. If it does not exist the nonterminal on the left of the first production is considered as startsymbol' },
    { 'key': 7, 'conv': 'To insert epsilon click on the ε button' },
    { 'key': 8, 'conv': '->, |, $, ε, S\', \' cannot be used as (Non-) Terminals' },
  ]

  const { setActiveStep } = useContext(StepperContext);
  const { grammar, setGrammar } = useContext(StoredContext);
  const { setGrammarObj } = useContext(StoredContext);

  const [error, setError] = useState(false);

  const grammarRef = useRef();

  /**
 * The `parseGrammar` function takes a grammarString as input and parses it into a grammar object.
 * @param {string} grammarString - The `grammarString` parameter is a string representing the grammar in the form of production rules separated by newlines. 
 * @returns {boolean} - Returns true if there is an error in the grammarString, and false if the parsing is successful.
 */
  const parseGrammar = (grammarString) => {
    const grammar = {
      nonTerminals: [],
      terminals: [],
      productions: [],
      startSymbol: 'S\'',
      firstSymbol: '',
    };

    const productions = grammarString.split('\n');
    grammar.nonTerminals.push(grammar.startSymbol);

    for (let production of productions) {
      const [lhs, rhs] = production.split(/=|->/).map((str) => str.trim());

      //empty line
      if (lhs === "" && rhs === undefined) {
        continue;
      }

      // Add non-terminal to the nonTerminals array if not already present
      if (!grammar.nonTerminals.includes(lhs)) {
        grammar.nonTerminals.push(lhs);
      }

      if (rhs === undefined || rhs === "") {
        return true;
      }

      // Split the right-hand side into individual symbols
      const productionsMultiple = rhs.split('|').map((symbol) => symbol.trim());

      // Add terminals to the terminals array
      productionsMultiple.forEach(element => {
        element.split(' ').forEach(symbol => {
          if (!grammar.nonTerminals.includes(symbol) && !grammar.terminals.includes(symbol)) {
            grammar.terminals.push(symbol);
          }
        })
      });

      // Add the production to the productions array
      productionsMultiple.forEach(element => {
        grammar.productions.push({ lhs, rhs: element.split(' ') });
      });
    }

    //set grammar attributes
    grammar.terminals = grammar.terminals.filter(e => !grammar.nonTerminals.includes(e));
    grammar.productions = grammar.productions.sort((a, b) => a.lhs.localeCompare(b.lhs));
    if (grammar.nonTerminals.includes('S')) {
      grammar.productions.push({ lhs: grammar.startSymbol, rhs: ['S', '$'] });
      grammar.firstSymbol = 'S';
    } else {
      grammar.productions.push({ lhs: grammar.startSymbol, rhs: [grammar.nonTerminals[1], '$'] });
      grammar.firstSymbol = grammar.nonTerminals[1];
    }

    setGrammarObj(grammar);

    return false;
  };

/**
 * The function `HandleNext` checks if a grammar value is empty and sets an error state if it is,
 * otherwise it parses the grammar value and updates the active step if the parsing is successful.
 */
  const HandleNext = () => {
    if (grammarRef.current.value == "") {
      setError(true);
    } else {
      const gram = parseGrammar(grammarRef.current.value);
      setError(gram);
      if (!gram) {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    }
  };

  /**
   * The handleChange function updates the grammar state based on the value of the grammarRef.current
   * input field.
   */
  const handleChange = () => {
    setGrammar(grammarRef.current.value);
  };


  /**
   * The `insertEpsilon` function inserts the epsilon symbol (ε) at the current cursor position in a text
   * input field.
   */
  const insertEpsilon = () => {
    const text = grammarRef.current.value;
    grammarRef.current.value = text.slice(0, grammarRef.current.selectionStart) + 'ε' + text.slice(grammarRef.current.selectionStart)
    handleChange();
  }

  const exampleOne = () => {
    const example = "E -> E + T | T\nT -> T * F | F\nF -> ( E ) | name | int";
    grammarRef.current.value = example;
    handleChange();
  }

  const exampleTwo = () => {
    const example = "E -> E + T | T\nT -> T * F | F | G\nF -> ( E ) | name | int\nG -> ε | g";
    grammarRef.current.value = example;
    handleChange();
  }

  const exampleThree = () => {
    const example = "S -> prn E T\nT -> prn E T | ε\nE -> num | bop E E | uop E";
    grammarRef.current.value = example;
    handleChange();
  }

  const exampleFour = () => {
    const example = "E -> T R\nR -> ε\nR -> + E\nT -> F X\nX -> ε\nX -> * T\nF -> n\nF -> ( E )";
    grammarRef.current.value = example;
    handleChange();
  }

  return (
    <div className='flex flex-col w-full justify-between'>
      <div className='flex flex-row'>
        <div className='flex flex-col w-1/2'>
          <TextField
            label="Grammar"
            multiline
            rows={15}
            id="outlined-multiline-static"
            inputRef={grammarRef}
            value={grammar}
            onChange={handleChange}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& > fieldset": { borderColor: "#2f2f2f", borderWidth: 2 },
              },
              "& .MuiOutlinedInput-root:hover": {
                "& > fieldset": { borderColor: "#fde047", borderWidth: 3 },
              },
            }}
            error={error}
            helperText={error ? "Please enter a grammar or your grammar does not comply with the convention." : ""}
          />
          <Button className='' onClick={insertEpsilon}>ε</Button>
        </div>

        <div className='text-yellow-200 px-4 w-1/2'>
          <div className='font-bold'>Grammar Conventions</div>
          <div>
            The tutor tool uses the following conventions for context-free-grammar:
            <ul role='list' className='marker:text-yellow-200 list-disc pl-5 flex flex-col items-baseline text-left text-sm'>
              {conventionList.map(item => (
                <li key={item.key}>{item.conv}</li>
              ))}
            </ul>
          </div>
          <div className='flex justify-around mt-5'>
            <div onClick={exampleOne} className='underline hover:cursor-pointer'>Example 1</div>
            <div onClick={exampleTwo} className='underline hover:cursor-pointer'>Example 2</div>
            <div onClick={exampleThree} className='underline hover:cursor-pointer'>Example 3</div>
            <div onClick={exampleFour} className='underline hover:cursor-pointer'>Example 4</div>
          </div>
        </div>
      </div>
      <div className='w-full flex justify-end'>
        <Button className='' onClick={HandleNext}>Next</Button>
      </div>
    </div>
  )
}