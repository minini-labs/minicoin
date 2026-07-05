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

describe('MiniCoin - Basic ERC20 functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [MiniCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('MiniCoin - ERC20 Token Info', async function () {
        it('Token name is ' + TestHelper.NAME, async () => {
            expect(await MiniCoin.name()).to.equal(TestHelper.NAME);
        });
        it('Token symbol is ' + TestHelper.SYMBOLE, async () => {
            expect(await MiniCoin.symbol()).to.equal(TestHelper.SYMBOL);
        });
        it('Token decimals is ' + TestHelper.DECIMALS, async () => {
            expect(await MiniCoin.decimals()).to.equal(TestHelper.DECIMALS);
        });
        it('Token chainId is ' + network.config.chainId, async () => {
            expect(await MiniCoin.chainId()).to.equal(network.config.chainId);
        });
        it('Token version is ' + TestHelper.VERSION, async () => {
            expect(await MiniCoin.version()).to.equal(TestHelper.VERSION);
        });

        it('Supply verification for total supply as ' + TestHelper.TOTALSUPPLY, async () => {
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(TestHelper.TOTALSUPPLY);
            expect(await MiniCoin.totalSupply()).to.equal(TestHelper.TOTALSUPPLY);
        });

        it('Should revert if owner tries to mint more than once', async () => {
            const amount = 10n ** 18n;
            await expect(MiniCoin.mint(owner.address, amount)).to.be.revertedWith('MiniCoin: Already minted');
        });

        it('Should revert if owner tries to mint more than once with explicit connect to owner', async () => {
            const amount = 10n ** 18n;
            await expect(MiniCoin.connect(owner).mint(owner.address, amount)).to.be.revertedWith(
                'MiniCoin: Already minted'
            );
        });

        it('Check owner', async () => {
            expect(await MiniCoin.owner()).to.equal(owner.address);
        });
    });

    describe('MiniCoin - Allowance', async function () {
        const amountToApprove = 100;
        const amountToIncrease = 100;
        const amountToDecrease = 50;

        beforeEach(async () => {
            const amountToTransfer = 100;
            const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                user1.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
        });
        it('Test approve()', async () => {
            const inputApprove = await MiniCoin.populateTransaction.approve(user2.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, user1, ethers, provider, 0);
            expect((await MiniCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );
        });
        it('Test increaseAllowance()', async () => {
            const inputIncreaseAllowance = await MiniCoin.populateTransaction.increaseAllowance(
                user2.address,
                amountToIncrease
            );
            await TestHelper.submitTxnAndCheckResult(
                inputIncreaseAllowance,
                MiniCoin.address,
                user1,
                ethers,
                provider,
                0
            );
            expect((await MiniCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToIncrease.toString()
            );
        });
        it('Test decreaseAllowance()', async () => {
            const inputApprove = await MiniCoin.populateTransaction.approve(user2.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, user1, ethers, provider, 0);
            expect((await MiniCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );

            const inputDecreaseAllowance = await MiniCoin.populateTransaction.decreaseAllowance(
                user2.address,
                amountToDecrease
            );
            await TestHelper.submitTxnAndCheckResult(
                inputDecreaseAllowance,
                MiniCoin.address,
                user1,
                ethers,
                provider,
                0
            );
            expect((await MiniCoin.allowance(user1.address, user2.address)).toString()).to.equal((50).toString());
        });
    });

    describe('MiniCoin - transfer and transferFrom', async function () {
        const amountToTransfer = 100;

        it('Test transfer() / verify balanceOf owner is -1000', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToTransfer)
            );
            expect((await MiniCoin.balanceOf(user2.address)).toString()).to.equal(amountToTransfer.toString());
        });
        it('Test transferFrom() / verify balance of owner is -1000', async () => {
            const originalOwnerBalance = await MiniCoin.balanceOf(owner.address);
            const originalUser2Balance = await MiniCoin.balanceOf(user2.address);

            const inputApprove = await MiniCoin.populateTransaction.approve(user1.address, amountToTransfer);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            const inputTransferFrom = await MiniCoin.populateTransaction.transferFrom(
                owner.address,
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransferFrom, MiniCoin.address, user1, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalOwnerBalance).sub(amountToTransfer)
            );
            expect((await MiniCoin.balanceOf(user2.address)).toString()).to.equal(
                ethers.BigNumber.from(originalUser2Balance).add(amountToTransfer)
            );
        });
    });

    describe('MiniCoin - burn', async function () {
        const amountToBurn = 100;

        it('Test burn() / verify balanceOf owner is -100', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const inputTransfer = await MiniCoin.populateTransaction['burn(uint256)'](amountToBurn);
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToBurn)
            );
        });
    });

    describe('MiniCoin - Test expecting failure Allowance', async function () {
        const amountToApprove = 100;
        const amountToDecrease = 150;

        beforeEach(async () => {
            const amountToTransfer = 100;
            const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                user1.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
        });
        it('Test decreaseAllowance() by more than the current allowance', async () => {
            const inputApprove = await MiniCoin.populateTransaction.approve(user2.address, amountToApprove);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, user1, ethers, provider, 0);
            expect((await MiniCoin.allowance(user1.address, user2.address)).toString()).to.equal(
                amountToApprove.toString()
            );

            const inputDecreaseAllowance = await MiniCoin.populateTransaction.decreaseAllowance(
                user2.address,
                amountToDecrease
            );
            await TestHelper.submitTxnAndCheckResult(
                inputDecreaseAllowance,
                MiniCoin.address,
                user1,
                ethers,
                provider,
                'ERC20: decreased allowance below zero'
            );
        });
    });

    describe('MiniCoin - Test expecting failure transfer and transferFrom', async function () {
        const amountToTransfer = 100;

        it('Test transfer() without balance', async () => {
            const originalUser1Balance = await MiniCoin.balanceOf(user1.address);

            const inputTransfer = await MiniCoin.populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(
                inputTransfer,
                MiniCoin.address,
                user1,
                ethers,
                provider,
                'MiniCoin: Insufficient balance'
            );
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(originalUser1Balance));
        });

        it('Test transferFrom() without allowance', async () => {
            const originalUser1Balance = await MiniCoin.balanceOf(user1.address);
            const originalUser3Balance = await MiniCoin.balanceOf(user3.address);

            const inputTransferFrom = await MiniCoin.populateTransaction.transferFrom(
                user1.address,
                user3.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(
                inputTransferFrom,
                MiniCoin.address,
                user2,
                ethers,
                provider,
                'ERC20: insufficient allowance'
            );
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(originalUser1Balance));
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(ethers.BigNumber.from(originalUser3Balance));
        });
        it('Test transferFrom() without balance', async () => {
            const originalUser1Balance = await MiniCoin.balanceOf(user1.address);
            const originalUser3Balance = await MiniCoin.balanceOf(user3.address);

            const inputApprove = await MiniCoin.populateTransaction.approve(user2.address, amountToTransfer);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, user1, ethers, provider, 0);

            const inputTransferFrom = await MiniCoin.populateTransaction.transferFrom(
                user1.address,
                user3.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(
                inputTransferFrom,
                MiniCoin.address,
                user2,
                ethers,
                provider,
                'MiniCoin: Insufficient balance'
            );
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(originalUser1Balance));
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(ethers.BigNumber.from(originalUser3Balance));
        });
        it('Test 2x transferFrom() second transferFrom will fail due to remaining allowance to low', async () => {
            const originalOwnerBalance = await MiniCoin.balanceOf(owner.address);
            const originalUser2Balance = await MiniCoin.balanceOf(user2.address);

            const inputApprove = await MiniCoin.populateTransaction.approve(user1.address, amountToTransfer);
            await TestHelper.submitTxnAndCheckResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            const inputTransferFrom = await MiniCoin.populateTransaction.transferFrom(
                owner.address,
                user2.address,
                amountToTransfer
            );
            await TestHelper.submitTxnAndCheckResult(inputTransferFrom, MiniCoin.address, user1, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalOwnerBalance).sub(amountToTransfer)
            );
            expect((await MiniCoin.balanceOf(user2.address)).toString()).to.equal(
                ethers.BigNumber.from(originalUser2Balance).add(amountToTransfer)
            );

            await TestHelper.submitTxnAndCheckResult(
                inputTransferFrom,
                MiniCoin.address,
                user1,
                ethers,
                provider,
                'ERC20: insufficient allowance'
            );
        });
    });

    describe('MiniCoin - Test expecting failure burn', async function () {
        const amountToBurn = 100;

        it('Test burn() without balance', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const inputTransfer = await MiniCoin.populateTransaction['burn(uint256)'](amountToBurn);
            await TestHelper.submitTxnAndCheckResult(
                inputTransfer,
                MiniCoin.address,
                user1,
                ethers,
                provider,
                'MiniCoin: Insufficient balance'
            );

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });
    });

    describe('MiniCoin - EIP-712 support', async function () {
        it('Return DOMAIN_SEPARATOR', async () => {
            let msg;
            try {
                await MiniCoin.DOMAIN_SEPARATOR();
                msg = 'DOMAIN_SEPARATOR succeeded';
            } catch {
                msg = 'DOMAIN_SEPARATOR failed';
            }
            expect(msg).to.be.equal('DOMAIN_SEPARATOR succeeded');
        });
    });
});
