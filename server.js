const express = require('express');
const cors = require('cors'); // Import the cors middleware
const { exec, spawn } = require('child_process'); // Import exec from child_process


// Create an instance of Express
const app = express();

// Define a port for the server to listen on
const PORT = 4000;

const noVNCDirectory = '/Users/shanasokolic/IdeaProjects/noVNC';
const vncCommand = './utils/novnc_proxy --vnc localhost:5900';

// Function to start the noVNC proxy server
function startNoVNCProxy() {
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
app.get('/api/start-vm', (req, res) => {
  // Simulate starting a VM
  if (req.method === 'GET') {

    const vmxPath = '/Users/shanasokolic/Virtual Machines.localized/Kali_Linux_Debian 12.x 64-bit Arm.vmwarevm/Kali_Linux_Debian 12.x 64-bit Arm.vmx';

    // Define API endpoint to start the VM
    console.log('Starting virtual machine...');
    exec(`vmrun start '${vmxPath}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting VM: ${error.message}`);
        return res.status(500).json({ message: 'Failed to start VM.', error: error.message });
      }
      console.log(`VM started successfully: ${stdout}`);
      //http://Shoshanas-MacBook-Pro.local:6080/vnc.html?host=Shoshanas-MacBook-Pro.local&port=6080
      res.status(200).json({ message: 'VM started successfully!', vncUrl: 'http://localhost:6080/vnc.html' });
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
