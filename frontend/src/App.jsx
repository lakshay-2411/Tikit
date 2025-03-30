import AllTicket from "./components/AllTicket";
import CreateEvent from "./components/CreateEvent";
import MyTickets from "./components/MyTicket";
import { Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/events" element={<AllTicket />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

export default App;
