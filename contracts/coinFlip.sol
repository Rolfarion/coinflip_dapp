import "./Ownable.sol";
import "./provableAPi.sol";
pragma solidity 0.5.12;

contract coinFlip is Ownable, usingProvable{

   struct Bet {
      address payable playerAddress;
      uint playerChoice;
      uint betAmount;
   }

   struct BetResult {
      address payable playerAddress;
      bytes32 betID;
      uint betResult;
   }

   uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
   uint256 public latestNumber;

   modifier min_costs(uint cost){
      require(msg.value >= cost);
      _;
   }

   mapping (address => BetResult) BetResults;
   mapping (address => Bet) currentBets; // collection of current bets pending for a result
   mapping (address => bool) awaitBets;  //check player has a bet going

   event flipMessage(string message);
   event invest(uint value, address player);
   event generatedRandomNumber(uint256 randomNumber);

   function __callback(bytes32 _queryID, string memory _result) public {
      require(msg.sender == provable_cbAddress());

      uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result))) % 2;
      setAwaitBets(false, msg.sender);

      BetResult memory newBetResult;
      newBetResult.playerAddress = msg.sender;
      newBetResult.betID = _queryID;
      newBetResult.betResult = randomNumber;

      addToBetresults(msg.sender, newBetResult);

      emit generatedRandomNumber(randomNumber);
   }

   function flipCoin(uint playerChoice) public payable min_costs(0.01 ether) {
      require(msg.value >= 0.01 ether, "Place a bet first.");
      string memory message;
      if (getAwaitBets(msg.sender) != true) {
         uint256 QUERY_EXECUTION_DELAY = 0;
         uint256 GAS_FOR_CALLBACK = 200000;
         provable_newRandomDSQuery(QUERY_EXECUTION_DELAY, NUM_RANDOM_BYTES_REQUESTED, GAS_FOR_CALLBACK); //uint result = pseudoRandom();

         // Create a new bet
         Bet memory newBet;
         newBet.playerAddress = msg.sender;
         newBet.playerChoice = playerChoice;
         newBet.betAmount = msg.value;

         addToCurrentBets(newBet.playerAddress, newBet);
         setAwaitBets(true, msg.sender);

         message = 'Your bet has been placed. Waiting for a result.';
      } else {
         message = 'awaiting previous bet result.';
      }
      emit flipMessage(message);
   }

   function addToBetresults(address _adr, BetResult memory newBet) private{
      BetResults[_adr] = newBet;
   }

   function getBetresults() public view returns(address playerAddress, bytes32 betID, uint betResult){
      address gambler = msg.sender;
      return (BetResults[gambler].playerAddress, BetResults[gambler].betID, BetResults[gambler].betResult);
   }

   function addToCurrentBets(address _adr, Bet memory newBet) private{
      currentBets[_adr] = newBet;
   }

   function getCurrentBet() public view returns(address playerAddress, uint playerChoice, uint betAmount){
      address gambler = msg.sender;
      return (currentBets[gambler].playerAddress, currentBets[gambler].playerChoice, currentBets[gambler].betAmount);
   }

   function setAwaitBets(bool value, address _adr) public{
      awaitBets[_adr] = value;
   }

   function getAwaitBets(address _adr) public view returns(bool){
      bool check = false;
      if (awaitBets[_adr] == true){
          check = true;
      }
      return check;
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
