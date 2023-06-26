import React, {useContext} from 'react'
import CheckBox from '../components/Checkbox';
import {StoredContext} from '../context/StoredContext';


const LookAHeadTable = ({classNameTable, className, grammarObj, tableRef, vertical=false, editable = true}) => {
  const {activeRow, setActiveRow} = useContext(StoredContext);
  return (
    <div className='flex items-center justify-center overflow-scroll m-2'>
                <table className='border '>
                <thead>
                    <tr class="border-b bg-zinc-800">
                        {false && <>
                        <th className='border-r'>Nonterminal</th> 
                        <th className='border-r'>$</th>
                        </>
                       }
                    </tr>
                </thead>
                <tbody>
                    {grammarObj.nonTerminals.slice(1).map((item, index) => (
                        <tr class="border-b  ">
                            <td className='nonTerminal-table flex justify-center border-r'><p>{item}</p></td>
                            {grammarObj.terminals.filter((sym) => sym !== 'e' && sym !== 'eps').map((item, ind) => (
                              <td className='border-r'><TextField  sx={{
                                "& .MuiOutlinedInput-root:hover": { 
                                  "& > fieldset": { borderColor: "#fde047", borderWidth: 1},
                                },
                              }} inputRef={tableRef.current[index][ind]}/></td>
                            ))}
                            <td className='border-r'><TextField sx={{
                                "& .MuiOutlinedInput-root:hover": { 
                                  "& > fieldset": { borderColor: "#fde047", borderWidth: 1},
                                },
                              }} inputRef={tableRef.current[index][grammarObj.terminals.length-1]}/></td>
                        </tr>
                    ))}
                </tbody>
                </table>
                
            </div>
  )
}

export default LookAHeadTable