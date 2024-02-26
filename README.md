# Thirty Seconds
[![Version](https://badgen.net/github/release/themardy/ThirtySeconds)](https://github.com/TheMardy/ThirtySeconds/releases)

Implemented as responsive PWA (Progressive Web App)
Fun game to play with friends.
Check it out: [https://thirtyseconds.mardy.tk](https://thirtyseconds.mardy.tk)

Note: Currently the app's language is Dutch only

## Images
Home                        |           Score         |     Guess   |
:-------------------------:|:-------------------------:|:------------:
![](https://raw.githubusercontent.com/TheMardy/ThirtySeconds/master/images/Home.png "Home screen") | ![](https://raw.githubusercontent.com/TheMardy/ThirtySeconds/master/images/Overview.png "Overview screen") | ![](https://raw.githubusercontent.com/TheMardy/ThirtySeconds/master/images/Guess.png "Guess screen")

Time Up                        |           Select         |     Score   |
:-------------------------:|:-------------------------:|:------------:
![](https://raw.githubusercontent.com/TheMardy/ThirtySeconds/master/images/TimeUp.png "Time up screen") | ![](https://raw.githubusercontent.com/TheMardy/ThirtySeconds/master/images/SelectionScreen.png "Selection screen") | ![](https://raw.githubusercontent.com/TheMardy/ThirtySeconds/master/images/Overview2.png "Overview screen")


## Contributing
All contributions are welcome

If you have something to add - anything from a typo through to a whole new feature, please create a pull request or issue.
 
## Developing, Building and running in production mode

#### Addition by Hein
##### If you get an error similar to 
```
Package subpath './compiler.js' is not defined by "exports" in {path to temp/node_modules/svelte/package.json}
```
##### Then navigate to ```package.json```, and change the value of ```"rollup-plugin-svelte"``` to ```"^6.1.1",```. Then run ```npm install``` again.

##### After cloning, install all NPM packages:
```bash
npm i
```

##### To run the app in development mode: (automatic rebuilds)
```bash
npm run dev
```

##### To create an optimised version of the app:

```bash
npm run build
```
The app can then be found in the /public folder.
