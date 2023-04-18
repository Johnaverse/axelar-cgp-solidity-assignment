require('@nomiclabs/hardhat-waffle');
require('hardhat-gas-reporter');
require('solidity-coverage');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        version: '0.8.9',
        settings: {
            evmVersion: process.env.EVM_VERSION || 'london',
            optimizer: {
                enabled: true,
                runs: 1000,
                details: {
                    peephole: true,
                    inliner: true,
                    jumpdestRemover: true,
                    orderLiterals: true,
                    deduplicate: true,
                    cse: true,
                    constantOptimizer: true,
                    yul: true,
                    yulDetails: {
                        stackAllocation: true,
                    },
                },
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 1,
        },
        sepolia: {
            url: `https://sepolia.infura.io/v3/eb76925db45f4faeb4b026371949c9cf`,
            accounts: ['5ca30873b4f52b72729a17120d98080b282137f08546042ba34d5f4fb02f17af']
          }
    },
};
