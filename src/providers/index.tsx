import WalletAdapterProvider from "@/providers/WalletAdapterProvider";
import { Provider as ChakraProvider } from "@/components/ui/provider";
import { ReactNode } from "react";
import DriftProvider from "@/providers/DriftProvider";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ChakraProvider>
      <WalletAdapterProvider>
        <DriftProvider>{children}</DriftProvider>
      </WalletAdapterProvider>
    </ChakraProvider>
  );
};

export default Providers;
