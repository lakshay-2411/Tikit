import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { toast, Toaster } from "react-hot-toast";
import ConnectWallet from "./ConnectWallet";

const Navbar = () => {
  const { isConnected } = useAccount();
  const prevConnectedRef = useRef(isConnected);

  useEffect(() => {
    if (prevConnectedRef.current !== isConnected) {
      if (isConnected) {
        toast.success("Wallet Connected Successfully!", {
          duration: 3000,
          position: "top-center",
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "8px",
          },
        });
      } else {
        toast.error("Wallet Disconnected!", {
          duration: 3000,
          position: "top-center",
          style: {
            background: "#ff4d4d",
            color: "#fff",
            borderRadius: "8px",
          },
        });
      }
      prevConnectedRef.current = isConnected;
    }
  }, [isConnected]);

  return (
    <>
      <Toaster />
      <nav className="text-white py-4 px-6 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold tracking-wide cursor-pointer flex gap-5"
        >
          TIKIT
        </Link>
        <div className="hidden md:flex font-bold space-x-6 text-lg py-1">
          <Link to="/events" className="hover:text-purple-500 transition">
            Events Tickets
          </Link>
          <Link to="/create-event" className="hover:text-purple-500 transition">
            Create Event
          </Link>
          <Link to="/my-tickets" className="hover:text-purple-500 transition">
            My Tickets
          </Link>
          <Link
            to="/admin-dashboard"
            className="hover:text-purple-500 transition"
          >
            Admin Dashboard
          </Link>
        </div>

        <div className="flex items-center space-x-4 rounded-3xl">
          <ConnectWallet />
        </div>
      </nav>
    </>
  );
};

export default Navbar;
