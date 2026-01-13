import './bootstrap';
import './lib/i18n';
import { createRoot } from "react-dom/client";
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useUserStore } from './store/useUserStore';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function App() {
    const checkAuth = useUserStore(state => state.checkAuth);

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    });

    useEffect(() => {
        checkAuth();
    }, []);

    return <QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>;
}


const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}


