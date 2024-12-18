const fs = require('fs');

const vmxTraineeTemplatesPath = '/Users/shanasokolic/Virtual Machines.localized/traineeVMs/';

function createTraineeVMDirectory(){
    // Ensure the destination directory exists
    if (!fs.existsSync(vmxTraineeTemplatesPath)) {
        fs.mkdirSync(vmxTraineeTemplatesPath, { recursive: true });
    }
}

function generateTraineeVMname() {
    const timestamp = new Date().toISOString(); // Generates a standardized ISO timestamp
    const result = `${vmxTraineeTemplatesPath}${timestamp}_traineeVM.vmx`;
    return result;
}


module.exports = { generateTraineeVMname };