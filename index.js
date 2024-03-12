const fs = require('fs/promises');
const ethers = require("ethers");
const abi = require("./abi.json");
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const {
    CONTRACT_ADDRESS,
    RPC,
    ADDRESS_EXPLORER_URL,
    TX_EXPLORER_URL
} = require('./constants');

const provider = new ethers.providers.JsonRpcProvider(RPC);

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

const GROUP_ID = -1002018827908;

// Function to send an alert message
async function sendAlert(staker, amount, txHash) {
    const userUrl = `${ADDRESS_EXPLORER_URL}${staker}`;

    const message =
        `<b>👨‍🦳 Address <a href="${userUrl}">${staker}</a> unstaked ${amount} $LINK</b>\n\n` +
        `<b>🔗 TXID 👉 <a href="${TX_EXPLORER_URL}${txHash}">check here</a>\n\n</b>`;
    const opts = {
        parse_mode: 'HTML',
    }
    await bot.sendMessage(GROUP_ID, message, opts);
}

async function sendUnbondAlert(staker, txHash) {
    const userUrl = `${ADDRESS_EXPLORER_URL}${staker}`;

    const message =
        `<b>👨‍🦳 Address <a href="${userUrl}">${staker}</a> started unbonding</b>\n\n` +
        `<b>🔗 TXID 👉 <a href="${TX_EXPLORER_URL}${txHash}">check here</a>\n\n</b>`;
    const opts = {
        parse_mode: 'HTML',
    }
    await bot.sendMessage(GROUP_ID, message, opts);
}

/*
Monitor for unstake events

event Unstaked(
    address indexed staker, uint256 amount, uint256 newStake, uint256 newTotalPrincipal
);
*/
contract.on('Unstaked', async (staker, amount, newStake, newTotalPrincipal, event) => {
    const logAmount = parseFloat(ethers.utils.formatUnits(amount).toString());

    console.log(`tx: ${event.transactionHash}`);

    await sendAlert(staker, logAmount, event.transactionHash);
});

/*
Monitor Unbond events
event UnbondingPeriodStarted(address indexed staker)
*/

contract.on('UnbondingPeriodStarted', async (staker, event) => {
    await sendUnbondAlert(staker, event.transactionHash);
})