const { expect } = require('@jest/globals');
const portReadinessChecker = require('../../src/vm/portReadinessChecker.js');

jest.mock('net');

describe('isPortOpen', () => {
    it('should resolve true if the port is open', async () => {
        const net = require('net');

        const socketMock = {
            setTimeout: jest.fn(),
            once: jest.fn((event, callback) => {
                if (event === 'connect') callback(true);
            }),
            destroy: jest.fn(),
            connect: jest.fn(),
        };

        net.Socket.mockImplementation(() => socketMock);

        const result = await portReadinessChecker.isPortOpen('localhost', 5900, 15000, socketMock);
        expect(result).toBe(true);
        expect(socketMock.setTimeout).toHaveBeenCalledWith(15000);
        expect(socketMock.connect).toHaveBeenCalledWith(5900, 'localhost');
        expect(socketMock.destroy).toHaveBeenCalled();
    });

    it('should reject with an error if the connection fails', async () => {
        const net = require('net');

        const socketMock = {
            setTimeout: jest.fn(),
            once: jest.fn((event, callback) => {
                if (event === 'error') callback(new Error('Connection failed'));
            }),
            destroy: jest.fn(),
            connect: jest.fn(() => { throw new Error('Triggered a connection failure'); }),
        };

        net.Socket.mockImplementation(() => socketMock);

        await expect(portReadinessChecker.isPortOpen('localhost', 5899, 15000, socketMock)).rejects.toThrow('Failed to connect to localhost:5899: ');
        expect(socketMock.setTimeout).toHaveBeenCalledWith(15000);
        expect(socketMock.connect).toHaveBeenCalledWith(5899, 'localhost');
        expect(socketMock.destroy).toHaveBeenCalled();
    });

    it('should reject with an error if the connection times out', async () => {
        const net = require('net');

        const socketMock = {
            setTimeout: jest.fn(),
            once: jest.fn((event, callback) => {
                if (event == 'timeout') callback(new Error('Connection timed out'));
            }),
            destroy: jest.fn(),
            connect: jest.fn(),
        };

        net.Socket.mockImplementation(() => socketMock);

        await expect(portReadinessChecker.isPortOpen('localhost', 5899, 15000, socketMock)).rejects.toThrow('Timeout connecting to localhost:5899 after 15000ms');
        expect(socketMock.setTimeout).toHaveBeenCalledWith(15000);
        expect(socketMock.connect).toHaveBeenCalledWith(5899, 'localhost');
        expect(socketMock.destroy).toHaveBeenCalled();

    });

    it('should reject with an error if an unexpected error occurs', async () => {
        const net = require('net');

        const socketMock = {
            setTimeout: jest.fn(),
            once: jest.fn(),
            destroy: jest.fn(),
            connect: jest.fn(() => { throw new Error('Unexpected error'); }),
        };

        net.Socket.mockImplementation(() => socketMock);

        await expect(portReadinessChecker.isPortOpen('localhost', 5899, 15000, socketMock)).rejects.toThrow('Unexpected error: Unexpected error');
        expect(socketMock.setTimeout).toHaveBeenCalledWith(15000);
        expect(socketMock.connect).toHaveBeenCalledWith(5899, 'localhost');
    });
});

describe('waitForVMToBeReady', () => {

    jest.mock('../../src/vm/portReadinessChecker.js', () => ({
        isPortOpen: jest.fn(),
        waitForVMToBeReady: jest.requireActual('../../src/vm/portReadinessChecker.js').waitForVMToBeReady,
    }));

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

    it('should catch an error thrown by isPortOpen', async () => {
        const isPortOpenMock = jest.fn().mockRejectedValue(new Error('Mocked error'));

        await expect(portReadinessChecker.waitForVMToBeReady('localhost', 5899, 3, 100, isPortOpenMock))
            .rejects.toThrow('VM did not become ready on localhost:5899 after 3 retries');
        expect(isPortOpenMock).toHaveBeenCalled();
    });
});