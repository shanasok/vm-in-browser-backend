// Function to start the noVNC proxy server
const config = require('../../.config.js');
const { spawn } = require('child_process');

function startNoVNCProxy() {
    console.log('Starting noVNC proxy server...');

    try {
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
    } catch (error) {
        console.error("Error spawning noVNC:", error.message);
        const newError = new Error("Error spawning noVNC");
        newError.originalError = error;
        throw newError;
    }

    console.log('noVNC proxy server started in background.');
}

module.exports = { startNoVNCProxy };