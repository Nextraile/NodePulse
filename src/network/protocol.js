import * as net from 'net'

export function parseBuffer(buffer) {
  const stringifiedBuffer = buffer.toString('utf-8');
  const parsedBuffer = JSON.parse(stringifiedBuffer);
  validateData(parsedBuffer);
  return parsedBuffer;
}

//=================
// HELPER FUNCTIONS
//=================
function validateDataFromClient(jsonData) {
  if (jsonData === null || typeof jsonData !== 'object') {
    throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: ${typeof jsonData}`);
  };

  const {command, payload} = jsonData;
  const payloadWhitelist = new Set(['client_id', 'type', 'topic', 'data', 'message_id', 'reason']);
  const typeWhitelist = new Set(['PUBLISHER', 'CONSUMER']);
  
  // check if 'command' is a string and 'payload' is an object
  if (typeof command !== 'string' || payload === null || typeof payload !== 'object') {
    throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: missing or invalid 'command' or 'payload' property`);
  };

  // check if 'payload' contains only whitelisted properties
  if (Object.keys(payload).some(prop => !payloadWhitelist.has(prop))) {
    throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: Unexpected property in 'payload'`);
  };

  // check if 'command' is in the whitelist
  switch (command) {
    case 'CONNECT':
      // check if 'client_id' is a string
      if (!Object.hasOwn(payload, 'client_id') || typeof payload.client_id !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'client_id' must be a string`);
      };

      // check if 'type' is a string
      if (!Object.hasOwn(payload, 'type') || typeof payload.type !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'type' must be a string`);
      };
      
      // check if 'type' is either 'PUBLISHER' or 'CONSUMER'
      if (!typeWhitelist.has(payload.type)) {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'type' must be either 'PUBLISHER' or 'CONSUMER'`);
      };
      break;

    case 'PUB':
      // check if 'topic' is a string
      if (!Object.hasOwn(payload, 'topic') || typeof payload.topic !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'topic' must be a string`);
      };

      // check if 'data' exists
      if (!Object.hasOwn(payload, 'data')) {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: Missing 'data' property`);
      };
      break;

    case 'SUB':
      // check if 'topic' is a string
      if (!Object.hasOwn(payload, 'topic') || typeof payload.topic !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'topic' must be a string`);
      };
      break;

    case 'ACK':
    case 'NACK':
      // check if 'message_id' is a string
      if (!Object.hasOwn(payload, 'message_id') || typeof payload.message_id !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'message_id' must be a string`);
      };

      if (command === 'NACK') {
        // check if 'reason' is a string
        if (!Object.hasOwn(payload, 'reason') || typeof payload.reason !== 'string') {
          throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'reason' must be a string`);
        };
      };
      break;

    default:
      throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: Unknown command ${command}`);
  };
}