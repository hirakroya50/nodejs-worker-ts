import dotenv from "dotenv";
dotenv.config();
import { createClient } from "redis";
const client = createClient({
  url: process.env.REDIS_URL,
});
const queueKey = process.env.REDIS_QUEUE_KEY || "sub";
const redisPubSubKey = process.env.REDIS_PUB_SUB_KEY || "pub_sub_Key";

async function processSubmission(submission: string) {
  const { data } = JSON.parse(submission);
  console.log(`DOING SOME WORK data: ${data}...`);
  client.publish(redisPubSubKey, JSON.stringify({ data }));
}

async function startWorker() {
  try {
    await client.connect();
    console.log("Worker connected to Redis.");
    let global = "";

    while (true) {
      try {
        const submission = await client.brPop(queueKey, 0);
        if (submission?.element) {
          global = submission.element;
          await processSubmission(submission.element);
        }
      } catch (error) {
        console.error("Error processing submission:", error);
        // if any error happen we can push that to the queue again :
        await client.lPush(queueKey, global);
      }
    }
  } catch (error) {
    console.error("Failed to connect to Redis", error);
  }
}
console.log(process.env.REDIS_URL);
startWorker();
