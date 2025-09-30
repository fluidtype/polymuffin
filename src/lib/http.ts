import ky from 'ky';
export const http = ky.create({ timeout: 15000, retry: { limit: 1 } });
