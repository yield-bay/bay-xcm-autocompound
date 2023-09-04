# Yieldbay Auto-compounder

## Description

[Yieldbay Auto-compounder](https://autocompound.yieldbay.io) is a novel offering within [YieldBay's](https://yieldbay.io) product-suite.

Yieldbay Auto-compounder lets users manage their Liquidity seamlessly, while also boasting the ability to auto-compound Liquidity Pools on [MangataX](https://x.mangata.finance/).

## How to set up a development environment?

1. Clone the repository:
```bash
git clone https://github.com/yield-bay/bay-xcm-autocompound.git
```

2. Navigate to the project directory and install the dependencies:
```bash
cd bay-xcm-autocompound
yarn
```

3. Setup & run the necessary backend services:
   - [bay-api](https://github.com/yield-bay/bay-api) - GraphQL API that the frontend consumes.
   - [bay-watcher](https://github.com/yield-bay/bay-watcher) - Indexer for yield farms written in Rust.
   - [bay-watcher-ts](https://github.com/yield-bay/bay-watcher-ts) - Indexer for yield farms written in TypeScript.

4. Create a .env file and add the URL for `bay-api` from above.
```bash
NEXT_PUBLIC_API_URL=<insert api url>
```

4. Start the dev server
```bash
yarn dev
```
## How to get in touch?
YieldBay's engineering team is active and open to questions on our [discord server](https://discord.com/invite/AKHuvbz7q4)

