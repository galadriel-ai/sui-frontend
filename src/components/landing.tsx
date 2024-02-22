"use client"

import {useEffect, useState} from "react"
import {ConnectButton, ConnectModal, useAccounts, useCurrentAccount, useSuiClient, useWallets} from "@mysten/dapp-kit"
// @ts-ignore
import {CoinBalance} from "@mysten/sui.js/src/client"
import {RunExplorer} from "@/components/explorer/runExplorer";

const MIST_PER_SUI = BigInt(1000000000)


export function Landing() {

  const client = useSuiClient()
  const wallets = useWallets()
  const accounts = useAccounts()
  const currentAccount = useCurrentAccount()

  // TODO: set dynamically somehow etc
  const runId: string = "0xd5923ed0b7ef32c3d4d14bf4594acb1d912573b6fb56ed245db0140ef334d997"

  const [balance, setBalance] = useState<number>(0)

  const getBalance = async (address: string) => {
    const balance = await client.getBalance({
      owner: address
    })
    setBalance(formatBalance(balance))
  }
  useEffect(() => {
    if (currentAccount) {
      getBalance(currentAccount.address)
    }
  }, [getBalance, currentAccount])


  const formatBalance = (balance: CoinBalance) => {
    return Number.parseInt(balance.totalBalance) / Number(MIST_PER_SUI)
  }


  return (
    <>
      <main className="flex min-h-screen flex-col items-center gap-20 p-12 justify-between">
        <div className="z-10 max-w-8xl w-full items-center justify-between font-mono text-sm lg:flex">
          {currentAccount ?
            <>
              Account balance {balance}
            </>
            :
            <>
              Not connected
            </>
          }
          <div
            className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
            <ConnectButton
              connectText={"Connect Wallet"}
            />
          </div>
        </div>

        <div
          className="flex flex-col gap-4 max-w-8xl w-full relative place-items-center">
          <RunExplorer runObjectId={runId}/>
        </div>

        <div>
          Copyright (c) 2024 Galadriel
        </div>
      </main>
    </>
  )
}
