import {Button, Dialog, Input} from "@chakra-ui/react";
import UserAccountSelect from "@/components/UserAccountSelect";
import AssetSelect from "@/components/AssetSelect";
import {BN, SpotMarketAccount, WRAPPED_SOL_MINT} from "@drift-labs/sdk-browser";
import {useState} from "react";
import {getAssociatedTokenAddressSync} from "@solana/spl-token";
import useDriftStore from "@/store/driftStore";

const DepositForm = () => {
  const [amount, setAmount] = useState<BN>(new BN(0));
  const [spotMarketAccount, setSpotMarketAccount] = useState<SpotMarketAccount>();
  const { driftClient, selectedUser } = useDriftStore();

  const deposit = async () => {
    if (spotMarketAccount && selectedUser) {
      const mint = spotMarketAccount.mint;
      const isSol = mint?.toString() === WRAPPED_SOL_MINT.toString();
      if (isSol) {
        console.log("SOL Deposit");
      } else {
        const transferAmount = amount.mul(new BN(10).pow(new BN(spotMarketAccount.decimals)));
        console.log(transferAmount.toString());
        const associatedTokenAccount = getAssociatedTokenAddressSync(mint, selectedUser.account.authority);
        await driftClient?.deposit(
          transferAmount,
          spotMarketAccount.marketIndex,
          associatedTokenAccount,
          selectedUser.account.subAccountId,
        )
      }
    }
  };

  return (
    <>
      <Dialog.Body>
        <p>Deposited assets automatically earn yield through lending.</p>
        <br />
        <UserAccountSelect />
        <br />
        <div>Transfer type and Amount</div>
        <div className="flex">
          <AssetSelect spotMarketAccount={spotMarketAccount} setSpotMarketAccount={setSpotMarketAccount} />
          <Input
            type="number"
            value={amount.toString()}
            onChange={e => setAmount(new BN(e.currentTarget.value.trim()))}
            className="text-center"
          />
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button variant="outline">Cancel</Button>
        </Dialog.ActionTrigger>
        <Button onClick={deposit}>Deposit</Button>
      </Dialog.Footer>
    </>
  )
};

export default DepositForm;