// Client
const program = pg.program;
const wallet = pg.wallet;

console.log("My address:", wallet.publicKey.toString());
const balance = await pg.connection.getBalance(wallet.publicKey);
console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
