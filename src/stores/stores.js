import { writable, get } from 'svelte/store';
import Home from '../components/Home.svelte';

const defaultSettings = {pointsToWin: 43};

export const currentGameScreen = writable(null);
export const prevGameScreen = writable(null);
export const game = writable(null);
export const localStorage = writable(null);
export const currentFiveWords = writable(null);
export const settings = writable(defaultSettings);
export function getOrderedTeams() {
    return JSON.parse(JSON.stringify(get(game))).teams.sort(compareTeamPoints);
} 

export function getCurrentPlayer() {
    return getCurrentTeam().players[0];
}
export function getCurrentTeam() {
    const currentTeam = get(game).round % get(game).teams.length;
    return get(game).teams[currentTeam];
}
export function changeCurrentTeamPoints(pointsToChange) {
    const currentTeam = get(game).round % get(game).teams.length;
    get(game).teams[currentTeam].points += pointsToChange;
    saveGame();
}
export function goToNextRound() {
    const currentTeamIndex = get(game).round % get(game).teams.length;
    get(game).round += 1;

    let curTurn = get(game).teams[currentTeamIndex].players[0];
    get(game).teams[currentTeamIndex].players.push(curTurn);
    get(game).teams[currentTeamIndex].players.splice(0, 1);
    saveGame();
}
export function setNextFiveWords() {
    let returnWords = [];
    for(let i = 0; i < 5; i++) {
        const index = Math.floor(Math.random() * Math.floor(get(game).words.length));
        returnWords.push(get(game).words[index]);
        get(game).words.splice(index, 1);
    }
    currentFiveWords.set(returnWords);
}

function saveGame() {
    get(localStorage).setItem('game', JSON.stringify(get(game)));
}

export function setDefaultSettings() {
    settings.set(defaultSettings);
    saveSettings();
}

export function saveSettings() {
    get(localStorage).setItem('settings', JSON.stringify(get(settings)));
}
export function endGame() {
    prevGameScreen.set(Home);
    currentGameScreen.set(Home);
    get(localStorage).removeItem('game');
    game.set(null);
}
export function goToHome() {
    prevGameScreen.set(Home);
    currentGameScreen.set(Home);
}

function compareTeamPoints(a, b) {
    if (a.points > b.points) return -1;
    if (b.points > a.points) return 1;
  
    return 0;
  }