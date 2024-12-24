module.exports = {
    transform: {
        "^.+\\.jsx?$": "babel-jest"
    },
    reporters: [
        'default', // Use the default Jest reporter
        ['jest-summarizing-reporter', { verbose: true }], // Add additional reporters
    ],
};

