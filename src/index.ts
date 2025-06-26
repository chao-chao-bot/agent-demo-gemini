#!/usr/bin/env node

import { ChatAgent } from './agent/ChatAgent';
import { TerminalUI } from './ui/TerminalUI';
import { ConfigManager } from './config/ConfigManager';
import chalk from 'chalk';

async function main() {
  try {
    console.log(chalk.blue('🚀 正在初始化多Agent AI团队...'));
    
    // 验证配置
    const configManager = ConfigManager.getInstance();
    const validation = configManager.validateConfig();
    
    if (!validation.isValid) {
      console.error(chalk.red('❌ 配置验证失败:'));
      validation.errors.forEach(error => {
        console.error(chalk.red(`  • ${error}`));
      });
      console.log(chalk.yellow('\n💡 请确保在.env文件中设置了 GOOGLE_API_KEY'));
      console.log(chalk.yellow('   然后重新启动程序。'));
      process.exit(1);
    }

    console.log(chalk.green('✅ 配置验证通过'));
    
    // 创建多Agent系统
    const chatAgent = new ChatAgent();
    console.log(chalk.green('✅ 多Agent团队初始化完成'));
    
    // 创建终端UI
    const terminalUI = new TerminalUI(chatAgent);
    console.log(chalk.green('✅ 终端界面准备就绪'));
    
    // 显示环境信息
    const envInfo = configManager.getEnvironmentInfo();
    console.log(chalk.cyan('\n📋 系统环境:'));
    Object.entries(envInfo).forEach(([key, value]) => {
      console.log(chalk.cyan(`  • ${key}: ${value}`));
    });
    
    console.log(chalk.magenta('\n🎉 多Agent AI团队已启动！'));
    console.log(chalk.magenta('👥 团队成员：小智（技术分析专家）、小梅（实用建议专家）'));
    console.log(chalk.magenta('💡 输入 "help" 查看详细使用说明\n'));
    
    // 启动UI
    await terminalUI.start();
    
  } catch (error) {
    console.error(chalk.red('❌ 启动失败:'), error);
    
    if (error instanceof Error) {
      if (error.message.includes('GOOGLE_API_KEY')) {
        console.log(chalk.yellow('\n💡 解决方案:'));
        console.log(chalk.yellow('1. 访问 https://aistudio.google.com/app/apikey'));
        console.log(chalk.yellow('2. 创建或获取您的API密钥'));
        console.log(chalk.yellow('3. 在项目根目录创建 .env 文件'));
        console.log(chalk.yellow('4. 添加: GOOGLE_API_KEY=your_api_key_here'));
        console.log(chalk.yellow('5. 重新启动程序'));
      } else if (error.message.includes('location')) {
        console.log(chalk.yellow('\n💡 地区限制解决方案:'));
        console.log(chalk.yellow('• Gemini API在某些地区可能有使用限制'));
        console.log(chalk.yellow('• 如果遇到地区问题，可能需要使用VPN'));
        console.log(chalk.yellow('• 或者等待API在您的地区开放'));
      }
    }
    
    process.exit(1);
  }
}

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 未捕获的异常:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('💥 未处理的Promise拒绝:'), reason);
  process.exit(1);
});

// 优雅退出处理
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 感谢使用多Agent AI团队服务！'));
  console.log(chalk.yellow('🎯 期待下次为您提供更好的AI协作体验！'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n\n📊 多Agent系统正在安全关闭...'));
  process.exit(0);
});

// 启动应用
main().catch(error => {
  console.error(chalk.red('🚨 应用启动失败:'), error);
  process.exit(1);
}); 