import "dotenv/config";
import { bootstrap } from "./bootstrap.js";

void bootstrap().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      level: "fatal",
      message: "service failed to start",
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exitCode = 1;
});
