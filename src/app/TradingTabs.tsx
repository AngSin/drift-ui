import {OrderType, PositionDirection} from "@drift-labs/sdk-browser";
import {Tabs} from "@chakra-ui/react";
import TradingForm from "@/app/TradingForm";
import useDriftStore from "@/store/driftStore";

type TradingTabsProps = {
  orderType: OrderType;
};

const TradingTabs = ({ orderType }: TradingTabsProps) => {
  const { driftClient } = useDriftStore();
  if (!driftClient) {
    return null;
  }
  return (
    <Tabs.Root defaultValue="long" variant="enclosed" size="lg">
      <Tabs.List>
        <Tabs.Trigger value="long">Long</Tabs.Trigger>
        <Tabs.Trigger value="short">Short</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="long">
        <TradingForm
          orderType={orderType}
          direction={PositionDirection.LONG}
          driftClient={driftClient}
        />
      </Tabs.Content>
      <Tabs.Content value="short">
        <TradingForm
          orderType={orderType}
          direction={PositionDirection.SHORT}
          driftClient={driftClient}
        />
      </Tabs.Content>
    </Tabs.Root>
  );
};

export default TradingTabs;