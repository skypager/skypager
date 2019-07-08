# Runtime Concept

Regardless of which framework you are using, if you're using a single page app, or rendering pages on the server, you're probably using some routing DSL (like Express, Hapi, or React-Router, or many others) to declare which URLs map to which pages.  Even if you're building a completely static website, your folder organization is itself a routing DSL.

If you have multiple apps which use the same libraries, chances are most of the project's source trees are very similar to each other.  The code which is different in each app, odds are, can be understood quickest by looking at the routes and seeing which modules are used to render them in response to a user's request.  (If you've used Webpack or any other module bundler, these are your "entry" points.)

Each of the pages in your app, should generally not know or care about how they were rendered.  This is especially true when you want to render a page first on the server, and then let client side JS handle the rest, without changing the code.  

The `runtime` idea exists to provide the code in this top level UX layer with a single object to talk to which behaves the same way regardless of which environment you're running.  It takes care of abstracting the many differences away, so your code can focus on what makes it unique for your user.

Skypager provides a few base runtimes:

- [@skypager/runtime](../src/runtime) - universal platform agnostic base runtime, which provides observable state, and other utilities which are useful in any context
- [@skypager/node](../src/runtimes/node) - the universal runtime extended with node specific features and helpers, used in server side scripts / long running processes (e.g. web or api servers)
- [@skypager/web](../src/runtimes/web) - the browser runtime extended with browser specific features and helpers, used in your browser builds

And the following runtimes are being ported over from older versions of skypager

- [@skypager/electron](../ROADMAP.md) - either the node or web runtime, extended with electron specific libraries and utilities depending if you're in the renderer or main electron process
- [@skypager/native](../ROADMAP.md) - the universal runtime extended with react-native specific features 

The value of this approach means when you're developing React Components, you can have them talk to the runtime instead of the platform.  When you want to re-use this component in another platform or process, it should be no big deal to do so.

Similarly, when you want to reuse these components across different apps which also use the `runtime`, you don't need to make so many changes as your apps will have a uniform pattern for how they get their state.
