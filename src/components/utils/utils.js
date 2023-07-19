import { useCallback, useState } from "react";

/**
 * Highlights a production in the grammar.
 * @param {object} productionRef - A ref object that references the DOM elements representing the productions in the grammar.
 * @param {number} counter - An integer representing the order in which the production should be highlighted (used for timing).
 * @param {number} [index=0] - The index of the production to be highlighted (default value is 0).
 * @param {object} productionFieldRef - A ref object that references the DOM element containing the productions (used for scrolling to the highlighted production).
 * @param {array} timeOut - An array of timeouts used to track and manage the highlighting actions.
 * @param {string} [color="text-sky-500"] - The CSS class name for the color of the highlighted production (default value is "text-sky-500").
 */
export const highlightProduction = (productionRef, counter, index = 0, productionFieldRef, timeOut, color = "text-sky-500") => {
  timeOut.push(setTimeout(() => {
    productionRef.current.classList.add(color, "font-bold");
    productionFieldRef && (productionFieldRef.current.scrollTop = index * 25 - productionFieldRef.current.clientHeight / 2);
  }, counter * 1000));
}

/**
 * Highlights a checkbox.
 * @param {object} checkBoxRef - A ref object that references the checkbox input element to be highlighted.
 * @param {number} counter - An integer representing the order in which the checkbox should be highlighted (used for timing).
 * @param {array} timeOut - An array of timeouts used to track and manage the highlighting actions.
 */
export const highlightCheckbox = (checkBoxRef, counter, timeOut) => {
  timeOut.push(setTimeout(() => checkBoxRef.current.checked = true, counter * 1000));
}

/**
 * Removes highlighting from productions in the grammar.
 * @param {object} productionRef - A ref object that references the DOM elements representing the productions in the grammar.
 * @param {array} modifiedList - An array of indices representing the productions that need to have their highlighting removed.
 */
export const removeHighlight = (productionRef, modifiedList) => {
  modifiedList.forEach(index => {
    productionRef.current[index].current.classList.remove("text-sky-500", "text-green-500", "font-bold");
  });
  modifiedList.length = 0;
}

/**
 * Adds opacity to productions in the grammar based on their nullable status.
 * @param {object} grammarObj - An object representing the grammar containing productions and non-terminals.
 * @param {object} productionRef - A ref object that references the DOM elements representing the productions in the grammar.
 * @param {Set} nullableSet - A Set containing the non-terminals that are nullable.
 */
export const highlightOpacity = (grammarObj, productionRef, nullableSet) => {
  grammarObj.productions.forEach((prod, index) => {
    if (nullableSet.has(prod.lhs) && !productionRef.current[index].current.classList.contains("opacity-50")) {
      productionRef.current[index].current.classList.add("opacity-50");
    }
  })
}

/**
 * Removes opacity from productions in the grammar based on their nullable status.
 * @param {object} grammarObj - An object representing the grammar containing productions and non-terminals.
 * @param {object} productionRef - A ref object that references the DOM elements representing the productions in the grammar.
 * @param {Set} nullableSet - A Set containing the non-terminals that are nullable.
 */
export const removeHighlightOpacity = (grammarObj, productionRef, nullableSet) => {
  grammarObj.productions.forEach((prod, index) => {
    if (nullableSet.has(prod.lhs)) {
      productionRef.current[index].current.classList.remove("opacity-50");
    }
  })
}


/**
 * Removes all kinds of highlighting from productions in the grammar.
 * @param {object} productionRef - A ref object that references the DOM elements representing the productions in the grammar.
 */
export const removeHighlightAll = (productionRef) => {
  productionRef.current.forEach(prod => {
    prod.current.classList.remove("text-sky-500", "text-green-500", "font-bold");
  });
}

/**
 * Stops and removes all highlighting actions and timeouts for productions in the grammar.
 * @param {object} productionRef - A ref object that references the DOM elements representing the productions in the grammar.
 * @param {array} modifiedList - An array of indices representing the productions that need to have their highlighting removed.
 * @param {array} timeOut - An array of timeouts used to track and manage the highlighting actions.
 */
export const stopSteps = (productionRef, modifiedList, timeOut) => {
  console.log(timeOut);
  timeOut.forEach(timeout => {
    clearTimeout(timeout);
  });
  removeHighlight(productionRef, modifiedList);
  timeOut.length = 0;
}

/**
 * Stops and removes all timeouts.
 * @param {array} timeOut - An array of timeouts used to track and manage the highlighting actions.
 */
export const stopTimeout = (timeOut) => {
  timeOut.forEach(timeout => {
    clearTimeout(timeout);
  });
}


/**
 * Resets the temporary correctness status for non-terminals in the grammar.
 * @param {object} correctTemp - An object containing temporary correctness status for non-terminals.
 */
export const resetCorrectTemp = (correctTemp) => {
  Object.entries(correctTemp).forEach(([_, item]) => {
    item.correct = false;
    item.error = false;
    item.stepActive = false;
  });
}

/**
 * Calculates the First Set for a given grammar and a list of tokens.
 * @param {array} tokens - An array of tokens representing a sequence.
 * @param {object} grammarObj - An object representing the grammar containing productions and non-terminals.
 * @param {Map} firstSet - A Map representing the First Set for the grammar.
 * @returns {Set} - The First Set calculated based on the tokens and grammar.
 */
export const calculateFirstSet = (tokens, grammarObj, firstSet) => {
  const firstSetTemp = new Set();
  let index = 0;
  let isEmpty = false;

  while (index < tokens.length) {
    const token = tokens[index];
    isEmpty = false;

    if (!grammarObj.nonTerminals.includes(token)) {
      if (token !== 'ε') {
        firstSetTemp.add(token);
      } else {
        firstSetTemp.add('');
      }
      break;
    } else {
      firstSet.get(token).forEach(terminal => {
        if (terminal !== 'ε') {
          firstSetTemp.add(terminal);
        } else {
          firstSetTemp.add('');
          isEmpty = true;
        }
      });
      if (!isEmpty) {
        break;
      }
    }

    index++;
  }
  return firstSetTemp;
};

/**
 * A custom React hook that returns the dimensions and translation values for centering a tree-like structure in a container.
 * @param {object} defaultTranslate - The default translation of the tree, an object with properties `x` and `y` representing the horizontal and vertical translation values respectively.
 * @returns {array} - An array containing three elements: `dimensions`, `translate`, and `containerRef`.
 */
export const useCenteredTree = (defaultTranslate = { x: 0, y: 0 }) => {
  const [translate, setTranslate] = useState(defaultTranslate);
  const [dimensions, setDimensions] = useState();
  const containerRef = useCallback((containerElem) => {
    if (containerElem !== null) {
      const { width, height } = containerElem.getBoundingClientRect();
      setDimensions({ width, height });
      setTranslate({ x: width / 2, y: 25 });
    }
  }, []);
  return [dimensions, translate, containerRef];
};


/**
 * Calculates the maximum length of the right-hand side of productions in a given grammar object.
 * @param {object} grammarObj - An object representing the grammar containing productions and non-terminals.
 * @returns {number} - The maximum length of the right-hand side (rhs) of the productions in the grammarObj, plus 1.
 */
export const getStackSize = (grammarObj) => {
  var max = 0;
  grammarObj.productions.forEach(({ lhs, rhs }) => {
    if (rhs.length > max) {
      max = rhs.length;
    }
  })
  return max + 1;
}