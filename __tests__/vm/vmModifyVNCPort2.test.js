jest.mock('util', () => ({
    promisify: jest.fn(), // Mock promisify globally
}));

const { cloneVmWithVmrun } = require('../../src/vm/vmModifyVNCPort.js'); // Import after mock
const util = require('util');
const { exec } = require('child_process');

describe('cloneVmWithVmrun without execPromise', () => {
    let execPromiseMock;

    beforeEach(() => {
        execPromiseMock = jest.fn(); // Create a mock function for execPromise
        util.promisify.mockReturnValue(execPromiseMock); // Mock util.promisify to return execPromiseMock
        jest.clearAllMocks(); // Clear previous mock states
    });

    it('should call setExecPromise if null', async () => {
        const templateVmx = 'template.vmx';
        const clonedVmx = 'cloned.vmx';

        // Mock execPromise to resolve successfully
        execPromiseMock.mockResolvedValueOnce({ stdout: 'Cloning complete', stderr: '' });

        const result = await cloneVmWithVmrun(templateVmx, clonedVmx);

        // Verify that promisify was called with exec
        expect(util.promisify).toHaveBeenCalledWith(exec);
        // Verify that execPromise was called with the correct clone command
        expect(execPromiseMock).toHaveBeenCalledWith(`vmrun clone "${templateVmx}" "${clonedVmx}" full`);
        // Verify the result
        expect(result).toBe(`VM Successfully cloned to ${clonedVmx}`);
    });

});
