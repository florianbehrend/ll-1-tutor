import React, {useContext} from 'react'
import CheckBox from '../components/Checkbox';
import {StoredContext} from '../context/StoredContext';


const NullableTable = ({classNameTable, className, grammarObj, checkBoxRef, checkedChange, editable = true}) => {
  const {activeRow, setActiveRow} = useContext(StoredContext);
  return (
    <div className={'flex items-center justify-center ' + classNameTable}>
                    <table className={'border ' + className}>
                    <thead>
                        <tr class="border-b bg-zinc-800">
                            <th className='border-r'>Nonterminal</th>
                            <th>isEmpty?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grammarObj.nonTerminals.slice(1).map((item, index) => (
                            <tr class={"border-b  " + (activeRow[index] ? "step-active bg-sky-500" : "bg-zinc-800")}>
                                <td className='max-h-6 flex justify-center border-r'><p>{item}</p></td>
                                <td className='max-h-6'><CheckBox inputRef={checkBoxRef.current[index]} onClick={editable ? checkedChange : (evt) => {evt.preventDefault()}} /></td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                    
                </div>
  )
}

export default NullableTable