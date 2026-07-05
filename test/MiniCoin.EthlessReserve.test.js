require('dotenv');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers, network } = require('hardhat');
const TestHelper = require('./shared');
const SignHelper = require('./signature');

use(solidity);

let owner;
let user1;
let user2;
let user3;
let MiniCoin;
let provider;
const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('MiniCoin - Ethless Reserve functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [MiniCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('MiniCoin - Regular Ethless Reserve', async function () {
        const amountToReserve = 1000;
        const feeToPay = 10;

        it('Test Ethless Reserve', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );
        });
        it('Test Ethless Reserve + ReserveOf', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const reserveOf = await MiniCoin.reserveOf(owner.address);
            expect(reserveOf).to.equal(ethers.BigNumber.from(amountToReserve).add(feeToPay));
        });
        it('Test Ethless Reserve + GetReservation', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const getReservation = await MiniCoin.getReservation(owner.address, nonce);
            expect(getReservation['amount'], 'amount').to.equal(ethers.BigNumber.from(amountToReserve));
            expect(getReservation['fee'], 'fee').to.equal(ethers.BigNumber.from(feeToPay));
            expect(getReservation['recipient'], 'recipient').to.equal(user1.address);
            expect(getReservation['executor'], 'executor').to.equal(owner.address);
            expect(getReservation['expiryBlockNum'], 'expiryBlockNum').to.equal(ethers.BigNumber.from(expirationBlock));
            expect(getReservation['status'], 'status').to.equal(1);
        });
        it('Test Ethless Reserve & Execute', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const inputExecute = await MiniCoin.connect(owner).populateTransaction['execute(address,uint256)'](
                owner.address,
                nonce
            );
            await TestHelper.submitTxnAndCheckResult(inputExecute, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve)
            );
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(amountToReserve));
        });
        it('Test Ethless Reserve & Reclaim', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const inputReclaim = await MiniCoin.connect(owner).populateTransaction['reclaim(address,uint256)'](
                owner.address,
                nonce
            );
            await TestHelper.submitTxnAndCheckResult(inputReclaim, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
        });
        it('Test Ethless Reserve current total balance', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const amountToReserve = originalBalance.sub(feeToPay);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );
        });
        it('Test Ethless Reserve half of balance and transfer half away', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const amountToReserve = originalBalance.div(2);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            await MiniCoin.connect(owner)['transfer(address,uint256)'](user2.address, amountToReserve.sub(feeToPay));
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(0);
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(amountToReserve.sub(feeToPay));
        });
        it('Test Ethless Reserve half of balance and transfer half away -1', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const amountToReserve = originalBalance.div(2);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            await MiniCoin.connect(owner)['transfer(address,uint256)'](
                user2.address,
                amountToReserve.sub(feeToPay).sub(1)
            );
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(1);
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(amountToReserve.sub(feeToPay).sub(1));
        });

        it('Test Ethless Reserve with receiver as address zero', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                zeroAddress,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](owner.address, zeroAddress, owner.address, amountToReserve, feeToPay, nonce, expirationBlock, signature);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );
        });

        it('Test Ethless Reserve with executor as address zero', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                zeroAddress,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](owner.address, user1.address, zeroAddress, amountToReserve, feeToPay, nonce, expirationBlock, signature);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );
        });
    });

    describe('MiniCoin - Test expecting failure Ethless Reserve', async function () {
        const amountToReserve = 1000;
        const feeToPay = 10;

        it('Test Ethless Reserve half of balance and transfer half +1 away', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const amountToReserve = originalBalance.div(2);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToReserve.add(1)
            );
            await TestHelper.submitTxnAndCheckResult(
                inputTransfer,
                MiniCoin.address,
                owner,
                ethers,
                provider,
                'MiniCoin: Insufficient balance'
            );
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(amountToReserve.sub(feeToPay));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(0);
        });

        it('Test Ethless Reserve with receiver as address zero and reclaim', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                zeroAddress,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](owner.address, zeroAddress, owner.address, amountToReserve, feeToPay, nonce, expirationBlock, signature);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const inputReclaim = await MiniCoin.connect(owner).populateTransaction['reclaim(address,uint256)'](
                owner.address,
                nonce
            );
            await TestHelper.submitTxnAndCheckResult(inputReclaim, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
        });

        it('Test Ethless Reserve with receiver as address zero and try to execute', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                zeroAddress,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](owner.address, zeroAddress, owner.address, amountToReserve, feeToPay, nonce, expirationBlock, signature);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const inputReclaim = await MiniCoin.connect(owner).populateTransaction['execute(address,uint256)'](
                owner.address,
                nonce
            );
            await TestHelper.submitTxnAndCheckResult(
                inputReclaim,
                MiniCoin.address,
                owner,
                ethers,
                provider,
                'ERC20: transfer to the zero address'
            );
        });

        it('Test Ethless Reserve with executor as address zero and reclaim when reservation expired', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                zeroAddress,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](owner.address, user1.address, zeroAddress, amountToReserve, feeToPay, nonce, expirationBlock, signature);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            await TestHelper.waitForNumberOfBlock(provider, expirationBlock + 1);

            const inputReclaim = await MiniCoin.connect(owner).populateTransaction['reclaim(address,uint256)'](
                owner.address,
                nonce
            );
            await TestHelper.submitTxnAndCheckResult(inputReclaim, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
        });

        it('Test Ethless Reserve while reusing the same nonce (and signature) on the second reserve', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'Ethless: nonce already used'
            );
        });

        it('Test Ethless Reserve while amountToReserve + feeToPay is higher than the balance', async () => {
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToReserve - feeToPay / 2
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                user2.address,
                user2.privateKey,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                user2.address,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'ERC20Reservable: reserve amount exceeds balance'
            );
        });

        it('Test Ethless Reserve while amountToReserve is higher than the balance', async () => {
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToReserve - feeToPay
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                user2.address,
                user2.privateKey,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                user2.address,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'ERC20Reservable: reserve amount exceeds balance'
            );
        });

        it('Test Ethless Reserve while feeToPay is higher than the balance', async () => {
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user2.address,
                feeToPay / 2
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                user2.address,
                user2.privateKey,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                user2.address,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'ERC20Reservable: reserve amount exceeds balance'
            );
        });

        it('Test Ethless Reserve while expirationBlock is lower than the current block.number', async () => {
            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber - 40;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'ERC20Reservable: deadline must be in the future'
            );
        });

        it('Test Ethless Reserve while expirationBlock is the current block.number', async () => {
            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user3.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                blockNumber
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](owner.address, user3.address, owner.address, amountToReserve, feeToPay, nonce, blockNumber, signature);
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'ERC20Reservable: deadline must be in the future'
            );
        });

        it('Test Ethless Reserve & Execute while reservation is expired already', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const inputExecute = await MiniCoin.connect(owner).populateTransaction['execute(address,uint256)'](
                owner.address,
                nonce
            );
            await TestHelper.submitTxnAndCheckResult(
                inputExecute,
                MiniCoin.address,
                owner,
                ethers,
                provider,
                'ERC20Reservable: reservation has expired and cannot be executed'
            );
        });
        it('Test Ethless Reserve & Reclaim while reservation is not expired yet', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                user3.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                user3.address,
                amountToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature
            );
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToReserve).sub(feeToPay)
            );

            const inputReclaim = await MiniCoin.connect(owner).populateTransaction['reclaim(address,uint256)'](
                owner.address,
                nonce
            );
            await TestHelper.submitTxnAndCheckResult(
                inputReclaim,
                MiniCoin.address,
                owner,
                ethers,
                provider,
                'ERC20Reservable: reservation has not expired to be reclaimed by non-executor'
            );
        });
    });
});
