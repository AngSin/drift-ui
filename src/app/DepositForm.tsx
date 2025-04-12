'use client';

import { Button, Dialog, Input, Link, Box } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster"
import UserAccountSelect from "@/app/UserAccountSelect";
import AssetSelect from "@/app/AssetSelect";
import {BN, SpotMarketAccount, WRAPPED_SOL_MINT, ZERO} from "@drift-labs/sdk-browser";
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

const DepositForm = () => {
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

  const deposit = async () => {
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
        description: "Please enter a valid deposit amount.",
        type: "error",
        duration: 5000,
        closable: true,
      });
      return;
    }

    try {
      const mint = spotMarketAccount.mint;
      const isSol = mint.toString() === WRAPPED_SOL_MINT.toString();
      console.log({ isSol });
      const decimals = spotMarketAccount.decimals;
      const transferAmount = decimalStrToBN(amountStr, decimals);

      if (transferAmount.isZero()) {
        toaster.create({
          title: "Invalid Amount",
          description: "Deposit amount cannot be zero.",
          type: "error",
          duration: 5000,
          closable: true,
        });
        return;
      }

      const associatedTokenAccount = isSol ? selectedUser.account.authority : getAssociatedTokenAddressSync(mint, selectedUser.account.authority);

      const txSig = await driftClient.deposit(
        transferAmount,
        spotMarketAccount.marketIndex,
        associatedTokenAccount,
        selectedUser.account.subAccountId,
      );

      toaster.create({
        title: "Deposit Submitted",
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
      console.error("Deposit failed:", error);
      toaster.create({
        title: "Deposit Failed",
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
        <p>Deposited assets automatically earn yield through lending.</p>
        <br />
        <UserAccountSelect label="Deposit to:" />
        <br />
        <div>Transfer type and Amount</div>
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
        <Button onClick={deposit} disabled={!driftClient || !selectedUser || !spotMarketAccount || parseFloat(amountStr) <= 0}>
          Deposit
        </Button>
      </Dialog.Footer>
    </>
  )
};

export default DepositForm;