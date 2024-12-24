const { expect, jest } = require('@jest/globals');
const portReadinessChecker = require('../../src/vm/portReadinessChecker.js');

jest.mock('net');
jest.mock('../../src/vm/portReadinessChecker.js', () => ({
    isPortOpen: jest.fn(),
    waitForVMToBeReady: jest.requireActual('../../src/vm/portReadinessChecker.js').waitForVMToBeReady,
}));

describe('isPortOpen', () => {
    it('should resolve true if the port is open', async () => {
        const net = require('net');
        net.Socket.mockImplementation(() => ({
            setTimeout: jest.fn(),
            once: jest.fn((event, callback) => {
                if (event === 'connect') callback();
            }),
            destroy: jest.fn(),
            connect: jest.fn(),
        }));

        const result = await portReadinessChecker.isPortOpen('localhost', 5900);
        expect(result).toBe(true);
    });

    it('should reject with an error if the connection fails', async () => {
        const net = require('net');
        net.Socket.mockImplementation(() => ({
            setTimeout: jest.fn(),
            once: jest.fn((event, callback) => {
                if (event === 'error') callback(new Error('Connection failed'));
            }),
            destroy: jest.fn(),
            connect: jest.fn(),
        }));

        await expect(portReadinessChecker.isPortOpen('localhost', 5899)).rejects.toThrow('Failed to connect to localhost:5899: ');
    });
});

describe('waitForVMToBeReady', () => {
    it('should resolve true if the VM becomes ready', async () => {
        const isPortOpenMock = jest.fn().mockResolvedValue(true);

        const result = await portReadinessChecker.waitForVMToBeReady('localhost', 5900, 3, 100, isPortOpenMock);

        expect(result).toBe(true);
        expect(isPortOpenMock).toHaveBeenCalled();
    });

    it('should throw an error if the VM does not become ready', async () => {
        const isPortOpenMock = jest.fn().mockResolvedValue(false);

        await expect(portReadinessChecker.waitForVMToBeReady('localhost', 5899, 3, 100, isPortOpenMock))
            .rejects.toThrow('VM did not become ready on localhost:5899 after 3 retries');
        expect(isPortOpenMock).toHaveBeenCalled();
    });
});