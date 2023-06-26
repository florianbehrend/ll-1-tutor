import React from 'react'

const Button = ({type='button', className, children, ...rest}) => {
  const hoverColor = rest.disabled ? 'hover:bg-yellow-200' : 'hover:bg-yellow-300';
  return (
    <button
        type={type}
        className={className + ' p-2 m-2 rounded-lg bg-yellow-200 w-2/12 ' + hoverColor}
        {...rest}
    >
        {children}
    </button>
  )
}

export default Button