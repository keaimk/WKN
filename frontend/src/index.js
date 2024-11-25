import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Signup from './Signup'; 
import './Signup.css';

const root = document.getElementById('root');

createRoot(root).render(
  <React.StrictMode>
    <App>
      <Signup />
    </App>
  </React.StrictMode>
);