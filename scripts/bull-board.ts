#!/usr/bin/env ts-node
import express from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { messageAggregationQueue } from '../lib/discord/messageAggregationQueue';
import { indexUserQueue, indexGuildQueue, indexChannelsQueue } from '../lib/discord/indexQueue';

const app = express();
const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [new BullAdapter(messageAggregationQueue), new BullAdapter(indexUserQueue), new BullAdapter(indexGuildQueue), new BullAdapter(indexChannelsQueue)],
  serverAdapter,
});

serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', serverAdapter.getRouter());

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Bull Board running on http://localhost:${PORT}/admin/queues`);
}); 