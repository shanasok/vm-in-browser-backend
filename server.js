const express = require('express');
const cors = require('cors'); // Import the cors middleware
const { spawn } = require('child_process');

const { startVM } = require('./src/vm/vmStarter.js');
const { generateTraineeVMname } = require('./src/vm/vmCreator.js');
const { cloneVmWithVmrun, getNextVncPort, updateVncPort, startWebsockify, getWebSocketPort } = require('./src/vm/vmModifyVNCPort.js');

// Create an instance of Express
const app = express();

// Define a port for the server to listen on
const PORT = 4000;
const webDir = '/Users/shanasokolic/IdeaProjects/noVNC';
const vncHost = 'localhost';
const templateVmxPath = '/Users/shanasokolic/Virtual Machines.localized/TeachingVM.vmwarevm/TeachingVM.vmx';

// Function to start the noVNC proxy server
async function startNoVNCProxy() {
  console.log('Starting noVNC proxy server...');

  const noVNCProcess = spawn('./utils/novnc_proxy', ['--vnc', 'localhost:5900'], {
      cwd: '/Users/shanasokolic/IdeaProjects/noVNC',
    });

    // Listen for stdout (normal output)
    noVNCProcess.stdout.on('data', (data) => {
      console.log(`noVNC output: ${data}`);
    });

    // Listen for stderr (error output)
    noVNCProcess.stderr.on('data', (data) => {
      console.error(`noVNC error: ${data}`);
    });

    // Handle process exit
    noVNCProcess.on('close', (code) => {
      if (code === 0) {
        console.log('noVNC proxy server exited successfully.');
      } else {
        console.error(`noVNC proxy server exited with code ${code}.`);
      }
    });

    console.log('noVNC proxy server started in background.');
}

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
      startVM(res, traineeVMPath).then(result => console.log(result));
      startWebsockify(webDir, externalPort, vncHost, internalPort)
          .then(result =>
              console.log(result));

      res.status(200).json({
        message: 'VM started successfully!',
        vncUrl: `http://localhost:${externalPort}/vnc.html`
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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
