# Musicoin Block Explorer

A blockchain explorer built with Node.js and Parity. It does not require an external database and retrieves all information on the fly from a backend Parity node.

## Current Features
* Browse blocks, transactions, accounts and contracts.
* View pending transactions.
* Display contract internal calls (call, create, suicide).
* Upload & verify contract sources.
* Show Solidity function calls & parameters (for contracts with available source code).
* Display the current state of verified contracts.
* Named accounts.
* Advanced transaction tracing (VM Traces & State Diff).
* View failed transactions.
* Live Backend Node status display.
* Submit signed Transactions to the Network.
* Support for all [Bootswatch](https://bootswatch.com/) skins.
* Accounts enumeration.
* Signature verification.
* Supports IPC and HTTP backend connections.
* Responsive layout.

## Getting started

### Setup from source

Supported environment:
* Windows 7 and newer
* Parity 1.8.x
* Node.js 8

### Run your local node

1. Install the Parity node. You might need to install VS 2015 x64 redistributable from Microsoft
2. Install Node.js
3. Start parity using the following options: `parity --chain musicoin --tracing=on --fat-db=on --pruning=archive  --ipcpath=\\.\pipe\musicoin.ipc`
4. Clone this repository to your local machine: `git clone https://github.com/seungjlee/MusicoinExplorer.git --recursive` (Make sure to include `--recursive` in order to fetch the solc-bin git submodule).
5. Install all dependencies: `npm install`
6. Adjust `config.js` if necessary.
7. Start the block explorer: `npm start`
8. Browse to `http://localhost:3000`
