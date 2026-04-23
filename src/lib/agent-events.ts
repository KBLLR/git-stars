export type HouseId = string;

interface EventBase {
  type: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface CustomEvent<TData = unknown> extends EventBase {
  type: `${HouseId}:${string}`;
  house_id: HouseId;
  data: TData;
}

export type AgentEvent = EventBase | CustomEvent;

export const createCustomEvent = <TData>(
  houseId: HouseId,
  eventType: string,
  data: TData,
): CustomEvent<TData> => ({
  type: `${houseId}:${eventType}`,
  house_id: houseId,
  timestamp: new Date().toISOString(),
  data,
});

export const getEventHouseId = (event: AgentEvent): string => {
  if (typeof event.house_id === 'string' && event.house_id.length > 0) {
    return event.house_id;
  }

  if (typeof event.type === 'string') {
    const [prefix] = event.type.split(':');
    if (prefix && prefix.length > 0) {
      return prefix;
    }
  }

  return 'unknown';
};
