// Function to start the noVNC proxy server
const { spawn } = require('child_process');
const config = require('../../.config.js');

function startNoVNCProxy() {
    console.log('Starting noVNC proxy server...');

    const noVNCProcess = spawn(
        './utils/novnc_proxy',
        [
            '--vnc',
            `${config.urls.vncHost}:${config.ports.internalVncPort}`
        ], {
        cwd: `${config.paths.noVncDir}`,
        }
    );

    // Listen for stdout (normal output)
    noVNCProcess.stdout.on('data', (data) => {
        console.log(`noVNC output: ${data}`);
    });

    // Listen for stderr (error output)
    noVNCProcess.stderr.on('data', (data) => {
        console.error(`noVNC error: ${data}`);
    });

    // Handle process exit
    noVNCProcess.on('close', (code) => {
        if (code === 0) {
            console.log('noVNC proxy server exited successfully.');
        } else {
            console.error(`noVNC proxy server exited with code ${code}.`);
        }
    });

    console.log('noVNC proxy server started in background.');
}

module.exports = { startNoVNCProxy };