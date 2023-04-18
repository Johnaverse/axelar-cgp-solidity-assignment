'use strict';

const { ethers } = require('hardhat');
require('dotenv').config();
const {
    getContractAt,
    Wallet,
    providers: { JsonRpcProvider },
    utils: { keccak256, defaultAbiCoder, arrayify },
} = ethers;

const {
    printLog,
} = require('./utils');




const url = process.env.URL;
const privKey = process.env.PRIVATE_KEY;

const provider = new JsonRpcProvider(url);
const owner = new Wallet(privKey, provider);

const getWeights = ({ length }, weight = 1) => Array(length).fill(weight);

// import that 4 address which is already used for the contract deployment
const signer1 = new Wallet("0x30c920327313fd0ebeabdb37408c08e127825d4e189b2bff64bf576b6f8ae260", provider);
const signer2 = new Wallet("0x1ffd783cd6fc61f43c54b66d538f78817362dbb181fd787f9c23b68d5be595ff", provider);
const signer3 = new Wallet("0x33c47f049b7c9942b8255d37468e7488cc472772905d4a476734c5724b6f3d31", provider);
const signer4 = new Wallet("0x55677987c6d7c3c155652508d73fa4eadaba354e1715ceeaf6ddd30f18ebd52c", provider);

// main execution

(async () => {
    const wallets = [signer1, signer2, signer3, signer4];

    const auth = '0xB914782D8EAFcc0148Dba3a62d2ccce2fc491240';
    const token = '0xf391E8e7199bb0DB813A18b3c908568b4f03Ca82';
    const gateway = '0x0699d1d6fe64dC5dF88f2416d846422E6F146BA1';
    const proxy = '0x609343b5482A8f5cB828530Bf358a4Dc19B6E029';

    //Task 1: Invoke the implementation method on the gateway proxy contract
    console.log('Task 1: fetching implemenetation method data from proxy');
    const AxelarGateway = await getContractAt('AxelarGateway', gateway, owner);
    const proxiedAxelarGateway = await AxelarGateway.attach(proxy);
    const currentImplAddress = await proxiedAxelarGateway.implementation();
    console.log(`Here is the current implementation address: `, currentImplAddress);

    //Task 2: invoke the callContract method via your script and find the tx on the blockchain explorer
    console.log("Task 2: invoke the callContract method via your script and find the tx on the blockchain explorer")
    //data sample from test/AxelarGatewat.js
    const chain = 'Polygon';
    const destination = '0xb7900E8Ec64A1D1315B6D4017d4b1dcd36E6Ea88';
    const payload = defaultAbiCoder.encode(['address', 'address'], ["0x302A716A4914d8459ACc3AB0C1b89BF04055FF63", "0x70F28EbB6A06E7158ca0F1726c4D04EA40dc3E2B"]);
    const tx = await proxiedAxelarGateway.connect(owner).callContract(chain, destination, payload);
    
    let msg = "Get the tx receipt and find info on the blockchain explorer: https://sepolia.etherscan.io/tx/";
    console.log(msg.concat(tx.hash));



    //Task 3: Upgrade contract
    console.log("Task 3: Upgrade Contract")
    var gatewayFactory = await ethers.getContractFactory('AxelarGateway', owner);
    console.log("Step 1: Deploying new impletementation smart contract.");
    const newGatewayImplementation = await gatewayFactory.deploy(auth, token).then((d) => d.deployed());
    printLog(`deployed gateway implementation at address ${newGatewayImplementation.address}`);
    const newGatewayImplementationCode = await newGatewayImplementation.provider.getCode(newGatewayImplementation.address);
    const newGatewayImplementationCodeHash = keccak256(newGatewayImplementationCode);

    var admins = wallets.map((wallet) => wallet.address);
    var operators = [];
    var weights = getWeights(operators);

    const paramsUpgrade = arrayify(
        defaultAbiCoder.encode(
            ['address[]', 'uint8', 'bytes'],
            [
                admins,
                2,
                operators.length
                    ? defaultAbiCoder.encode(['address[]', 'uint256[]', 'uint256'], [operators, weights, 2])
                    : '0x',
            ],
        ));

    console.log("Step 2: Call Upgrade method on the proxy contract with first admin signature.");
    var tx1 = await proxiedAxelarGateway.connect(signer1).upgrade(newGatewayImplementation.address, newGatewayImplementationCodeHash, paramsUpgrade);
    await tx1.wait();

    console.log("Step 3: Call Upgrade method on the proxy contract with second admin signature.");
    var tx2 = await proxiedAxelarGateway.connect(signer2).upgrade(newGatewayImplementation.address, newGatewayImplementationCodeHash, paramsUpgrade);
    await tx2.wait();

    console.log("***********Verify***********")
    console.log("2 admin signature = threshold. So the proxy is now change to the new gateway implementation.")
    const NewAxelarGateway = await getContractAt('AxelarGateway', newGatewayImplementation.address, owner);
    const NewproxiedAxelarGateway = await NewAxelarGateway.attach(proxy);
    const NewImplAddress = await NewproxiedAxelarGateway.implementation();
    console.log(`Here is the new implementation address: `, NewImplAddress)

})()
    .catch((err) => {
        console.error(err);
    })
    .finally(() => {
        //Do nothing
    });