(function () {

  var bittrex = require('node-bittrex-api');
  var colors = require('colors');

  bittrex.options({
    'apikey' : "",
    'apisecret' : "",
    'verbose' : true,
    'cleartext' : false
  });

  var BTCCoins  = [];
  var ETHCoins  = [];
  var USDTCoins = [];
  var NewBTCCoins  = [];
  var NewETHCoins  = [];
  var NewUSDTCoins = [];

  var tmpCoins = [];

  function init(){
    bittrex.getmarketsummaries( function( data, err ) {
      if (data.success){
        data.result.forEach(function(coin) {
          switch(true){
            case (/^BTC/).test(coin.MarketName): 
                        BTCCoins.push(coin);
                        break;
            case (/^ETH/).test(coin.MarketName): 
                        ETHCoins.push(coin);
                        break;
            case (/^USDT/).test(coin.MarketName):
                        USDTCoins.push(coin);
                        break;
          }
        }, this);

        console.log('BTC Based: ' + BTCCoins.length);
        console.log('ETH Based: ' + ETHCoins.length);
        console.log('USDT Based: ' + USDTCoins.length);
        
        var intervalID = setInterval(compare, 15000);
        
      }
    });
  }

  function subscribe(coins){
    var coinSymbols = coins.map(function(coin){
      return coin.MarketName;
    });
    bittrex.websockets.subscribe(coinSymbols, function(data, client) {
      if (data.M === 'updateExchangeState') {
        data.A.forEach(function(data_for) {
          console.log('Market Update for '+ data_for.MarketName, data_for);
        });
      }
    });
  }

  function compare(){
    bittrex.getmarketsummaries( function( data, err ) {
      if (data !== null && data.success){

        NewBTCCoins  = [];
        NewETHCoins  = [];
        NewUSDTCoins = [];

        data.result.forEach(function(coin) {
          switch(true){
            case (/^BTC/).test(coin.MarketName): 
                        NewBTCCoins.push(coin);
                        break;
            case (/^ETH/).test(coin.MarketName): 
                        NewETHCoins.push(coin);
                        break;
            case (/^USDT/).test(coin.MarketName):
                        NewUSDTCoins.push(coin);
                        break;
          }
        }, this);

        for (i=0; i < NewBTCCoins.length; i++){
          if (NewBTCCoins[i].Volume > BTCCoins[i].Volume){
            var volChange = NewBTCCoins[i].Volume - BTCCoins[i].Volume;
            var volPerChange = (volChange / BTCCoins[i].Volume) * 100;
            var priceChange = NewBTCCoins[i].Last - BTCCoins[i].Last;
            var pricePerChange = (priceChange / BTCCoins[i].Last) * 100;
            // Fees per trade .25%; which means .5% because of the buy and sell operations
            if (volPerChange > 0.05 && pricePerChange > 1.5){
              // Add a dictionary that saves which coin have already appeared here, probably save first price
              if (typeof tmpCoins[NewBTCCoins[i].MarketName] !== 'undefined'){
                var newTP = tmpCoins[BTCCoins[i].MarketName].timesPumping + 1;
                tmpCoins[NewBTCCoins[i].MarketName].timesPumping = newTP;
              }else{
                tmpCoins[NewBTCCoins[i].MarketName] = {marketName: BTCCoins[i].MarketName, firstPrice: (BTCCoins[i].Last ), timesPumping : 1, firstVolume:  BTCCoins[i].Volume };
              }
              // console.log(tmpCoins[NewBTCCoins[i].MarketName]);
              // console.log('_____________________________________________________')
              //console.log(colors.magenta(NewBTCCoins[i].MarketName) + ' Volume changed ' + colors.blue(volChange) + ' equals ' + colors.green(volPerChange.toFixed(2)) + '% change, the price changed from ' + colors.magenta(BTCCoins[i].Last) + ' to ' + colors.cyan(NewBTCCoins[i].Last) + ' equals ' + colors.yellow(pricePerChange.toFixed(2)) + '%');
              if (typeof tmpCoins[NewBTCCoins[i].MarketName].timesPumping !== 'undefined' && tmpCoins[NewBTCCoins[i].MarketName].timesPumping >= 3){
                console.log(colors.bgRed('Check ' + tmpCoins[NewBTCCoins[i].MarketName].marketName) + 
                '\n First Volume: ' + colors.blue(tmpCoins[NewBTCCoins[i].MarketName].firstVolume) + ' Current Volume: ' + colors.blue(NewBTCCoins[i].Volume) + ' % change: ' + colors.blue(volPerChange) +
                '\n First Price: ' + colors.blue(tmpCoins[NewBTCCoins[i].MarketName].firstPrice) + ' Current Price: ' + colors.blue(NewBTCCoins[i].Last) + 
                '\n Times Pumping: ' + tmpCoins[NewBTCCoins[i].MarketName].timesPumping);
              }
            }
          }
        }
        console.log('==========================================');
        // Copying the first values to the ones we just tested, if a coin appears repeatedly, it's a pump
        BTCCoins = JSON.parse(JSON.stringify(NewBTCCoins));
        ETHCoins = JSON.parse(JSON.stringify(NewETHCoins));
        USDTCoins = JSON.parse(JSON.stringify(NewUSDTCoins));

      }
    });
  }

  init();

})();