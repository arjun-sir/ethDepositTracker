import * as dotenv from "dotenv";
import { ethers } from "ethers";
import logger from "./logger";
import depositContractABI from "./DepositContractABI.json";
import saveDepositData from "./saveData";
import { Telegraf, Context } from "telegraf";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const depositContractAddress = process.env.DEPOSIT_CONTRACT_ADDRESS as string;
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

console.log(`Using contract address: ${depositContractAddress}`);

const depositContract = new ethers.Contract(
    depositContractAddress,
    depositContractABI,
    provider
);

let subscribedChatIds: Set<number> = new Set();

bot.command("subscribe", (ctx: Context) => {
    if ("chat" in ctx && "id" in ctx.chat!) {
        subscribedChatIds.add(ctx.chat.id);
        ctx.reply("You have successfully subscribed to deposit notifications.");
    }
});

bot.command("unsubscribe", (ctx: Context) => {
    if ("chat" in ctx && "id" in ctx.chat!) {
        subscribedChatIds.delete(ctx.chat.id);
        ctx.reply("You have unsubscribed from deposit notifications.");
    }
});

async function sendTelegramMessage(message: string) {
    try {
        for (const chatId of subscribedChatIds) {
            await bot.telegram.sendMessage(chatId, message);
        }
        console.log("Telegram messages sent successfully");
    } catch (error) {
        console.error("Error sending Telegram messages:", error);
    }
}

async function saveDepositDataAndNotify(depositData: any) {
    await saveDepositData(depositData);

    const message =
        `New deposit detected!\n` +
        `Block: ${depositData.blockNumber}\n` +
        `Timestamp: ${new Date(
            depositData.blockTimestamp * 1000
        ).toISOString()}\n` +
        `Fee: ${depositData.fee} ETH\n` +
        `Hash: ${depositData.hash}\n` +
        `Pubkey: ${depositData.pubkey.slice(0, 10)}...`;

    await sendTelegramMessage(message);
}

async function main() {
    try {
        bot.launch();
        console.log("Telegram bot started");

        // Get the latest block when the application starts
        let lastCheckedBlock = await provider.getBlockNumber();
        logger.info(
            `Connected to provider. Latest block number: ${lastCheckedBlock}`
        );

        const code = await provider.getCode(depositContractAddress);
        if (code === "0x") {
            logger.error("No contract found at the specified address");
            return;
        } else {
            logger.info("Contract found at the specified address");
        }

        // Query and store past events
        await queryAndStorePastEvents();

        // Set up event listener for new events
        console.log("Setting up DepositEvent listener...");
        depositContract.on(
            depositContract.filters.DepositEvent(),
            handleDepositEvent
        );
        console.log("DepositEvent listener set up successfully");

        // Keep track of processed blocks to avoid logging duplicates
        let lastProcessedBlock = lastCheckedBlock;

        // Periodic check for new blocks
        setInterval(async () => {
            const latestBlock = await provider.getBlockNumber();

            // Only process new blocks (no duplicates)
            if (latestBlock > lastProcessedBlock) {
                console.log(`Current block: ${latestBlock}`);

                // Check and process blocks between last checked and latest block
                while (lastProcessedBlock < latestBlock) {
                    lastProcessedBlock++;
                    console.log(`Checking block: ${lastProcessedBlock}`);

                    // Query past deposit events in this block
                    const filter = depositContract.filters.DepositEvent();
                    const events = await depositContract.queryFilter(
                        filter,
                        lastProcessedBlock,
                        lastProcessedBlock
                    );

                    console.log(
                        `Found ${events.length} events in block ${lastProcessedBlock}`
                    );

                    // Process each deposit event
                    for (const event of events) {
                        await processDepositEvent(event as ethers.EventLog);
                    }
                }
            }
        }, 1000); // Adjust interval as needed
    } catch (error) {
        logger.error("Error in main function:", error);
    }
}

async function queryAndStorePastEvents() {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 1000; // Look back 100 blocks, adjust as needed

    console.log(
        `Querying past events from block ${fromBlock} to ${currentBlock}`
    );

    const filter = depositContract.filters.DepositEvent();
    const events = await depositContract.queryFilter(
        filter,
        fromBlock,
        currentBlock
    );

    console.log(`Found ${events.length} past DepositEvents`);

    for (const event of events) {
        await processDepositEvent(event as ethers.EventLog);
    }
}

async function processDepositEvent(event: ethers.EventLog) {
    try {
        // Check if blockNumber is undefined
        if (event.blockNumber === undefined) {
            logger.warn(`Skipping event with undefined blockNumber`);
            return; // Exit the function early
        }

        const [
            pubkeyBytes,
            withdrawalCredentialsBytes,
            amountBytes,
            signatureBytes,
            indexBytes,
        ] = event.args || [];

        const pubkey = ethers.hexlify(pubkeyBytes);
        const withdrawalCredentials = ethers.hexlify(
            withdrawalCredentialsBytes
        );
        const amount = ethers.getBigInt(amountBytes);
        const signature = ethers.hexlify(signatureBytes);
        const index = ethers.getBigInt(indexBytes);

        const block = await event.getBlock();
        const transaction = await event.getTransaction();
        const receipt = await event.getTransactionReceipt();

        // Verify that the `to` address of the transaction is the deposit contract address
        if (transaction.to !== depositContractAddress) {
            logger.warn(
                `Skipping event. Transaction to address ${transaction.to} does not match deposit contract address ${depositContractAddress}`
            );
            return;
        }

        if (!event.transactionHash || !receipt) {
            logger.error(
                `Missing required event data. BlockNumber: ${event.blockNumber}, Hash: ${event.transactionHash}`
            );
            return; // Skip processing this event
        }

        const gasUsed = receipt.gasUsed;
        const gasPrice = transaction.gasPrice || 0n;
        const fee = gasUsed * gasPrice;

        const depositData = {
            blockNumber: event.blockNumber,
            blockTimestamp: block.timestamp,
            fee: ethers.formatEther(fee),
            hash: event.transactionHash,
            pubkey: pubkey,
        };

        console.log("Processing deposit:", depositData);
        await saveDepositDataAndNotify(depositData);
    } catch (error) {
        logger.error(
            `Error processing deposit at block ${event.blockNumber}:`,
            error
        );
    }
}

async function handleDepositEvent(...args: any[]) {
    console.log("New DepositEvent received!");
    const event = args[args.length - 1] as ethers.EventLog;
    await processDepositEvent(event);
}

// Error handling for provider
provider.on("error", (error) => {
    console.error("Provider error:", error);
});

main().catch(console.error);
