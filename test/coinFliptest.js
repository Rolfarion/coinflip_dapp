const CoinFlip = artifacts.require("coinFlip");
const truffleAssert = require("truffle-assertions");

contract("CoinFlip", async function(accounts){

   let instance;

   before(async function(){
     instance = await CoinFlip.deployed();
   });

   /**
   *  Method: investToContract(uint value);
   **/
   it("should be able to invest into contract", async function(){
     let value = web3.utils.toWei("1", "ether");
     await truffleAssert.passes(instance.investToContract(value, {from: accounts[0], value: value}), truffleAssert.ErrorType.REVERT);
  });

  /**
  *   Method: flipCoin(uint playerChoice);
  *   Take the value send by the player.
  *   Check if player has an ongoing bet.
  *   Ask for a random number
  **/

  it("should be able to get the players choice, recieve payment value and request a random number from the oracle", async function(){
     let betCoinChoice = 1;
     let value = web3.utils.toWei("0.2", "ether");
     await truffleAssert.passes(instance.flipCoin(betCoinChoice, {from: accounts[0], value: value}), truffleAssert.ErrorType.REVERT);
     //let flipResult = await instance.events.flipRes();
  });

  it("should be able to get balance of contract", async function(){
     let contractBalanceBefore = await web3.eth.getBalance(instance.address);
     let ownerBalanceOld = await web3.eth.getBalance(accounts[0]);
     await truffleAssert.passes(instance.payOut({from: accounts[0]}), truffleAssert.ErrorType.REVERT);
     let ownerBalanceNew = await web3.eth.getBalance(accounts[0]);
     let contractBalance = await web3.eth.getBalance(instance.address);
     assert(contractBalance == 0 && ownerBalanceOld < ownerBalanceNew, "contractBalance Before: " + contractBalanceBefore + "contractBalance After: " + contractBalance + " ownerBalanceOld: " + ownerBalanceOld + " ownerBalanceNew: " + ownerBalanceNew);
  });
;})
