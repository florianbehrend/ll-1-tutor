import React from 'react'
import './Header.css'
import Content from './Content'

const Header = ({className}) => {
  
  return (
    // bg-pink-950
    <div id="Header" className={className + ' relative bg-zinc-900'}>
        <Content containerClassName='' className='bg-zinc-800 neumophism-shadow flex items-center justify-end min-h-[5em] max-h-[5em] px-5'>
          <p className='text-yellow-200'>LL(1)-Tutor</p>
        </Content>

    </div>

  )
}

export default Header