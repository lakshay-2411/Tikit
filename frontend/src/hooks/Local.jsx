import { useNetwork } from 'wagmi'

export function useCurrentNetwork() {
  const { chain } = useNetwork()
  
  return {
    isHardhat: chain?.id === 31337,
    isSepolia: chain?.id === 11155111,
    chainId: chain?.id
  }
}