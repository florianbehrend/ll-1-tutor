import React from 'react';
import '../layout/css/Popup.css';

const Popup = ({ onClose, title, text, img = '' }) => {
  return (
    <div className="popup-container">
      <div className="popup">
        <h2 className='font-bold text-sky-500 p-5'>{title}</h2>
        <p className='whitespace-pre-wrap'>{text}</p>
        <img src={img}></img>
        <button onClick={onClose} className='text-zinc-50 p-3'>Close</button>
      </div>
    </div>
  );
};

export default Popup;