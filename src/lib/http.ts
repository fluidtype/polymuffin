import ky from 'ky';

export const http = ky.create({
  timeout: 20000,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 429, 500, 502, 503, 504],
  },
});
