import React, { useEffect, useState } from "react";
import { eventTicketAddress } from "../constants/constant";
import { useReadContract, useWriteContract } from "wagmi";
import abi from "../constants/EventTicketAbi.json";
import Navbar from "./Navbar";
import { formatEther } from "viem";

export default function AllTickets() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    data: contractEvents,
    isError,
    isLoading,
    refetch,
  } = useReadContract({
    address: eventTicketAddress,
    abi,
    functionName: "getAllEvents",
  });

  const { writeContract } = useWriteContract();

  const buyTicket = async (eventId, price) => {
    console.log("Buying ticket for event:", eventId);
    console.log("Price:", price);

    try {
      await writeContract({
        address: eventTicketAddress,
        abi,
        functionName: "buyTicket",
        args: [eventId],
        value: BigInt(price * 1e18),
      });
      alert("Ticket purchased successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to purchase ticket:", error);
      alert("Failed to purchase ticket.");
    }
  };

  const formatIPFSUrl = (url) => {
    if (!url) return null;

    // Extract the IPFS hash from any URL format
    const match = url.match(/ipfs\/([a-zA-Z0-9]+)/);
    const ipfsHash = match ? match[1] : url;

    // Return standardized IPFS link
    return `https://ipfs.io/ipfs/${ipfsHash}`;
  };

  const fetchMetadata = async (uri) => {
    try {
      const metadataUrl = formatIPFSUrl(uri);
      if (!metadataUrl) return null;

      console.log("Fetching metadata from:", metadataUrl);
      const response = await fetch(metadataUrl);
      if (!response.ok)
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);

      const metadata = await response.json();
      console.log("Fetched metadata:", metadata);

      // Extract image from metadata and format it
      const imageUrl = formatIPFSUrl(metadata.image);
      return { ...metadata, image: imageUrl };
    } catch (err) {
      console.error("Error fetching metadata:", err);
      return null;
    }
  };

  useEffect(() => {
    const processEvents = async () => {
      if (!contractEvents || contractEvents.length < 2) return;

      const [eventArray, uriArray] = contractEvents; // Destructure the two arrays
      console.log("Event Array:", eventArray);
      console.log("URI Array:", uriArray);

      try {
        const processedEvents = await Promise.all(
          eventArray.map(async (event, index) => {
            const metadataUri = uriArray[index] ?? null; // Match event with URI by index

            const baseEvent = {
              eventId: event?.eventId?.toString() ?? "N/A",
              name: event?.name ?? "Unnamed Event",
              description: event?.description ?? "No description available",
              basePrice: event?.basePrice
                ? formatEther(event.basePrice.toString())
                : "0",
              maxParticipants: event?.maxParticipants?.toString() ?? "0",
              currentSupply: event?.currentSupply?.toString() ?? "0",
              active: event?.active ?? true,
              createdAt: event?.createdAt
                ? new Date(Number(event.createdAt) * 1000).toLocaleDateString()
                : "N/A",
              image: "",
              attributes: [],
            };
            // Fetch metadata if URI exists
            if (metadataUri) {
              try {
                const metadata = await fetchMetadata(metadataUri);
                if (metadata) {
                  baseEvent.image = metadata.image ?? baseEvent.image;
                  baseEvent.attributes = metadata.attributes ?? [];
                }
              } catch (err) {
                console.error("Error fetching metadata for event:", err);
              }
            }

            return baseEvent;
          })
        );

        const validEvents = processedEvents.filter(Boolean);
        setEvents(validEvents);
      } catch (err) {
        console.error("Error processing events:", err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    if (contractEvents) {
      processEvents();
    }
  }, [contractEvents]);

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p className="text-lg">Loading events...</p>
      </div>
    );
  }

  if (error || isError) {
    return (
      <div className="text-red-500 text-center">Failed to load events.</div>
    );
  }

  if (!events.length) {
    return <div className="text-center text-gray-500">No events found.</div>;
  }

  return (
    <>
      <div className="bg-black h-[730px]">
        <Navbar />
        <div className="grid grid-cols-1 w-[1200px] md:grid-cols-2 lg:grid-cols-3 gap-20 p-4 mt-10">
          {events.map((event) => (
            <div
              key={event.eventId}
              className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white border-4 border-purple-500"
            >
              <div className="aspect-video relative p-4">
                <img
                  src={formatIPFSUrl(event.image)}
                  alt={event.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4 bg-gray-800">
                <div className="mb-2">
                  <h3 className="text-lg text-white font-semibold">
                    {event.name}
                  </h3>
                </div>
                <p className="text-sm text-white mb-4 line-clamp-2">
                  {event.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="block text-white">Price</span>
                    <span className="font-medium text-white">
                      {event.basePrice} ETH
                    </span>
                  </div>
                  <div>
                    <span className="block text-white">Capacity</span>
                    <span className="font-medium text-white">
                      {event.currentSupply}/{event.maxParticipants}
                    </span>
                  </div>
                  <div>
                    <span className="block text-white">Status</span>
                    <span
                      className={`font-medium ${
                        event.active ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {event.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700"
                    onClick={() => buyTicket(event.eventId, event.basePrice)}
                    disabled={!event.active}
                  >
                    Purchase Ticket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
``;
