"use client";

import { Box, Button, Dialog, Input, Text } from "@chakra-ui/react";
import UserAccountSelect from "@/app/UserAccountSelect";
import AssetSelect from "@/app/AssetSelect";
import {
  SpotMarketAccount,
  WRAPPED_SOL_MINT,
  ZERO,
  BN,
} from "@drift-labs/sdk-browser";
import { useState, useEffect, useMemo } from "react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import useDriftStore from "@/store/driftStore";
import { decimalStrToBN, formatBigNum } from "@/utils/strings";
import { toast } from "react-toastify";

const DepositForm = () => {
  const [amountStr, setAmountStr] = useState<string>("0");
  const [spotMarketAccount, setSpotMarketAccount] =
    useState<SpotMarketAccount>();
  const { driftClient, selectedUser } = useDriftStore();
  const [walletBalanceBn, setWalletBalanceBn] = useState<BN | undefined>(
    undefined,
  );

  useEffect(() => {
    if (
      !driftClient?.connection ||
      !selectedUser?.account.authority ||
      !spotMarketAccount
    ) {
      setWalletBalanceBn(undefined);
      return;
    }

    const connection = driftClient.connection;
    const authority = selectedUser.account.authority;
    const mint = spotMarketAccount.mint;

    const fetchBalance = async () => {
      try {
        let balanceLamports: number | string | BN;

        if (mint.equals(WRAPPED_SOL_MINT)) {
          balanceLamports = await connection.getBalance(authority);
          setWalletBalanceBn(new BN(balanceLamports));
        } else {
          const ata = getAssociatedTokenAddressSync(mint, authority);
          try {
            const tokenAccountInfo =
              await connection.getTokenAccountBalance(ata);
            if (tokenAccountInfo?.value?.amount) {
              setWalletBalanceBn(new BN(tokenAccountInfo.value.amount));
            } else {
              setWalletBalanceBn(ZERO);
            }
          } catch (error) {
            console.log(
              `ATA ${ata.toBase58()} for mint ${mint.toBase58()} not found or error fetching balance:`,
              error,
            );
            setWalletBalanceBn(ZERO);
          }
        }
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
        setWalletBalanceBn(undefined);
      }
    };

    fetchBalance();
  }, [driftClient, selectedUser, spotMarketAccount]);

  const formattedWalletBalance = useMemo(() => {
    return formatBigNum(walletBalanceBn, spotMarketAccount?.decimals ?? 0);
  }, [walletBalanceBn, spotMarketAccount]);

  const deposit = async () => {
    if (!driftClient || !selectedUser || !spotMarketAccount) {
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

      if (walletBalanceBn !== undefined && transferAmount.gt(walletBalanceBn)) {
        toast.error("Insufficient Wallet Balance");
        return;
      }

      const sourceTokenAccount = isSol
        ? selectedUser.account.authority
        : getAssociatedTokenAddressSync(mint, selectedUser.account.authority);

      await driftClient.deposit(
        transferAmount,
        spotMarketAccount.marketIndex,
        sourceTokenAccount,
        selectedUser.account.subAccountId,
      );

      toast.success("Deposit Submitted");
      setAmountStr("0");
    } catch (error) {
      console.error("Deposit failed:", error);
      toast.error("Deposit Failed");
    }
  };

  if (!driftClient) {
    return null;
  }

  return (
    <>
      <Dialog.Body>
        <p>Deposited assets automatically earn yield through lending.</p>
        <br />
        <UserAccountSelect label="Deposit to:" />
        <br />
        <div>Transfer type and Amount</div>
        <div className="flex items-center space-x-2">
          <AssetSelect<SpotMarketAccount>
            selectedMarketAccount={spotMarketAccount}
            setMarketAccount={setSpotMarketAccount}
            marketAccounts={driftClient.getSpotMarketAccounts()}
          />
          <Input
            type="number"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value.trim())}
            placeholder="0.00"
            className="text-right flex-1"
            min={0}
          />
        </div>
        <Box textAlign="right" mt={1} mr={1} height="20px">
          {spotMarketAccount && selectedUser && (
            <Text fontSize="xs" color="gray.500">
              Wallet Balance: {formattedWalletBalance}{" "}
              {Buffer.from(spotMarketAccount.name).toString()}
            </Text>
          )}
        </Box>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button variant="outline">Cancel</Button>
        </Dialog.ActionTrigger>
        <Button
          onClick={deposit}
          disabled={
            !driftClient ||
            !selectedUser ||
            !spotMarketAccount ||
            parseFloat(amountStr) <= 0
          }
        >
          Deposit
        </Button>
      </Dialog.Footer>
    </>
  );
};

export default DepositForm;
