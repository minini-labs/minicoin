require('dotenv');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers, network } = require('hardhat');
const TestHelper = require('./shared');
const ErrorMessages = require('./errorMessages');

use(solidity);

let owner;
let user1;
let user2;
let user3;
let MiniCoin;
let provider;
const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('MiniCoin - Ethless Burn functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [MiniCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('MiniCoin - Regular Ethless Burn', async function () {
        const amountToBurn = TestHelper.getRandomIntInRange(10, 200);

        it('Test Ethless burn', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await MiniCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, MiniCoin, owner, user3, user3, amountToBurn);
            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(amountToBurn);
            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(0);
        });

        it('Test Ethless burn lesser than permit', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await MiniCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, MiniCoin, owner, user3, user3, amountToBurn + 1);
            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(1);
        });

        it('Test Ethless burn with approve', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await MiniCoin.balanceOf(user3.address);

            const inputApprove = await MiniCoin.populateTransaction.approve(user3.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(amountToBurn);

            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(0);
        });

        it('Test Ethless burn lesser than approve', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await MiniCoin.balanceOf(user3.address);
            const inputApprove = await MiniCoin.populateTransaction.approve(user3.address, amountToBurn + 1);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(1);
        });

        it('Test Ethless burn with different submitter from permit', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const originalBalanceSubmitter = await MiniCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, MiniCoin, owner, user3, user2, amountToBurn);
            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
        });

        it('Test Ethless burn from received amount', async () => {
            await MiniCoin['transfer(address,uint256)'](user1.address, amountToBurn);
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(amountToBurn);
            const originalBalanceSubmitter = await MiniCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, MiniCoin, user1, user3, user2, amountToBurn);
            const input = await MiniCoin.populateTransaction.burnFrom(user1.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(0);
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
        });

        it('Test Ethless burn some of the received amount', async () => {
            await MiniCoin['transfer(address,uint256)'](user1.address, amountToBurn);
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(amountToBurn);
            const newAmountToBurn = amountToBurn - 3;
            const originalBalanceSubmitter = await MiniCoin.balanceOf(user3.address);
            await TestHelper.executePermitFlow(provider, MiniCoin, user1, user3, user2, amountToBurn);
            const input = await MiniCoin.populateTransaction.burnFrom(user1.address, newAmountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(amountToBurn - newAmountToBurn);
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(originalBalanceSubmitter);
        });
    });

    describe('MiniCoin - Test expecting failure Ethless Burn', async function () {
        const amountToBurn = TestHelper.getRandomIntInRange(10, 200);

        it('Test Ethless burn when there is no permit', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);

            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test Ethless self-burning without permit', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                owner,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });

        it('Test Ethless burn more than permit', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const permitAmount = amountToBurn - 1;
            await TestHelper.executePermitFlow(provider, MiniCoin, owner, user3, user3, permitAmount);
            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));

            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(permitAmount);
        });

        it('Test Ethless burn multiple time than permit', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const amountAfterBurn = ethers.BigNumber.from(originalBalance).sub(amountToBurn);
            await TestHelper.executePermitFlow(provider, MiniCoin, owner, user3, user3, amountToBurn);
            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(amountAfterBurn);

            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(0);

            const input1 = await MiniCoin.populateTransaction.burnFrom(owner.address, 1);
            await TestHelper.submitTxnAndCheckResult(
                input1,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(amountAfterBurn);
        });

        it('Test Ethless burn more than approved', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);
            const amountToApprove = amountToBurn - 1;
            const inputApprove = await MiniCoin.populateTransaction.approve(user3.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            const input = await MiniCoin.populateTransaction.burnFrom(owner.address, amountToBurn);
            await TestHelper.submitTxnAndCheckResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                ErrorMessages.ERC20_INSUFFICIENT_ALLOWANCE
            );
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));

            expect(await MiniCoin.allowance(owner.address, user3.address)).to.equal(amountToApprove);
        });
    });
});
