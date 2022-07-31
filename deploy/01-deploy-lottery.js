const {
  getNamedAccounts,
  deployments,
  network,
  run,
  ethers,
} = require("hardhat");
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const FUND_AMOUNT = "1000000000000000000000";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoorDinatorV2Address, subscriptionId;

  if (chainId == 31337) {
    // create VRFV2 Subscription
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoorDinatorV2Address = vrfCoordinatorV2Mock.address;
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionRecepit = await transactionResponse.wait();
    subscriptionId = transactionRecepit.events[0].args.subId;
    // Fund the subscription
    // Our mock makes it so we don't actually have to worry about sending fund
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoorDinatorV2Address = networkConfig[chaindId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chaindId]["subscriptionId"];
  }
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;
  log("----------------------------------------------------");
  const arguments = [
    vrfCoorDinatorV2Address,
    subscriptionId,
    networkConfig[chainId]["gasLane"],
    networkConfig[chainId]["keepersUpdateInterval"],
    networkConfig[chainId]["raffleEntranceFee"],
    networkConfig[chainId]["callbackGasLimit"],
  ];

  const lottery = await deploy("Lottery", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  // Verify the deployment
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(lottery.address, arguments);
  }

  log("Enter lottery with command:");
  const networkName = network.name == "hardhat" ? "localhost" : network.name;
  log(`yarn hardhat run scripts/enterLottery.js --network ${networkName}`);
  log("----------------------------------------------------");
};

module.exports.tags = ["all", "lottery"];
