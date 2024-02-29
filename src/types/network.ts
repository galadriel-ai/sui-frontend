export function getFullnodeUrl(network: Network) {
  switch (network) {
    // case "mainnet":
    //   return "https://fullnode.mainnet.sui.io:443";
    //   SuiClientProvider does not support testnet? :O
    // case "testnet":
    //   return "https://fullnode.testnet.sui.io:443";
    case "devnet":
      return "https://fullnode.devnet.sui.io:443";
    case "localnet":
      return "http://127.0.0.1:9000";
    // case "custom":
    //   return "http://34.76.196.93:9001";
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

// export type Network = "mainnet" | "devnet" | "localnet" | "custom"
export type Network = "devnet" | "localnet"
export const NETWORKS = ["mainnet", "devnet", "localnet", "custom"]

type NetworkIds = {
  packageId: string
  registryObjectId: string
}
export const NETWORK_IDS: { devnet: NetworkIds, localnet: NetworkIds } = {
  devnet: {
    packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || "",
    registryObjectId: process.env.NEXT_PUBLIC_REGISTRY_OBJECT_ID || "",
  },
  localnet: {
    packageId: process.env.NEXT_PUBLIC_LOCAL_PACKAGE_ID || "",
    registryObjectId: process.env.NEXT_PUBLIC_LOCAL_REGISTRY_OBJECT_ID || "",
  },
}
