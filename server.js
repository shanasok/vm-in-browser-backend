const express = require('express');
const cors = require('cors'); // Import the cors middleware
const { triggerVmWorkflow } = require('./src/vm/vmStarter.js');
const config = require('./.config.js');
const { startNoVNCProxy } = require('./src/noVNC/noVNCstarter');

const backendServerPort = config.ports.backendServerPort;  // Define a port for the server to listen on
const vncHost = config.urls.vncHost;

// Create an instance of Express
const app = express();

// Configures the cors middleware to allow requests only from the specified origin
app.use(cors({ origin: `http://${vncHost}:${config.ports.originPort}` }));

// Middleware to parse JSON requests
app.use(express.json());

// Start the noVNC proxy server when the app initializes
startNoVNCProxy();


// Define a simple GET route
app.get('/', (req, res) => {
  res.send('Welcome to the backend server!');
});

// Define an API endpoint (e.g., to start a VM)
app.get('/api/start-vm', async (req, res) => {

  try {
    if (req.method === 'GET') {

      const externalPort = await triggerVmWorkflow();

      res.status(200).json({
        message: 'VM started successfully!',
        vncUrl: `http://${vncHost}:${externalPort}/vnc.html`
      });

    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }catch(error){
    return res.status(500).json({ message: 'Failed on backend', error: error.message });
  }
  return res;
});

// Start the server
app.listen(backendServerPort, () => {
  console.log(`Server is running on http://${vncHost}:${backendServerPort}`);
});
