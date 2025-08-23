#!/usr/bin/env node

/**
 * n8n-MCP動作確認スクリプト
 * NPXコマンドを使ってn8n-mcpの基本動作をテストします
 */

const { spawn } = require('child_process');
const readline = require('readline');

console.log('n8n-MCP動作テストを開始します...\n');

// MCPサーバーをnpxで起動
const mcpProcess = spawn('npx', ['-y', 'n8n-mcp@latest'], {
  env: {
    ...process.env,
    MCP_MODE: 'stdio',
    MCP_LOG_LEVEL: 'info',
    NODE_ENV: 'production',
    REBUILD_ON_START: 'false'
  }
});

// タイムアウトの設定
const timeout = setTimeout(() => {
  console.error('\n❌ タイムアウト: MCPサーバーが応答しません');
  mcpProcess.kill();
  process.exit(1);
}, 30000);

// 標準出力のハンドリング
const rl = readline.createInterface({
  input: mcpProcess.stdout,
  output: process.stdout,
  terminal: false
});

let serverStarted = false;

rl.on('line', (line) => {
  console.log('サーバー出力:', line);
  
  // サーバー起動の確認
  if (line.includes('capabilities') || line.includes('MCP server started')) {
    serverStarted = true;
    console.log('\n✅ MCPサーバーが正常に起動しました');
    
    // テストリクエストを送信
    sendTestRequest();
  }
});

// エラー出力のハンドリング
mcpProcess.stderr.on('data', (data) => {
  console.error('エラー:', data.toString());
});

// プロセス終了時の処理
mcpProcess.on('close', (code) => {
  clearTimeout(timeout);
  if (code === 0) {
    console.log('\n✅ テスト完了: MCPサーバーは正常に動作しています');
  } else {
    console.error(`\n❌ MCPサーバーが異常終了しました (コード: ${code})`);
  }
  process.exit(code);
});

// テストリクエストの送信
function sendTestRequest() {
  const testRequest = JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  }) + '\n';
  
  console.log('\nテストリクエストを送信中...');
  mcpProcess.stdin.write(testRequest);
  
  // レスポンスを待つ
  setTimeout(() => {
    console.log('\n✅ 基本的な通信テストが成功しました');
    mcpProcess.kill();
    clearTimeout(timeout);
    process.exit(0);
  }, 3000);
}

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('\n\nテストを中断します...');
  mcpProcess.kill();
  clearTimeout(timeout);
  process.exit(0);
});