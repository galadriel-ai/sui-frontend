import {useEffect, useState} from "react"
import {useSuiClient} from "@mysten/dapp-kit"
// @ts-ignore
import {SuiParsedData} from "@mysten/sui.js/src/types"
import {ExplorerLinks} from "@/components/explorer/explorerLinks"
import {JSONTree} from 'react-json-tree';

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

  let [isLoading, setIsLoading] = useState<boolean>(false)
  let [agentRun, setAgentRun] = useState<AgentRun | undefined>()

  useEffect(() => {
    if (runObjectId) {
      setIsLoading(true)
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
      setIsLoading(false)
      setAgentRun(agentRun)
      if (!agentRun.isFinished) {
        await new Promise(r => setTimeout(r, 3000))
        await getRunObject(objectId)
      }
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
    <div className="flex flex-col gap-y-2 w-full pt-10 pb-32">
      {(agentRun && !isLoading) &&
        <AgentRunDisplay agentRun={agentRun}/>
      }
      {isLoading && <Loader/>}
    </div>

  </>
}

const AgentRunDisplay = ({agentRun}: { agentRun: AgentRun }) => {
  return <>
    <div className="bg-[#1c1a1a] rounded-2xl p-4 border-t-2 border-blue-300 border-opacity-50">

      <h1 className="text-4xl font-semibold">Agent run details</h1>
      <div className="flex flex-col gap-5 pt-5">
        <div className="flex flex-row gap-5">
          <div><span className="text-blue-200">Object id:</span> {agentRun.id}</div>
          <ExplorerLinks objectId={agentRun.id} type={"object"}/>
        </div>
        <div className="flex flex-row gap-5">
          <div><span className="text-blue-200">Owner:</span> {agentRun.owner}</div>
          <ExplorerLinks objectId={agentRun.owner} type={"address"}/>
        </div>
        {agentRun.knowledgeBase &&
          <div className="flex flex-row gap-5">
            <div><span className="text-blue-200">Knowledge base:</span> {agentRun.knowledgeBase}</div>
          </div>
        }
        {agentRun.knowledgeBase &&
          <div className="flex flex-row gap-5">
            {agentRun.knowledgeBaseDescription}
          </div>
        }
        <div className="flex flex-row gap-5">
          <div><span className="text-blue-200">Max iterations:</span> {agentRun.maxIterations}</div>

        </div>
        <div className="flex flex-row gap-5">
          <div><span className="text-blue-200">Status:</span> {agentRun.isFinished ? "Finished" : "Running"}</div>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-y-10 pt-10">
      {agentRun && <>
        {agentRun.llmData.map((d, i) => <div
          key={d.id}
          className="flex flex-row gap-10 pt-10 border-t-2 border-blue-300 border-opacity-50 bg-[#1c1a1a] p-4 rounded-2xl"
        >
          <div className="basis-1/4 flex flex-col gap-3">
            <div>Index: {d.index}</div>
            <LlmDataType type={d.type}/>
            <span className="text-xs">{d.id}</span>
            <div>
              <ExplorerLinks objectId={d.id} type={"object"}/>
            </div>
            {d.functionRunId && <div>
              Function run ID: {d.functionRunId}
            </div>}
          </div>
          <div className="basis-3/4 whitespace-pre-line rounded-2xl bg-[#141414] bg-opacity-80 p-4">
            <LlmDataContent text={d.content} isFirst={i === 0}/>
          </div>
        </div>)}
        {!agentRun.isFinished && <Loader/>}
      </>
      }
    </div>
  </>
}

const LlmDataType = ({type}: { type: string }) => {
  let className: string = ""
  if (type.toLowerCase() === "user") {
    className = "text-green-400"
  } else if (type.toLowerCase() === "assistant") {
    className = "text-green-600"
  } else if (["function", "function_result"].includes(type.toLowerCase())) {
    className = "text-blue-400"
  }
  return <div className={className}>
    Type: {type}
  </div>
}

const LlmDataContent = ({text, isFirst}: { text: string, isFirst: boolean }) => {
  function hasJsonStructure(value: string) {
    try {
      const result = JSON.parse(value);
      const type = Object.prototype.toString.call(result);
      return type === '[object Object]' || type === '[object Array]'
    } catch (err) {
      return false;
    }
  }

  const theme = {
    scheme: 'monokai',
    author: 'wimer hazenberg (http://www.monokai.nl)',
    base00: 'opaque',
    base01: 'opaque',
    base02: '#49483e',
    base03: '#75715e',
    base04: '#a59f85',
    base05: '#f8f8f2',
    base06: '#f5f4f1',
    base07: '#f9f8f5',
    base08: '#f92672',
    base09: '#fd971f',
    base0A: '#f4bf75',
    base0B: '#b5ef72',
    base0C: '#a1efe4',
    base0D: '#60A5FAFF',
    base0E: '#ae81ff',
    base0F: '#cc6633',
  };

  return <div>
    {!hasJsonStructure(text) ?
      <>{isFirst ?
        <>{text.split("Begin!\nQuestion: ").length > 1 ?
          <>
            {text.split("Begin!\nQuestion: ")[0]}
            {"Begin!\nQuestion: "}
            <span className="font-bold">
              {text.split("Begin!\nQuestion: ")[1].split("\nThought:")[0]}
            </span>
            {"\nThought: "}
          </>
          :
          <>{text}</>
        }</>
        :
        <>{text}</>
      }
      </>
      :
      <JSONTree
        hideRoot={true}
        data={JSON.parse(text)}
        theme={theme}
      />
    }
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
