module.exports = {
  networks: {
    localhost: {
      network_id: "*",
      port: 8545,
      host: "localhost"
    },
    loc_development_development: {
      network_id: "*",
      port: 8545,
      host: "127.0.0.1"
    }
  },
  mocha: {},
  compilers: {
    solc: {
      version: "0.7.3"
    }
  }
};
