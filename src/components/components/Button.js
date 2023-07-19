import React from 'react'

/**
 * The `Button` component is a reusable React button component that allows customization of its appearance and behavior using various props.
 * @param {string} [type='button'] - Specifies the type of the button element.
 * @param {string} className - Additional CSS classes to apply to the button element.
 * @param {ReactNode} children - The content to be displayed inside the button (usually text or other React elements).
 * @param {object} rest - Any additional props passed to the component, which will be spread to the underlying button element.
 * @returns {React.JSX.Element} - The rendered Button component.
 */
const Button = ({ type = 'button', className, children, ...rest }) => {
  const hoverColor = rest.disabled ? 'hover:bg-yellow-200 opacity-50' : 'hover:bg-yellow-300';
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

export default Button;