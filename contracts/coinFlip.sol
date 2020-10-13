import "./Ownable.sol";
import "./provableAPI.sol";
pragma solidity 0.5.12;

contract coinFlip is Ownable, usingProvable{

    struct Bet {
        address payable playerAddress;
        uint256 playerChoice;
        uint playerBetAmount;
    }

   uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
   uint256 public latestNumber;
   string public betResult;

   modifier min_costs(uint cost){
      require(msg.value >= cost);
      _;
   }

   mapping (bytes32 => Bet) playerBets; // collection of current bets pending for a result

   event proofRandomFailed(bytes32 queryId);
   event flipMessage(string message);
   event invest(uint value, address player);
   event callbackResult(string betResult, uint256 randomNumber, address playerAddress);

   constructor() public {
    provable_setProof(proofType_Ledger);
  }

    function __callback(bytes32 _queryID, string memory _result,  bytes memory _proof) public {
        require(msg.sender == provable_cbAddress());

        if (provable_randomDS_proofVerify__returnCode(_queryID, _result, _proof) != 0) {
             emit proofRandomFailed(_queryID);
        } else {

            uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result))) % 2;
            uint jackpot = 0;
            betResult = 'You have lost the bet';

            if(playerBets[_queryID].playerChoice == randomNumber){
                //player wins
                jackpot = playerBets[_queryID].playerBetAmount * 2;
                playerBets[_queryID].playerAddress.transfer(jackpot);
                betResult = 'You have won the bet';
            }

            emit callbackResult(betResult, randomNumber, playerBets[_queryID].playerAddress);
        }
   }

    function flipCoin(uint256 playerChoice) public payable min_costs(0.01 ether) {
        require(msg.value >= 0.01 ether, "Place a bet first.");
        require(address(this).balance > msg.value, "Sorry, someone looted the jackpot. Add funds to the jackpot first");

        uint256 QUERY_EXECUTION_DELAY = 0;
        uint256 GAS_FOR_CALLBACK = 200000;
        bytes32 _queryId = provable_newRandomDSQuery(QUERY_EXECUTION_DELAY, NUM_RANDOM_BYTES_REQUESTED, GAS_FOR_CALLBACK);

        // Create a new bet
        Bet memory newBet;
        newBet.playerAddress = msg.sender;
        newBet.playerChoice = playerChoice;
        newBet.playerBetAmount = msg.value;

        addToPlayerBets(_queryId, newBet);

        emit flipMessage('Your bet has been placed. Waiting for a result.');
   }

   function addToPlayerBets(bytes32 _queryId, Bet memory newBet) private{
      playerBets[_queryId] = newBet;
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
