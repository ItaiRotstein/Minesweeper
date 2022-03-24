'use strict'

function renderBoard(gBoard) {
    var strHTML = `<table>\n<tbody>\n`
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += `<tr>\n`
        for (var j = 0; j < gBoard[0].length; j++) {
            var className = `close`
            var id = `cell-${i}-${j}`
            strHTML += `<td id="${id}" class="${className}" onclick="cellClicked(this)" oncontextmenu="cellMarked(this)"></td>\n`
        }
        strHTML += `</tr>\n`
    }
    strHTML += `</tbody>\n</table>`
    var elContainer = document.querySelector('.game-container')
    elContainer.innerHTML = strHTML
}

function renderCell(cellPos, className) {
    var elCell = document.querySelector(`#cell-${cellPos.i}-${cellPos.j}`)
    elCell.classList.add(className)  
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min)
}

function disableContextMenu(ev) {
    ev.preventDefault()
}

