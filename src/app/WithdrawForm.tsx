'use client';

import {Box, Button, Dialog, Input, Text} from "@chakra-ui/react";
import UserAccountSelect from "@/app/UserAccountSelect";
import AssetSelect from "@/app/AssetSelect";
import {SpotMarketAccount, WRAPPED_SOL_MINT, ZERO} from "@drift-labs/sdk-browser";
import {useMemo, useState} from "react";
import {getAssociatedTokenAddressSync} from "@solana/spl-token";
import useDriftStore from "@/store/driftStore";
import {decimalStrToBN, formatBigNum} from "@/utils/strings";
import {toast} from "react-toastify";


const WithdrawForm = () => {
  const [amountStr, setAmountStr] = useState<string>("0");
  const [spotMarketAccount, setSpotMarketAccount] = useState<SpotMarketAccount>();
  const { driftClient, selectedUser, lastUpdatedAt } = useDriftStore();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.currentTarget.value;
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.substring(1);
    }
    if (value === "" || value === ".") {
      value = "0";
    }
    setAmountStr(value);
  };

  const availableBalanceBn = useMemo(() => {
    if (!selectedUser?.driftUser || spotMarketAccount === undefined) {
      return undefined;
    }
    const spotPosition = selectedUser.driftUser.getSpotPosition(spotMarketAccount.marketIndex);
    return spotPosition ? spotPosition.scaledBalance : ZERO;
  }, [selectedUser, spotMarketAccount, lastUpdatedAt]);

  const formattedBalance = useMemo(() => {
    if (spotMarketAccount === undefined || availableBalanceBn === undefined) {
      return '0.00';
    }
    return formatBigNum(availableBalanceBn, spotMarketAccount.decimals);
  }, [availableBalanceBn, spotMarketAccount]);


  const withdraw = async () => {
    if (!driftClient || !selectedUser || !spotMarketAccount || availableBalanceBn === undefined) {
      toast.error("Missing Information");
      return;
    }
    if (!amountStr || parseFloat(amountStr) <= 0) {
      toast.error("Invalid Amount");
      return;
    }

    try {
      const mint = spotMarketAccount.mint;
      const isSol = mint.equals(WRAPPED_SOL_MINT);
      const decimals = spotMarketAccount.decimals;
      const transferAmount = decimalStrToBN(amountStr, decimals);

      if (transferAmount.isZero()) {
        toast.error("Invalid Amount");
        return;
      }

      if (transferAmount.gt(availableBalanceBn)) {
        toast.error("Insufficient Balance");
        return;
      }


      const destinationAccount = isSol
        ? selectedUser.account.authority
        : getAssociatedTokenAddressSync(mint, selectedUser.account.authority);

      await driftClient.withdraw(
        transferAmount,
        spotMarketAccount.marketIndex,
        destinationAccount,
        false,
        selectedUser.account.subAccountId,
      );

      toast.success("Withdrawal Submitted");
      setAmountStr("0");

    } catch (error) {
      console.error("Withdrawal failed:", error);
      toast.error("Withdrawal Failed");
    }
  };

  if (!driftClient) {
    return null;
  }

  return (
    <>
      <Dialog.Body>
        <p>Withdraw assets from your Drift account to your wallet.</p>
        <br />
        <UserAccountSelect label="Withdraw From:" />
        <br />
        <div>Withdrawal Amount</div>
        <div className="flex items-center space-x-2">
          <AssetSelect<SpotMarketAccount>
            selectedMarketAccount={spotMarketAccount}
            setMarketAccount={setSpotMarketAccount}
            marketAccounts={driftClient.getSpotMarketAccounts()}
          />
          <Input
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="text-right flex-1"
            min={0}
          />
        </div>
        <Box textAlign="right" mt={1} mr={1} height="20px">
          {spotMarketAccount && selectedUser && (
            <Text fontSize="xs" color="gray.500">
              Balance: {formattedBalance} {Buffer.from(spotMarketAccount.name).toString()}
            </Text>
          )}
        </Box>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button variant="outline">Cancel</Button>
        </Dialog.ActionTrigger>
        <Button onClick={withdraw} disabled={!driftClient || !selectedUser || !spotMarketAccount || parseFloat(amountStr) <= 0}>
          Withdraw
        </Button>
      </Dialog.Footer>
    </>
  )
};

export default WithdrawForm;