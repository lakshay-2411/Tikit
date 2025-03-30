import React from 'react'
import {useAccount , useReadContract , useWriteContract} from 'wagmi'
function StackingDashboard() {

    const {address} = useAccount();

    const {data : stakeInfo } = useReadContract({
        address,
        abi,
        functionName : 'getStakeInfo',
        args : [address]
    })

    const {write : unstake } = useWriteContract({
        address,
        abi,
        functionName : 'unstake'
    })

    const calculateTimeRemaining = () => {
        if (!stakeInfo?.timestamp) return null;
        const stakingTime = new Date(stakeInfo.timestamp * 1000);
        const minimumStakeTime = new Date(stakingTime.getTime() + (30 * 24 * 60 * 60 * 1000));
        const now = new Date();
        
        if (now < minimumStakeTime) {
          const difference = minimumStakeTime - now;
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          return `${days} days remaining`;
        }
        return 'Ready to unstake';
      };

  return (
    <div className="max-w-4xl mx-auto p-4">
    <h1 className="text-3xl font-bold mb-6">Staking Dashboard</h1>
    {stakeInfo?.amount > 0 ? (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Stake</h2>
        <div className="space-y-4">
          <p>Event ID: {stakeInfo.eventId}</p>
          <p>Staked Amount: {stakeInfo.amount} tickets</p>
          <p>Potential Reward: {stakeInfo.potentialReward}% discount</p>
          <p>Status: {calculateTimeRemaining()}</p>
          <button
            onClick={() => unstake()}
            disabled={calculateTimeRemaining() !== 'Ready to unstake'}
            className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            Unstake Tickets
          </button>
        </div>
      </div>
    ) : (
      <p>No active stakes found. Stake your tickets to earn rewards!</p>
    )}
  </div>
  )
}

export default StackingDashboard
