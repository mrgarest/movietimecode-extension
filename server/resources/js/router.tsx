import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Privacy from "./pages/privacy";
import Home from "./pages/home";
import NotFound from "./pages/not-found";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            { index: true, element: <Home /> },
            { path: "/privacy", element: <Privacy /> },
            { path: "*", element: <NotFound /> }
        ],
    },
]);

export default router;