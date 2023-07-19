import React, { useContext } from 'react'
import CheckBox from '../components/Checkbox';
import { StoredContext } from '../context/StoredContext';

/**
 * @param {string} classNameTable - CSS classes for the table element.
 * @param {string} classNameContainer - CSS classes for the container element of the table.
 * @param {object} grammarObj - The grammar object containing the grammar information.
 * @param {Array<React.Ref>} checkBoxRef - The reference objects for the checkboxes.
 * @param {function} checkedChange - The event handler function for checkbox changes.
 * @param {boolean} editable - Determines if the table is editable or read-only. Default value is true.
 * @returns {React.JSX.Element} - The JSX element representing the nullable table.
 */
const NullableTable = ({ classNameTable, classNameContainer, grammarObj, checkBoxRef, checkedChange, editable = true }) => {
    const { activeRow } = useContext(StoredContext);
    return (
        <div className={'flex items-center justify-center ' + classNameContainer}>
            <table className={'border ' + classNameTable}>
                <thead>
                    <tr className="border-b bg-zinc-800">
                        <th className='border-r'>Nonterminal</th>
                        <th>isEmpty?</th>
                    </tr>
                </thead>
                <tbody>
                    {grammarObj.nonTerminals.slice(1).map((item, index) => (
                        <tr className={"border-b  " + (activeRow[index] ? "step-active bg-sky-500" : "bg-zinc-800")} key={index}>
                            <td className='max-h-6 flex justify-center border-r'><p>{item}</p></td>
                            <td className='max-h-6'><CheckBox inputRef={checkBoxRef.current[index]} onClick={editable ? checkedChange : (evt) => { evt.preventDefault() }} accessKey={item}/></td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    )
}

export default NullableTable;