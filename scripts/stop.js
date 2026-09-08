/* npm stop — stops only the server this project started.
   It reads .server.pid and signals that exact process, so it can never
   take down an unrelated node process (which a broad `pkill -f node`
   very much can). */
const fs = require("fs");
const path = require("path");

const PIDFILE = path.join(__dirname, "..", ".server.pid");

let info;
try { info = JSON.parse(fs.readFileSync(PIDFILE, "utf8")); }
catch { console.log("\n  No server recorded as running.\n"); process.exit(0); }

try {
  process.kill(info.pid, 0);            // does it still exist?
} catch {
  fs.unlinkSync(PIDFILE);
  console.log(`\n  Server (pid ${info.pid}) was already gone. Cleaned up.\n`);
  process.exit(0);
}

process.kill(info.pid, "SIGTERM");
try { fs.unlinkSync(PIDFILE); } catch {}
console.log(`\n  Stopped the server on port ${info.port} (pid ${info.pid}).\n`);
