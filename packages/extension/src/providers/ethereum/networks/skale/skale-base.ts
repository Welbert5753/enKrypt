import { CoingeckoPlatform, NetworkNames } from "@enkryptcom/types";
import { EvmNetworkOptions, EvmNetwork } from "../../types/evm-network";
import { EtherscanActivity } from "../../libs/activity-handlers";
import wrapActivityHandler from "@/libs/activity-state/wrap-activity-handler";

import { AssetsType } from "@/types/provider";
import MarketData from "@/libs/market-data";
import { fromBase } from "@/libs/utils/units";
import BigNumber from "bignumber.js";
import {
  formatFiatValue,
  formatFloatingPointValue,
} from "@/libs/utils/number-formatter";
import API from "@/providers/ethereum/libs/api";
import Sparkline from "@/libs/sparkline";
import { NATIVE_TOKEN_ADDRESS } from "../../libs/common";
import { Erc20Token, Erc20TokenOptions } from "../../types/erc20-token";
const DEFAULT_DECIMALS = 18;


function getBlockExplorerValue(
  chainName: string,
  type: "tx" | "address" | string
) {
  return `https://${chainName}.explorer.mainnet.skalenodes.com/${type}/[[${
    type === "tx" ? "txHash" : type
  }]]`;
}

export interface ICustomSKALEAsset {
  address: string;
  coingeckoID: string;
  name?: string;
  symbol?: string;
  icon?: string;
  showZero?: boolean;
  decimals?: number;
}

export interface SkaleParams {
  name: NetworkNames;
  name_long: string;
  chainName: string;
  chainID: `0x${string}`;
  icon?: string;
}

// async function getPreconfiguredTokens(
//   api: API,
//   chainId: `0x${string}`,
//   address: string
// ): Promise<AssetsType[]> {
//   const marketData = new MarketData();
//   const preconfiguredAssets: AssetsType[] = [];
//   const assets: ICustomSKALEAsset[] | undefined = tokenMap[chainId];
//   // throw Error(`Wrong ${JSON.stringify(tokenMap)}`);
//   if (!assets || assets.length === 0)
//     throw Error(`Wrong ${JSON.stringify(tokenMap)}`);
//   const nativeAssetMarketData = await marketData.getMarketData(
//     assets.map((asset) => asset.coingeckoID)
//   );
//   for (let index = 0; index < assets.length; index++) {
//     const asset = assets[index];
//     const assetToken = new Erc20Token({
//       contract: asset.address,
//     } as Erc20TokenOptions);
//     const balanceAsset = await assetToken.getLatestUserBalance(
//       api as API,
//       address
//     );
//     const assetDecimals = asset.decimals ? asset.decimals : DEFAULT_DECIMALS;
//     const nativeAssetUsdBalance = new BigNumber(
//       fromBase(balanceAsset, assetDecimals)
//     ).times(nativeAssetMarketData[index]?.current_price ?? 0);

//     const assetData: AssetsType = {
//       name: asset?.name ?? nativeAssetMarketData[index]?.name ?? "Name",
//       symbol: asset?.symbol ?? nativeAssetMarketData[index]?.symbol ?? "Symbol",
//       icon:
//         nativeAssetMarketData[index]?.image ??
//         require(`../icons/${asset.icon}`) ??
//         require("../icons/skl.png"),
//       balance: balanceAsset,
//       balancef: formatFloatingPointValue(fromBase(balanceAsset, assetDecimals))
//         .value,
//       balanceUSD: nativeAssetUsdBalance.toNumber(),
//       balanceUSDf: formatFiatValue(nativeAssetUsdBalance.toString()).value,
//       value: nativeAssetMarketData[index]?.current_price.toString() ?? "0",
//       valuef: formatFiatValue(
//         nativeAssetMarketData[index]?.current_price.toString() ?? "0"
//       ).value,
//       decimals: assetDecimals,
//       sparkline: nativeAssetMarketData[index]
//         ? new Sparkline(nativeAssetMarketData[index]?.sparkline_in_7d.price, 25)
//             .dataUri
//         : "",
//       priceChangePercentage:
//         nativeAssetMarketData[index]?.price_change_percentage_7d_in_currency ??
//         0,
//       contract: asset.address,
//     };
//     if (asset.showZero || assetData.balancef !== "0")
//       preconfiguredAssets.push(assetData);
//   }
//   return preconfiguredAssets;
// }

export function createSkaleEvmNetwork(params: SkaleParams): EvmNetwork {
  return new EvmNetwork({
    name: params.name,
    name_long: params.name_long,
    homePage: "https://skale.space",
    blockExplorerTX: getBlockExplorerValue(params.chainName, "tx"),
    blockExplorerAddr: getBlockExplorerValue(params.chainName, "address"),
    chainID: params.chainID,
    isTestNetwork: false,
    currencyName: "SFUEL",
    currencyNameLong: "Skale FUEL",
    node: `wss://mainnet.skalenodes.com/v1/ws/${params.chainName}`,
    icon: require(`../icons/${params.icon ?? "skl.png"}`),
    gradient: "#7B3FE4",
    coingeckoID: "skale",
    coingeckoPlatform: CoingeckoPlatform.Skale,
    assetsInfoHandler: assetInfoHandlerSkale,
    activityHandler: wrapActivityHandler(EtherscanActivity),
    customTokens: true,
  } as EvmNetworkOptions);
}

export async function assetInfoHandlerSkale(
  network: EvmNetwork,
  address: string
): Promise<AssetsType[]> {
  const api = await network.api();
  const balance = await (api as API).getBalance(address);
  const nativeAsset: AssetsType = {
    name: network.currencyNameLong,
    symbol: network.currencyName,
    icon: require("../icons/skl-fuel.png"),
    balance,
    balancef: formatFloatingPointValue(fromBase(balance, network.decimals))
      .value,
    balanceUSD: 0,
    balanceUSDf: "0",
    value: "0",
    valuef: "0",
    decimals: network.decimals,
    sparkline: "",
    priceChangePercentage: 0,
    contract: NATIVE_TOKEN_ADDRESS,
  };

  // const preconfiguredTokens: AssetsType[] = await getPreconfiguredTokens(
  //   api as API,
  //   network.chainID,
  //   address
  // );

  await Promise.all(
    network.assets.map((token) =>
      token.getLatestUserBalance(api as API, address).then((balance) => {
        token.balance = balance;
      })
    )
  );

  const assetInfos = network.assets
    .map((token) => {
      const assetsType: AssetsType = {
        name: token.name,
        symbol: token.symbol,
        icon: token.icon,
        balance: token.balance!,
        balancef: formatFloatingPointValue(
          fromBase(token.balance!, token.decimals)
        ).value,
        balanceUSD: 0,
        balanceUSDf: "0",
        value: "0",
        valuef: "0",
        decimals: token.decimals,
        sparkline: "",
        priceChangePercentage: 0,
        contract: token.contract,
      };
      return assetsType;
    })
    .filter((asset) => asset.balancef !== "0");

  // return [nativeAsset, ...preconfiguredTokens, ...assetInfos];
  return [nativeAsset, ...assetInfos];
}
