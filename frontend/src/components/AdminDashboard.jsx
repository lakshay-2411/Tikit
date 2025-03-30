import React, { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import EventTicketABI from "../constants/EventTicketAbi.json";
import { eventTicketAddress } from "../constants/constant";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

const AdminDashboard = () => {
  const [eventStats, setEventStats] = useState([]);

  const { data: allEvents } = useReadContract({
    address: eventTicketAddress,
    abi: EventTicketABI,
    functionName: "getAllEvents",
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (allEvents && allEvents[0]) {
        const stats = await Promise.all(
          allEvents[0].map(async (event) => {
            console.log(event);
            
            const { eventId, name, maxParticipants, currentSupply } = event;
            const sold =
              parseInt(maxParticipants.toString(), 10) -
              parseInt(currentSupply.toString(), 10);
            const remaining = parseInt(currentSupply.toString(), 10);

            return { name, sold, remaining };
          })
        );
        setEventStats(stats);
      }
    };

    fetchStats();
  }, [allEvents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-400">
        Admin Dashboard
      </h1>

      {eventStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {eventStats.map((event, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-transform transform hover:scale-105"
            >
              <h2 className="text-2xl font-semibold mb-4 text-green-300">
                📅 {event.name}
              </h2>

              <div className="flex items-center justify-center">
                <div className="w-64 h-64">
                  <Pie
                    data={{
                      labels: ["Sold", "Remaining"],
                      datasets: [
                        {
                          data: [event.sold, event.remaining],
                          backgroundColor: ["#4caf50", "#f44336"],
                          hoverBackgroundColor: ["#66bb6a", "#ef5350"],
                        },
                      ],
                    }}
                    options={{
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { color: "#fff" },
                        },
                      },
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <p className="text-lg">
                  🎫{" "}
                  <span className="font-bold text-blue-400">Tickets Sold:</span>{" "}
                  {event.sold}
                </p>
                <p className="text-lg">
                  🕰{" "}
                  <span className="font-bold text-yellow-400">
                    Tickets Remaining:
                  </span>{" "}
                  {event.remaining}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xl text-gray-400">
          No event stats available.
        </p>
      )}
    </div>
  );
};

export default AdminDashboard;
