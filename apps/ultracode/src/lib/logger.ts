type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV !== "production";

function formatMessage(level: LogLevel, message: string): void {
 const timestamp = new Date().toISOString();
 const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
 switch (level) {
 case "debug":
 if (isDev) console.info(`${prefix} ${message}`);
 break;
 case "info":
 if (isDev) console.info(`${prefix} ${message}`);
 break;
 case "warn":
 if (isDev) console.warn(`${prefix} ${message}`);
 break;
 case "error":
 if (isDev) console.error(`${prefix} ${message}`);
 break;
 }
}

export const logger = {
 debug(message: string): void {
 formatMessage("debug", `DEBUG: ${message}`);
 },
 info(message: string): void {
 formatMessage("info", message);
 },
 warn(message: string): void {
 formatMessage("warn", message);
 },
 error(message: string): void {
 formatMessage("error", message);
 },
};
