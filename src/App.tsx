import { Routes, Route } from "react-router";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Composer from "./pages/Composer";
import Scheduler from "./pages/Scheduler";
import Accounts from "./pages/Accounts";
import Analytics from "./pages/Analytics";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/composer" element={<Composer />} />
      <Route path="/scheduler" element={<Scheduler />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
