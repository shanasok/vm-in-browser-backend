const express = require('express');
const cors = require('cors'); // Import the cors middleware
const { startVM } = require('./src/vm/vmStarter.js');
const { generateTraineeVMname } = require('./src/vm/vmCreator.js');
const { cloneVmWithVmrun, getNextVncPort, updateVncPort, startWebsockify, getWebSocketPort } = require('./src/vm/vmModifyVNCPort.js');
const config = require('./.config.js');
const { startNoVNCProxy } = require('./src/noVNC/noVNCstarter');

const backendServerPort = config.ports.backendServerPort;  // Define a port for the server to listen on
const vncHost = config.urls.vncHost;
const noVncDir = config.paths.noVncDir;
const templateVmxPath = config.paths.vmTemplatePath;

// Create an instance of Express
const app = express();

// Enable CORS for all routes
app.use(cors({ origin: 'http://localhost:3000' }));

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

      const traineeVMPath = generateTraineeVMname();
      const internalPort = getNextVncPort();
      const externalPort = getWebSocketPort();

      await cloneVmWithVmrun(templateVmxPath, traineeVMPath)
          .then(result => console.log(result))
          .catch(error => console.error("Clone failed:", error.message));
      console.log("after clone call");

      updateVncPort(traineeVMPath, internalPort);  // Modify the VNC port of the cloned VM
      startVM(res, traineeVMPath)
          .then(result => {
            console.log(result);

            // Start websockify after the VM has started
            startWebsockify(noVncDir, externalPort, vncHost, internalPort)
                .then(result =>
                    console.log(result));
          });

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
  console.log(`Server is running on http://localhost:${backendServerPort}`);
});
