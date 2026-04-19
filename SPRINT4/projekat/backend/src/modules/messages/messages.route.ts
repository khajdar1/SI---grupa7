import { Router } from 'express';

const messagesRouter = Router();

messagesRouter.get('/', (_req, res) => {
  res.json({
    module: 'messages',
    endpoints: ['GET /tickets/:ticketId', 'POST /tickets/:ticketId'],
  });
});

export default messagesRouter;