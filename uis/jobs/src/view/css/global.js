// global.js
// Source: https://github.com/maximakymenko/react-day-night-toggle-app/blob/master/src/global.js#L23-L41

import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  *,
  *::after,
  *::before {
    box-sizing: border-box;
  }

  html {
    height: 100%;
  }

  body {
    background: ${props => props.theme.body};
    color: ${props => props.theme.text};
    height: 100%;
    font-family: "IBM Plex Mono", monospace;
    margin: 0;
  }`;