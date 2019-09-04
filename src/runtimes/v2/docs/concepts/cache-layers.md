 JavaScript Applications can be designed to be containerized, the way Docker containerizes a server application runtime using cacheable layers ( described line by line in a Dockerfile ) 

Take the following example Dockerfile, which describes a linux server that has node and npm installed,
and can run the npm command, which starts a server which listens on port 3000.

 ```Dockerfile
 FROM node/12
 WORKDIR /app
 EXPOSE 3000
 RUN mkdir /app
 COPY package.json /app
 RUN npm install
 CMD npm start
 ```

The `FROM` line references a unique container that will be found in your docker registry.  In a JavaScript
application this might be like saying give me a browser with `React`, `ReactDOM`, `ReactRouterDOM` already loaded. 

When you build this docker container, it starts from the top.  The `FROM` line requires a decent sized download,
which you only need to pay the cost once.  This line gets generates a `hash` which refers to the layer in the cache.
A layer is like a brand new laptop, the state of the computer when all of the files are the same and nothing has been changed.  Each of the following lines describe a specific change made to the container, and each line gets a new `hash` that is unique.  By the time it gets to the bottom, it tags your container by referencing some cache layer 
by its `hash`.  

You can start as many instances of this container as you want, and supply it with per instance customizations.
 
 Docker can inject environment variables, mount dynamic data at runtime through volume mounts, and a bunch of other things, to combine these cached layers on disk with instance / deployment specific data, files, and configuration. Doing this allows it and create a living running server with its own unique state and configuration, on top of reusable / shared layers that all the containers share. 

 This technology really has revolutionized the way servers are used.

 Everything the frontend needs to use the same ideas already exist today.
 
 JavaScript runtimes (such as the browser and node) can leverage the same ideas, since everything gets bundled as a module and served from a cache, and unique / site / deployment specific settings can be injected into the DOM at the last minute (or loaded from the process in node) before booting the application using the 80% third party cached code and the 20% unique code that is your application.

 Runtime can act as a base container, FROM which you build a unique container that can host any application you write. Each Application is one or more entry points, which are written to take advantage of this runtime architecture.
 
 Imagine a React application

 layer 1:
  - react
  - react-dom
  - react-router-dom

 layer 2:
  - bootstrap css
  - site theme
  - project specific dependencies (e.g. google maps, firebase )

 layer 3:
   - pages / app functionality

 These layers not only represent the dependencies, they're ordered by which ones change the least, and they're grouped in such a way that they can be worked on on independently of the others.
 
 If you're writing a bunch of different applications, they can all share layers 1 & 2 and still be pretty unique. 

 The Helper class defines some type of component module in the application, and the runtime activates these components using common APIs.  This allows us to express entire compositions of module loading and activation in a declarative way (we can even write skypager applications using JSX)

 You can write many different applications and re-use layer 1 and layer 2 as long as they never change, just as Dockerfiles let us share a base ubuntu linux image and spawn 100s of unique servers with their own environments, state, and configuration.