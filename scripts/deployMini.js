const { ethers, network, upgrades, addressBook } = require('hardhat');
const ScriptHelper = require('./helper');
const TestHelper = require('../test/shared');
const owner = "0x7B17116c5C56264a70B956FEC54E3a3736e08Af0";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
    console.log('\x1b[32m%s\x1b[0m', 'Account address: ', deployer.address);
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', (await deployer.getBalance()).toString());

    // Contract deployed with transparent proxy
    const MiniCoinContract = await ethers.getContractFactory('MiniCoin');
    const MiniCoin = await MiniCoinContract.deploy(
        TestHelper.NAME,
        TestHelper.SYMBOL
    );
    await MiniCoin.deployed();
    addressBook.saveContract(
        'MiniCoin',
        MiniCoin.address,
        network.name,
        deployer.address,
        MiniCoin.blockHash,
        MiniCoin.blockNumber
    );
    console.log(
        '\x1b[32m%s\x1b[0m',
        'MiniCoin deployed at address: ',
        MiniCoin.address
    );
  
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', (await deployer.getBalance()).toString());

    console.log('Contract deployed!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
