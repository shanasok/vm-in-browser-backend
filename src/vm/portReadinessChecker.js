const net = require('net');

function isPortOpen(host, port, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();

        socket.setTimeout(timeout);

        // Handle connection errors
        socket.once('error', (err) => {
            console.error(`Error connecting to ${host}:${port} - ${err.message}`);
            socket.destroy(); // Ensure the socket is cleaned up
            reject(new Error(`Failed to connect to ${host}:${port}: ${err.message}`));
        });

        // Handle connection timeout
        socket.once('timeout', () => {
            console.error(`Connection to ${host}:${port} timed out after ${timeout}ms`);
            socket.destroy(); // Ensure the socket is cleaned up
            reject(new Error(`Timeout connecting to ${host}:${port} after ${timeout}ms`));
        });

        // Handle successful connection
        socket.once('connect', () => {
            console.log(`Successfully connected to ${host}:${port}`);
            socket.destroy(); // Clean up the socket after successful connection
            resolve(true);
        });

        // Attempt to connect to the specified host and port
        try {
            console.log(`Attempting to connect to ${host}:${port} with a timeout of ${timeout}ms`);
            socket.connect(port, host);
        } catch (err) {
            console.error(`Unexpected error initiating connection to ${host}:${port} - ${err.message}`);
            reject(new Error(`Unexpected error: ${err.message}`));
        }
    });
}

async function waitForVMToBeReady(host, port, maxRetries = 10, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        console.log("About to wait for port. Counter is: " + i);
        try {
            const portOpen = await isPortOpen(host, port);
            console.log("Finished waiting for port. Counter is: " + i);
            if (portOpen) {
                console.log("Port became open. Counter is: " + i);
                return true;
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error(`VM did not become ready on ${host}:${port} after ${maxRetries} retries`);
}

module.exports = { waitForVMToBeReady };