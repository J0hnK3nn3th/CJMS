const { spawn } = require('child_process');
const path = require('path');

function run(command, args, options = {}) {
  const proc = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${command} exited with code ${code}`);
    }
  });

  return proc;
}

// Backend: py manage.py runserver
const backend = run('py', ['manage.py', 'runserver']);

// Frontend: cd frontend && npm start
const frontendDir = path.join(__dirname, '..', 'frontend');
const frontend = run('npm', ['start'], { cwd: frontendDir });

// If this process is killed, terminate children as well
function shutdown() {
  if (backend && !backend.killed) backend.kill();
  if (frontend && !frontend.killed) frontend.kill();
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);




