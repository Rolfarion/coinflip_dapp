import "./Ownable.sol";
import "./provableAPi.sol";
pragma solidity 0.5.12;

contract coinFlip is Ownable, usingProvable{

   uint public playerBalance;
   address payable public payableAddress;

   modifier min_costs(uint cost){
      require(msg.value >= cost);
      _;
   }

   event flipRes(uint result, uint playerChoice, address player);
   event invest(uint value, address player);

   function flipCoin(uint playerChoice) public payable min_costs(0.01 ether) {
     /**
     *   playerChoice: 0 == Heads
     *   playerChoice: 1 == Tails
     */
     require(msg.value >= 0.01 ether, "Place a bet first.");
     uint result = pseudoRandom();
     emit flipRes(result, playerChoice, msg.sender);

      if(result == playerChoice){
         /* pay out winnings */
         msg.sender.transfer(msg.value * 2);
      }
   }

   function pseudoRandom() public view returns (uint){
      return now % 2;
   }

   function investToContract(uint value) external payable min_costs(0.001 ether){
      emit invest(value, msg.sender);
   }

   function payOut() public onlyOwner payable{
      if (address(this).balance > 0){
         msg.sender.transfer(address(this).balance);
      }
   }
}
