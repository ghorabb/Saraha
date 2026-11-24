import { createClient } from "redis";

export const client = createClient({
  url: process.env.REDIS_URL,
});

export async function testRedisConnection() {
  try {
    await client.connect();
    console.log("Redis connected....");
  } catch (error) {
    console.log("Redis connection Error", error);
  }
}
