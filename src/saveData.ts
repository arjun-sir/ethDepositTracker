import { PrismaClient } from "@prisma/client";
import { time, timeStamp } from "console";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Define the Deposit type based on the schema provided
type Deposit = {
    blockNumber: number;
    blockTimestamp?: number;
    fee: string;
    hash: string;
    pubkey: string;
};

const saveDepositData = async (depositData: Deposit): Promise<void> => {
    try {
        let timeStamp = depositData.blockTimestamp;
        if (timeStamp === undefined) {
            timeStamp = 0;
        }
        // Use Prisma to create a new deposit record in MongoDB
        const deposit = await prisma.deposit.create({
            data: {
                blockNumber: depositData.blockNumber,
                blockTimestamp: timeStamp,
                fee: depositData.fee,
                hash: depositData.hash,
                pubkey: depositData.pubkey,
            },
        });

        console.log(`Deposit saved:`, deposit);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error saving deposit: ${error.message}`);
        } else {
            console.error("Unknown error:", error);
        }
    }
};

export default saveDepositData;
