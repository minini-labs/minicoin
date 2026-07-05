require('dotenv');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers, network } = require('hardhat');
const TestHelper = require('./shared');
const SignHelper = require('./signature');
const ErrorMessages = require('./errorMessages');
use(solidity);

let owner;
let user1;
let user2;
let user3;
let MiniCoin;
let provider;
const zeroAddress = '0x0000000000000000000000000000000000000000';

const feeToPay = 0;

describe('MiniCoin - Ethless Transfer functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [MiniCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('MiniCoin - Regular Ethless Transfer', async function () {
        it('Test Ethless transfer', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                amountToTransfer,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToTransfer)
            );
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(amountToTransfer));
        });

        it('Test Ethless transfer when amountToTransfer is the same balance', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            const currentBalance = await MiniCoin.balanceOf(owner.address);
            expect(currentBalance).to.be.above(0n);

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                currentBalance,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                currentBalance,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(0n);
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(currentBalance));
        });
    });

    describe('MiniCoin - Test expecting failure Ethless Transfer', async function () {
        const amountToTransfer = TestHelper.getRandomIntInRange(10, 200);

        beforeEach(async () => {
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user1.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
        });

        it('Test Ethless transfer while reusing the signature on the second transfer', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                amountToTransfer,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToTransfer)
            );
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(amountToTransfer));
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ETHLESS_INVALID_SIGNATURE
            );
        });

        it('Test Ethless transfer while using the signed by different sender', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                user3,
                user2.address,
                amountToTransfer,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                amountToTransfer,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ETHLESS_INVALID_SIGNATURE
            );

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(0);
        });

        it('Test Ethless transfer while reusing the same nonce on the second transfer', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const firstNonce = nonce.toNumber();

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                firstNonce,
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                amountToTransfer,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToTransfer).sub(feeToPay)
            );
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(amountToTransfer));

            const splitSignature1 = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                amountToTransfer + 1,
                firstNonce,
                expirationTimestamp
            );
            const input1 = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                amountToTransfer + 1,
                expirationTimestamp,
                splitSignature1.v,
                splitSignature1.r,
                splitSignature1.s
            );

            await TestHelper.submitTxnAndCheckResult(
                input1,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ETHLESS_INVALID_SIGNATURE
            );
        });

        it('Test Ethless transfer when amountToTransfer is higher than the balance', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            const currentBalance = await MiniCoin.balanceOf(owner.address);

            expect(currentBalance).to.be.above(0n);

            const overBalance = currentBalance.add('1');

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                overBalance,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                overBalance,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.MINICOIN_INSUFFICIENT_BALANCE
            );
        });

        it('Test Ethless transfer when amountToTransfer is higher than the signed one', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                amountToTransfer + 1,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ETHLESS_INVALID_SIGNATURE
            );
        });

        it('Test Ethless transfer when amountToTransfer is lower than the signed one', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                amountToTransfer - 1,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ETHLESS_INVALID_SIGNATURE
            );
        });

        it('Test Ethless transfer when the deadline passed', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp;

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                amountToTransfer,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user2.address,
                amountToTransfer,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ETHLESS_EXPIRED_DEADLINE
            );
        });
    });
});
