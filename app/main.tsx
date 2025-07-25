import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import App from './App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <>
            <HashRouter>
                <App />
            </HashRouter>
            <Toaster
                position="top-right"
                reverseOrder={true}
            />
        </>
    </StrictMode>,
)