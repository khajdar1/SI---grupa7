import { createServer } from 'node:http';

import { env } from './config/env';
import { createApp } from './app';
import { initSocket } from './realtime/socket';

const app = createApp();
const server = createServer(app);

initSocket(server);

server.listen(env.PORT, () => {
  console.log(`Backend running on http://localhost:${env.PORT}`);
});