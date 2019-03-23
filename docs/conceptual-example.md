# Conceptual Example
> Cache to the Max, Cash to the Max

Skypager's conceptual model makes it possible to model any system out of JavaScript modules, at the same time since it is also possible to turn any data source with a URL into a JavaScript module, on the server or in the browser, it is possible to do this using documents made by everyday tools used by non-programmers, such as a [Google Spreadsheet](https://sheets.new)

This means anybody who knows just enough JavaScript, and how to work with spreadsheets on Google Drive, can build a software app to run their business out, using a little custom code.  Even directly in the browser itself with no tools.

As you'll see in the example below, the classes themselves are higher level, domain specific classes, that exist in the layer of people, less in the layer of machines.  
Code is a great way to express most systems, and I really believe anyone can do it, if we got rid of most of the noise.

## A Hypothetical Example
> Create a franchise. Be the next Jimmy John.

Since The [Google Sheets Helper](../src/helpers/google-sheet) lets us turn any google sheet into a lazy loadable JavaScript module 

Since it lets us a take any collection of google sheets and combine them into a full blown API that runs anywhere... 

I figure we  take all the money we save setting up servers and plumbing and invest in a bunch of restaurants (tbh just different kinds of servers and different kind of plumbing.) 


Here's the script which kicks it off every morning.

```javascript
// our program is running on a machine, this is that layer
import environmentRuntimeLayer, { Runtime, Helper } from '@skypager/runtime'
// we can discover all the sheets shared with our email address
import * as Sheet from '@skypager/helpers-runtime'

// just call it runtime now, but this is the lifecycle of the whole process  
const runtime = environmentRuntimeLayer

// a singular instance entity that encapsulates everything 
const myBusiness = new Franchise({
  // thing which can be entities usually have a unique name
  name: 'Soederpops',
  // or at least some other unique id 
  taxPayerId: '123-456789',

  description: 'A diner, no scrubs, no haters allowed',
  // runtime contains all the stuff that is not core to my domain, 
  // but still needed for my program to work
  runtime
})

// mobx state.observe returns a function to call when you wanna stop observing
const stopWorryinAboutIt = myBusiness.state.observe(({ name, newValue }) => {
  if (name !== 'aboutToBlowUp') {
    console.log('hit me up')
  } else {
    console.log('im on a boat, call me back')
  }
})

// here's how we're gonna do it
await myBusiness
  // my motto
  .getRichOrDieTryin()
  // handle my mistakes
  .catch(someBullShit => myBusiness.handle(someBullShit))
  // hashtag goals
  .then(() => myBusiness.reminisceAboutTheOldDaysWithMyCrew())
  // when it is all said and done
  .finally(stopWorryinAboutIt)
```

Here is how I modeled it with JavaScript modules.

We start with `@my/business`, a module.  It extends `Runtime` because its a layer that hosts or contains a bunch of other processes and workflows that you can zoom in or out on.

```javascript
// A Franchise is a way to describe a business that has many instances of restaurants
export class Franchise extends Runtime {
  constructor(options = {}, context = {}) {
    super(options, context)

    this
      .use(Sheet)
      .use(Restaurant)
  }

  handle(error) {
    this.runtime.communicationTools.nineOneOneMyPager(error.message)
  }

  // this gets run every morning
  async getRichOrDieTryin() {
    const { entries } = this.lodash
    await this.runtime.sheets.discover()

    // each google sheet i have access to is from one of my spots
    for(let spot of this.runtime.sheets.allMembers()) {
      await spot.fetch()
      this.restaurants.register(spot.name, () => spot.data)
    }

    this.runMyBusiness()
  }

  // honestly if i knew what to put here i probably wouldn't be writing this :)
  runMyBusiness() { 
    // make money basically  
  }

  // as one does
  rebuildAndTryAgain() {
    try {
      console.log('get goin')
    } catch(error) {
      console.log('reflect on shit')
    } finally() {
      console.log('dont give up')
    }
  }

  // #goals
  reminisceAboutTheOldDaysWithMyCrew() {
    if (this.totalRevenue < 5 * 100000 * 100000) {
      console.log('Sheeeeit.')
    } else {
      throw new Error('Keep Grindin')
    }
  }

  // my spots are usually packed, so
  get allOpenTables() {
    const { mapValues } = this.lodash
    return this.restaurants.allMembers()

    return mapValues(
      this.restaurants.allMembers(),
      'openTables'
    )
  }
}

// My Franchise is made up of a lot of restaurants
export class Restaurant extends Helper {
  // this describes the Mobx observable interfaces
  observables() {
    return {
      // any mobx.observable function
      tables: ["shallowMap"], 
      waitStaff: ["shallowMap"],
      ingredientStock: ["shallowMap"]
      takeReservation: ["action", this.takeReservation],
      openTables: ["computed", this.getOpenTables]
    }
  }   
  
  // tell mobx this is an action so it can optimize 
  takeReservation({ count, time, name }) {
    const firstOpenTableForThisParty = this.tables.values().find(table => table.size >= count && !table.booked)

    if (firstOpenTableForThisParty) {
      this.tables.merge({
        [firstOpenTableForThisParty.id] : {
          ...firstOpenTableForThisParty,
          booked: true,
          time
        }
      })
    } else {
      throw new Error('bribe me or wait')
    }
  }

  // we tell mobx this is a computed property so it can optimize 
  // get an object of each restaurant's number of open table
  getOpenTables() {
    const { mapValues } = this
    return mapValues(this.tables.toJSON(), (restaurant) => restaurant.openTables)
  }
}
```

