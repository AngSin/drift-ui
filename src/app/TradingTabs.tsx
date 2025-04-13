import {OrderType} from "@drift-labs/sdk-browser";
import {Tabs} from "@chakra-ui/react";

type TradingTabsProps = {
  orderType: OrderType;
};

const TradingTabs = ({ orderType }: TradingTabsProps) => {
  return (
    <Tabs.Root defaultValue="long" variant="enclosed" size="lg">
      <Tabs.List>
        <Tabs.Trigger value="long">Long</Tabs.Trigger>
        <Tabs.Trigger value="short">Short</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="long">Long</Tabs.Content>
      <Tabs.Content value="short">Short</Tabs.Content>
    </Tabs.Root>
  );
};

export default TradingTabs;