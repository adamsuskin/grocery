/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZERO_SERVER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
