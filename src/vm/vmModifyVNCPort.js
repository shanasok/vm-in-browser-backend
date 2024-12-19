const fs = require('fs');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const config = require('./../../.config.js');

let vmInternalPort = config.ports.internalVncPort;
let externalWebSocketPort = config.ports.externalWebSocketPort;


function getNextVncPort() {
    return vmInternalPort++;
}

function getWebSocketPort() {
    return externalWebSocketPort++;
}

// Function to update the VNC port in the VMX file
function updateVncPort(vmxFile, newPort) {
    const vmxContent = fs.readFileSync(vmxFile, 'utf8');

    console.log("before updating VncPort");
    // Replace or add the VNC port line
    const updatedContent = vmxContent.replace(
        /RemoteDisplay\.vnc\.port\s*=\s*".*"/,
        `RemoteDisplay.vnc.port = "${newPort}"`
    );

    // If the port was not found, append it to the end of the file
    if (!/RemoteDisplay\.vnc\.port/.test(vmxContent)) {
        fs.appendFileSync(vmxFile, `\nRemoteDisplay.vnc.port = "${newPort}"\n`);
    } else {
        fs.writeFileSync(vmxFile, updatedContent, 'utf8');
    }

    console.log(`Updated VNC port to: ${newPort}`);
}

/**
 * Starts a websockify instance.
 * @param {string} webDir - Path to the directory containing the NoVNC web files.
 * @param {number} websocketPort - The port for websockify to listen on.
 * @param {string} vncHost - The host of the VNC server.
 * @param {number} vncPort - The port of the VNC server.
 */
async function startWebsockify(webDir, websocketPort, vncHost, vncPort) {
    const command = 'websockify';
    const args = [
        '--web', webDir,
        websocketPort.toString(),
        `${vncHost}:${vncPort}`
    ];

    const websockifyProcess = await spawn(command, args);

    // Log output from the websockify process
    websockifyProcess.stdout.on('data', (data) => {
        console.log(`websockify stdout: ${data}`);
    });

    websockifyProcess.stderr.on('data', (data) => {
        console.error(`websockify stderr: ${data}`);
    });

    // Handle process exit
    websockifyProcess.on('close', (code) => {
        console.log(`websockify process exited with code ${code}`);
    });

    return websockifyProcess;
}


// Execute the cloning operation with vmrun (this requires vmrun to be installed and accessible)
async function cloneVmWithVmrun(templateVmx, clonedVmx) {
    // Use vmrun to clone the VM
    const cloneCommand = `vmrun clone "${templateVmx}" "${clonedVmx}" full`;

    try {
        console.log("Starting clone command...");
        const { stdout, stderr } = await execPromise(cloneCommand);

        if (stderr) {
            throw new Error(`VM cloning failed with error: ${stderr}`);
        }

        console.log(`stdout: ${stdout}`);
        return `VM Successfully cloned to ${clonedVmx}`;
    } catch (error) {
        console.error(`Error cloning VM: ${error.message}`);
        throw error;
    }
}

module.exports = { cloneVmWithVmrun, getNextVncPort, updateVncPort, startWebsockify, getWebSocketPort };