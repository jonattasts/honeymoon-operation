# Operação Lua de Mel

A Operação Lua de Mel é uma aplicação interativa desenvolvida com foco em modernizar a tradicional dinâmica de "cortar a gravata" em casamentos. Em vez da abordagem convencional, optamos por uma experiência digital e gamificada, onde os convidados participam de um sorteio online em tempo real.

O objetivo do App é gerenciar a entrada de jogadores e automatizar o sorteio de números, exibindo um ranking de classificação atualizado instantaneamente conforme as dezenas são chamadas.

Tecnologias e Funcionamento: Para garantir alta performance e atualização em tempo real (real-time), a aplicação utiliza o Firebase Firestore como banco de dados NoSQL, permitindo que todos os convidados visualizem o sorteio simultaneamente em seus próprios dispositivos. O frontend foi construído utilizando tecnologias web modernas (JavaScript ES6+, HTML5 e CSS3), garantindo um layout responsivo para smartphones e telões, proporcionando uma experiência fluida, transparente e divertida para celebrar a união de Jhon e Rê.

## Features

• Cadastrar jogador: Permite que o convidado insira seu nome para participar da dinâmica. <br>
• Gerar cartela aleatória: Atribui automaticamente uma tabela de números exclusivos para cada participante cadastrado. <br>
• Acompanhar sorteio em tempo real: Visualização instantânea dos números chamados e marcação automática na cartela do jogador. <br>
• Gerenciar sorteio (Painel do Organizador): Controle centralizado para realizar novos sorteios e atualizar os dados da rodada. <br>
• Ranking de classificação dinâmico: Exibição da pontuação de todos os jogadores em tempo real, destacando quem está mais próximo da vitória. <br>
• Identificar vencedor automaticamente: Sistema de validação que interrompe o jogo e anuncia o ganhador assim que uma linha ou cartela é completada. <br>

## Screens

### Home

<div style="display: flex; flex-direction: row;">
    <img src="./assets/home-1.png" style="height: 480px; margin-right:15px;" />
    <img src="./assets/home-2.png" style="height: 480px; margin-right:15px;" />
     <img src="./assets/home-3.png" style="height: 480px;" />
</div>

<div style="display: flex; flex-direction: row; margin-top: 15px;">
    <img src="./assets/home-4.png" style="height: 480px; margin-right:15px;" />
    <img src="./assets/home-5.png" style="height: 480px; margin-right:15px;" />
    <img src="./assets/home-6.png" style="height: 480px;" />
</div>

### Player

<div style="display: flex; flex-direction: row;">
    <img src="./assets/player-1.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/player-2.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/player-3.png" style="height: 480px;"/>   
</div>

<div style="display: flex; flex-direction: row; margin-top: 15px;">
    <img src="./assets/player-4.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/player-5.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/player-6.png" style="height: 480px;"/>
</div>

<div style="display: flex; flex-direction: row; margin-top: 15px;">
    <img src="./assets/player-7.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/player-8.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/player-9.png" style="height: 480px;"/>
</div>

<div style="display: flex; flex-direction: row; margin-top: 15px;">
    <img src="./assets/player-10.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/player-11.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/player-12.png" style="height: 480px;"/>
</div>

### Organizer

<div style="display: flex; flex-direction: row;">
    <img src="./assets/organizer-1.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/organizer-2.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/organizer-3.png" style="height: 480px;"/>
</div>

<div style="display: flex; flex-direction: row; margin-top: 15px;">
    <img src="./assets/organizer-4.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/organizer-5.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/organizer-6.png" style="height: 480px;"/>
</div>

<div style="display: flex; flex-direction: row; margin-top: 15px;">
    <img src="./assets/organizer-7.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/organizer-8.png" style="height: 480px; margin-right:15px;"/>
    <img src="./assets/organizer-9.png" style="height: 480px;"/>
</div>

## App

<div style="display: flex; flex-direction: row; margin-top: 15px;">
    <div style="margin-right: 15px;">
        <h3>Organizer</h3>
        <img src="./assets/organizer-game.gif" style="height:480px; margin-right:15px;"/>
    </div>
    <div>
        <h3>Player Loses</h3>
        <img src="./assets/player-loses.gif" style="height: 480px; margin-right:15px;" />
    </div>
    <div>
        <h3>Player Wins</h3>
        <img src="./assets/player-wins.gif" style="height: 480px; margin-left:15px;" />
    </div>
</div>
