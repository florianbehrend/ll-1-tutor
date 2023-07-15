import React from 'react';
import '../css/Content.css';

/**
 * The `Content` component represents a container for content within the web page.
 * @param {object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The content to be rendered within the component.
 * @param {string} props.className - The CSS classes for styling the content block.
 * @param {string} props.containerClassName - The CSS classes for styling the content container.
 * @param {object} props.rest - Any additional props passed to the component.
 * @returns {React.JSX.Element} - The JSX element representing the content container.
 */
const Content = ({ children, className, containerClassName, ...props }) => {
  return (
    <div className={containerClassName + ' content-container'}>
      <div className={className + ' content-block'} {...props}>
        {children}
      </div>
    </div>
  )
}

export default Content;