import {createContext, useContext, useState} from 'react';

export const StoredContext = createContext();

export const StoredProvider = ({children}) => {
    const grammarObject = {
        nonTerminals: [],
        terminals: [],
        productions: [],
        startSymbol: 'S\''
      };

    const [grammar, setGrammar] = useState("");
    const [grammarObj, setGrammarObj] = useState(grammarObject);
    const [nullableSet, setNullableSet] = useState(new Set());
    const [firstSet, setFirstSet] = useState();
    const [followSet, setFollowSet] = useState();
    const [parsingTable, setParsingTable] = useState();
    const [storedNodes, setStoredNodes] = useState();
    const [storedEdges, setStoredEdges] = useState();
  

    //Context object for Rows of NullableTable to paint them in steps
    const [activeRow, setActiveRow] = useState([]);

    const value = {grammar, setGrammar, grammarObj, setGrammarObj, nullableSet, setNullableSet, activeRow, setActiveRow, firstSet, setFirstSet, followSet, setFollowSet, parsingTable, setParsingTable, storedNodes, setStoredNodes, storedEdges, setStoredEdges};
        
    return (
        <StoredContext.Provider value={value}>
            {children}
        </StoredContext.Provider>
    );
}