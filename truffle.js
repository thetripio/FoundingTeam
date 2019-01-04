const HDWalletProvider = require("truffle-hdwallet-provider");
const MNEMONIC = process.env.MNEMONIC;
const GAS_LIMIT = 4800000;
module.exports = {
  compilers: {
    solc: {
      settings: {
        optimizer: {
          enabled: true,
          runs: 200   // Optimize for how many times you intend to run the code
        }
      }
    }
  },
  networks: {
    live: {
      network_id: 1,
      provider: new HDWalletProvider(MNEMONIC, "http://35.200.87.13:8545/"),
      gas: GAS_LIMIT,
      gasPrice: 4200000000,
    },
    ropsten: {
      network_id: "3",
      provider: new HDWalletProvider(MNEMONIC, "http://35.200.87.13:9545/"),
      gas: GAS_LIMIT,
      gasPrice: 10000000000,
    },
  }
};
