import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // We will specify the model in the flow itself to allow for flexibility
  // The API key will be passed on a per-request basis from the client
});
