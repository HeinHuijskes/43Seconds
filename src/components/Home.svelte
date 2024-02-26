<script>
    import { onMount } from 'svelte';
	import InterimScore from './InterimScore.svelte'
	import Settings from './Settings.svelte'
	import Toast from './Toast.svelte'
	import Help from './Help.svelte'
	import {currentGameScreen, game, localStorage, settings, prevGameScreen } from '../stores/stores.js'
	import { fly } from 'svelte/transition';
import ChooseListScreen from './ChooseListScreen.svelte';
import HomeTeamsCollapsible from './HomeTeamsCollapsible.svelte';
import { teams, saveTeamsToLocalStorage } from '../stores/homeStores.js'
    
    class Game {
      constructor(teams) {
        this.teams = teams;
        this.round = 0;
        this.started;
        this.words = [];
      }
    }
    
    class Team {
      constructor(name) {
        this.name = name;
        this.players = [];
        this.points = 0;
      }
    }

    onMount(async () => {
        init();
    });
        
    function init() {
        //Recover from Local Storage
        let teamsFromStorage = $localStorage.getItem('teams');
        if(teamsFromStorage != null) {
            teams.set(JSON.parse(teamsFromStorage));
        }
        let gameFromStorage = $localStorage.getItem('game');
        if(gameFromStorage != null) {
            game.set(JSON.parse(gameFromStorage));
        }
        let settingsFromStorage = $localStorage.getItem('settings');
        if(settingsFromStorage != null) {
            settings.set(JSON.parse(settingsFromStorage));
        }
    }
    
    function addTeam() {
        if(newTeamName.length < 1) {
            window.pushToast("Fill in a team name");
            return;
        }

        let team = new Team(newTeamName);
        $teams.push(team);
        //Reactivity
        $teams = $teams;
        newTeamName = "";
        saveTeamsToLocalStorage();
    }
   
    function resetTeams() {
        teams.set([]);
        $localStorage.removeItem('teams');
    }
    function startGame() {

        let canStart = true;
        if($teams.length < 2){
            canStart = false;
            window.pushToast("There must be 2 teams or more to start the game");
            return;
        }

        $teams.forEach(team => {
            if(team.players.length < 2) {
                canStart = false;
                window.pushToast("Team "+team.name+" has less than 2 players");
                return;
            }
        })

        if(canStart) {
            window.clearToasts();
            game.set(new Game($teams));
            $game.started = new Date();
            $localStorage.setItem('game', JSON.stringify($game));
            prevGameScreen.set(ChooseListScreen);
            currentGameScreen.set(ChooseListScreen);
        }
    }
    function resumeGame() {
        window.clearToasts();
        prevGameScreen.set(InterimScore);
        currentGameScreen.set(InterimScore);
    }
    function getResumeGameDateString(dt){
        let m = new Date(dt);
        let h = (m.getUTCHours() + 1)
        if(h.toString().length == 1) h = "0"+h;
        let min = m.getUTCMinutes();
        if(min.toString().length == 1) min = "0"+min;
        let sec =  m.getUTCSeconds();
        if(sec.toString().length==1) sec = "0"+sec;

        return  m.getUTCDate()+"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCFullYear() + " " + h + ":" + min + ":" + sec;
    }
    
    let newTeamName = "";
    
    </script>
    
<div in:fly>
    <div class="container-fluid pt-2">
        <div class="row mb-3">
            <div class="col-12">
                <div class="float-start" on:click="{() => currentGameScreen.set(Help)}">
                    <i class="c-white fas fa-question-circle"></i>
                </div>
                <div class="float-end" on:click="{() => currentGameScreen.set(Settings)}">
                    <i class="c-white fas fa-cog"></i>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12 text-center">
                <h1 class="c-white">43 Seconds</h1>
            </div>
        </div>
    </div>
    <div class="vertical-center">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-12"><h5 class="text-center">Add Team</h5></div>
                                <div class="col-12">
                                    <input class="form-control" type="text" bind:value="{newTeamName}" placeholder="Team Name">
                                </div>
                            </div>
                            <div class="row justify-content-center">
                                <div class="col-12 col-sm-6 col-md-4 mb-2">
                                    <button class="btn bg-blue w-100 c-white"
                                        on:click="{() => addTeam()}"><i class="fas fa-plus-square"></i></button>
                                </div>
                                <div class="col-12 col-sm-6 col-md-4 mb-2">
                                    <button class="btn bg-red w-100 c-white" 
                                        on:click="{() => resetTeams()}"><i class="fas fa-trash-alt"></i> Teams</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    
            {#if $teams.length > 0}
            {#each $teams as team, i}
            <HomeTeamsCollapsible index={i}/>
            {/each}
            {/if}
    
            {#if $game != null}
            <div class="row justify-content-center mt-3">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="card bg-blue" on:click="{() => resumeGame()}">
                        <div class="card-body text-center">
                            <h2 class="c-white mb-0">Resume Game</h2>
                            <span class="c-white">{getResumeGameDateString($game.started)}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/if}

            <div class="row justify-content-center mt-3 mb-3">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="card bg-blue" on:click="{() => startGame()}">
                        <div class="card-body text-center">
                            <h2 class="c-white mb-0">New Game</h2>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

<Toast />
    <style>
      
     
    </style>