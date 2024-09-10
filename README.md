# ETH Deposit Tracker - Documentation

## Table of Contents

1. [Important Submission Links](#important-subsmission-details)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Usage Instructions](#usage-instructions)
5. [Features](#features)
6. [Codebase Walkthrough](#codebase-walkthrough)
7. [Error Handling](#error-handling)
8. [Known Issues](#known-issues)
9. [Comments and Readability](#comments-and-readability)

## Important Submission Details

-   **Background Worker Setup**: The code in this repository is deployed as background worker service. All the below links work with the help of this service.
-   **Grafana Dashboard**: [ETH Tracker Grafana Dashboard](https://arjunkhanna0108.grafana.net/public-dashboards/66fba209a9c848939c857f79c3f08eb4)
-   **Telegram Bot**: You can interact with the tracker through the Telegram bot. Use the `/subscribe` command to enable notifications for anyone, or `/unsubscribe` to stop receiving notifications. [Telegram Bot Link](https://t.me/ethDepositTrackerBot)- https://t.me/ethDepositTrackerBot

## Prerequisites

Before setting up the ETH Deposit Tracker, ensure you have the following:

-   Node.js (version 16.x or higher)
-   MongoDB database instance
-   Ethers.js for interacting with the Ethereum blockchain
-   Prisma for database ORM
-   Telegraf for Telegram bot interaction
-   Docker (optional, for containerized deployment)

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

    Note: The current configuration uses the deposit contract address `0x00000000219ab540356cBB839Cbe05303d7705Fa`. This address is specific to the contract you're interacting with. If you need to use a different contract address, you will need to:

    - Update the `DEPOSIT_CONTRACT_ADDRESS` in your environment variables with the new address.
    - Change the ABI file (`DepositContractABI.json`) to match the ABI of the new contract address. You can find the ABI on Etherscan under the "Contract" tab for the respective contract.

## Usage Instructions

### Option 1: Running with Docker

1. **Build the Docker image:**

    ```bash
    docker build -t eth-deposit-tracker .
    ```

2. **Run the container using Docker Compose:**

    ```bash
    docker-compose up
    ```

    This will start the ETH Deposit Tracker in a Docker container, handling all necessary dependencies and environment setup.

### Option 2: Running without Docker

1. **Ensure MongoDB is running:**
   Make sure your MongoDB server is up and running before proceeding.

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the necessary variables as described in the Environment Setup section.

4. **Initialize Prisma:**

    ```bash
    npx prisma generate
    ```

5. **Start the application:**
    ```bash
    npm start
    ```

### Using the Telegram Bot

Regardless of how you run the application, you can interact with the Telegram bot using these commands:

-   **Subscribe to notifications:** Send the `/subscribe` command to the bot in your Telegram chat.
-   **Unsubscribe from notifications:** Send the `/unsubscribe` command to stop receiving notifications.

### Accessing the Grafana Dashboard

You can monitor the ETH Deposit Tracker's metrics through the Grafana dashboard:

[ETH Tracker Grafana Dashboard](https://arjunkhanna0108.grafana.net/public-dashboards/66fba209a9c848939c857f79c3f08eb4)

### Telegram Bot Link

Interact with the tracker through the Telegram bot:

[ETH Deposit Tracker Telegram Bot](https://t.me/ethDepositTrackerBot)

## Features

-   Monitors Ethereum deposit contract for `DepositEvent` transactions.
-   Sends a summary of each deposit (block number, timestamp, fee, transaction hash, and public key) to subscribed Telegram users.
-   Stores each deposit in MongoDB using Prisma ORM.

## Codebase Walkthrough

-   `main.ts`: The core logic for monitoring the blockchain and handling new blocks.
-   `saveData.ts`: Logic for saving deposit data to MongoDB using Prisma.
-   `telegramBot.ts`: Logic for handling Telegram commands and sending notifications.

## Error Handling

-   The system checks the validity of transactions by comparing the `to` address with the deposit contract address.
-   If any required data (block number, transaction hash, or receipt) is missing, the transaction is skipped, and an error is logged.

## Known Issues

-   For every deposit event, we get one event with missing data (such as `hash` or `blockNumber`). This event is currently being skipped but we need to come up with a solution wherein we skip any mundane events.
-   System metrics not being properly tracked on grafana, could possibly need a link to promethus (https://arjunkhanna0108.grafana.net/public-dashboards/66fba209a9c848939c857f79c3f08eb4).

## Comments and Readability

The codebase includes comments to explain key logic, such as:

-   **Event Filtering**: Used to detect deposit events in blocks.
-   **Telegram Integration**: Commands for subscribing to and unsubscribing from notifications.
-   **Data Persistence**: Uses Prisma to create new deposit records in MongoDB.

For readability and maintenance, key sections are documented with in-line comments explaining the purpose of each function.

---

For any further questions or issues, please refer to the project's GitHub repository or contact the maintainers.
