<script>
    import {currentGameScreen, game, localStorage , prevGameScreen} from '../stores/stores.js'
	import InterimScore from './InterimScore.svelte'
    import Settings from './Settings.svelte';
    import { fly } from 'svelte/transition';
	import Toast from './Toast.svelte'
    import {interActief} from '../stores/wordsDatabase.js';

    let interActiefSelect = true;

    function startGame() {
        let wordsDatabase = [];
        if(interActiefSelect) {
            wordsDatabase = wordsDatabase.concat(interActief);
        }

        if(wordsDatabase.length > 1) {
            $game.words = wordsDatabase;
            $localStorage.setItem('game', JSON.stringify($game));
            prevGameScreen.set(InterimScore);
            currentGameScreen.set(InterimScore);
        } else {
            window.pushToast("Select a minimum of 1 category");
        }
    }
    
</script>

<div class="" in:fly>
    <div class="container-fluid pt-2">
        <div class="row mb-3">
            <div class="col-12">
                <div class="float-end" on:click="{() => currentGameScreen.set(Settings)}">
                    <i class="c-white fas fa-cog"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="vertical-center">
        <div class="container-fluid">
            <div class="row justify-content-center pt-3">
                <div class="col-12 col-md-8 col-lg-6 mb-5 text-center">
                    <h1 class="c-white mb-0">Choose Categories</h1>
                </div>
            </div>

            <div class="row justify-content-center pt-3 mb-3">
                <div class="col-12 col-md-8 col-lg-6 mb-3">
                    <div class="card bg-blue" on:click="{() => startGame()}">
                        <div class="card-body text-center">
                            <h2 class="c-white">Start Game</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row justify-content-center">
                <div class="col-12 col-sm-8 col-lg-5 mb-3">
                    <div class="card">
                        <div class="card-body c-purple text-center">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="check1" bind:checked={interActiefSelect}>
                                <label class="form-check-label" for="check1">
                                    <i class="fas fa-book"></i> Inter-<i>Actief</i> <small class="float-right">({interActief.length})</small>
                                </label>
                                <!-- <span class="float-end"><a href="mailto:mardy@hdlv.nl?subject=Words - Algemene Kennis&body=Hoi, ik wil graag woorden toevoegen aan de Algemene Kennis lijst \n\n Mijn naam (Leeg = Anoniem): \n Woorden: \n"><i class="fas fa-plus-square"></i></a></span> -->
                            </div>
                            <hr class="mt-0">
                            <p class="my-0">A mix of all things, events, and people that make up Inter-<i>Actief</i>!</p>
                        </div>
                    </div>
                </div>
            </div>

           
        
        </div>
    </div>
</div>
<Toast />

<style>
   .form-check {
        font-size: 20px;
   }
  
</style>