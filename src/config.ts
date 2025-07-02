import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY || 'AIzaSyAQjybebdwSk6AyDjVOtXeuAhMwdY_oSsI',
  vectorStorePath: './vector_store.json',
  chunkSize: 1000,
  chunkOverlap: 200,
}; 