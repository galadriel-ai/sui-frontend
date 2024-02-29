"use client"

import {useEffect, useState} from "react"
import {ConnectButton, useCurrentAccount, useSignAndExecuteTransactionBlock, useSuiClient} from "@mysten/dapp-kit"
// @ts-ignore
import {CoinBalance} from "@mysten/sui.js/src/client"
import {RunExplorer} from "@/components/explorer/runExplorer";
import {Input} from "@/components/ui/input";
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {ExplorerLinks} from "@/components/explorer/explorerLinks";
import {getFullnodeUrl, Network, NETWORK_IDS} from "@/types/network";

const MIST_PER_SUI = BigInt(1000000000)

interface Props {
  network: Network
  onSwitchNetwork: (network: Network) => void
}

export function Landing(props: Props) {
  const client = useSuiClient()
  const currentAccount = useCurrentAccount()
  const {mutate: signAndExecuteTransactionBlock} = useSignAndExecuteTransactionBlock();

  const [searchInput, setSearchInput] = useState<string>("")
  const [searchErrorMessage, setSearchErrorMessage] = useState<string>("")

  const [agentErrorMessage, setAgentErrorMessage] = useState<string>("")

  const [gameId, setGameId] = useState<string | undefined>()

  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    const getBalance = async (address: string) => {
      const balance = await client.getBalance({
        owner: address
      })
      setBalance(formatBalance(balance))
    }
    if (currentAccount && props.network) {
      getBalance(currentAccount.address)
    }
  }, [currentAccount, props.network])


  const formatBalance = (balance: CoinBalance) => {
    return Number.parseInt(balance.totalBalance) / Number(MIST_PER_SUI)
  }

  const onStartGame = (): void => {
    const txb = new TransactionBlock()
    const packageName: string = "rpg"
    const functionName: string = "start_game"
    txb.moveCall({
      target: `${NETWORK_IDS[props.network].packageId}::${packageName}::${functionName}`,
      // object IDs must be wrapped in moveCall arguments
      arguments: [
        txb.object(NETWORK_IDS[props.network].registryObjectId),
      ],
    })
    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
        // chain: `sui:${process.env.NETWORK || "devnet"}`,
        options: {
          showObjectChanges: true
        }
      },
      {
        onSuccess: (result) => {
          console.log("Executed transaction block");
          console.log(result);
          (result.objectChanges || []).forEach((o: any) => {
            if (o.objectType.includes("Game") && !o.objectType.includes("GamesRegistry")) {
              setGameId(o.objectId)
            }
          })
        },
        onError: (error) => {
          console.log("Transaction error")
          console.log(error)
        }
      },
    );
  }

  const SUI_ADDRESS_LENGTH: number = 32;

  const isHex = (value: string): boolean => {
    return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;
  }

  const getHexByteLength = (value: string): number => {
    return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
  }

  const isValidSuiAddress = (value: string): boolean => {
    return isHex(value) && getHexByteLength(value) === SUI_ADDRESS_LENGTH;
  }

  const onSearch = (): void => {
    if (searchInput) {
      if (!isValidSuiAddress(searchInput)) {
        setSearchErrorMessage("Invalid object ID")
        return
      }
      setGameId(searchInput)
    }
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
            className="flex flex-col h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
            <div className="mx-auto pb-2">
              Only regular wallets supported! (no zk support)
            </div>
            <div className="flex flex-row gap-4 items-center">
              <ConnectButton
                connectText={"Connect Wallet"}
              />
            </div>

          </div>
        </div>
        <div className="w-full text-left">
          <div className="pb-12">
            Make sure your wallet is connected to
            <span className="pl-2 font-bold">
              {props.network}
            </span>
          </div>
          <div>
            Game contract address: {NETWORK_IDS[props.network].packageId}
            <ExplorerLinks objectId={NETWORK_IDS[props.network].packageId} type={"object"} network={props.network}/>
          </div>
          <div className="pt-4">
            Game registry object: {NETWORK_IDS[props.network].registryObjectId}
            <ExplorerLinks objectId={NETWORK_IDS[props.network].registryObjectId} type={"object"}
                           network={props.network}/>
          </div>
        </div>
        <div
          className="w-full items-center flex flex-col p-6 bg-gray-200 rounded-2xl text-black border-t-2 border-blue-300">
          <div className="flex flex-row w-full gap-4">

            <div className="basis-1/2 flex flex-col grow gap-4 max-w-8xl w-full relative place-items-center h-full">
              {currentAccount ?
                <>
                  <div className="min-h-[24px] text-red-400">
                    {agentErrorMessage}
                  </div>
                  <button
                    className="p-2 px-4 rounded bg-gray-800 text-white hover:bg-gray-600 duration-200 focus:outline-none"
                    onClick={() => onStartGame()}
                  >
                    Start Game
                  </button>
                </>
                :
                <div className="pt-8">Connect wallet to play the game!</div>
              }
            </div>

            <div className="basis-1/2 flex flex-col grow gap-4 max-w-8xl w-full relative place-items-center h-full">
              <div className="min-h-[24px] text-red-400">
                {searchErrorMessage}
              </div>
              <Input
                value={searchInput}
                placeholder="Existing game ID"
                onChange={e => {
                  setSearchInput(e.target.value)
                  if (searchErrorMessage) setSearchErrorMessage("")
                  if (agentErrorMessage) setAgentErrorMessage("")
                }
                }
              />
              <button
                className="p-2 px-4 rounded bg-gray-800 text-white hover:bg-gray-600 duration-200 focus:outline-none"
                onClick={() => onSearch()}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col grow gap-4 max-w-8xl w-full relative place-items-center h-full">

          {gameId && <RunExplorer gameObjectId={gameId} network={props.network}/>}
        </div>

        <div>
          Copyright (c) 2024 Galadriel
        </div>
      </main>
    </>
  )
}
