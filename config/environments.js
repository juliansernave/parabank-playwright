import 'dotenv/config';

const environments = {
  staging: {
    baseURL: 'https://parabank.parasoft.com',
    apiURL: 'https://parabank.parasoft.com/parabank/services/bank',
  },
  // Local ParaBank instance started via `npm run docker:up`.
  // Uses in-memory HSQLDB — data resets on container restart, giving a clean state per run.
  local: {
    baseURL: 'http://localhost:8080',
    apiURL: 'http://localhost:8080/parabank/services/bank',
  },
};

const env = process.env.TEST_ENV || 'staging';

if (!environments[env]) {
  throw new Error(`Unknown TEST_ENV: "${env}". Valid options: ${Object.keys(environments).join(', ')}`);
}

export const { baseURL, apiURL } = environments[env];
