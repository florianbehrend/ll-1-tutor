import './App.css';
import React from 'react';
import StartPage from './components/pages/Start';
import TutorPage from './components/pages/Tutor';
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartPage />}/>
          <Route path="tutor" element={<TutorPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
