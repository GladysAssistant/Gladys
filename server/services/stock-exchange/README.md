# Stock Exchange Service

This is a stock exchange service. It uses Financial Modeling Prep API.

Feel free to give your feedbacks 🙂


## Third-party libraries

This service is using `financialmodelingprep` package as dependency.

https://www.npmjs.com/package/financialmodelingprep


## API

This services exposes a function which returns a read-only object:

```
{
  start: [Function], // function to start the service
  stop: [Function], // function to stop the service
  controllers: {
    getStockExchangeIndexQuote: [Function], // function to get the stock exchange info
  }
}
```

## How To

You need an api key by creating an account on https://financialmodelingprep.com/ .

For free you will have 200 request per day.

## Testing

**All this service is tested.**


## Glossary

* Stock Exchange : a place where shares in companies are bought and sold

* Stock quote : A stock quote is the price of a stock as quoted on an exchange. A basic quote for a specific stock provides information, such as its bid and ask price, last traded price, and volume traded

* Stock Symbol (Ticker) : A stock symbol is an arrangement of characters—usually letters—representing publicly-traded securities on an exchange


## To do

* Stock exchange box :  as a user I am able to see the currency associated to the displayed stock quote information.

* Multi selection on tickers : as a user i can configure one or more tickers to be displayed in the stock exchange box (see front demo)

* Ask gladys for a information about a quote : as a user i can ask glady by chat to give me the actual information about a quote. IE : Tell me about quote Stark Industries

* Configure scenario around a stock quote : as a user i can create a scenario based on a stock quote value. IE : if Stark Industries stock quote value is below 500$ then send me a message.


## Quotation

"Oh Ben, il nous détestait parce que nous gagnons de l'argent et, dans son optique prolétarienne, le profit lui était insupportable..."

*Réplique La cité de la peur*
