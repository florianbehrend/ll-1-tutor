import { createContext, useState } from 'react';

export const StoredContext = createContext();

export const StoredProvider = ({ children }) => {
    const grammarObject = {
        nonTerminals: [],
        terminals: [],
        productions: [],
        startSymbol: 'S\'',
        firstSymbol: '',
    };

    const [grammar, setGrammar] = useState("");                     //grammar string
    const [grammarObj, setGrammarObj] = useState(grammarObject);    //grammar object
    const [nullableSet, setNullableSet] = useState(new Set());      //empty attributes
    const [firstSet, setFirstSet] = useState();                     //first set
    const [followSet, setFollowSet] = useState();                   //follow set
    const [parsingTable, setParsingTable] = useState({});           //parsing table
    const [storedNodes, setStoredNodes] = useState();               //nodes for dependency graph
    const [storedEdges, setStoredEdges] = useState();               //edges for dependency graph


    //Context object for Rows of NullableTable to paint them in steps
    const [activeRow, setActiveRow] = useState([]);

    const value = { grammar, setGrammar, grammarObj, setGrammarObj, nullableSet, setNullableSet, activeRow, setActiveRow, firstSet, setFirstSet, followSet, setFollowSet, parsingTable, setParsingTable, storedNodes, setStoredNodes, storedEdges, setStoredEdges };

    return (
        <StoredContext.Provider value={value}>
            {children}
        </StoredContext.Provider>
    );
}