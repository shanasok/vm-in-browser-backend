const { exec, spawn } = require('child_process');
const config = require('../../.config');
const { startNoVNCProxy } = require('../../src/noVNC/noVNCstarter.js');

jest.mock('child_process', () => ({
    exec: jest.fn(),
    spawn: jest.fn(),
}));
jest.mock('../../.config', () => ({
    paths: { noVncDir: '/Users/shanasokolic/IdeaProjects/noVNC' },
    urls: { vncHost: 'localhost' },
    ports: { internalVncPort: 5900 },
}));

describe('startNoVNCProxy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should start noVNC successfully', async () => {
        const externalPort = 6080;
        const internalPort = 5900;
        const noVncDir = config.paths.noVncDir;
        const vncHost = config.urls.vncHost;

        const mockProcess = {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn(),
        };
        spawn.mockReturnValue(mockProcess);

        exec.mockImplementation((cmd, callback) => callback(null, 'noVNC started successfully', ''));

        await startNoVNCProxy(externalPort, internalPort);

        expect(spawn).toHaveBeenCalledWith(
            './utils/novnc_proxy',
            ['--vnc', `${vncHost}:${internalPort}`],
            { cwd: noVncDir }
        );
        expect(mockProcess.stdout.on).toHaveBeenCalled();
        expect(mockProcess.stderr.on).toHaveBeenCalled();
        expect(mockProcess.on).toHaveBeenCalled();
    });

    it('should throw an error if starting noVNC fails', (done) => {

        const externalPort = 6080;
        const internalPort = 5900;
        const noVncDir = config.paths.noVncDir;
        const vncHost = config.urls.vncHost;

        const mockProcess = {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn((event, callback) => {
                if (event === 'close') {
                    callback(1);
                    done();
                }
            }),
        };
        spawn.mockReturnValue(mockProcess);

        exec.mockImplementation((cmd, callback) => callback(new Error('Starting noVNC failed'), '', ''));

        try {
            startNoVNCProxy(externalPort, internalPort);
        } catch (error) {
            expect(error.message).toBe('Error spawning noVNC');
            done();
        }

        expect(spawn).toHaveBeenCalledWith(
            './utils/novnc_proxy',
            ['--vnc', `${vncHost}:${internalPort}`],
            { cwd: noVncDir }
        );
        expect(mockProcess.stdout.on).toHaveBeenCalled();
        expect(mockProcess.stderr.on).toHaveBeenCalled();
    });
});