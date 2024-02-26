<script>
    import { teams, saveTeamsToLocalStorage } from '../stores/homeStores.js'
    
    export let index;

    let playersVisible = false;
    let newTeamMemberName = "";

    class Player {
      constructor(name) {
        this.name = name;
      }
    }
    
    function addPlayer(teamIndex) {
        if(newTeamMemberName.length < 1) {
            window.pushToast("Fill in a player name");
            return;
        }

        let player = new Player(newTeamMemberName);
        $teams[teamIndex].players.push(player);
        //Reactivity
        $teams[teamIndex].players = $teams[teamIndex].players;
        newTeamMemberName = "";
        saveTeamsToLocalStorage();
    }
    function removePlayer(teamIndex, playerIndex) {
        $teams[teamIndex].players.splice(playerIndex, 1);
        //Reactivity
        $teams[teamIndex].players = $teams[teamIndex].players;
        saveTeamsToLocalStorage();
    }
    function removeTeam(teamIndex) {
        $teams.splice(teamIndex, 1);
        //Reactivity
        $teams = $teams;
        saveTeamsToLocalStorage();
    }

</script>

{#if $teams[index].players}
<div class="row justify-content-center">
    <div class="col-12 col-md-8 col-lg-6">
        <div class="card">
            <div class="card-body">
                {#if playersVisible}
                <h3 class="d-inline mb-0 float-start"><div class="d-inline" on:click="{() => {removeTeam(index)}}"><i class="fas fa-trash-alt c-red"></i></div> {$teams[index].name}</h3>
                <h3 class="d-inline mb-0 float-end" on:click="{() => {playersVisible = !playersVisible; saveTeamsToLocalStorage()}}">{$teams[index].players.length || 0} players <i class="fas fa-chevron-down"></i></h3>
                {:else}
                <h3 class="d-inline mb-0 float-start">{$teams[index].name}</h3>
                <h3 class="d-inline mb-0 float-end" on:click="{() => {playersVisible = !playersVisible; saveTeamsToLocalStorage() }}">{$teams[index].players.length || 0} players <i class="fas fa-chevron-right"></i></h3>
                {/if}

                {#if playersVisible}
                <div class="clearfix"></div>
                <hr>
                <div class="row mb-3">
                    <div class="col-8 col-md-10">
                        <input class="form-control" type="text" bind:value="{newTeamMemberName}" placeholder="Player Name">
                    </div>
                    <div class="col-4 col-md-2">
                        <button class="btn bg-blue w-100"
                            on:click="{() => addPlayer(index)}"><i class="fas fa-plus-square c-white"></i></button>
                    </div>
                </div>
                <hr>
                {#each $teams[index].players as player, j}
                <h5 class="mb-0">{player.name} <div class="d-inline float-end" on:click="{() => {removePlayer(index, j)}}"><i class="fas fa-trash-alt float-end c-red"></i></div></h5>
                {#if j != $teams[index].players.length-1}
                <hr>
                {/if}
                {/each}
                {/if}
            </div>
        </div>
    </div>
</div>
{/if}