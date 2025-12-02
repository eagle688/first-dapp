export default function TransactionIcon({
  type,
  category,
}: {
  type: string;
  category: string;
}) {
  const getIcon = () => {
    if (category === "erc20") return "🪙";
    if (type === "receive") return "⬇️";
    return "⬆️";
  };

  const getColor = () => {
    if (type === "receive") return "bg-green-500/20 text-green-400";
    return "bg-red-500/20 text-red-400";
  };

  return <div className={`p-2 rounded-full ${getColor()}`}>{getIcon()}</div>;
}
