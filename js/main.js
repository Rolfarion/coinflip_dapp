var contractAddress = '0xBD0dc23e8dDFA18a11f466Ca1Ac15Aed991654C5';
var ownerAddress = '0x27Fe75BD164c92BA21c1fd617dF1135bd2520375';

var spinArray = ['animation900','animation1080','animation1260','animation1440','animation1620','animation1800','animation1980','animation2160'];
const web3 = new Web3(Web3.givenProvider);
var contractInstance;
const ethereumButton = document.querySelector('#connectButton');
var awaitBetResult = false;


window.addEventListener('load', async function() {
   const showAccount = document.querySelector('.showAccount');

   if(window.ethereum) {

      try {
         // Request account access if needed
         window.ethereum.enable().then((account) => {
            contractInstance = new web3.eth.Contract(abi, contractAddress, {from: account[0]});
            showAccount.innerHTML = account[0];

            // web3.eth.getBlock("latest", false, (error, result) => {
            //    console.log(result.gasLimit)
            //    // => 8000029
            // });

            /* One way to get the returnvalue from a contract method..
            contractInstance.methods.getAwaitBets(account[0]).call()
            .then(function (test) {
              console.log(test);
            });
            */

            displayContractBalance();

            contractInstance.events.callbackResult(function(error, callbackResult){
               if(!error){
                  let betResult = callbackResult.returnValues.betResult;
                  let randomNumber = callbackResult.returnValues.randomNumber;
                  let playerAddress = callbackResult.returnValues.playerAddress;
                  showCoinResult(randomNumber);
                  $(".outcome").text(betResult);
                  awaitBetResult = false;
                  /* Update the balance of the contract */
                  displayContractBalance();
               }else{
                  console.info('error: ', error);
               }
            });

            contractInstance.events.flipMessage(function(error, result){
               if(error){console.log(error);}
               $(".outcome").text(result.returnValues.message);
            });

            contractInstance.events.proofRandomFailed(function(error, result){
               if(error){console.log(error);}
               console.log('proofRandomFailed', result.returnValues);
               $(".outcome").text(result.returnValues.queryId);
            });

         });/* End of acces to MetaMask */
      } catch (error) {
         console.log(error);
      }
   } /* End if (window.ethereum) */
});

   /**
    * Action when a bet is placed.
    * Get the value of the bet and check if it is valid.
    * Call the flipCoin method at the contract.
    **/
   $("#submitBet").on('click', function(e){
      e.preventDefault();

      if(awaitBetResult == true){
         $(".outcome").text("Await the result of your previous bet first please!");
         return false;
      } else {

         resetCoin();
         $('.wager').html( "");
         $(".outcome").text("");
         var result = getBetValue();

         $('.wager').html( "Placed a bet of: " + result.betValue + " ETH");

          try {
             contractInstance.methods.flipCoin(parseInt(result.betCoinChoice)).send({from: web3.givenProvider.selectedAddress, value: result.value})
             .then(() => {
                awaitBetResult = true;
                flipCoinAnim();
             });
          } catch (e) {
             console.log(e);
          }
          return false;
      }
   });


   $("#submit_withdraw").on('click', function(e){
      e.preventDefault();

      try {
         contractInstance.methods.payOut().send({from: ownerAddress})
         .then((r) => {
               /* Update the balance of the contract */
               displayContractBalance();
         });
      } catch (e) {
         $('.withdrawFunds .msg').html( "You are not the banker!! Get your filthy hands off my Jackpot!!");
      }

      return false;
   });


   $("#submit_addFunds").on('click', function(e){
      e.preventDefault();

      try {
         let addFundsAmount = web3.utils.toWei($("#addFundsField").val(), 'ether');
         contractInstance.methods.investToContract(addFundsAmount).send({from: web3.givenProvider.selectedAddress, value: addFundsAmount})
         .then((r) => {
               /* Update the balance of the contract */
               displayContractBalance();
         });
      } catch (e) {
         console.log(e);
      }

      return false;
   });

   async function flipCoinAnim(){
      $('#coin').removeClass();
      setTimeout(function(){
         $('#coin').addClass(getSpin());
      }, 100);

      return true;
   }

   function getSpin() {
      var spin = spinArray[Math.floor(Math.random()*spinArray.length)];
      return spin;
   }

   function showCoinResult(result){
      $('#coin').removeClass();
      if(result == 0){
         // Show the head: transform: translateZ(1px);
         // Hide the tail: transform: translateZ(-1px) rotateY(180deg);
         $(".front").css({'background-image' : 'url(/images/ethereum_head.png)'});
         //$(".front").css({'transform' : 'translateZ(-1px) rotateY(180deg)'});
         $(".back").css({'background-image' : 'none'});
      } else {
         $(".front").css({'background-image' : 'url(/images/ethereum_tail.png)'});
         $(".front").css({'transform' : 'translateZ(-1px) rotateY(180deg)'});
         $(".back").css({'background-image' : 'none'});
      }
   }

   function resetCoin(){
      $('#coin').removeClass();
      $(".front").css({'background-image' : 'url(/images/ethereum_head.png)'});
      $(".front").css({'transform' : 'translateZ(1px)'});
      $(".front").css({'background-size' : 'cover'});
      $(".front").css({'display' : 'block'});


      $(".back").css({'background-image' : 'url(/images/ethereum_tail.png)'});
      $(".back").css({'transform' : 'translateZ(-1px) rotateY(180deg)'});
   }

   function getBetValue() {

      let betCoin = $("input[name='coin']:checked").val();
      let betValue = $("#bet").val();
      let betCoinChoice;

      if(betCoin == "heads"){
         betCoinChoice = 0;
      }else if (betCoin == "tails") {
         betCoinChoice = 1;
      }

      var config = {
         value: web3.utils.toWei(betValue, "ether"),
         betCoinResult: betCoin,
         betCoinChoice: betCoinChoice,
         betValue: betValue
      }

      return config;
   }

   function displayContractBalance(){
      try {
         web3.eth.getBalance(contractAddress).then(function(res){
            $("#jackpot").text(web3.utils.fromWei(res, "ether") + " ETH" );
         });
      } catch (e) {
         console.log(e);
      }
   }
