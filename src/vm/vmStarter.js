const {exec} = require("child_process");
const {generateTraineeVMname} = require("./vmCreator");
const {
    getNextVncPort,
    getWebSocketPort,
    cloneVmWithVmrun,
    updateVncPort,
    startWebsockify
} = require("./vmModifyVNCPort");
const config = require("../../.config");

const vncHost = config.urls.vncHost;
const noVncDir = config.paths.noVncDir;
const templateVmxPath = config.paths.vmTemplatePath;

async function startVM(pathToTraineeVM){

    console.log('Starting virtual machine...');

    return new Promise((resolve, reject) => {
        exec(`vmrun start '${pathToTraineeVM}'`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error starting VM: ${error.message}`);
                const updatedError = new Error(`Error starting VM:: ${error.message}`);
                updatedError.originalError = error;
                return reject(updatedError);
            }
            console.log(`VM started successfully: ${stdout}`);
            resolve(`VM Successfully started`);
        });
    });
}

/* Clones VM. Updates port. Then starts Websockify. */
async function triggerVmWorkflow() {
    try {
        const traineeVMPath = generateTraineeVMname();
        const internalPort = getNextVncPort();
        const externalPort = getWebSocketPort();

        // Step 1: Clone the VM
        console.log(`[${new Date().toISOString()}]`, "Cloning the VM...");
        await cloneVmWithVmrun(templateVmxPath, traineeVMPath);
        console.log(`[${new Date().toISOString()}]`, "VM cloned successfully.");

        // Step 2: Update the VNC Port
        console.log(`[${new Date().toISOString()}]`, "Updating the VNC port...");
        await updateVncPort(traineeVMPath, internalPort);
        console.log(`[${new Date().toISOString()}]`, "VNC port updated successfully.");

        // Step 3: Start the VM
        console.log(`[${new Date().toISOString()}]`, "Starting the VM...");
        await startVM(traineeVMPath);
        console.log(`[${new Date().toISOString()}]`, "VM started successfully.");

        // Step 4: Start Websockify
        console.log(`[${new Date().toISOString()}]`, "Starting websockify...");
        await startWebsockify(noVncDir, externalPort, vncHost, internalPort);
        console.log(`[${new Date().toISOString()}]`, "Websockify started successfully.");

        // Return the external WebSocket port once all steps are complete
        return externalPort;
    } catch (error) {
        console.error("VM Start up workflow failed:", error.message);
        const newError = new Error("Failed to clone VM.");
        newError.originalError = error;
        throw newError;
    }
}

module.exports = { triggerVmWorkflow };