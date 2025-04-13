import {OrderType, PositionDirection} from "@drift-labs/sdk-browser";
import {Tabs} from "@chakra-ui/react";
import TradingForm from "@/app/TradingForm";

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
      <Tabs.Content value="long">
        <TradingForm orderType={orderType} direction={PositionDirection.LONG} />
      </Tabs.Content>
      <Tabs.Content value="short">
        <TradingForm orderType={orderType} direction={PositionDirection.SHORT} />
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default TradingTabs;