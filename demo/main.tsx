import { createRoot } from 'react-dom/client';
import { App } from './App';
import './tailwind.css';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('metal-fx demo: missing #root element');
createRoot(root).render(<App />);
