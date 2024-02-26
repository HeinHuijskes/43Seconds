<script>
    import {currentGameScreen, getCurrentPlayer, currentFiveWords, getCurrentTeam } from '../stores/stores.js'
	import TimeUp from './TimeUp.svelte'
	import { fly } from 'svelte/transition';

    let turnSecondsLeft = 43;

    let gameTimer = setInterval(function(){
            if(turnSecondsLeft <= 1){
                goToTimeUp();
            } else {
                turnSecondsLeft -= 1;
            }
        }, 1000);

    function goToTimeUp() {
        clearInterval(gameTimer);
        currentGameScreen.set(TimeUp);
    }

    function endTurnPress() {
        if (confirm('Are you sure you want to end your turn?')) {
            goToTimeUp();
        } 
    }
</script>


<div class="vertical-center" in:fly>
    <div class="container-fluid">
        <div class="row justify-content-center pt-3">
            <div class="col-12 mb-5 text-center">
                <h5 class="c-white mb-0">{getCurrentTeam().name}</h5>
                <h5 class="c-white">{getCurrentPlayer().name}</h5>
            </div>
        </div>
        <div class="row justify-content-center pt-3">
            <div class="col-12 mb-5 text-center">
                <h5 class="c-white">{turnSecondsLeft}</h5>
            </div>
        </div>
        <div class="row justify-content-center pt-3">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card">
                    <div class="card-body text-center c-purple border border-secondary m-3">
                        {#each $currentFiveWords as word, i}
                        {#if i == 4}
                        <h4 class="">{word}</h4>
                        {:else}
                        <h4 class="mb-3">{word}</h4>
                        {/if}
                        {/each}
                    </div>
                </div>
            </div>
        </div>
        <div class="row justify-content-center pt-5">
            <div class="col-8 col-lg-3 mb-3">
                <div class="card bg-blue" on:click="{() => endTurnPress()}">
                    <div class="py-2 text-center">
                        <h2 class="c-white mb-0">End Turn <i class="fas fa-chevron-right"></i></h2>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
    
<style>

</style>