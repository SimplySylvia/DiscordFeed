import { messageAggregationQueue, MessageAggregationJobTypes } from "./messageAggregationQueue";

messageAggregationQueue.add(MessageAggregationJobTypes.FETCH_MESSAGES, { channelId: '184198840142790656' });