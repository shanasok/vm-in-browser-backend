const {exec} = require("child_process");

async function startVM(res, pathToTraineeVM){

    console.log('Starting virtual machine...');

    exec(`vmrun start '${pathToTraineeVM}'`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting VM: ${error.message}`);
            const updatedError = new Error(`Error starting VM:: ${error.message}`);
            updatedError.originalError = error;
            throw updatedError;
        }
        console.log(`VM started successfully: ${stdout}`);
    });

    return `VM Successfully started`;
}

module.exports = { startVM };