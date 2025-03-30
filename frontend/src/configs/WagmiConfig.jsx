// 1. First, let's update the Wagmi configuration (configs/WagmiConfig.jsx)
import { http, createConfig } from 'wagmi'
import { hardhat, sepolia , mainnet } from 'wagmi/chains'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'

// Modified hardhat chain for local development
const localHardhat = {
  ...hardhat,
  id: 31337,
  name: 'Hardhat Local',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  }
}



export const config = createConfig({
  appName: 'NFT-MARKET-PLACE',
  projectId: import.meta.env.VITE_WALLET_CONNECT,


  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(import.meta.env.VITE_MAINNET_URL),
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_URL),
    [hardhat.id]: http(import.meta.env.VITE_HARDHAT_URL),
    [localHardhat.id]: http(),
  },
})