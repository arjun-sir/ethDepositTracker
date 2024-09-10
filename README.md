# ETH Deposit Tracker - Documentation

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Usage Instructions](#usage-instructions)
4. [Features](#features)
5. [Codebase Walkthrough](#codebase-walkthrough)
6. [Error Handling](#error-handling)
7. [Known Issues](#known-issues)
8. [Comments and Readability](#comments-and-readability)

## Prerequisites

Before setting up the ETH Deposit Tracker, ensure you have the following:

- Node.js (version 16.x or higher)
- MongoDB database instance
- Ethers.js for interacting with Ethereum blockchain
- Prisma for database ORM
- Telegraf for Telegram bot interaction

## Environment Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-repo/ethDepositTracker.git
   cd ethDepositTracker
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the root directory and add the following variables:

   ```
   ETH_RPC_URL=<your-ethereum-rpc-url>
   TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
   DEPOSIT_CONTRACT_ADDRESS=<eth-deposit-contract-address>
   DATABASE_URL=<your-mongodb-connection-string>
   ```

   Replace the placeholders with your actual values.

4. **Initialize Prisma:** 
   
   If you haven't set up the Prisma client yet, run:

   ```bash
   npx prisma generate
   ```

## Usage Instructions

### Running the Tracker

1. **Start MongoDB:** 
   Ensure that your MongoDB server is running before you proceed with the next steps.

2. **Run the deposit tracker:**

   ```bash
   npm start
   ```

   This will:
   - Connect to the Ethereum blockchain provider.
   - Launch the Telegram bot for deposit notifications.
   - Start listening for new deposit events from the Ethereum deposit contract.

3. **Telegram Bot Commands:**
   - **Subscribe to notifications:** In your Telegram chat, send the `/subscribe` command to the bot. You will start receiving deposit notifications.
   - **Unsubscribe from notifications:** Send the `/unsubscribe` command to stop receiving notifications.

## Features

- Monitors Ethereum deposit contract for `DepositEvent` transactions.
- Sends a summary of each deposit (block number, timestamp, fee, transaction hash, and public key) to subscribed Telegram users.
- Stores each deposit in MongoDB using Prisma ORM.

## Codebase Walkthrough

- `main.ts`: The core logic for monitoring the blockchain and handling new blocks.
- `saveData.ts`: Logic for saving deposit data to MongoDB using Prisma.
- `telegramBot.ts`: Logic for handling Telegram commands and sending notifications.

## Error Handling

- The system checks the validity of transactions by comparing the `to` address with the deposit contract address.
- If any required data (block number, transaction hash, or receipt) is missing, the transaction is skipped, and an error is logged.

## Known Issues

- If `blockNumber` is `undefined`, ensure your blockchain provider is correctly set and reachable.
- Missing data in some deposits (such as `hash` or `blockNumber`) may indicate incomplete blockchain sync or an RPC provider issue.

## Comments and Readability

The codebase includes comments to explain key logic, such as:

- **Event Filtering**: Used to detect deposit events in blocks.
- **Telegram Integration**: Commands for subscribing to and unsubscribing from notifications.
- **Data Persistence**: Uses Prisma to create new deposit records in MongoDB.

For readability and maintenance, key sections are documented with in-line comments explaining the purpose of each function.

---

For any further questions or issues, please refer to the project's GitHub repository or contact the maintainers.
