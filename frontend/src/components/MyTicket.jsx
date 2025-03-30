import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import Moralis from "moralis";
import EventTicketABI from "../constants/EventTicketAbi.json";
import StakeTicketABI from "../constants/StakeTicketAbi.json";

import {
  eventTicketAddress,
  ticketStakingAddress,
} from "../constants/constant";
import { formatEther } from "viem";
import Navbar from "./Navbar";

export default function MyTickets() {
  const { address } = useAccount();
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  const { writeContract: resellTicketWrite } = useWriteContract();
  const { writeContract: stakeTicketWrite } = useWriteContract();

  // Resolve IPFS URLs
  const resolveIPFS = (uri) => {
    if (!uri) return "/default-ticket.png";
    if (uri.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${uri.slice(7)}`;
    }
    const match = uri.match(/ipfs\/([^/?]+)/);
    if (match) {
      return `https://ipfs.io/ipfs/${match[1]}`;
    }
    return uri;
  };

  // Read all events from the smart contract
  const {
    data: allEvents,
    isError,
    isLoading,
  } = useReadContract({
    address: eventTicketAddress,
    abi: EventTicketABI,
    functionName: "getAllEvents",
  });

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

  // Fetch and store events
  useEffect(() => {
    const fetchEvents = async () => {
      if (allEvents && allEvents[0]) {
        try {
          console.log("All events from contract:", allEvents[0]);

          const formattedEvents = await Promise.all(
            allEvents[0].map(async (event) => {
              const eventId = event?.eventId?.toString() || "0";
              const metadataUri = event?.cid;
              let price = "0";

              try {
                if (event?.basePrice) {
                  price = formatEther(event.basePrice);
                }
              } catch (err) {
                console.error("Error formatting price:", err);
              }

              let image = "/default-ticket.png"; // Initialize default image
              if (metadataUri) {
                try {
                  const metadata = await fetchMetadata(metadataUri);
                  if (metadata && metadata.image) {
                    image = resolveIPFS(metadata.image);
                  }
                } catch (err) {
                  console.error("Error fetching metadata for event:", err);
                }
              }

              return {
                eventId,
                name: event?.name || "Unnamed Event",
                description: event?.description || "No description available",
                image,
                price,
                active: event?.active ?? false,
                maxParticipants: event?.maxParticipants?.toString() || "0",
                currentSupply: event?.currentSupply?.toString() || "0",
              };
            })
          );

          setEvents(formattedEvents);
        } catch (err) {
          console.error("Error processing events:", err);
          setError("Failed to process events from contract");
        }
      }

      if (isError) {
        console.error("Error fetching events from contract");
        setError("Failed to fetch events from contract");
      }
    };

    fetchEvents();
  }, [allEvents, isError]);
  // Fetch user-owned tickets using Moralis
  useEffect(() => {
    const fetchTickets = async () => {
      if (!address) return;

      try {
        if (!Moralis.Core.isStarted) {
          await Moralis.start({
            apiKey: import.meta.env.VITE_MORALIS_API_KEY,
          });
        }

        const tickets = await Moralis.EvmApi.nft.getWalletNFTs({
          chain: "11155111",
          tokenAddresses: [eventTicketAddress],
          address,
          normalizeMetadata: true,
        });

        console.log("Raw Tickets:", tickets.result);

        const formattedTickets = await Promise.all(
          tickets.result.map(async (nft) => {
            let metadata = nft.metadata;

            if (!metadata && nft.tokenUri) {
              try {
                const response = await fetch(nft.tokenUri);
                metadata = await response.json();
              } catch (error) {
                console.error(
                  "Failed to fetch metadata from tokenUri:",
                  nft.tokenUri
                );
              }
            }

            const tokenId = nft?.tokenId?.toString() || "0";
            const event = events.find((e) => e.eventId === tokenId);

            return {
              eventId: tokenId,
              name: metadata?.name || event?.name || "Event Ticket",
              description:
                metadata?.description ||
                event?.description ||
                "No description available.",
              image: resolveIPFS(metadata?.image || event?.image),
              price: event?.price || "N/A",
            };
          })
        );

        setMyTickets(formattedTickets);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        setError("Failed to fetch tickets.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [address, events]);

  // Resell Ticket
  const resellTicket = useWriteContract({
    abi: EventTicketABI,
    address: eventTicketAddress,
    functionName: "resellTicket",
  });

  const handleResell = async (eventId) => {
    try {
      if (!eventId) {
        throw new Error("Invalid event ID");
      }
      
      await resellTicketWrite({
        address: eventTicketAddress,
        abi: EventTicketABI,
        functionName: "resellTicket",
        args: [eventId],
      });
      
      alert("Ticket listed for resale.");
    } catch (error) {
      console.error("Resell failed:", error);
      alert("Failed to resell ticket. Please try again.");
    }
  };

  // Stake Ticket
  const stakeTicket = useWriteContract({
    abi: StakeTicketABI,
    address: ticketStakingAddress,
    functionName: "stakeTicket",
  });

  const handleStake = async (eventId) => {
    try {
      if (!eventId) {
        throw new Error("Invalid event ID");
      }

      await stakeTicketWrite({
        address: ticketStakingAddress,
        abi: StakeTicketABI,
        functionName: "stakeTicket",
        args: [eventId],
      });

      alert("Ticket staked successfully!");
    } catch (error) {
      console.error("Staking failed:", error);
      alert("Failed to stake ticket. Please try again.");
    }
  };

  return (
    <>
      <div className="bg-black h-[730px]">
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6 text-white">🎟 My Tickets</h1>

          {loading || isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : myTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTickets.map((ticket) => (
                <div
                  key={ticket.eventId}
                  className="border p-4 rounded-2xl shadow-md border-white"
                >
                  <img
                    src={ticket.image}
                    alt={ticket.name}
                    className="w-full h-48 object-cover rounded"
                  />
                  <h2 className="text-xl font-semibold text-white mt-2">
                    {ticket.name}
                  </h2>
                  <p className="text-white mt-1">{ticket.description}</p>
                  <p className="text-blue-500 font-bold mt-1">
                    Price: {ticket.price} ETH
                  </p>
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleResell(ticket.eventId)}
                      className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
                    >
                      Resell Ticket
                    </button>
                    <button
                      onClick={() => handleStake(ticket.eventId)}
                      className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-700"
                    >
                      Stake Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No tickets found.</p>
          )}
        </div>
      </div>
    </>
  );
}
