// api/index.js
import serverless from 'serverless-http';
import expressApp from '../server/index.js'; // your existing Express `app`

export const handler = serverless(expressApp);
