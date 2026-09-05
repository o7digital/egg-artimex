declare module "cloudflare:workers" {
  export const env: {
    DB?: Parameters<typeof import("drizzle-orm/d1").drizzle>[0];
  };
}

type D1Database = Parameters<typeof import("drizzle-orm/d1").drizzle>[0];

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
