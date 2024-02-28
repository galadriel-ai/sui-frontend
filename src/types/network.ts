export function getFullnodeUrl(network: Network) {
  switch (network) {
    // case "mainnet":
    //   return "https://fullnode.mainnet.sui.io:443";
    //   SuiClientProvider does not support testnet? :O
    // case "testnet":
    //   return "https://fullnode.testnet.sui.io:443";
    case "devnet":
      return "https://fullnode.devnet.sui.io:443";
    // case "localnet":
    //   return "http://127.0.0.1:9000";
    case "custom":
      return "http://34.76.196.93:9001";
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

// export type Network = "mainnet" | "devnet" | "localnet" | "custom"
export type Network = "devnet" | "custom"
export const NETWORKS = ["mainnet", "devnet", "localnet", "custom"]

type NetworkIds = {
  packageId: string
  oracleAccountAddress: string
  registryPackageId: string
  registryObjectId: string
}
export const NETWORK_IDS: { devnet: NetworkIds, custom: NetworkIds } = {
  devnet: {
    packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || "",
    oracleAccountAddress: process.env.NEXT_PUBLIC_ORACLE_ACCOUNT_ADDRESS || "",
    registryPackageId: process.env.NEXT_PUBLIC_REGISTRY_PACKAGE_ID || "",
    registryObjectId: process.env.NEXT_PUBLIC_REGISTRY_OBJECT_ID || "",
  },
  custom: {
    packageId: process.env.NEXT_PUBLIC_CUSTOM_PACKAGE_ID || "",
    oracleAccountAddress: process.env.NEXT_PUBLIC_CUSTOM_ORACLE_ACCOUNT_ADDRESS || "",
    registryPackageId: process.env.NEXT_PUBLIC_CUSTOM_REGISTRY_PACKAGE_ID || "",
    registryObjectId: process.env.NEXT_PUBLIC_CUSTOM_REGISTRY_OBJECT_ID || "",
  },
}
