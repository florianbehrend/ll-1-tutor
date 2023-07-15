import React from 'react'
import '../css/Header.css'
import Content from './Content'

/**
 * The `Header` component represents the header section of this web page.
 * @param {object} props - The properties passed to the component.
 * @param {string} props.className - CSS classes for styling the header.
 * @returns {React.JSX.Element} - The JSX element representing the header section.
 */
const Header = ({ className }) => {
  return (
    <div id="Header" className={className + ' relative bg-zinc-900'}>
      <Content containerClassName='' className='bg-zinc-800 neumophism-shadow flex items-center justify-end min-h-[5em] max-h-[5em] px-5'>
        <p className='text-yellow-200'>LL(1)-Tutor</p>
      </Content>
    </div>
  )
}

export default Header;