"use client"

import {Landing} from "@/components/landing";
import {useEffect, useState} from "react";
import {createNetworkConfig, SuiClientProvider, WalletProvider} from "@mysten/dapp-kit";
import {QueryClient} from "@tanstack/query-core";
import {QueryClientProvider} from "@tanstack/react-query";
import {getFullnodeUrl, Network, NETWORKS} from "@/types/network";


const {networkConfig} = createNetworkConfig({
  // localnet: {url: getFullnodeUrl("localnet")},
  devnet: {
    url: getFullnodeUrl("devnet"),
  },
  // mainnet: {url: getFullnodeUrl("mainnet")},
  custom: {
    url: getFullnodeUrl("custom"),
  },
});

const queryClient = new QueryClient()
const DEFAULT_NETWORK: Network = "devnet"

export default function Home() {

  const [currentNetwork, setCurrentNetwork] = useState<Network | undefined>()

  useEffect(() => {
    if (!currentNetwork) {
      let network: Network = DEFAULT_NETWORK
      if (process.env.NEXT_PUBLIC_NETWORK && NETWORKS.includes(process.env.NEXT_PUBLIC_NETWORK)) {
        network = process.env.NEXT_PUBLIC_NETWORK as Network
      }
      setCurrentNetwork(network)
    }
  }, [currentNetwork])

  const onSwitchNetwork = (network: Network) => {
    setCurrentNetwork(network)
  }

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} network={currentNetwork}>
          <WalletProvider>
            <Landing network={currentNetwork || DEFAULT_NETWORK} onSwitchNetwork={onSwitchNetwork}/>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </>
  )
}
