"use client"

import {Landing} from "@/components/landing";
import {useState} from "react";
import {createNetworkConfig, SuiClientProvider, WalletProvider} from "@mysten/dapp-kit";
import {QueryClient} from "@tanstack/query-core";
import {QueryClientProvider} from "@tanstack/react-query";

function getFullnodeUrl(network: 'mainnet' | 'testnet' | 'devnet' | 'localnet') {
  switch (network) {
    case 'mainnet':
      return 'https://fullnode.mainnet.sui.io:443';
    case 'testnet':
      return 'https://fullnode.testnet.sui.io:443';
    case 'devnet':
      return 'https://fullnode.devnet.sui.io:443';
    case 'localnet':
      return 'http://127.0.0.1:9000';
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

const {networkConfig} = createNetworkConfig({
  localnet: {url: getFullnodeUrl("localnet")},
  devnet: {url: getFullnodeUrl("devnet")},
  mainnet: {url: getFullnodeUrl("mainnet")},
});

const queryClient = new QueryClient();

export default function Home() {
  const networks = ["mainnet", "devnet", "localnet"]
  type Network = "mainnet" | "devnet" | "localnet"
  let currentNetwork: Network = "devnet"
  if (process.env.NEXT_PUBLIC_NETWORK && networks.includes(process.env.NEXT_PUBLIC_NETWORK)) {
    currentNetwork = process.env.NEXT_PUBLIC_NETWORK as Network
  }
  const [activeNetwork, setActiveNetwork] = useState(currentNetwork);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={currentNetwork}>
        <WalletProvider>
          <Landing/>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
