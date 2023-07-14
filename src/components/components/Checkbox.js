import React from 'react'
import './CheckBox.css';

/**
 * The CheckBox component renders a checkbox input element with an optional label.
 * @param {string} type - The type of the input element. Default is 'checkbox'.
 * @param {string} id - The ID of the input element. Default is 'checkbox'.
 * @param {string} label - The label text to display next to the checkbox.
 * @param {string} className - Additional CSS classes to apply to the input element.
 * @param {React.Ref} inputRef - A reference to the input element.
 * @param {...any} rest - Additional props to be spread onto the input element.
 * @returns {React.JSX.Element} - The JSX element representing the checkbox and label.
 */
const CheckBox = ({ type = 'checkbox', id = 'checkbox', label = '', className, children, inputRef, ...rest }) => {
  return (
    <>
      <input
        id={id}
        type={type}
        className={className + ' p-2 rounded-sm border hover:bg-yellow-300 accent-yellow-200'}
        ref={inputRef}
        {...rest}>
        {children}
      </input>
      <label>{label}</label>
    </>
  )
}

export default CheckBox;