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
    const value = {grammar, setGrammar, grammarObj, setGrammarObj};
        
    return (
        <StoredContext.Provider value={value}>
            {children}
        </StoredContext.Provider>
    );
}