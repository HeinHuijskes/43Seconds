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

#### Additions by Hein
Changes to the base game from `https://github.com/TheMardy/ThirtySeconds`:
 - Translated from Dutch to English
 - Removed timer before a turn (due to a bug when clicking "next" multiple times)
 - Changed to 43 seconds
 - Changed categories to be specific to Dies 43
 - Added python csv parser for words lists
 - Removed excess texts and such
 - Other things that I forgot
 
## Developing, Building and running in production mode

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
