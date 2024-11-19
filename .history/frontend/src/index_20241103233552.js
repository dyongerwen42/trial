import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './themes';

const root = ReactDOM.createRoot(document.getElementById('root'));

const resizeObserverLoopErr = /ResizeObserver loop limit exceeded/;
const originalError = console.error;

console.error = (message, ...args) => {
  if (resizeObserverLoopErr.test(message)) {
    // Ignore the error
    return;
  }
  originalError.call(console, message, ...args);
};

root.render(
  <React.StrictMode>
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
