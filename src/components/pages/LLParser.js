import React, { useContext, useState, useRef } from 'react';
import Button from "../components/Button";
import { TextField } from '@mui/material';
import { StepperContext } from "../context/StepperContext";
import { StoredContext } from "../context/StoredContext";
import Tree from 'react-d3-tree';
import { useCenteredTree, getStackSize } from '../utils/utils';
import '../layout/css/LLParser.css';
import { TreeStruc } from '../components/TreeStruc';

var inputErrorText = "Please enter your word!";

var correctTemp = {};

var lastEditNonterminal = undefined;
var lastEditTerminal = undefined;

function check(grammar) {
  grammar.nonTerminals.slice(1).forEach((item, index) => {
    if (correctTemp[item] === undefined) {
      correctTemp[item] = [];
      for (let i = 0; i <= grammar.terminals.filter((sym) => sym !== 'ε').length; i++) {
        correctTemp[item].push({ correct: false, error: false, helpertext: "wrong elements", stepActive: false });
      }
    }
  });
};

export default function LLParser({ children, className, containerClassName, ...props }) {

  const { setActiveStep } = useContext(StepperContext);
  const { grammarObj, setGrammarObj } = useContext(StoredContext);
  const { parsingTable, setParsingTable } = useContext(StoredContext);
  const { setFollowSet } = useContext(StoredContext);
  const { setFirstSet } = useContext(StoredContext);
  const { setNullableSet } = useContext(StoredContext);

  const [solved, setSolved] = useState(true);
  const [correct, setCorrect] = useState(false);
  const [stepState, setStepState] = useState(0);
  const [stepStateRunning, setStepStateRunning] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [treeData, setTreeData] = useState({});
  const [stack, setStack] = useState([["S'", "1"]]);
  const [input, setInput] = useState([]);
  const [rule, setRule] = useState("");
  const [tree, setTree] = useState(new TreeStruc('1', "S'"));
  const [productionMap] = useState(new Map());

  const [refresh, setRefresh] = useState(false);

  const inputRef = useRef();
  const parsingTableRef = useRef();
  const treeRef = useRef();

  const [dimensions, translate, containerRef] = useCenteredTree();

  const verticalTable = grammarObj.terminals.length >= grammarObj.nonTerminals.length;
  const stackSize = getStackSize(grammarObj);
  check(grammarObj);

  grammarObj.productions.forEach(({ lhs, rhs }) => {
    if (productionMap.get(lhs) === undefined) {
      productionMap.set(lhs, []);
    }
    productionMap.get(lhs).push(rhs);
  });

  /**
   * Function to handle the "Next" button click
   */
  const handleNext = () => {
    setActiveStep(0);
    correctTemp = {};
    setParsingTable({});
    setGrammarObj({});
    setFirstSet();
    setFollowSet();
    setNullableSet(new Set());
  };

  /**
   * Function to handle the "Back" button click
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    inputErrorText = "Please enter your word!";
    correctTemp = {};
  };

  /**
   * Handle each step based on the current step state
   */
  const handleStep = () => {
    switch (stepState) {
      case 0:
        // Prepare input for parsing
        const tempInput = inputRef.current.value.split(" ").filter(sym => sym !== "");
        tempInput.push('$'); // Add end-of-input marker
        setInput(tempInput);
        inputRef.current.disabled = true;
        setStepState(stepState + 1);
        setStepStateRunning(true);
        break;
      case 1:
        if (stack.length !== 0 && solved) {
          // Perform a parsing step and update the parser state
          const solvedTemp = parserStep(tree, input, productionMap, true);
          setSolved(solvedTemp);
          treeToGraph(tree);
          if (!solvedTemp) {
            setStepState(stepState + 1)
          }
        } else {
          if (stack.length === 0) {
            setCorrect(true);
          }
          setStepState(stepState + 1)
        }
        break;
      default:
        setStepState(0);
        inputRef.current.value = "";
        reset();
        break;
    }
  }

  /**
   * Function to handle solving the LL(1) parsing
   */
  const handleSolved = () => {
    reset();

    // Split and filter the input word
    const input = inputRef.current.value.split(" ").filter(sym => sym !== "");
    input.push('$');
    const tree = new TreeStruc('1', "S'");

    // Check if input is empty
    if (input.length === 0) {
      setInputError(true);
      inputErrorText = "Please enter your word!";
      setRefresh(!refresh);
    } else {
      setInputError(false);
      runParser(stack, input, tree);
      setStepState(2);
    }
  }

  /**
   * Function to run the LL(1) parser
   */
  const runParser = (stack, input, tree) => {
    var solved = true;

    // Continue parsing until the stack is empty or parsing is not successful
    while (stack.length !== 0 && solved) {
      solved = parserStep(tree, input, productionMap);
    }

    // If parsing is successful, update the graphical representation of the tree and set correctness
    if (solved) {
      treeToGraph(tree);
      setCorrect(true);
    }

  }

  /**
 * Simulates a single step of the LL(1) parsing algorithm.
 *
 * @param {TreeStruc} tree - The parse tree data structure.
 * @param {string[]} input - The input string to be parsed.
 * @param {Map} productionMap - A map containing production rules for non-terminals.
 * @param {boolean} [stepping=false] - Indicates whether the parser is in stepping mode.
 * @returns {boolean} Returns `true` if the step was successful, `false` otherwise.
 */
  const parserStep = (tree, input, productionMap, stepping = false) => {

    const lastStackItem = stack.pop();    // initially it is S'
    const A = lastStackItem[0];
    const parentId = lastStackItem[1];

    /**
     * Add items to tree, when adding new Items on stack 
     * Stack will be [A, NodeId]
     */

    //initially it is first symbol in string, it can be $ also
    const r = input[0] === undefined ? 'ε' : input[0];
    if (grammarObj.terminals.includes(A) || A === '$') {
      // Handle cases based on terminals and empty string
      if (A === 'ε') {
        if (stepping) {
          setRule(A + " ==  ε");
        }
      } else if (A === r || r === 'ε') {
        //pop A from stack;
        input.shift();
        if (stepping) {
          setRule(A + " == " + r);
        }
      } else {
        inputErrorText = "This word cannot be generated by the grammar."
        setInputError(true);
        setRefresh(!refresh);
        return false;
      }
    }
    else if (grammarObj.nonTerminals.includes(A)) {
      console.log(r);
      if (parsingTable[A][r] === undefined) {
        // Handle cases when no production exists
        if (r === 'ε') {
          console.log("Test");
          const childId = parentId + tree.find(parentId).children.length;
          tree.insert(parentId, childId, 'ε');
          if (stepping) {
            setRule(A + " -> ε");
          }
        } else {
          inputErrorText = "This word cannot be generated by the grammar."
          setInputError(true);
          setRefresh(!refresh);
          return false;
        }
      } else {
        if (parsingTable[A][r].size === 1) {
          // Handle single production
          //pop A from stack

          productionMap.get(A)[parsingTable[A][r].values().next().value].reduceRight((_, sym) => {
            const childId = parentId + tree.find(parentId).children.length;
            if (sym !== '$') {
              tree.insert(parentId, childId, sym);
            }
            stack.push([sym, childId]);
          }, null);

          if (stepping) {
            setRule(A + " -> " + productionMap.get(A)[parsingTable[A][r].values().next().value].join(" "));
          }
        } else if (parsingTable[A][r].size === 0) {
          // Handle cases when no production exists
          inputErrorText = "This word cannot be generated by the grammar."
          setInputError(true);
          setRefresh(!refresh);
        } else if (parsingTable[A][r].size > 1) {
          // Handle cases with multiple productions
          setTableError(A, r);
          return false;
        }
      }

    }
    return true;
  }


  /**
  * Function to mark the error field in the lookahead table
  */
  const setTableError = (A, r) => {
    var index = 0;
    if (r === '$') {
      index = grammarObj.terminals.filter((sym) => sym !== 'ε').length;
    } else {
      index = grammarObj.terminals.filter((sym) => sym !== 'ε').indexOf(r);
    }
    correctTemp[A][index].error = true;
    inputErrorText = "The given grammar is non-deterministic, so the LL(1) parser cannot parse the word."
    setInputError(true);
    setRefresh(!refresh);

    // Scroll the parsing table to the location of the error
    parsingTableRef.current.scrollTop = (index + 1) * 34 - parsingTableRef.current.clientHeight / 2

    // Store the last edited nonterminal and terminal for future reference
    lastEditNonterminal = A;
    lastEditTerminal = index;
  }

  /**
  * The `reset` function resets the state and visual appearance of the application.
  * It clears the input of the textfields and objects.
  */
  const reset = () => {
    console.log(correctTemp);
    if (lastEditNonterminal !== undefined && lastEditTerminal !== undefined) {
      correctTemp[lastEditNonterminal][lastEditTerminal].error = false;
    }
    setCorrect(false);
    setSolved(true);
    setTreeData({});
    setRefresh(!refresh);
    setStack([["S'", "1"]]);
    setTree(new TreeStruc('1', "S'"));
    setRule("");
    setInput([]);
    setStepStateRunning(false);
    setInputError(false);
    inputRef.current.disabled = false;
  }

  // Function to handle input changes of inputRef Textfield
  const inputChange = () => {
    setCorrect(false);
    setInputError(false);
  }

  // Function to convert a tree structure to a graph structure
  const treeToGraph = (tree) => {
    setTreeData(traverseInOrder(tree.root));
  }

  // Recursive function to traverse the tree in-order and convert to graph structure
  const traverseInOrder = (node) => {
    const graphNode = {
      name: node.value,
      id: node.key,
      children: []
    }
    // Reverse the children array to maintain the correct order
    node.children.reverse().forEach((n) => {
      graphNode.children.push(traverseInOrder(n));
    });
    // Reverse the children array back to original order
    node.children.reverse();
    return graphNode;
  }

  const convention = 'Please enter your word that you want to parse. Each token must be separated by a space.';

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='border-2 border-solid rounded-lg border-color mb-1 p-2 flex justify-center items-center'>
        <p className='whitespace-pre-line'>{convention}</p>
      </div>
      <div className='flex h-full'>
        <div className='w-1/3'>
          <div className='h-1/2 border-2 border-solid rounded-lg border-color p-2 text-left overflow-scroll' ref={parsingTableRef}>
            <div className='flex items-center justify-center'>
              <table className='border w-full '>
                {!verticalTable && <thead>
                  <tr class="border-b bg-zinc-800">
                    <th className='border-r max-w-4'>Nonterminal</th>
                    {grammarObj.terminals.filter((sym) => sym !== 'ε').map((item, index) => (
                      <th className='border-r max-w-4'>{item}</th>
                    ))}
                    <th className='border-r max-w-4'>$</th>
                  </tr>
                </thead>}
                {verticalTable && <thead>
                  <tr class="border-b bg-zinc-800">
                    <th className='border-r max-w-4'>Terminals</th>
                    {grammarObj.nonTerminals.slice(1).map((item, index) => (
                      <th className='border-r max-w-4' id={index}>{item}</th>
                    ))}
                  </tr>
                </thead>}
                {!verticalTable && <tbody>
                  {grammarObj.nonTerminals.slice(1).map((item, index) => (
                    <tr class="border-b  ">
                      <td className='nonTerminal-table flex justify-center max-w-4'><p>{item}</p></td>
                      {grammarObj.terminals.filter((sym) => sym !== 'ε').map((sym, ind) => (
                        <td className='border-r border-l max-w-4'><p className={correctTemp[item][ind].error ? "field-error" : ""}>{[...parsingTable[item][sym]].join(", ")}</p></td>
                      ))}
                      <td className='border-r border-l max-w-4'><p className={correctTemp[item][correctTemp[item].length - 1].error ? "field-error" : ""}>{[...parsingTable[item]['$']].join(", ")}</p></td>
                    </tr>
                  ))}
                </tbody>}
                {verticalTable && <tbody>
                  {grammarObj.terminals.filter((sym) => sym !== 'ε').map((sym, index) => (
                    <tr class="border-b  ">
                      <td className='nonTerminal-table flex justify-center max-w-4'><p>{sym}</p></td>
                      {grammarObj.nonTerminals.slice(1).map((item, ind) => (
                        <td className='border-r border-l max-w-4'><p className={correctTemp[item][index].error ? "field-error" : ""}>{[...parsingTable[item][sym]].join(", ")}</p></td>
                      ))}
                    </tr>
                  ))}
                  <tr class="border-b  ">
                    <td className='nonTerminal-table flex justify-center max-w-4'><p>$</p></td>
                    {grammarObj.nonTerminals.slice(1).map((item, ind) => (
                      <td className='border-r border-l max-w-4'><p className={correctTemp[item][correctTemp[item].length - 1].error ? "field-error" : ""}>{[...parsingTable[item]['$']].join(", ")}</p></td>
                    ))}
                  </tr>
                </tbody>}
              </table>

            </div>

          </div>

          <div className='h-1/8 border-2 border-solid rounded-lg border-color mt-1 p-1 text-left'>
            <p>Remaining Input: </p>
            <p>{input.join(" ")}</p>
          </div>
          <div className='h-1/8 border-2 border-solid rounded-lg border-color mt-1 p-1 text-left'>
            <p>Stack: </p>
            {stepStateRunning && <p>{stack.map(x => x[0]).slice(stackSize * -1).length > stackSize ? "... " + stack.map(x => x[0]).slice(stackSize * -1).join(" ") : stack.map(x => x[0]).slice(stackSize * -1).join(" ")}</p>}
          </div>
          <div className='h-1/8 border-2 border-solid rounded-lg border-color mt-1 p-1 text-left'>
            <p>Rule: </p>
            <p>{rule}</p>
          </div>

        </div>
        <div className='flex flex-col w-2/3 items-center'>
          <TextField className='w-4/5 !m-2'
            inputRef={inputRef}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& > fieldset": correct ? { borderColor: "#22c55e", borderWidth: 2 } : { borderColor: "#2f2f2f", borderWidth: 2 },
              },
              "& .MuiOutlinedInput-root:hover": {
                "& > fieldset": { borderColor: "#fde047", borderWidth: 3 },
              },
            }}
            variant="outlined"
            error={inputError ? true : false}
            helperText={inputError ? inputErrorText : ""}
            onChange={inputChange}
          />
          <div ref={containerRef} className='w-full h-full'>
            <Tree data={treeData}
              dimensions={dimensions}
              translate={translate}
              zoom={1}
              orientation='vertical'
              collapsible={false}
              separation={{
                nonSiblings: 1,
                siblings: 1
              }}
              nodeSize={{ x: 100, y: 100 }}
              ref={treeRef} />
          </div>

        </div>
      </div>
      <div>
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleBack}>
          Back
        </Button>
        <Button variant="contained" sx={{ mt: 3, ml: 1 }} onClick={handleStep}>
          {stepState !== 2 ? (stepState === 0 ? 'Start Step-by-Step' : 'Next Step') : 'Restart'}
        </Button>
        <Button onClick={handleSolved} disabled={correct}>Solve</Button>
        <Button onClick={handleNext}>Finish</Button>
      </div>
    </div>
  )
}