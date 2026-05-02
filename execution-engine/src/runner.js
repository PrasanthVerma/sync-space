const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// Hard timeout given to each execution (ms).
const EXEC_TIMEOUT_MS = 10000;

const executeCode = async (language, code) => {
    const sessionId = crypto.randomBytes(8).toString('hex');
    const tempDir = path.join(__dirname, '..', 'temp', sessionId);

    await fs.mkdir(tempDir, { recursive: true });

    let fileName, runCommand;

    if (language === 'javascript') {
        fileName = 'script.js';
        runCommand = `node "${path.join(tempDir, fileName)}"`;
    } else if (language === 'python') {
        fileName = 'script.py';
        runCommand = `python3 "${path.join(tempDir, fileName)}"`;
    } else {
        await fs.rm(tempDir, { recursive: true, force: true });
        throw new Error(`Unsupported language: ${language}`);
    }

    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, code);

    return new Promise((resolve) => {
        exec(
            runCommand,
            {
                timeout: EXEC_TIMEOUT_MS,
                cwd: tempDir,
                // Limit memory via ulimit where available (Linux)
                env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=128' },
            },
            async (error, stdout, stderr) => {
                // Always clean up temp files
                try {
                    await fs.rm(tempDir, { recursive: true, force: true });
                } catch (err) {
                    console.error('Failed to clean up temp dir:', err);
                }

                if (error && error.killed) {
                    return resolve({
                        output: '',
                        error: `Execution timed out (${EXEC_TIMEOUT_MS / 1000}s limit)`
                    });
                }

                resolve({
                    output: stdout.trim(),
                    error: stderr.trim()
                });
            }
        );
    });
};

module.exports = { executeCode };


