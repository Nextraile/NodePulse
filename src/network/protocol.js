import * as net from 'net'

export function parseBuffer(buffer) {
  const data = buffer.toString('utf-8');
  const parsedData = JSON.parse(data);
  validateData(parsedData);
  return parsedData;
}

function validateDataFromClient(jsonData) {
  const isValidObject = obj => obj !== null && typeof obj === 'object';

  const mandatoryProperties = ['command', 'payload'];
  const payloadWhitelist = new Set(['client_id', 'type', 'topic', 'data', 'message_id', 'reason']);
  const typeWhitelist = new Set(['PUBLISHER', 'CONSUMER']);

  if (!isValidObject(jsonData)) {
    throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: ${typeof jsonData}`);
  };
  
  // check if all mandatory properties are present
  if (!mandatoryProperties.every(prop => jsonData.hasOwn(prop))) {
    throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: Missing mandatory property`);
  };

  // check if 'command' is a string
  if (typeof jsonData.command !== 'string') {
    throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'command' must be a string`);
  };
  
  // check if 'payload' is an object and not null
  if (!isValidObject(jsonData.payload)) {
    throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: Missing or invalid 'payload' property`);
  };

  // check if 'payload' contains only whitelisted properties
  if (Object.keys(jsonData.payload).some(prop => !payloadWhitelist.has(prop))) {
    throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: Unexpected property in 'payload'`);
  };

  // check if 'command' is in the whitelist
  switch (jsonData.command) {
    case 'CONNECT':
      // check if 'client_id' is a string
      if (!jsonData.payload.hasOwn('client_id') || typeof jsonData.payload.client_id !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'client_id' must be a string`);
      };

      // check if 'type' is a string
      if (!jsonData.payload.hasOwn('type') || typeof jsonData.payload.type !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'type' must be a string`);
      };
      
      // check if 'type' is either 'PUBLISHER' or 'CONSUMER'
      if (!typeWhitelist.has(jsonData.payload.type)) {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'type' must be either 'PUBLISHER' or 'CONSUMER'`);
      };
      break;

    case 'PUB':
      // check if 'topic' is a string
      if (!jsonData.payload.hasOwn('topic') || typeof jsonData.payload.topic !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'topic' must be a string`);
      };

      // check if 'data' exists
      if (!jsonData.payload.hasOwn('data')) {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: Missing 'data' property`);
      };
      break;

    case 'SUB':
      // check if 'topic' is a string
      if (!jsonData.payload.hasOwn('topic') || typeof jsonData.payload.topic !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'topic' must be a string`);
      };
      break;

    case 'ACK':
    case 'NACK':
      // check if 'message_id' is a string
      if (!jsonData.payload.hasOwn('message_id') || typeof jsonData.payload.message_id !== 'string') {
        throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'message_id' must be a string`);
      };

      if (jsonData.command === 'NACK') {
        // check if 'reason' is a string
        if (!jsonData.payload.hasOwn('reason') || typeof jsonData.payload.reason !== 'string') {
          throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: 'reason' must be a string`);
        };
      };
      break;

    default:
      throw new Error(`(protocol.validateData): [PROTOCOL] Invalid data format: Unknown command ${jsonData.command}`);
  };
}