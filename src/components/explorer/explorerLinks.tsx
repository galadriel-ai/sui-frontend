export const ExplorerLinks = ({objectId, type}: {
  objectId: string,
  type: "object" | "address"
}) => {
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