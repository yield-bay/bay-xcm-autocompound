import { FC } from "react";
import { useAtom } from "jotai";
import { walletDialogOpenAtom } from "@store/commonAtoms";
import { accountAtom } from "@store/accountAtoms";

const ConnectWalletButton: FC = () => {
  const [walletDialogOpen, setWalletDialogOpen] = useAtom(walletDialogOpenAtom);
  const handleClick = () => {
    setWalletDialogOpen(true);
  }
  const [account] = useAtom(accountAtom);

  return (
    <button
      onClick={handleClick}
      className="border border-blue-400 hover:border-blue-500 rounded-md px-4 py-2 text-blue-900 font-semibold bg-blue-50 active:bg-blue-100 transition duration-200"
    >
      {account == null ? "Connect Wallet" : `${account}`}
    </button>
  )
}

export default ConnectWalletButton;
