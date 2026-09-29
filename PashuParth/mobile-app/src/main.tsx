import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { watermelonDB } from './db/watermelondb';
import { synchronizeWithSupabase } from './db/syncAdapter';

// Expose on window for debugging & evaluation
(window as any).watermelonDB = watermelonDB;
(window as any).synchronizeWithSupabase = synchronizeWithSupabase;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
