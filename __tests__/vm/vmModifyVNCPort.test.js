const { expect } = require('@jest/globals');
const fs = require('fs');
const { spawn} = require('child_process');
const config = require('../../.config.js');

const { getNextVncPort, updateVncPort, startWebsockify, getWebSocketPort } = require('../../src/vm/vmModifyVNCPort.js');
const {cloneVmWithVmrun, setExecPromise} = require("../../src/vm/vmModifyVNCPort");


jest.mock('fs');
jest.mock('child_process');
jest.mock('util', () => ({
    promisify: jest.fn(), // Mock promisify globally
}));


describe('vmModifyVNCPort', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getNextVncPort', () => {
        it('should return the next VNC port', () => {
            const initialPort = config.ports.internalVncPort;
            const nextPort = getNextVncPort();
            expect(nextPort).toBe(initialPort);
            const nextPort2 = getNextVncPort();
            expect(nextPort2).toBe(initialPort + 1);
        });
    });

    describe('getWebSocketPort', () => {
        it('should return the next WebSocket port', () => {
            const initialPort = config.ports.externalWebSocketPort;
            const nextPort = getWebSocketPort();
            expect(nextPort).toBe(initialPort);
            const nextPort2 = getWebSocketPort();
            expect(nextPort2).toBe(initialPort + 1);
        });
    });

    describe('updateVncPort', () => {
        it('should update the VNC port in the VMX file', () => {
            const vmxFile = 'test.vmx';
            const newPort = 5901;
            const vmxContent = 'RemoteDisplay.vnc.port = "5900"';
            fs.readFileSync.mockReturnValue(vmxContent);

            updateVncPort(vmxFile, newPort, fs);

            expect(fs.readFileSync).toHaveBeenCalledWith(vmxFile, 'utf8');
            expect(fs.writeFileSync).toHaveBeenCalledWith(vmxFile, expect.any(String), 'utf8');
            expect(fs.appendFileSync).not.toHaveBeenCalled();
        });

        it('should append the VNC port if not found in the VMX file', () => {
            const vmxFile = 'test.vmx';
            const newPort = 5901;
            const vmxContent = 'some other content';
            fs.readFileSync.mockReturnValue(vmxContent);

            updateVncPort(vmxFile, newPort, fs);

            expect(fs.readFileSync).toHaveBeenCalledWith(vmxFile, 'utf8');
            expect(fs.writeFileSync).not.toHaveBeenCalled();
            expect(fs.appendFileSync).toHaveBeenCalledWith(vmxFile, `\nRemoteDisplay.vnc.port = "${newPort}"\n`);
        });
    });

    describe('startWebsockify', () => {

        it('should start a websockify instance', async () => {
            const webDir = '/path/to/web';
            const websocketPort = 6080;
            const vncHost = 'localhost';
            const vncPort = 5900;
            const mockProcess = {
                stdout: {on: jest.fn()},
                stderr: {on: jest.fn()},
                on: jest.fn(),
            };
            spawn.mockReturnValue(mockProcess);

            const result = await startWebsockify(webDir, websocketPort, vncHost, vncPort);

            expect(spawn).toHaveBeenCalledWith('websockify', [
                '--web', webDir,
                websocketPort.toString(),
                `${vncHost}:${vncPort}`
            ]);
            expect(result).toBe(mockProcess);
        });

        it('should log output if websockify process writes to stdout', async () => {
            const webDir = '/path/to/web';
            const websocketPort = 6080;
            const vncHost = 'localhost';
            const vncPort = 5900;

            const mockProcess = {
                stdout: { on: jest.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Mocked stdout output');
                        }
                    }) },
                stderr: { on: jest.fn() },
                on: jest.fn(),
            };
            spawn.mockReturnValue(mockProcess);

            await startWebsockify(webDir, websocketPort, vncHost, vncPort);

            expect(spawn).toHaveBeenCalledWith('websockify', [
                '--web', webDir,
                websocketPort.toString(),
                `${vncHost}:${vncPort}`
            ]);
            expect(mockProcess.stdout.on).toHaveBeenCalledWith('data', expect.any(Function));
        });

        it('should log an error if websockify process writes to stderr', async () => {
            const webDir = '/path/to/web';
            const websocketPort = 6080;
            const vncHost = 'localhost';
            const vncPort = 5900;

            const mockProcess = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn((event, callback) => {
                        if (event === 'data') {
                            callback('Mocked stderr error');
                        }
                    }) },
                on: jest.fn(),
            };
            spawn.mockReturnValue(mockProcess);

            await startWebsockify(webDir, websocketPort, vncHost, vncPort);

            expect(spawn).toHaveBeenCalledWith('websockify', [
                '--web', webDir,
                websocketPort.toString(),
                `${vncHost}:${vncPort}`
            ]);
            expect(mockProcess.stderr.on).toHaveBeenCalledWith('data', expect.any(Function));
        });

        it('should log output if websockify process writes to stdout', async () => {
            const webDir = '/path/to/web';
            const websocketPort = 6080;
            const vncHost = 'localhost';
            const vncPort = 5900;

            const mockProcess = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn((event, callback) => {
                    if (event === 'close') {
                        callback(0);
                    }
                }),
            };
            spawn.mockReturnValue(mockProcess);

            await startWebsockify(webDir, websocketPort, vncHost, vncPort);

            expect(spawn).toHaveBeenCalledWith('websockify', [
                '--web', webDir,
                websocketPort.toString(),
                `${vncHost}:${vncPort}`
            ]);
            expect(mockProcess.on).toHaveBeenCalledWith('close', expect.any(Function));
        });
    });

    describe('cloneVmWithVmrun', () => {
        let execPromiseMock;

        beforeEach(() => {
            execPromiseMock = jest.fn(); // Create a mock function for execPromise
            setExecPromise(execPromiseMock); // Inject the mock
            jest.clearAllMocks();
        });

        it('should clone the VM using vmrun and resolve with success', async () => {
            const templateVmx = 'template.vmx';
            const clonedVmx = 'cloned.vmx';
            const cloneCommand = `vmrun clone "${templateVmx}" "${clonedVmx}" full`;

            execPromiseMock.mockResolvedValueOnce({stdout: 'Cloning complete', stderr: ''});

            const result = await cloneVmWithVmrun(templateVmx, clonedVmx);

            expect(execPromiseMock).toHaveBeenCalledWith(cloneCommand);
            expect(result).toBe(`VM Successfully cloned to ${clonedVmx}`);
        });


        it('should throw an error if execPromise is not initialized', async () => {
            const templateVmx = 'template.vmx';
            const clonedVmx = 'cloned.vmx';

            execPromiseMock.mockResolvedValueOnce({stderr: 'Error happened'});

            await expect(cloneVmWithVmrun(templateVmx, clonedVmx)).rejects.toThrow('Error happened');
        });
    });
});


