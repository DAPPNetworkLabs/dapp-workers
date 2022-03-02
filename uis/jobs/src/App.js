import React from 'react';
import './App.module.scss';

import Home from './containers/Home/Home';
import Dsp from './containers/Dsp/Dsp';
import Admin from './containers/Admin/Admin';
import Consumer from './containers/Consumer/Consumer';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/dsp" exact element={<Dsp/>} />
          <Route path="/admin" exact element={<Admin/>} />
          <Route path="/consumer" exact element={<Consumer/>} />
          <Route path="/" exact element={<Home/>} />
          <Route path="/" element={<Home/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
