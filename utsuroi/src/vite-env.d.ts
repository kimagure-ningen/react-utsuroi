/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REMOTION_GOOGLE_CLIENT_ID: string;
    readonly REMOTION_GOOGLE_API_KEY: string;
  }
}