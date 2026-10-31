import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './ui/tokens.css';
import './styles.css';
import './styles/recipe-refresh.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

import './styles/recipe-page.css';
