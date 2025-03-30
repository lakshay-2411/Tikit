import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { eventTicketAddress } from "../constants/constant";
import abi from "../constants/EventTicketAbi.json";

const CATEGORIES = [
  "Conference",
  "Concert",
  "Sports",
  "Workshop",
  "Exhibition",
  "Other",
];

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    participants: "",
    category: CATEGORIES[0],
    image: null,
  });

  const [txHash, setTxHash] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const {
    isLoading: isWaiting,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      alert("✅ Event successfully created!");
      setFormData({
        name: "",
        description: "",
        price: "",
        participants: "",
        category: CATEGORIES[0],
        image: null,
      });
      setPreviewUrl(null);
      setTxHash(null);
    }
    if (receiptError) {
      console.error("❌ Transaction failed:", receiptError.message);
      setError(receiptError.message);
    }
  }, [isSuccess, receiptError]);

  useEffect(() => {
    // Create preview URL for image
    if (formData.image) {
      const url = URL.createObjectURL(formData.image);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [formData.image]);

  const uploadImageToIpfs = async () => {
    try {
      if (!formData.image) throw new Error("No image selected.");
      const form = new FormData();
      form.append("file", formData.image);

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
          },
          body: form,
        }
      );

      if (!response.ok)
        throw new Error(`Image upload failed: ${response.statusText}`);

      const result = await response.json();
      return `https://ipfs.io/ipfs/${result.IpfsHash}`;
    } catch (err) {
      console.error("Image Upload Error:", err);
      throw err;
    }
  };

  const uploadMetadataToIpfs = async (imageUrl) => {
    try {
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imageUrl,
        attributes: [
          {
            trait_type: "Max Participants",
            value: parseInt(formData.participants),
          },
          {
            trait_type: "Price (ETH)",
            value: parseFloat(formData.price),
          },
          {
            trait_type: "Category",
            value: formData.category,
          },
          {
            trait_type: "Created Date",
            value: new Date().toISOString(),
          },
        ],
      };

      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      const metadataFile = new File([metadataBlob], "metadata.json");

      const form = new FormData();
      form.append("file", metadataFile);

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
          },
          body: form,
        }
      );

      if (!response.ok)
        throw new Error(`Metadata upload failed: ${response.statusText}`);

      const result = await response.json();
      return result.IpfsHash;
    } catch (err) {
      console.error("Metadata Upload Error:", err);
      throw err;
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setFormData({ ...formData, image: file });
    } else {
      setError("Please select a valid image file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validation
      if (
        !formData.name ||
        !formData.description ||
        !formData.price ||
        !formData.participants ||
        !formData.image ||
        !formData.category
      ) {
        throw new Error("Please fill in all fields.");
      }

      if (parseFloat(formData.price) <= 0) {
        throw new Error("Price must be greater than 0.");
      }

      if (parseInt(formData.participants) <= 0) {
        throw new Error("Number of participants must be greater than 0.");
      }

      // Upload image and metadata
      const imageUrl = await uploadImageToIpfs();
      console.log("🚀 Image URL:", imageUrl);

      const metadataUrl = await uploadMetadataToIpfs(imageUrl);
      console.log("🚀 Metadata URL:", metadataUrl);

      // Contract interaction - Make sure we pass exactly 6 arguments
      const priceInWei = parseEther(formData.price);
      const args = [
        formData.name, // string: name
        formData.description, // string: description
        priceInWei, // uint256: basePrice
        BigInt(formData.participants), // uint256: maxParticipants
        metadataUrl, // string: metadataUri    
      ];

      console.log("Contract args:", args);

      const hash = await writeContractAsync({
        address: eventTicketAddress,
        abi,
        functionName: "createEvent",
        args,
        account: address,
      });

      setTxHash(hash);
      console.log("📜 Transaction Hash:", hash);
    } catch (err) {
      console.error("❌ Error creating event:", err);
      setError(err.message || "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-black w-full h-[1000px]">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 rounded-lg">
          <h2 className="text-2xl text-white font-bold mb-6">
            Create New Event
          </h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <div className="grid grid-cols-2 gap-6">
            <div className="border-dashed border-2 border-gray-500 flex items-center justify-center h-64 bg-gray-700 rounded-lg">
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="opacity-0 w-full h-full cursor-pointer"
              />
              {previewUrl && (
                <div className="mt-2 items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full object-cover pr-10 rounded-lg items-center justify-center"
                  />
                </div>
              )}
              {formData.image ? (
                <p className="text-white pr-15">{formData.image.name}</p>
              ) : (
                <p className="text-gray-400 p-4">
                  Click to upload image. Max file size: 10MB. Supported formats:
                  JPG, PNG, GIF
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Event Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border placeholder-white border-white text-white rounded-lg"
                required
              />

              <textarea
                name="description"
                placeholder="Event Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border placeholder-white border-white text-white rounded-lg h-24"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  step="0.000000000000000001"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 placeholder-white border border-white text-white rounded-lg"
                />
                <input
                  type="number"
                  name="participants"
                  placeholder="Max Participants"
                  value={formData.participants}
                  onChange={(e) =>
                    setFormData({ ...formData, participants: e.target.value })
                  }
                  className="w-full px-4 py-2 placeholder-white border border-white text-white rounded-lg"
                />
              </div>


              <button
                type="submit"
                disabled={isLoading || isWaiting}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
              >
                {isLoading || isWaiting ? "Creating Event..." : "Create Event"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
