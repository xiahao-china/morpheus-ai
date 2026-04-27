const { NodeSSH } = require('node-ssh');
const config = require('./config.json');
const ssh = new NodeSSH();

async function check() {
  try {
    await ssh.connect({
      host: config.backendServer.host,
      username: config.backendServer.username,
      password: config.backendServer.password,
      port: config.backendServer.port || 22
    });
    
    console.log('--- Docker PS ---');
    const psResult = await ssh.execCommand('docker ps -a | grep morpheus-server');
    console.log(psResult.stdout);

    console.log('\n--- Server Logs (morpheus-server-3000) ---');
    const serverLogs = await ssh.execCommand('docker logs morpheus-server-3000 --tail 200');
    console.log(serverLogs.stdout);
    if (serverLogs.stderr) {
      console.log('STDERR:', serverLogs.stderr);
    }
    
    ssh.dispose();
  } catch (err) {
    console.error(err);
  }
}
check();