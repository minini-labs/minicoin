require('dotenv');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers, network } = require('hardhat');
const Chance = require('chance');
const TestHelper = require('./shared');
const SignHelper = require('./signature');
const ErrorMessages = require('./errorMessages');
const errorMessages = require('./errorMessages');

use(solidity);

let owner;
let user1;
let user2;
let user3;
let MiniCoin;
let provider;
const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('MiniCoin - Boundary', function () {
    let originalBalance;
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [MiniCoin] = await TestHelper.setupContractTesting(owner);
        originalBalance = await MiniCoin.balanceOf(owner.address);
    });

    describe('Test floating point on different fn()', () => {
        it('Test burn() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                const inputBurn = await MiniCoin.populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.submitTxnAndCheckResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test transfer() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test transferFrom() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const inputApprove = await MiniCoin.populateTransaction.approve(user1.address, 1000);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    MiniCoin.address,
                    user1,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test transfer(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            let msg;
            try {
                const splitSignature = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    MiniCoin.address,
                    owner,
                    user1.address,
                    amount,
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                    owner.address,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test permit(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await MiniCoin.allowance(owner.address, user2.address);

            let msg;
            try {
                const splitSignature = await SignHelper.signPermit(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    MiniCoin.address,
                    owner,
                    user2.address,
                    amount,
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await MiniCoin.populateTransaction.permit(
                    owner.address,
                    user2.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.allowance(owner.address, user2.address)).to.equal(
                ethers.BigNumber.from(originalAllowance)
            );
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test reserve(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = await SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test approve() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            let msg;
            try {
                const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test increaseAllowance() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, 1000);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(1000));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });

        it('Test decreaseAllowance() w/ floating point', async () => {
            const chance = new Chance();
            const amount =
                chance.floating({ min: 0, max: 1000, fixed: 7 }) +
                chance.floating({ min: 0.0000001, max: 0.0000009, fixed: 7 });
            const inputApprove = await MiniCoin.populateTransaction.approve(MiniCoin.address, 1000);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.populateTransaction.decreaseAllowance(MiniCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(1000));
            expect(msg).to.equal(ErrorMessages.NUMERIC_FAULT_CODE);
        });
    });

    describe('Test negative number on different fn()', () => {
        it('Test burn() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const inputBurn = await MiniCoin.populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.submitTxnAndCheckResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transferFrom() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const inputApprove = await MiniCoin.populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    MiniCoin.address,
                    user1,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });

            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            let msg;
            try {
                const splitSignature = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    MiniCoin.address,
                    owner,
                    user1.address,
                    amount,
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                    owner.address,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test permit(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await MiniCoin.allowance(owner.address, user2.address);

            let msg;
            try {
                const splitSignature = await SignHelper.signPermit(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    MiniCoin.address,
                    owner,
                    user2.address,
                    amount,
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await MiniCoin.populateTransaction.permit(
                    owner.address,
                    user2.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.allowance(owner.address, user2.address)).to.equal(
                ethers.BigNumber.from(originalAllowance)
            );
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test reserve(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = await SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test approve() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(0);
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test increaseAllowance() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, ethers.BigNumber.from(10000));
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
        it('Test decreaseAllowance() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const inputApprove = await MiniCoin.populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.populateTransaction.decreaseAllowance(MiniCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
    });

    describe('Test zero(0) number on different fn()', () => {
        const amount = 0;
        it('Test burn() w/ zero(0) number', async () => {
            const inputBurn = await MiniCoin.populateTransaction['burn(uint256)'](amount);
            msg = await TestHelper.submitTxnAndCheckResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test transfer() w/ zero(0) number', async () => {
            const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                user1.address,
                amount,
                { from: owner.address }
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
        });

        it('Test transferFrom() w/ zero(0) number', async () => {
            const amount = 0;
            const inputApprove = await MiniCoin.populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                owner.address,
                user2.address,
                amount
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, user1, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
        });

        it('Test transfer(w/ signature) w/ negative number', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            const splitSignature = await SignHelper.signTransfer(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user1.address,
                amount,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                owner.address,
                user1.address,
                amount,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test permit(w/ signature) w/ zero(0)', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await MiniCoin.allowance(owner.address, user2.address);

            const splitSignature = await SignHelper.signPermit(
                TestHelper.NAME,
                TestHelper.VERSION_712,
                MiniCoin.address,
                owner,
                user2.address,
                amount,
                nonce.toNumber(),
                expirationTimestamp
            );
            const input = await MiniCoin.populateTransaction.permit(
                owner.address,
                user2.address,
                amount,
                expirationTimestamp,
                splitSignature.v,
                splitSignature.r,
                splitSignature.s
            );

            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.allowance(owner.address, user2.address)).to.equal(
                ethers.BigNumber.from(originalAllowance)
            );
        });

        it('Test reserve(w/ signature) w/ zero(0) number', async () => {
            const feeToPay = 0;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            const signature = await SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amount,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                from: owner.address,
                gasLimit: ethers.utils.hexlify(3000000)
            });
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test approve() w/ zero(0) number', async () => {
            const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, amount);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
        });

        it('Test increaseAllowance() w/ zero(0) number', async () => {
            const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, ethers.BigNumber.from(10000));
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            const inputIncreaseAllowance = await MiniCoin.populateTransaction.increaseAllowance(
                MiniCoin.address,
                amount
            );
            await TestHelper.submitTxnAndCheckResult(
                inputIncreaseAllowance,
                MiniCoin.address,
                owner,
                ethers,
                provider,
                0
            );

            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
        });

        it('Test decreaseAllowance() w/ zero(0) number', async () => {
            const inputAprove = await MiniCoin.populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputAprove, MiniCoin.address, owner, ethers, provider, 0);
            const input = await MiniCoin.populateTransaction.decreaseAllowance(MiniCoin.address, amount);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
        });
    });

    describe('Test overflow on different fn()', () => {
        const amount = 2 ** 256;
        it('Test burn() w/ overflow', async () => {
            let msg;
            try {
                const inputBurn = await MiniCoin.populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.submitTxnAndCheckResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test transfer() w/ overflow', async () => {
            let msg;
            try {
                const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.fault;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test transferFrom() w/ overflow', async () => {
            const inputApprove = await MiniCoin.populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    MiniCoin.address,
                    user1,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.fault;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test transfer(w/ signature) w/ overflow', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            let msg;
            try {
                const splitSignature = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    MiniCoin.address,
                    owner,
                    user1.address,
                    amount,
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                    owner.address,
                    user1.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test permit(w/ signature) w/ overflow', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await MiniCoin.allowance(owner.address, user2.address);

            let msg;
            try {
                const splitSignature = await SignHelper.signPermit(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    MiniCoin.address,
                    owner,
                    user2.address,
                    amount,
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await MiniCoin.populateTransaction.permit(
                    owner.address,
                    user2.address,
                    amount,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }

            expect(await MiniCoin.allowance(owner.address, user2.address)).to.equal(
                ethers.BigNumber.from(originalAllowance)
            );
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test reserve(w/ signature) w/ overflow', async () => {
            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = await SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test approve() w/ overflow', async () => {
            let msg;
            try {
                const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test increaseAllowance() w/ overflow', async () => {
            const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, ethers.BigNumber.from(10000));
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.fault;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });

        it('Test decreaseAllowance() w/ overflow', async () => {
            const inputApprove = await MiniCoin.populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.populateTransaction.decreaseAllowance(MiniCoin.address, amount);
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.fault;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.OVERFLOW_FAULT_CODE);
        });
    });

    describe('Test empty string on different fn()', () => {
        const emptyString = '';
        it('Test burn() w/ empty string', async () => {
            let msg;
            try {
                const inputBurn = await MiniCoin.populateTransaction['burn(uint256)'](emptyString);
                msg = await TestHelper.submitTxnAndCheckResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer() w/ empty string', async () => {
            let msg;
            try {
                const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    emptyString,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transferFrom() w/ empty string', async () => {
            const inputApprove = await MiniCoin.populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    emptyString
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputTransfer,
                    MiniCoin.address,
                    user1,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test transfer(w/ signature) w/ empty string', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;

            let msg;
            try {
                const splitSignature = await SignHelper.signTransfer(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    MiniCoin.address,
                    owner,
                    user1.address,
                    emptyString,
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await MiniCoin.populateTransaction[TestHelper.ETHLESS_TRANSFER_SIGNATURE](
                    owner.address,
                    user1.address,
                    emptyString,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test permit(w/ signature) w/ empty string', async () => {
            const [blockNumber, nonce] = await Promise.all([provider.getBlockNumber(), MiniCoin.nonces(owner.address)]);

            const block = await provider.getBlock(blockNumber);
            const expirationTimestamp = block.timestamp + 20000;
            const originalAllowance = await MiniCoin.allowance(owner.address, user2.address);

            let msg;
            try {
                const splitSignature = await SignHelper.signPermit(
                    TestHelper.NAME,
                    TestHelper.VERSION_712,
                    MiniCoin.address,
                    owner,
                    user2.address,
                    emptyString,
                    nonce.toNumber(),
                    expirationTimestamp
                );
                const input = await MiniCoin.populateTransaction.permit(
                    owner.address,
                    user2.address,
                    emptyString,
                    expirationTimestamp,
                    splitSignature.v,
                    splitSignature.r,
                    splitSignature.s
                );

                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.allowance(owner.address, user2.address)).to.equal(
                ethers.BigNumber.from(originalAllowance)
            );
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });

        it('Test reserve(w/ signature) w/ empty string', async () => {
            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = await SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    emptyString,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](
                    owner.address,
                    user1.address,
                    owner.address,
                    emptyString,
                    feeToPay,
                    nonce,
                    expirationBlock,
                    signature,
                    { from: owner.address }
                );
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
        it('Test approve() w/ empty string', async () => {
            const emptyString = '';
            let msg;
            try {
                const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, emptyString);
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
        it('Test increaseAllowance() w/ empty string', async () => {
            const emptyString = '';
            const input = await MiniCoin.populateTransaction.approve(MiniCoin.address, ethers.BigNumber.from(10000));
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    emptyString
                );
                msg = await TestHelper.submitTxnAndCheckResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
        it('Test decreaseAllowance() w/ empty string', async () => {
            const emptyString = '';
            const inputApprove = await MiniCoin.populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.populateTransaction.decreaseAllowance(MiniCoin.address, emptyString);
                msg = await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = err.code;
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal(ErrorMessages.INVALID_ARGUMENT_CODE);
        });
    });
});
