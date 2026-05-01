const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// Timeout (ms) given to the docker run command.
// Includes container startup time (~1-2s) + actual execution time.
const EXEC_TIMEOUT_MS = 10000;

const executeCode = async (language, code) => {
    const sessionId = crypto.randomBytes(8).toString('hex');
    const tempDir = path.join(__dirname, '..', 'temp', sessionId);

    await fs.mkdir(tempDir, { recursive: true });

    let fileName, dockerImage, runCommand;

    if (language === 'javascript') {
        fileName = 'script.js';
        dockerImage = 'syncspace-runner-node:latest';
        runCommand = 'node script.js';
    } else if (language === 'python') {
        fileName = 'script.py';
        dockerImage = 'syncspace-runner-python:latest';
        runCommand = 'python script.py';
    } else {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw new Error('Unsupported language');
    }

    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, code);

    // Build the sandboxed docker run command.
    // Security flags:
    //   --rm              : auto-remove container after it exits (no ghost containers)
    //   --network none    : no internet access from inside the sandbox
    //   --memory=128m     : hard memory cap — prevents memory exhaustion attacks
    //   --cpus=0.5        : limits to half a CPU core
    //   --pids-limit=64   : prevents fork bombs
    //   --read-only       : container root filesystem is read-only
    //   --tmpfs /app      : writable scratch space in RAM only (wiped on exit)
    //   --user 1000       : run as unprivileged user, not root
    //   -v <file>:ro      : mount only the user's script, read-only
    //   -w /app           : set working directory inside container
    const dockerCmd = [
        'docker run',
        '--rm',
        '--network none',
        '--memory=128m',
        '--memory-swap=128m',
        '--cpus=0.5',
        '--pids-limit=64',
        '--read-only',
        '--tmpfs /app:rw,noexec,nosuid,size=10m',
        '--user 1000:1000',
        `--name syncspace-${sessionId}`,
        `-v "${filePath}":/app/${fileName}:ro`,
        `-w /app`,
        dockerImage,
        runCommand
    ].join(' ');

    return new Promise((resolve) => {
        exec(dockerCmd, { timeout: EXEC_TIMEOUT_MS }, async (error, stdout, stderr) => {
            // Always clean up the temp directory on the host
            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            } catch (err) {
                console.error('Failed to clean up temp dir:', err);
            }

            // Force-remove the container if it somehow survived (e.g. timeout)
            exec(`docker rm -f syncspace-${sessionId}`, () => { });

            if (error && error.killed) {
                return resolve({ output: '', error: `Execution timed out (${EXEC_TIMEOUT_MS / 1000}s limit)` });
            }

            // Docker exits with code 125/126/127 for container-level failures
            if (error && error.code !== undefined && error.code >= 125) {
                return resolve({ output: '', error: 'Container error: ' + (stderr.trim() || error.message) });
            }

            resolve({
                output: stdout.trim(),
                error: stderr.trim()
            });
        });
    });
};

module.exports = { executeCode };