This `franchise` runtime runs in the browser or on the server.  I can build a JSON API on top of it.  I can build a React UI on top of it.  

Same modules, no changes necessary.

## What's next?

Alright so the business is a success.  

The `@soederpop/franchise` runtime is a container for a whole world domination strategy.

As it grew more complex, Skypager would give me a system to organize all of the moving pieces that were required to build an automated system that integrates with the rest of the world.

```javascript
import business from '@my/franchise'
// braintree for my places in chicago, stripe for my places in SF
// since naturally i got a guy in each city, gives me a good deal
import PaymentProcessors from '@my/helpers-payment-processor'
// open table, automated phone prompts, chat bots?
import ReservationSystems from '@my/helpers-reservation-system'

business
  .use(PaymentProcessors)
  .use(ReservationSystems)
```

Our `PaymentProcessors` class is a Helper, and the entire universe of payment processing providers can be loaded as modules,
but from the perspective of my buiness I really only care about two functions

```javascript
class PaymentProcessor extends Helper {
  async takeMoney(fromSource, options = {}) {
    await this.provider.charge(fromSource, options) 
  }

  async putItInMyVault() {
    const { runtime: business } = this
    await this.provider.deposit(business.settings.paymentProcessing)
  }
}
```

Same with the `ReservationSystems`

```javascript
class ReservationSystems extends Helper {
  async initialize() {
    const { runtime: business }  = this
    const { restaurant } = this.options
    await this.provider.configureFor(restaurant, business)
  }

  async updateAvailability() {
    const { restaurant } = this.options
    await this.provider.updateAvailability(restaurant.openTables)
  }

  async takeReservation(params = {}) {
    await this.provider.takeReservation(params)
  }

  async actuallyKeepReservation() {
    await this.provider.doYourJob()
  }
}
```

So overtime my portfolio of components might grow to look like 

```
  - src/
    - payment-processors/
      - braintree/
        - package.json
      - stripe/
        - package.json
      - paypal
        - package.json
    - reservation-systems/
      - opentable
        - package.json
      - what-else-is-there/
        - package.json
```

Each of the subfolders of my helpers -- braintree, stripe, opentable, whatever else -- are referred to as providers.  They're different modules that implement the Helper's provider type interface.  How they do it under the hood doesn't matter, but as a business owner who needs these integrations I can just farm them out and use them when they're ready. 

Which payment processor i use doesn't matter as much as the fact that i actually take payments. Which reservation system doesn't really matter as long as I actually keep the reservation instead of just taking it.

The specifics of which one or the other are important, but this style of organization helps us put them in the right conceptual layer that matches the concepts I need to be thinking about to succeed in this domain. 

At the end of the day if I'm conducting business on the internet, with a website, or a mobile app, or a chat bot -- all of these technical layers are going to be represented.  

It pays to be clear and intentional about which code lives where, and for the names of the important things in the software to match how the people who need the software think and talk about it.  I learned this from [Domain Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)