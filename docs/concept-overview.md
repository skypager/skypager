# Overview via a Socratic Dialogue

> As discussed by Jon Soeder and Andrey Drozd.

Skypager is a monorepo. It is the JavaScript runtime on which all of our apps run, depending on the environment - browser, Node, React Native, or Electron, etc. It allows us to write JavaScript code once and reuse it in multiple environments. Skypager abstracts away the Javascript runtime so that code can talk to Skypager once and then Skypager talks to the appropriate platform/environment. Each of the subfolders (features, servers, runtimes) is like a [yarn workspace](https://yarnpkg.com/lang/en/docs/workspaces/). I'll be using "Skypager" and "runtime" interchangeably throughout this dialogue.

Node Runtime, i.e. [`skypager-runtimes-node`](https://github.com/skypager/skypager-old/tree/master/src/runtimes/node) is the Node runtime, one of the sub-packages of the workspace. Whenever I update the `skypager-runtime` module, any packages that depend on it, e.g. `skypager-runtimes-node` - also gets updated. Same with [feature modules](https://github.com/skypager/skypager-old/tree/master/src/features).

The difference between `skypager-runtime`, `skypager-runtimes-node`, `skypager-runtimes-electron`, etc. is that they each have specific features that get enabled automatically.

**So, when it says `require('skypager-runtimes-node’)` that's referring to [https://github.com/skypager/skypager-old/tree/master/src/runtimes/node](https://github.com/skypager/skypager-old/tree/master/src/runtimes/node)?**

Yes. The Node runtime ships with a bunch of features enabled by default. [See here for the Node ones](https://github.com/skypager/skypager-old/tree/master/src/runtimes/node/features). You can lazy load your own features by having a `skypager.js` script which will get called automatically, and you can do whatever you want.

The main idea is that in all of JavaScript, we have special modules — files — that serve as an “entry point” into the application. It doesn’t matter which environment, OS, browser, or platform, every entry point in a Skypager project should expect to find a global runtime that will tell it the entry point. It’ll tell what environment it’s in — `skypager.env` will tell it what environment it’s been called in. `skypager.argv` will tell it what arguments have been called with it. What URL did I start from? `skypager.cwd` or `skypager.url` — in Node that would a file://URL and `process.cwd()` in the web at http URL.

**So, Skypager is just a wrapper around Node so that we can expand what is able to run on Node? Or another runtime we need?**

Yes - when you’re developing an app, you should be focusing on the interfaces and the user experience. Do you know how in React every component has props, context, and state?

**Yep.**

Every JavaScript process (whether it’s on Node, web, wherever) also has these concepts, just not as cleanly named. React props would be things like `process.argv` or `url.queryString`/`url.path` if you have a router.

React context would be a mix of `process.env`, `process.os`, URL, the dependencies and the `global` object in general. React state would be whatever the program does over time, in theory constantly changing, in some part dependent on the initial props and context.

Skypager brings these implicit categories together and makes them explicitly like React’s model. In our React applications, the global App, initial render / mount point is directly linked to Skypager — it’s like the global root of the tree. The React apps just represents a view.

**So, instead of our React apps using the default root, which is however a standlone React project is setup, they use Skypager. If they were standlone projects, it would mean the React apps would no longer just represent a view. The Skypager runtime provides a wrapper to speaking to Node, along with other functions for other environments.**

Yes. You can render with either `react-dom/server` or `react-dom`. So, when it comes time to server render our apps, which will be soon, the fact that they all talk to Skypager instead of the native browser APIs means it will be a piece of cake.

**I understand it conceptually, but I get lost in the sauce when I'm trying to figure out how a certain function of Skypager, or a custom function built in the app itself, works. For example, I thought `get()` was a function of Skypager, but it is not. Is it from another library?**

`get()` is one of the many Lodash functions used in Skypager. [Lodash](https://lodash.com/) makes it easy to work with arrays, numbers, objects and strings.

All of the core classes in Skypager — Runtime, Feature, and Helper - mix in Lodash. It makes the commands easier to run.

`runtime.get(...args)` instead of `_.get(runtime, ...args)`

`runtime.pick(...args)` instead of `_.pick(runtime, ...args)`

The `chain` Lodash is used heavily (e.g. `runtime.chain.get('currentState').keys().value()`)

**How come Lodash isn't in the package.json of the Node runtime then?**

It’s part of the base module `skypager-runtime`. So, `skypager-runtime` is MobX, Lodash, and a few utilities. The platform specific runtime is skypager-runtime + platform (Node, web, etc.)

**Oh, so like you said that any changes to skypager-runtime affects the environment specific runtimes? The core skypager is skypager-runtime? I see Lodash, etc. in that package.json**

Yes, `skypager-runtimes-node` just imports `skypager-runtime` and extends it.

The other important aspect of the Skypager idea is caching. Skypager can encapsulate other dependencies, e.g. `react`, `react-dom`, `semantic-ui-react`. One example is `skypager-runtimes-react`. We could make `skypager-runtimes-dais`, and have it bundle the SDK and the UI kit. Imagine you have a dozen apps built on top of `skypager-runtimes-dais` — which we will. Once you download that in app 1, you should be able to go to app 2, app 3, app 4 — and only need to download the bundle of code for that app due to the caching of that specific Skypager runtime. All the core dependencies are bundled separately with the runtime. Without this type of construct or constraint in our architecture it would be challenging and pretty ad hoc trying to organize our dependencies.

You can already see it in the `quote-presentation` app, where they import the `lodash` module; that’s like 100k of unnecessary code that is already loaded in the runtime. Over time those kinds of mistakes accumulate. Build/test times get much bigger, download time gets bigger, etc. So, by explicitly having this concept of a runtime, we have a technique for separating our actual important code from the generic dependencies. Any project’s build config will automatically transform `import lodash from 'lodash'` to `const lodash = global.skypager.lodash`

What qualifies as a generic dependency is either straight from npm, or something extremely common to all our apps. If we load these in the runtime, and the runtime is separate from the unique app, then the runtime build will survive across multiple app versions — since it is downloaded and cached.

**In regard to the rest of the packages within `skypager/src`, should I just focus on understanding runtime and runtimes only? Or, are there other packages I should look into?**

[Helpers](../helpers/overview.md). Helpers is the 2nd most important concept after runtime.