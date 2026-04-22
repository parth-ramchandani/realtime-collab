# Managed WebSocket (API Gateway) Notes

This project currently uses Socket.IO on EC2. To use AWS API Gateway WebSocket mode instead:

1. Create a WebSocket API with routes:
   - `$connect`
   - `$disconnect`
   - `join_session`
   - `leave_session`
   - `send_message`
   - `editor_update`
2. Back each route with Lambda handlers that:
   - validate payloads
   - write/read session state from DynamoDB or Redis
   - publish updates through API Gateway Management API
3. Store active connection IDs by `sessionId` for fan-out.
4. Put session history in MongoDB/DynamoDB and fetch during `join_session`.

Trade-off:
- API Gateway reduces socket server ops burden.
- Socket.IO features (rooms, built-in fallbacks) need explicit implementation when moving to native managed WebSocket.
