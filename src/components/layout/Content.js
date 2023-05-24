import React from 'react'
import './Content.css'

const Content = ({children, className, containerClassName,  ...props}) => {
  return (
    <div className={containerClassName + ' content-container'}>
        <div className={className + ' content-block'} {...props}>
            {children}
        </div>
    </div>
  )
}

export default Content