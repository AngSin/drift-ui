import {PublicKey} from "@solana/web3.js";
import {connection} from "@/utils/constants";

export const getBalance= async (address: PublicKey) => {
  const balance = await connection.getBalance(address);
};