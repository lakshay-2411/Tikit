import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import EventTicketABI from '../constants/EventTicketAbi.json';
import { formatEther } from 'viem';

const CheckNFTs = () => {
    const { address, isConnected } = useAccount();
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get all events
    const { data: allEvents, error: eventsError } = useReadContract({
        address: '' ,// contract address ,
        abi: EventTicketABI,
        functionName: 'getAllEvents',
    });

    // Read multiple balances at once when we have events
    const { data: balances, error: balancesError } = useReadContracts({
        contracts: allEvents?.map(event => ({
            address: '' ,//contract address ,
            abi: EventTicketABI,
            functionName: 'getTicketBalance',
            args: [address, event.eventId],
        })) || [],
        enabled: Boolean(allEvents?.length && isConnected),
    });

    useEffect(() => {
        if (!isConnected) {
            setLoading(false);
            return;
        }
    
        if (eventsError || balancesError) {
            setError(eventsError?.message || balancesError?.message);
            setLoading(false);
            return;
        }
    
        if (allEvents && allEvents.length > 0 && balances) {
            try {
                const userNFTs = allEvents
                    .map((event, index) => ({
                        eventId: event.eventId,
                        name: event.name,
                        description: event.description,
                        price: formatEther(event.basePrice),
                        maxParticipants: Number(event.maxParticipants),
                        currentSupply: Number(event.currentSupply),
                        uri: event.uri,
                        active: event.active,
                        balance: Number(balances[index]?.result || 0),
                    }))
                    .filter(nft => nft.balance > 0);
    
                setNfts(userNFTs);
            } catch (err) {
                setError('Error processing NFT data: ' + err.message);
            }
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [isConnected, allEvents, balances, eventsError, balancesError]);
    

    if (!isConnected) {
        return (
            <div className="p-4 text-center">
                <p className="text-gray-600">Please connect your wallet to view your NFTs</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Your NFTs</h1>
            {nfts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map((nft) => (
                        <div key={nft.eventId} className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold mb-2">{nft.name}</h3>
                            <div className="space-y-2">
                                <p className="text-gray-600">Event ID: #{nft.eventId}</p>
                                <p className="text-gray-600">Your Balance: {nft.balance}</p>
                                <p className="text-gray-600">Price: {nft.price} ETH</p>
                                <p className="text-gray-600">
                                    Supply: {nft.currentSupply}/{nft.maxParticipants}
                                </p>
                                <p className="text-gray-600">
                                    Status: {nft.active ? (
                                        <span className="text-green-600">Active</span>
                                    ) : (
                                        <span className="text-red-600">Inactive</span>
                                    )}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">{nft.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No NFTs found in your wallet</p>
                </div>
            )}
        </div>
    );
};

export default CheckNFTs;