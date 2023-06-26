import { useCallback, useState } from "react";

export const highlightProduction = (productionRef, counter, index = 0, productionFieldRef, timeOut, color="text-sky-500") => {
    timeOut.push(setTimeout(() => {
        productionRef.current.classList.add(color, "font-bold");
        productionFieldRef && (productionFieldRef.current.scrollTop = index*25 - productionFieldRef.current.clientHeight/2 );
    }, counter * 1000));
    //productionRef.current.classList.add("text-sky-500", "font-bold");

}

export const highlightCheckbox = (checkBoxRef, counter, timeOut) => {
    timeOut.push(setTimeout(() => checkBoxRef.current.checked = true, counter * 1000));
}

export const removeHighlight = (productionRef, modifiedList) => {
    modifiedList.forEach(index => {
        productionRef.current[index].current.classList.remove("text-sky-500", "text-green-500", "font-bold");
    });
    modifiedList.length = 0;
}

export const removeHighlightAll = (productionRef) => {
    productionRef.current.forEach(prod => {
        prod.current.classList.remove("text-sky-500", "text-green-500", "font-bold");
    });
}

export const stopSteps = (productionRef, modifiedList, timeOut) => {
    console.log(timeOut);
    timeOut.forEach(timeout => {
        clearTimeout(timeout);
    });
    removeHighlight(productionRef, modifiedList);
    timeOut.length = 0;
    //stepStateRunning = false;
}

export const stopTimeout = (timeOut) => {
    timeOut.forEach(timeout => {
        clearTimeout(timeout);
    });
}

export  const resetCorrectTemp = (correctTemp) => {
    Object.entries(correctTemp).forEach(([nonTerminal, item]) => {
      item.correct = false; 
      item.error = false;
      item.stepActive = false;
    });
  }

export const calculateFirstSet = (tokens, grammarObj, firstSet) => {
    const firstSetTemp = new Set();
    let index = 0;
    let isEmpty = false;

    while (index < tokens.length) {
      const token = tokens[index];
      isEmpty = false;

      if (!grammarObj.nonTerminals.includes(token)) {
        if (token !== 'e' && token !== 'eps') {
          firstSetTemp.add(token);
        } else {
          firstSetTemp.add('');
        }
        break;
      } else {
            firstSet.get(token).forEach(terminal => {
              if (terminal !== 'e' && terminal !== 'eps') {
                firstSetTemp.add(terminal);
              } else {
                firstSetTemp.add('');
                isEmpty = true;
              }
            });
            if(!isEmpty){
                break;
            }
      }

      index++;
    }
    return firstSetTemp;
  };

export const useCenteredTree = (defaultTranslate = { x: 0, y: 0 }) => {
  const [translate, setTranslate] = useState(defaultTranslate);
  const [dimensions, setDimensions] = useState();
  const containerRef = useCallback((containerElem) => {
    if (containerElem !== null) {
      const { width, height } = containerElem.getBoundingClientRect();
      setDimensions({ width, height });
      setTranslate({ x: width / 2, y: height / 2 });
    }
  }, []);
  return [dimensions, translate, containerRef];
};
