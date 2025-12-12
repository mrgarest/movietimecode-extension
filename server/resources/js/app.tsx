import './bootstrap';
import './lib/i18n';
import { createRoot } from "react-dom/client";
import { RouterProvider } from 'react-router-dom';
import router from './router';

const App = () => <RouterProvider router={router} />;

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}


