var contractAddress = '0xc1EcfBe42C86008174D6A305DE60E71347945727';
var ownerAddress = '0x27Fe75BD164c92BA21c1fd617dF1135bd2520375';

var spinArray = ['animation900','animation1080','animation1260','animation1440','animation1620','animation1800','animation1980','animation2160'];
const web3 = new Web3(window.web3.currentProvider);

window.addEventListener('load', async function() {
   const showAccount = document.querySelector('.showAccount');

   if(window.ethereum) {
      try {
         // Request account access if needed
         await window.ethereum.enable().then((account) => {
            const contractInstance = new web3.eth.Contract(abi, contractAddress, {from: account[0]});

            showAccount.innerHTML = account[0];

            displayContractBalance();

            contractInstance.events.flipRes( async function(error, result){
               if(!error){
                  await flipCoinAnim().then(() => {


                     setTimeout(function() {
                        showCoinResult(result.returnValues.result);
                        /* Check the results */
                        if(result.returnValues.result == result.returnValues.playerChoice){
                              $(".outcome").text("result: " + result.returnValues.result + ". You win!!");

                           } else {
                              $(".outcome").text("result: " + result.returnValues.result + ". You Lose!!");
                           }
                           /* Update the balance of the contract */
                           displayContractBalance();
                     }, 3000)
                  });
               } else {
                  console.log(error);
               }
            });

            /**
             * Action when a bet is placed.
             * Get the value of the bet and check if it is valid.
             * Call the flipCoin method at the contract.
             **/
            $("#submitBet").on('click', function(e){
               e.preventDefault();
               resetCoin();
               $('.wager').html( "");
               $(".outcome").text("");
               var result = getBetValue();

               if (result.betValue < 0.01){
                  $('.outcome').html("Place a bet first!");
               } else {
               $('.wager').html( "Placed a bet of: " + result.betValue + " ETH");

                  try {
                     contractInstance.methods.flipCoin(parseInt(result.betCoinValue)).send({from: web3.givenProvider.selectedAddress, value: result.value});
                  } catch (e) {
                     console.log(e);
                  }
               }

               return false;
            });


            $("#submit_withdraw").on('click', async function(e){
               e.preventDefault();

               try {
                  await contractInstance.methods.payOut().send({from: ownerAddress})
                  .then((r) => {
                        /* Update the balance of the contract */
                        displayContractBalance();
                  });
               } catch (e) {
                  $('.withdrawFunds .msg').html( "You are not the banker!! Get your filthy hands off my Jackpot!!");
                  console.log(e);
               }

               return false;
            });


            $("#submit_addFunds").on('click', async function(e){
               e.preventDefault();

               try {
                  let addFundsAmount = web3.utils.toWei($("#addFundsField").val(), 'ether');
                  await contractInstance.methods.investToContract(addFundsAmount).send({from: web3.givenProvider.selectedAddress, value: addFundsAmount})
                  .then(() => {
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
               let betCoinValue;

               if(betCoin == "heads"){
                  betCoinValue = 0;
               }else if (betCoin == "tails") {
                  betCoinValue = 1;
               }

               var config = {
                  value: web3.utils.toWei(betValue, "ether"),
                  betCoinResult: betCoin,
                  betCoinValue: betCoinValue,
                  betValue: betValue
               }

               return config;
            }

            async function displayContractBalance(){

               try {
                  await web3.eth.getBalance(contractAddress).then(function(res){

                     $("#jackpot").text(web3.utils.fromWei(res, "ether") + " ETH" );
                  });
               } catch (e) {
                  console.log(e);
               }

            }

         });/* End of acces to MetaMask */
      } catch (error) {
         console.log(error);
      }

   } /* End if (window.ethereum) */

});
