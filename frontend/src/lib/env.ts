type EnvMap = Record<string, string | undefined>;

const readEnv = (key: string) => {
  const value = (import.meta.env as EnvMap)[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

export const getApiBaseUrl = () => readEnv('VITE_API_URL').replace(/\/$/, '');
export const getFrontendUrl = () => readEnv('VITE_FRONTEND_URL').replace(/\/$/, '');
