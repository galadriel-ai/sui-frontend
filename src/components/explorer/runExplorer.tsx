import {useEffect, useState} from "react"
import {useCurrentAccount, useSuiClient, useSignAndExecuteTransactionBlock} from "@mysten/dapp-kit"
// @ts-ignore
import {SuiParsedData} from "@mysten/sui.js/src/types"
import {ExplorerLinks} from "@/components/explorer/explorerLinks"
import {Network, NETWORK_IDS} from "@/types/network";
import {TransactionBlock} from '@mysten/sui.js/transactions';


interface Props {
  gameObjectId: string
  network: Network
}

interface GamePrompt {
  id: string
  index: number
  imageUrl: string
  content: string
}

interface UserSelection {
  // Not yet indexed
  id: string | undefined
  index: number
  selection: number
}

interface Game {
  id: string
  index: number
  player: string
  isFinished: boolean
  promptsId: string
  prompts: GamePrompt[]
  userSelectionsId: string
  userSelections: UserSelection[]
}

const SELECTIONS = ["A", "B", "C", "D"]

export const RunExplorer = ({gameObjectId, network}: Props) => {
  const client = useSuiClient()

  let [isLoading, setIsLoading] = useState<boolean>(false)
  let [gameRun, setGameRun] = useState<Game | undefined>()

  useEffect(() => {
    if (gameObjectId) {
      setIsLoading(true)
      getGameObject(gameObjectId)
    }
  }, [client, gameObjectId])

  const getObject = async (objectId: string) => {
    return await client.getObject({
      id: objectId,
      options: {
        showContent: true
      }
    })
  }

  const getGameObject = async (objectId: string) => {
    const object = await getObject(objectId);
    const content: SuiParsedData | null | undefined = object.data?.content
    if (content && content["fields"]) {
      const fields = content["fields"]["value"]["fields"]
      const gameRun: Game = {
        id: objectId,
        index: fields.index,
        player: fields.player,
        isFinished: fields.is_finished,
        promptsId: fields.prompts.fields.id.id,
        prompts: [],
        userSelectionsId: fields.user_selections.fields.id.id,
        userSelections: []
      }
      gameRun.prompts = await getGamePrompts(gameRun.promptsId)
      gameRun.userSelections = await getUserSelections(gameRun.userSelectionsId)
      setIsLoading(false)
      setGameRun(gameRun)
      if (!gameRun.isFinished) {
        await new Promise(r => setTimeout(r, 3000))
        await getGameObject(objectId)
      }
    }
  }

  const getGamePrompts = async (objectId: string): Promise<GamePrompt[]> => {
    const dynamicFields = await client.getDynamicFields({
      parentId: objectId,
    })
    const prompts: GamePrompt[] = []
    for (const d of dynamicFields.data) {
      const object = await getObject(d.objectId)
      const content: SuiParsedData | null | undefined = object.data?.content
      if (content && ((content["fields"] || {})["value"] || {})["fields"]) {
        const fields = content["fields"]["value"]["fields"]
        prompts.push({
          id: d.objectId,
          index: parseInt(content["fields"].name),
          imageUrl: fields.image_url,
          content: fields.content,
        })
      }
    }
    return prompts.sort((d1, d2) => d1.index - d2.index)
  }

  const getUserSelections = async (objectId: string): Promise<UserSelection[]> => {
    const dynamicFields = await client.getDynamicFields({
      parentId: objectId,
    })
    const selections: UserSelection[] = []
    for (const d of dynamicFields.data) {
      const object = await getObject(d.objectId)
      const content: SuiParsedData | null | undefined = object.data?.content
      if (content && content.fields) {
        const fields = content.fields
        selections.push({
          id: d.objectId,
          index: parseInt(content["fields"].name),
          selection: fields.value,
        })
      }
    }
    return selections.sort((d1, d2) => d1.index - d2.index)
  }

  const onNewSelection = (selection: number) => {
    if (gameRun && gameRun.userSelections) {
      gameRun.userSelections.push({
        id: undefined,
        index: gameRun.userSelections.length - 1,
        selection: selection,
      })
      setGameRun(gameRun)
    }
  }

  return <>
    <div className="flex flex-col gap-y-2 w-full pt-10 pb-32">
      {(gameRun && !isLoading) &&
        <GameDisplay game={gameRun} network={network} onNewSelection={onNewSelection}/>
      }
      {isLoading && <Loader/>}
    </div>

  </>
}

