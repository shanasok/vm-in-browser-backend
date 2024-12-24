const { exec } = require('child_process');
const { generateTraineeVMname } = require('../../src/vm/vmCreator.js');
const {
    getNextVncPort,
    getWebSocketPort,
    cloneVmWithVmrun,
    updateVncPort,
    startWebsockify
} = require('../../src/vm/vmModifyVNCPort');
const config = require('../../.config');
const { triggerVmWorkflow } = require('../../src/vm/vmStarter.js');

jest.mock('child_process', () => ({
    exec: jest.fn(),
}));
jest.mock('../../src/vm/vmCreator', () => ({
    generateTraineeVMname: jest.fn(),
}));
jest.mock('../../src/vm/vmModifyVNCPort', () => ({
    getNextVncPort: jest.fn(),
    getWebSocketPort: jest.fn(),
    cloneVmWithVmrun: jest.fn(),
    updateVncPort: jest.fn(),
    startWebsockify: jest.fn(),
}));
jest.mock('../../.config', () => ({
    urls: { vncHost: 'localhost' },
    paths: { noVncDir: '/path/to/noVnc', vmTemplatePath: '/path/to/template.vmx' },
}));

describe('triggerVmWorkflow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should complete the VM workflow successfully', async () => {
        const traineeVMPath = '/path/to/trainee.vmx';
        const internalPort = 5901;
        const externalPort = 6080;

        generateTraineeVMname.mockReturnValue(traineeVMPath);
        getNextVncPort.mockReturnValue(internalPort);
        getWebSocketPort.mockReturnValue(externalPort);
        cloneVmWithVmrun.mockResolvedValue();
        updateVncPort.mockResolvedValue();
        exec.mockImplementation((cmd, callback) => callback(null, 'VM started successfully', ''));
        startWebsockify.mockResolvedValue({});

        const result = await triggerVmWorkflow();

        expect(generateTraineeVMname).toHaveBeenCalled();
        expect(getNextVncPort).toHaveBeenCalled();
        expect(getWebSocketPort).toHaveBeenCalled();
        expect(cloneVmWithVmrun).toHaveBeenCalledWith(config.paths.vmTemplatePath, traineeVMPath);
        expect(updateVncPort).toHaveBeenCalledWith(traineeVMPath, internalPort);
        expect(exec).toHaveBeenCalledWith(`vmrun start '${traineeVMPath}'`, expect.any(Function));
        expect(startWebsockify).toHaveBeenCalledWith(config.paths.noVncDir, externalPort, config.urls.vncHost, internalPort);
        expect(result).toBe(externalPort);
    });

    it('should throw an error if cloning the VM fails', async () => {
        cloneVmWithVmrun.mockRejectedValue(new Error('Cloning failed'));

        await expect(triggerVmWorkflow()).rejects.toThrow('Failed to clone VM.');
        expect(cloneVmWithVmrun).toHaveBeenCalled();
    });

    it('should throw an error if updating the VNC port fails', async () => {
        cloneVmWithVmrun.mockResolvedValue();
        updateVncPort.mockRejectedValue(new Error('Updating VNC port failed'));

        await expect(triggerVmWorkflow()).rejects.toThrow('Failed to clone VM.');
        expect(updateVncPort).toHaveBeenCalled();
    });

    it('should throw an error if starting the VM fails', async () => {
        cloneVmWithVmrun.mockResolvedValue();
        updateVncPort.mockResolvedValue();
        exec.mockImplementation((cmd, callback) => callback(new Error('Starting VM failed'), '', ''));

        await expect(triggerVmWorkflow()).rejects.toThrow('Failed to clone VM.');
        expect(exec).toHaveBeenCalled();
    });

    it('should throw an error if starting websockify fails', async () => {
        cloneVmWithVmrun.mockResolvedValue();
        updateVncPort.mockResolvedValue();
        exec.mockImplementation((cmd, callback) => callback(null, 'VM started successfully', ''));
        startWebsockify.mockRejectedValue(new Error('Starting websockify failed'));

        await expect(triggerVmWorkflow()).rejects.toThrow('Failed to clone VM.');
        expect(startWebsockify).toHaveBeenCalled();
    });
});