'use client';

import { Button, Dialog, Input, Link, Box } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import UserAccountSelect from "@/app/UserAccountSelect";
import AssetSelect from "@/app/AssetSelect";
import { BN, SpotMarketAccount, WRAPPED_SOL_MINT, ZERO } from "@drift-labs/sdk-browser";
import { useState } from "react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import useDriftStore from "@/store/driftStore";

function decimalStrToBN(decimalStr: string, decimals: number): BN {
  if (!decimalStr || isNaN(parseFloat(decimalStr))) {
    return ZERO;
  }
  const safeStr = String(Number(decimalStr));
  const parts = safeStr.split('.');
  const integerPart = parts[0];
  const fractionalPart = parts[1] || '';
  const integerBN = new BN(integerPart).mul(new BN(10).pow(new BN(decimals)));
  let fractionalBN = ZERO;
  if (fractionalPart.length > 0) {
    const trimmedFractional = fractionalPart.substring(0, decimals);
    const paddedFractional = trimmedFractional.padEnd(decimals, '0');
    fractionalBN = new BN(paddedFractional);
  }
  if (safeStr.startsWith('-')) {
    return integerBN.add(fractionalBN).neg();
  } else {
    return integerBN.add(fractionalBN);
  }
}

const solscanBaseUrl = `https://solscan.io/tx`;

const WithdrawForm = () => {
  const [amountStr, setAmountStr] = useState<string>("0");
  const [spotMarketAccount, setSpotMarketAccount] = useState<SpotMarketAccount>();
  const { driftClient, selectedUser } = useDriftStore();

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

  const withdraw = async () => {
    if (!driftClient || !selectedUser || !spotMarketAccount) {
      toaster.create({
        title: "Missing Information",
        description: "Please wait or reload the page",
        type: "error",
        duration: 5000,
        closable: true,
      });
      return;
    }
    if (!amountStr || parseFloat(amountStr) <= 0) {
      toaster.create({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        type: "error",
        duration: 5000,
        closable: true,
      });
      return;
    }

    try {
      const mint = spotMarketAccount.mint;
      const isSol = mint.equals(WRAPPED_SOL_MINT);
      const decimals = spotMarketAccount.decimals;
      const transferAmount = decimalStrToBN(amountStr, decimals);

      if (transferAmount.isZero()) {
        toaster.create({
          title: "Invalid Amount",
          description: "Withdrawal amount cannot be zero.",
          type: "error",
          duration: 5000,
          closable: true,
        });
        return;
      }

      const destinationAccount = isSol
        ? selectedUser.account.authority
        : getAssociatedTokenAddressSync(mint, selectedUser.account.authority);

      const txSig = await driftClient.withdraw(
        transferAmount,
        spotMarketAccount.marketIndex,
        destinationAccount,
        false,
        selectedUser.account.subAccountId,
      );

      toaster.create({
        title: "Withdrawal Submitted",
        type: "success",
        duration: 9000,
        closable: true,
        description: (
          <Box>
            Transaction sent successfully.{" "}
            <Link href={`${solscanBaseUrl}/${txSig}`} color="teal.500" fontWeight="bold">
              View on Solscan
            </Link>
          </Box>
        ),
      });
      setAmountStr("0");

    } catch (error) {
      console.error("Withdrawal failed:", error);
      toaster.create({
        title: "Withdrawal Failed",
        description: (error as Error)?.message || "An unknown error occurred.",
        type: "error",
        duration: 9000,
        closable: true,
      });
    }
  };


  return (
    <>
      <Dialog.Body>
        <p>Withdraw assets from your Drift account to your wallet.</p>
        <br />
        <UserAccountSelect label="Withdraw From:" />
        <br />
        <div>Withdrawal Amount</div>
        <div className="flex items-center space-x-2">
          <AssetSelect
            spotMarketAccount={spotMarketAccount}
            setSpotMarketAccount={setSpotMarketAccount}
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