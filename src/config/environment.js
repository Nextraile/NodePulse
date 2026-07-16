console.log("(environment): Initializing environment variables...");

const env = process.env;

const appConfig = {
  retries: {
    max: validateEnvVar({RETRIES_MAX: env.RETRIES_MAX}, (key, value) => toNumber(key, value), 5),
    delay: validateEnvVar({RETRIES_DELAY: env.RETRIES_DELAY}, (key, value) => toNumber(key, value), 1000),
  },

  ports: {
    http: validateEnvVar({HTTP_PORT: env.DOCKER_HTTP_PORT}, (key, value) => toNumber(key, value), 3000),
    tcp: {
      port: validateEnvVar({TCP_PORT: env.DOCKER_TCP_PORT}, (key, value) => toNumber(key, value), 4000),
      timeout: validateEnvVar({TCP_TIMEOUT: env.TCP_TIMEOUT_MS}, (key, value) => toNumber(key, value), 5000)
    }
  }
};

console.log("(environment): Environment variables initialized.");

deepFreeze(appConfig);

console.log("(environment): Environment configuration is now immutable.");

export default appConfig;

//=================
// HELPER FUNCTIONS
//=================

// variable must be an object with a single key-value pair,
// the key is the environment variable name and the value is its value
function validateEnvVar(variable, callback, defaultValue = undefined, mandatory = true) {
  if (typeof callback !== 'function') throw new Error("(environment.validateEnvVar): Callback function is invalid.");

  if (typeof variable === 'object') {
    if (variable === null)
      throw new Error("(environment.validateEnvVar): Environment variable is null.");

    const keys = Object.keys(variable);
    if (keys.length === 0)
      throw new Error("(environment.validateEnvVar): Environment variable is empty.");
    if (keys.length > 1)
      throw new Error("(environment.validateEnvVar): Environment variable must have a single key-value pair.");

    const isNestedObject = keys.some(key => typeof variable[key] === 'object' && variable[key] !== null);
    if (isNestedObject)
      throw new Error("(environment.validateEnvVar): Environment variable must not be a nested object.");

  } else throw new Error("(environment.validateEnvVar): Environment variable must be an object with a single key-value pair.");
  
  const [key, value] = Object.entries(variable)[0];

  if (mandatory && isEmpty(value)) {
    if (!isEmpty(defaultValue)) {
      console.warn(`(environment.validateEnvVar): Mandatory environment variable ${key} is missing or empty. Using default value...`);
      return callback(key, defaultValue);
    }

    throw new Error(`(environment.validateEnvVar): Mandatory environment variable ${key} is missing or empty. No default value provided.`);
  }

  return callback(key, value);
}

// Recursively freezes an object and its nested objects to make it immutable
function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") throw new Error("(environment.deepFreeze): Invalid object provided for deep freezing.");

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (
      (typeof value === "object") &&
      !isEmpty(value) &&
      !Object.isFrozen(value)
    ) deepFreeze(value);
  });

  Object.freeze(obj);
  return obj;
}

function isEmpty(value) { return value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0) };

function toNumber(variableName, value) {
  switch (typeof value) {
    case 'number':
      if (isNaN(value)) throw new Error(`(environment.toNumber): Invalid number value for ${variableName}: ${value}`);
      return value;

    case 'string':
      const trimmedValue = value.trim();
      if (trimmedValue.length === 0) throw new Error(`(environment.toNumber): Empty string value for ${variableName}`);

      const parsed = Number(trimmedValue);
      if (isNaN(parsed)) throw new Error(`(environment.toNumber): Invalid number format for ${variableName}: ${value}`);
      return parsed;
      
    default:
      throw new Error(`(environment.toNumber): Invalid value type for ${variableName}: ${value}`);
  }
}