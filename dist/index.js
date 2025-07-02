"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("./cli");
async function main() {
    const cli = new cli_1.CLI();
    await cli.start();
}
// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason);
    process.exit(1);
});
// 启动应用
main().catch((error) => {
    console.error('应用启动失败:', error);
    process.exit(1);
});
