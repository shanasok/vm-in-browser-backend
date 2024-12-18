const fs = require('fs');
const path = '/Library/Preferences/VMware Fusion/vmnet8/nat.conf';
const pathToNatConf = '/Library/Preferences/VMware\ Fusion/vmnet8/nat.conf';

function addPortForwardingRule(externalPort, privateIP, internalPort = 5900) {
    const rule = `${externalPort} = ${privateIP}:${internalPort}`;
    const config = fs.readFileSync(pathToNatConf, 'utf8');
    if (!config.includes(rule)) {
        const updatedConfig = config.replace('[incomingtcp]', `[incomingtcp]\n${rule}`);
        fs.writeFileSync(path, updatedConfig, 'utf8');
        console.log(`Added port forwarding rule: ${rule}`);
    }
}

// Example: Add a new rule for the next VM
addPortForwardingRule(6084, '192.168.48.144');
