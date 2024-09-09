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
        } else {
            logger.info("Contract found at the specified address");
        }

        // Query past events
        const pastEvents = await queryPastEvents();
        console.log(`Found ${pastEvents.length} past DepositEvents`);

        // Set up event listener
        console.log("Setting up DepositEvent listener...");
        depositContract.on("DepositEvent", handleDepositEvent);
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

async function queryPastEvents() {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 1000; // Look back 1000 blocks

    console.log(
        `Querying past events from block ${fromBlock} to ${currentBlock}`
    );

    const filter = depositContract.filters.DepositEvent();
    const events = await depositContract.queryFilter(
        filter,
        fromBlock,
        currentBlock
    );

    for (const event of events) {
        console.log(
            `Past event found in block ${event.blockNumber}, transaction hash: ${event.transactionHash}`
        );
    }

    return events;
}

async function handleDepositEvent(
    pubkeyBytes: string,
    withdrawalCredentialsBytes: string,
    amountBytes: string,
    signatureBytes: string,
    indexBytes: string,
    event: ethers.EventLog
) {
    console.log("DepositEvent received!");
    try {
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

        if (!block || !transaction || !receipt) {
            throw new Error(
                "Could not fetch block, transaction, or receipt data"
            );
        }

        const gasUsed = receipt.gasUsed;
        const gasPrice = transaction.gasPrice || 0n; // Use 0n as fallback if gasPrice is null
        const fee = gasUsed * gasPrice;

        const depositData = {
            blockNumber: event.blockNumber,
            blockTimestamp: block.timestamp,
            fee: ethers.formatEther(fee),
            hash: event.transactionHash,
            pubkey: pubkey,
        };

        console.log("Processed event details:", depositData);
        await saveDepositData(depositData);
    } catch (error) {
        logger.error("Error processing deposit:", error);
    }
}

// Error handling for provider
provider.on("error", (error) => {
    console.error("Provider error:", error);
});

main().catch(console.error);
