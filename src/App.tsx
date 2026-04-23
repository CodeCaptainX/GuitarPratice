import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import routes, { navItems } from "./routes";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout navItems={navItems}>
        <Routes>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
