const { expect } = require('@jest/globals');
const { generateTraineeVMname } = require('../../src/vm/vmCreator.js');
const config = require('../../.config');

describe('vmCreator', () => {
    describe('generateTraineeVMname', () => {
        it('should generate a valid VM name with a timestamp', () => {
            const pathToDirForTraineeVms = config.paths.pathToDirForTraineeVms;
            const result = generateTraineeVMname();
            const timestamp = new Date().toISOString().split('T')[0]; // Get only the date part

            expect(result).toContain(pathToDirForTraineeVms);
            expect(result).toContain(timestamp);
            expect(result).toContain('Clone_traineeVM.vmx');
        });
    });
});