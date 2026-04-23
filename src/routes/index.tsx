// src/routes/index.ts
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";

const routes = [
  {
    path: "/",
    element: <HomePage />, // ✅ JSX element, not a function
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
];

export default routes;