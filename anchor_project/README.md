# Solana Crowdfunding App

## Project Description

This project is a decentralized crowdfunding application built on the Solana blockchain. It allows users to create fundraising campaigns, donate to existing campaigns, and withdraw or close campaigns they have created. The app leverages the power of Solana's fast, low-cost transactions to facilitate seamless interactions between users, making it easy to raise funds and support causes. Since this applicatino is built on the blockchain, it is open to all for use and there is no censorship and central control on data.

### Key Features:
- **Create Campaigns**: Users can create their own campaigns with a fundraising goal and deadline.
- **Donate to Campaigns**: Users can browse campaigns and donate Solana to their chosen causes.
- **Withdraw or Close Campaigns**: Campaign creators can withdraw funds or close their campaigns once the fundraising goal has been met.

## Deployment

### Frontend and Program Deployment

Both the Anchor program and the frontend have been successfully deployed. You can view the app at the following link:  
[Solana Crowdfunding App](https://crowd-fund-frontend.vercel.app/basics)

## Build and Test the Anchor Program Locally

### Prerequisites:
- Solana CLI
- Rust (with the `cargo` tool)
- Anchor framework

### Instructions:
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/solana-crowdfunding.git
   cd solana-crowdfunding
   ```

2. **Install dependencies**:

    ```bash
    anchor install
    ```

3. **Build the Anchor program**:
    
    ```bash
    anchor build
    ```


4. **Run tests: To test the program locally, make sure you have the Solana test validator running**:

    ```bash
    solana-test-validator
    ```

    Then run the tests with:

    ```bash
    anchor test
    ```

5. **Deploy the program to a Solana cluster: For a local testnet deployment**:

    ```bash
    anchor deploy
    ```

## Run the Frontend App Locally
### Prerequisites:
    - Node.js
    - Yarn or npm
    
### Instructions:
1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/solana-crowdfunding-frontend.git
    cd solana-crowdfunding-frontend
    ```

2. Install dependencies: Using Yarn:

    ```bash
    yarn install
    ```

    Or with npm:

    ```bash
    npm install
    ```

3. Run the frontend:

    ```bash
    yarn start
    ```

    Or with npm:

    ```bash
    npm start
    ```

4. Open the app in your browser at http://localhost:3000/basics to interact with the app.