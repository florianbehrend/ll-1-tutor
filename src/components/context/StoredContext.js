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

    //Context object for Rows of NullableTable to paint them in steps
    const [activeRow, setActiveRow] = useState([]);

    const value = {grammar, setGrammar, grammarObj, setGrammarObj, nullableSet, setNullableSet, activeRow, setActiveRow};
        
    return (
        <StoredContext.Provider value={value}>
            {children}
        </StoredContext.Provider>
    );
}