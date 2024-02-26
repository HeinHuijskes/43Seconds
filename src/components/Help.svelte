<script>
	import {currentGameScreen, game,  settings, saveSettings, endGame, prevGameScreen, goToHome } from '../stores/stores.js'
    import Home from './Home.svelte'
	import { fly } from 'svelte/transition';
  
    let safari = false;
    let chrome = false;
    let samsungInternet = false;

    let makeTeams = false;
    let startGame = false;

    </script>
    
    <div class="container-fluid pt-2 vh-100" in:fly>
        <div class="row mb-3">
            <div class="col-12">
                <div class="float-end" on:click="{() => currentGameScreen.set(Home)}">
                    <i class="c-white fas fa-times"></i>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12 text-center">
                <h1 class="c-white">Help</h1>
            </div>
        </div>
    
        <div class="container">

            <div class="row justify-content-center">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="row mb-2 justify-content-center">
                                <div class="col-12">
                                    <h3 class="text-center">Install & Update</h3>
                                    <p class="mb-0">This app is installable as a Progressive Web App, such that it is 
                                        usable without internet connection, while receiving updates automatically.
                                    </p>
                                </div>
                            </div>
                            <div class="row justify-content-center">
                                <div class="col-12 text-left">
                                    <hr>
                                    {#if !safari}
                                    <h5 on:click="{() => {safari = !safari}}"><i class="fab fa-apple"></i> Safari <i class="fas float-end d-inline fa-chevron-right"></i></h5>
                                    <hr>
                                    {:else}
                                    <h5 on:click="{() => {safari = !safari}}"><i class="fab fa-apple"></i> Safari <i class="fas float-end d-inline fa-chevron-down"></i></h5>
                                    <hr>
                                    <ol type="1">
                                        <li>CLick on the "sharing" icon</li>
                                        <li>Click on "Put on startscreen"</li>
                                        <li>Click on "Add"</li>
                                    </ol>
                                    {/if}
                                </div>
                            </div>
                            <div class="row justify-content-center">
                                <div class="col-12 text-left">
                                    {#if !chrome}
                                    <h5 on:click="{() => {chrome = !chrome}}"><i class="fab fa-android"></i> Chrome <i class="fas float-end d-inline fa-chevron-right"></i></h5>
                                    <hr>
                                    {:else}
                                    <h5 on:click="{() => {chrome = !chrome}}"><i class="fab fa-android"></i> Chrome <i class="fas float-end d-inline fa-chevron-down"></i></h5>
                                    <hr>
                                    <ol type="1">
                                        <li>Click on the <i class="fas fa-ellipsis-v"></i> icon</li>
                                        <li>Click on "Install app"</li>
                                        <li>Click on "Install"</li>
                                    </ol>
                                    {/if}
                                </div>
                            </div>
                            <div class="row justify-content-center">
                                <div class="col-12 text-left">
                                    {#if !samsungInternet}
                                    <h5 on:click="{() => {samsungInternet = !samsungInternet}}"><i class="fab fa-android"></i> Samsung Internet <i class="fas float-end d-inline fa-chevron-right"></i></h5>
                                    <hr>
                                    {:else}
                                    <h5 on:click="{() => {samsungInternet = !samsungInternet}}"><i class="fab fa-android"></i> Samsung Internet <i class="fas float-end d-inline fa-chevron-down"></i></h5>
                                    <hr>
                                    <ol type="1">
                                        <li>Click on the <i class="fas fa-ellipsis-v"></i> icon</li>
                                        <li>Click on "Add to start screen"</li>
                                    </ol>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row justify-content-center">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="row mb-2 justify-content-center">
                                <div class="col-12">
                                    <h3 class="text-center">Play</h3>
                                    <p class="mb-0">Explanation about how to play 43 seconds
                                    </p>
                                </div>
                            </div>
                            <div class="row justify-content-center">
                                <div class="col-12 text-left">
                                    <hr>
                                    {#if !makeTeams}
                                    <h5 on:click="{() => {makeTeams = !makeTeams}}">1. Create teams <i class="fas float-end d-inline fa-chevron-right"></i></h5>
                                    <hr>
                                    {:else}
                                    <h5 on:click="{() => {makeTeams = !makeTeams}}">1. Create teams <i class="fas float-end d-inline fa-chevron-down"></i></h5>
                                    <hr>
                                    <p class="">
                                        Add a team by filling in the teamname and clicking on the <i class="fas fa-plus-square"></i> button. <br>
                                        Then add the players by clicking on the team, filling in the player name, and clicking the <i class="fas fa-plus-square"></i> 
                                        button. <br> <br>
                                        Note: A team consists of 2 players minimum.
                                    </p>
                                    {/if}
                                </div>
                            </div>
                            <div class="row justify-content-center">
                                <div class="col-12 text-left">
                                    {#if !startGame}
                                    <h5 on:click="{() => {startGame = !startGame}}">2. Start the game <i class="fas float-end d-inline fa-chevron-right"></i></h5>
                                    <hr>
                                    {:else}
                                    <h5 on:click="{() => {startGame = !startGame}}">2. Start the game <i class="fas float-end d-inline fa-chevron-down"></i></h5>
                                    <hr>
                                    <p class="">
                                        When their are at least 2 teams with 2 people, the game can be started by pressing the button "Start game". <br>
                                    </p>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
    </div>
</div>
    
    
    <style>
    
     
    </style>