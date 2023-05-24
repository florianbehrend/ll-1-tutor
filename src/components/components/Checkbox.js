import React from 'react'
import './CheckBox.css';

const CheckBox = ({type='checkbox', id='checkbox', label='', className, children, inputRef, ...rest}) => {
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

export default CheckBox