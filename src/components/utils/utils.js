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