export const getEnv = (envName: string) => {
  const envValue = process.env[envName];
  if (typeof envValue === 'undefined') {
    throw new Error(`Please define ${envName}`);
  }
  return envValue;
};
