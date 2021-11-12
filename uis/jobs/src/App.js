import React from 'react';
import './App.module.scss';

import Home from './containers/Home/Home';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" exact component={Home} />
          <Route path="/" component={Home} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
