import {Network} from "@/types/network";

export const ExplorerLinks = ({objectId, type, network}: {
  objectId: string,
  type: "object" | "address",
  network: Network,
}) => {
  return <>
    {network === "devnet" &&
      <div className="flex flex-row gap-4 z-10">
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
  </>
}