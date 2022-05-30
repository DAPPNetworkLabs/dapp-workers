import React from 'react';
import ReactDOM from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { createStore } from 'redux';
import reducer from './store/reducers/auth.js';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { LocalizeProvider } from 'react-localize-redux';

const store = createStore(reducer);

const app = (
  <ReduxProvider store={store}>
    <LocalizeProvider>
      <App />
    </LocalizeProvider>
  </ReduxProvider>
);

ReactDOM.render(app, document.getElementById('root'));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
