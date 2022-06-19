<script>
    export let errmessage;
</script>

<div class="card err-box">
    <div class="card-content">
        <div class="content">
            {errmessage}
        </div>
    </div>
</div>

<style>
    .err-box {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.25em;
        letter-spacing: 1px;
        text-align: center;
        background-color: #be5a08;
        color: white;
        box-shadow: 4px 4px 4px 0px grey;
    }
</style>
