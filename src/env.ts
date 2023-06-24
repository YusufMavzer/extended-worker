import dotenv from "dotenv";

dotenv.config();

interface CustomEnv extends NodeJS.ProcessEnv {
  EXTENDED_WORKER_TEST?: string;
}

export const customEnv: CustomEnv = {
  ...process.env
}