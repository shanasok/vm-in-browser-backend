const fs = require('fs');
const config = require("../../.config");

const pathToDirForTraineeVms = config.paths.pathToDirForTraineeVms;

function generateTraineeVMname() {
    const timestamp = new Date().toISOString(); // Generates a standardized ISO timestamp
    const result = `${pathToDirForTraineeVms}/${timestamp}/Clone_traineeVM.vmx`;
    return result;
}


module.exports = { generateTraineeVMname };