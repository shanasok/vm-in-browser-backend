require('dotenv').config();

const config = {
    urls: {
        vncHost: process.env.VNC_HOST || 'localhost',
    },
    ports: {
        backendServerPort: process.env.BACKEND_SERVER_PORT || 4000,
        originPort: process.env.ORIGIN_PORT || 3000,
        internalVncPort: process.env.INTERNAL_VNC_PORT || 5900,
        externalWebSocketPort: process.env.EXTERNAL_WEBSOCKET_PORT || 6080,
    },
    paths: {
        noVncDir: process.env.NOVNC_DIR || '/Users/shanasokolic/IdeaProjects/noVNC',
        vmTemplatePath: process.env.TEMPLATE_VMX_PATH || '/Users/shanasokolic/Virtual Machines.localized/TeachingVM.vmwarevm/TeachingVM.vmx',
    },
};

module.exports = config;
