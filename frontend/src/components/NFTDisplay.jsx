import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { config } from '../configs/WagmiConfig';
import { eventTicketAddress } from '../constants/constant.jsx';
import abi from '../constants/EventTicketAbi.json';

export default function CreateEvent() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        participants: '',
        category: '',
        image: null
    });

    const [txHash, setTxHash] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();

    const { isLoading: isWaiting, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
        hash: txHash
    });

    useEffect(() => {
        if (isSuccess) {
            alert('✅ Event successfully created!');
            setFormData({
                name: '',
                description: '',
                price: '',
                participants: '',
                category: '',
                image: null
            });
            setTxHash(null);
        }
        if (receiptError) {
            console.error('❌ Transaction failed:', receiptError.message);
            setError(receiptError.message);
        }
    }, [isSuccess, receiptError]);

    const uploadToIpfs = async () => {
        try {
            if (!formData.image) throw new Error('No image selected.');
            const form = new FormData();
            form.append('file', formData.image);

            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: { Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}` },
                body: form
            });

            if (!response.ok) {
                throw new Error(`IPFS upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.IpfsHash) return `ipfs://${result.IpfsHash}`;
            throw new Error('Failed to get IPFS hash.');
        } catch (err) {
            console.error('IPFS Upload Error:', err);
            throw err;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Form validation
            if (!formData.name || !formData.description || !formData.price || !formData.participants || !formData.image) {
                throw new Error('Please fill in all fields.');
            }

            // Upload image to IPFS
            const ipfsUrl = await uploadToIpfs();
            console.log('🚀 IPFS URL:', ipfsUrl);

            // Prepare price value
            const priceInWei = parseEther(formData.price);

            // Contract interaction
            try {
                const hash = await writeContractAsync({
                    address: eventTicketAddress,
                    abi,
                    functionName: 'createEvent',
                    args: [
                        formData.name,
                        formData.description,
                        priceInWei,
                        BigInt(formData.participants),
                        ipfsUrl
                    ],
                    account: address
                });

                if (!hash) {
                    throw new Error('Transaction failed - no hash returned');
                }

                setTxHash(hash);
                console.log('📜 Transaction Hash:', hash);
            } catch (contractError) {
                console.error('Contract Error:', contractError);
                throw new Error(`Contract interaction failed: ${contractError.message}`);
            }

        } catch (err) {
            console.error('❌ Error creating event:', err);
            setError(err.message || 'Failed to create event');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6">Create New Event</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Event Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Price (ETH)</label>
                        <input
                            type="number"
                            name="price"
                            step="0.000000000000000001"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                        <input
                            type="number"
                            name="participants"
                            value={formData.participants}
                            onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Event Image</label>
                        <input
                            type="file"
                            name="image"
                            accept="image/*"
                            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isWaiting}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                    >
                        {isLoading || isWaiting ? 'Creating Event...' : 'Create Event'}
                    </button>
                </form>
            </div>
        </div>
    );
}