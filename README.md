# X-Tokenize

X-Tokenize is a command line tool to simplify the process of creating, managing and distributing issued currencies and eventually NFT's on the XRPL. 

**This project is in a very early stage and is not intended for use on the Main Network.**

## Pre-requisites
1) [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed (verified with node v14.17.0 and 7.24.2)

## Installation

1) Clone or download this repository to your local machine.
2) In the root directory:

```bash

# To install the tool globally on your local machine run:
npm install -g

# Alternatively you can install in the local directory by running:
npm install


```


## Usage
In your favorite terminal run the command:
```bash

# If installed globally, you can run the tool using this command:
x-tokenize

# Otherwise:
node x-tokenize.js

```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Road Map
* Comment code, refactor, build unit tests.
* Encryption  of configuration files when creating a new project implementing [PBKDF2](https://www.pbkdf2.com/).
* Increase the detail of a project overview to include more data i.e) Detailed trustline data, DEX offers, growth metrics.
* Add more Airdrop features ie) scheduled releases, connect with twitter apis.
* Add [DEX](https://xrpl.org/decentralized-exchange.html) support to provide liquidity for your projects.
* [XUMM](https://xumm.app/) integration for funding wallets on the Main net. 
* Hardware wallet support for storing your private keys for projects.
* Implement [XLS-20d](https://github.com/XRPLF/XRPL-Standards/discussions/46) standard along with various options for meta-data storage.
* Build redundant NFT meta-data distribution system.
* Random NFT from collection minting system.
