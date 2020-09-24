import "./Ownable.sol";
import "./provableAPi.sol";
pragma solidity 0.5.12;

contract coinFlip is Ownable, usingProvable{

   struct Bet {
      address payable playerAddress;
      bytes32 betID;
      uint playerChoice;
      uint betAmount;
      //uint betResult;
   }

   uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
   uint256 public latestNumber;

   modifier min_costs(uint cost){
      require(msg.value >= cost);
      _;
   }

   mapping (bytes32 => Bet) public currentBets; // collection of current bets pending for a result
   mapping (address => bool) private awaitBets; // check player has a bet going

   event flipRes(bytes32 queryID, uint playerChoice, address playerAddress);
   event flipMessage(string message);
   event invest(uint value, address player);
   event generatedRandomNumber(uint256 randomNumber);

   function __callback(bytes32 _queryID, string memory _result, bytes memory _proof) public {
      require(msg.sender == provable_cbAddress());

      uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result))) % 2;
      latestNumber = randomNumber;
      setAwaitBets(false, msg.sender);
      emit generatedRandomNumber(randomNumber);
   }

   function flipCoin(uint playerChoice) public payable min_costs(0.01 ether) {
     /**
     *   playerChoice: 0 == Heads
     *   playerChoice: 1 == Tails
     */
     require(msg.value >= 0.01 ether, "Place a bet first.");
     if (getAwaitBets(msg.sender) != false) {

        uint256 QUERY_EXECUTION_DELAY = 0;
        uint256 GAS_FOR_CALLBACK = 200000;
        bytes32 queryID = provable_newRandomDSQuery(QUERY_EXECUTION_DELAY, NUM_RANDOM_BYTES_REQUESTED, GAS_FOR_CALLBACK); //uint result = pseudoRandom();

        // Create a new bet
        Bet memory newBet;
        newBet.playerAddress = msg.sender;
        newBet.betID = queryID;
        newBet.playerChoice = playerChoice;
        newBet.betAmount = msg.value;

        addToCurrentBets(newBet.betID, newBet);
        setAwaitBets(true, msg.sender);

        emit flipRes(newBet.betID, newBet.playerChoice, msg.sender);

        /**
         *  __callback takes the Id of the query, the result, and proof??
         * emits either 1 or 0 (Heads or Tails);
         **/
        __callback(newBet.betID, "1", bytes("test"));

         //if(result == playerChoice){
            /* pay out winnings */
         //   msg.sender.transfer(msg.value * 2);
         //}
      } else {
         string memory message = 'awaiting previous bet result.';
         emit flipMessage(message);
      }
   }

   function addToCurrentBets(bytes32 queryID, Bet memory newBet) private{
      currentBets[queryID] = newBet;
   }

   function setAwaitBets(bool value, address adr) public{
      awaitBets[adr] = value;
   }

   function getAwaitBets(address adr) public returns(bool){
      return awaitBets[adr];
   }

   // function pseudoRandom() public view returns (uint){
   //    return now % 2;
   // }

   // function testRandom() public returns (bytes32) {
   //    bytes32 queryId = bytes32(keccak256(abi.encodePacked(msg.sender)));
   //    __callback(queryId, "1", bytes("test"));
   // }

   function investToContract(uint value) external payable min_costs(0.001 ether){
      emit invest(value, msg.sender);
   }

   function payOut() public onlyOwner payable{
      if (address(this).balance > 0){
         msg.sender.transfer(address(this).balance);
      }
   }
}
