import {useEffect, useState} from "react"
import {useSuiClient} from "@mysten/dapp-kit"
// @ts-ignore
import {SuiParsedData} from "@mysten/sui.js/src/types"


interface Props {
  runObjectId: string
}

interface LlmData {
  id: string
  index: number
  content: string
  type: string
  functionRunId: string
}

interface AgentRun {
  id: string
  owner: string
  knowledgeBase: string
  knowledgeBaseDescription: string
  maxIterations: number
  isFinished: boolean
  llmDataId: string
  llmData: LlmData[]
}

export const RunExplorer = ({runObjectId}: Props) => {
  const client = useSuiClient()

  let [agentRun, setAgentRun] = useState<AgentRun | undefined>()

  useEffect(() => {
    if (runObjectId) {
      getRunObject(runObjectId)
    }
  }, [client, runObjectId])

  const getObject = async (objectId: string) => {
    return await client.getObject({
      id: objectId,
      options: {
        showContent: true
      }
    })
  }

  const getRunObject = async (objectId: string) => {
    const object = await getObject(objectId);
    const content: SuiParsedData | null | undefined = object.data?.content
    if (content && content["fields"]) {
      const fields = content["fields"]
      const llmDataId = fields.llm_data.fields.id.id
      const agentRun: AgentRun = {
        id: objectId,
        owner: fields.owner,
        knowledgeBase: fields.knowledge_base,
        knowledgeBaseDescription: fields.knowledge_base_description,
        maxIterations: Number.parseInt(fields.max_iterations),
        isFinished: fields.is_finished,
        llmDataId,
        llmData: await getRunLlmData(llmDataId),
      }
      setAgentRun(agentRun)
    }
  }

  const getRunLlmData = async (objectId: string) => {
    const dynamicFields = await client.getDynamicFields({
      parentId: objectId,
    })
    const llmData: LlmData[] = []
    for (const d of dynamicFields.data) {
      const object = await getObject(d.objectId)
      // const content: SuiParsedData = object.data?.content
      const content: SuiParsedData | null | undefined = object.data?.content
      if (content && ((content["fields"] || {})["value"] || {})["fields"]) {
        const fields = content["fields"]["value"]["fields"]
        console.log(d)
        llmData.push({
          id: d.objectId,
          index: fields.index,
          content: fields.content,
          type: fields.type,
          functionRunId: fields.function_run_id,
        })
      }
    }
    return llmData.sort((d1, d2) => d1.index - d2.index)
  }

  return <>
    <div className="flex flex-col gap-y-2 w-full">
      {agentRun && <AgentRunDisplay agentRun={agentRun}/>}
    </div>

  </>
}

const AgentRunDisplay = ({agentRun}: { agentRun: AgentRun }) => {
  return <>
    <h1 className="text-4xl font-semibold">Agent run details</h1>
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex flex-row gap-5">
        Object id: {agentRun.id}
        <ExplorerLinks objectId={agentRun.id} type={"object"}/>
      </div>
      <div className="flex flex-row gap-5">
        Owner: {agentRun.owner}
        <ExplorerLinks objectId={agentRun.owner} type={"address"}/>
      </div>
      {agentRun.knowledgeBase &&
        <div className="flex flex-row gap-5">
          Knowledge base: {agentRun.knowledgeBase}
        </div>
      }
      {agentRun.knowledgeBase &&
        <div className="flex flex-row gap-5">
          {agentRun.knowledgeBaseDescription}
        </div>
      }
      <div className="flex flex-row gap-5">
        Max iterations: {agentRun.maxIterations}
      </div>
      <div className="flex flex-row gap-5">
        Status: {agentRun.isFinished ? "Finished" : "Running"}
      </div>
      {/*owner: string
  knowledgeBase: string
  knowledgeBaseDescription: string
  maxIterations: number
  isFinished: boolean*/}
    </div>
    <div className="flex flex-col gap-y-10 pt-10">
      {agentRun && <>
        {agentRun.llmData.map(d => <div
          key={d.id}
          className="flex flex-row gap-10 pt-10 border-t-2 border-blue-300 border-opacity-50"
        >
          <div className="basis-1/4 flex flex-col gap-3">
            <div>Index: {d.index}</div>
            <span className="text-xs">{d.id}</span>
            <div>
              <ExplorerLinks objectId={d.id} type={"object"}/>
            </div>
          </div>
          <div className="basis-3/4">
            {d.content}
          </div>
        </div>)}
      </>
      }
    </div>
  </>
}

const ExplorerLinks = ({objectId, type}: { objectId: string, type: "object" | "address" }) => {
  return <div className="flex flex-row gap-4 z-10">
    <a
      href={`https://suiscan.com/${type}/${objectId}?network=devnet`}
      target={"_blank"}
      className="underline"
    >
      Suiscan.com
    </a>
    <a
      href={`https://suiscan.xyz/devnet/${type}/${objectId}`}
      target={"_blank"}
      className="underline"
    >
      Suiscan.xyz
    </a>
  </div>
}