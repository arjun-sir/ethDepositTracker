import * as dotenv from "dotenv";
import { ethers } from "ethers";
import logger from "./logger";
import depositContractABI from "./DepositContractABI.json";
import saveDepositData from "./saveData";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const depositContractAddress = process.env.DEPOSIT_CONTRACT_ADDRESS as string;

console.log(`Using contract address: ${depositContractAddress}`);

const depositContract = new ethers.Contract(
    depositContractAddress,
    depositContractABI,
    provider
);

async function main() {
    try {
        const latestBlock = await provider.getBlockNumber();
        logger.info(
            `Connected to provider. Latest block number: ${latestBlock}`
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

        // Periodic check
        setInterval(async () => {
            const blockNumber = await provider.getBlockNumber();
            console.log(`Still listening... Current block: ${blockNumber}`);
        }, 60000);
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

        if (!block || !transaction || !receipt) {
            throw new Error(
                "Could not fetch block, transaction, or receipt data"
            );
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
        await saveDepositData(depositData);
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
