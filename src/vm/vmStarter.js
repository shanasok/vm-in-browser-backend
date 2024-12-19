const {exec} = require("child_process");

async function startVM(res, pathToTraineeVM){

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

module.exports = { startVM };