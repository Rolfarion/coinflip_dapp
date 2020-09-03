const CoinFlip = artifacts.require("coinFlip");
const Ownable = artifacts.require("Ownable");

module.exports = function(deployer, accounts) {
  deployer.deploy(CoinFlip)
};
