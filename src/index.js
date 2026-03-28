import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { RiceProvider } from './context/RiceContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RiceProvider>
      <App />
    </RiceProvider>
  </React.StrictMode>
);
