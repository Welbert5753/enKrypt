import { SignerType } from "@enkryptcom/types";
import { PolkadotNodeType } from "../types";
const dotNode: PolkadotNodeType = {
  name: "DOT",
  name_long: "Polkadot",
  homePage: "https://polkadot.network",
  blockExplorerTX: "https://polkascan.io/polkadot/transaction/[[txHash]]",
  blockExplorerAddr: "https://polkascan.io/polkadot/account/[[address]]",
  isTestNetwork: false,
  currencyName: "DOT",
  icon: require("./icons/polkadot.svg"),
  decimals: 10,
  prefix: 0,
  signer: SignerType.sr25519,
  gradient: "#8247E5",
};
export default dotNode;