const GameDisplay = ({game, network, onNewSelection}: {
  game: Game,
  network: Network,
  onNewSelection: (selection: number) => void
}) => {
  const currentAccount = useCurrentAccount()
  const {mutate: signAndExecuteTransactionBlock} = useSignAndExecuteTransactionBlock();

  let [isSelectionLoading, setIsSelectionLoading] = useState<boolean>(false)

  const onSelection = async (selection: number): Promise<void> => {
    setIsSelectionLoading(true)
    const txb = new TransactionBlock()
    const packageName: string = "rpg"
    const functionName: string = "add_game_answer"
    txb.moveCall({
      target: `${NETWORK_IDS[network].packageId}::${packageName}::${functionName}`,
      // object IDs must be wrapped in moveCall arguments
      arguments: [
        txb.pure.u8(selection),
        txb.object(NETWORK_IDS[network].registryObjectId),
        txb.pure.u64(game.index),
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
          setIsSelectionLoading(false)
          onNewSelection(selection)
        },
        onError: (error) => {
          console.log("Transaction error")
          console.log(error)
          setIsSelectionLoading(false)
        }
      },
    );
  }

  return <>
    <div className="bg-[#1c1a1a] rounded-2xl p-4 border-t-2 border-blue-300 border-opacity-50">

      <h1 className="text-4xl font-semibold">Game details</h1>
      <div className="flex flex-col gap-5 pt-5">
        <div className="flex flex-row gap-5">
          <div><span className="text-blue-200">Object id:</span> {game.id}</div>
          <ExplorerLinks objectId={game.id} type={"object"} network={network}/>
        </div>
        <div className="flex flex-row gap-5">
          <div><span className="text-blue-200">Owner:</span> {game.player}</div>
          <ExplorerLinks objectId={game.player} type={"address"} network={network}/>
        </div>
        <div className="flex flex-row gap-5">

        </div>
        <div className="flex flex-row gap-5">
          <div><span className="text-blue-200">Status:</span> {game.isFinished ? "Finished" : "Running"}</div>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-y-10 pt-10">
      {game && <>
        {game.prompts.map((d, i) =>
          <div
            key={d.id}
            className="flex flex-col gap-10 pt-10 border-t-2 border-blue-300 border-opacity-50 bg-[#1c1a1a] p-4 rounded-2xl"
          >
            <div className="flex flex-col gap-2">
              <div>Index: {d.index}</div>
              <div className="flex flex-row gap-2 items-center">
                <span className="text-xs">{d.id}</span>
                <ExplorerLinks objectId={d.id} type={"object"} network={network}/>
              </div>
            </div>
            <div className="mx-auto pt-10">
              {d.imageUrl &&
                <img
                  src={d.imageUrl}
                  alt={`Story illustration ${i}`}
                  width={1000}
                  height={1000}
                />
              }
            </div>
            <div className="whitespace-pre-line rounded-2xl bg-[#141414] bg-opacity-80 p-4">
              <div>{d.content}</div>
            </div>
            {(game.userSelections.length < (i + 1) && currentAccount && currentAccount.address === game.player) &&
              <>
                {isSelectionLoading ?
                  <Loader/>
                  :
                  <Selector onSelection={onSelection}/>
                }
              </>
            }
            {game.userSelections.length > i &&
              <div className="p-4">
                User selection: {SELECTIONS[game.userSelections[i].selection]}
                <div className="pt-2">
                  {(game.userSelections.length > i && game.userSelections[i].id) &&
                    <ExplorerLinks objectId={game.userSelections[i].id || ""} type={"object"} network={network}/>
                  }
                </div>
              </div>
            }
          </div>
        )}

        {(!game.isFinished && game.prompts.length == game.userSelections.length) && <Loader/>}
      </>
      }
    </div>
  </>
}

const Selector = ({onSelection}: { onSelection: (selection: number) => Promise<void> }) => {

  return <div className="flex flex-col gap-6 p-6">
    Choose your next step!
    <div className="flex flex-row gap-12">
      {SELECTIONS.map((selection: string, i: number) =>
        <div
          className="border-2 rounded p-4 cursor-pointer hover:bg-white hover:text-black duration-150"
          key={`selection-${i}`}
          onClick={() => onSelection(i)}
        >
          {selection}
        </div>
      )}
    </div>
  </div>
}

const Loader = () => {
  return <div className="pt-20">
    <svg className="animate-spin h-32 w-32 mx-auto text-white" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
}
