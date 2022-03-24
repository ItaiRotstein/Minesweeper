'use strict'

var gGame = {
    isOn: false,
    livesRemain: 3,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gLevel = {
    SIZE: 4,
    MINES: 2
};

var gBoard
var gTimerInterval
var gIsFirstClick = false
var gElLivesRemain = document.querySelector('.lives')
var gHeartPx

function initGame() {
    gGame.isOn = false
    gIsFirstClick = false
    gGame.livesRemain = 3
    gHeartPx = 96
    gElLivesRemain.style.width = gHeartPx + 'px'
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
    var elResetBtn = document.querySelector('.resetBtn')
    elResetBtn.style.backgroundImage = 'url(img/reset.png)'
    gBoard = buildBoard()
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
    clearInterval(gTimerInterval)
}

var isClicked = false

function selectLevel(selectBtn) {
    gLevel.SIZE = +selectBtn.dataset.size
    gLevel.MINES = +selectBtn.dataset.mines
    initGame()
}

function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = creatCell()
            board[i][j] = cell
        }
    }
    //Set random mines
    for (var i = 0; i < gLevel.MINES; i++) {
        var randPos = { i: getRandomInt(0, gLevel.SIZE), j: getRandomInt(0, gLevel.SIZE) }
        while (board[randPos.i][randPos.j].isMine) {
            randPos = { i: getRandomInt(0, gLevel.SIZE), j: getRandomInt(0, gLevel.SIZE) }
        }
        board[randPos.i][randPos.j].isMine = true
    }
    return board;
}

function creatCell() {
    var cell = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false
    }
    return cell
}

function cellClicked(elCell) {
    //If user clicked first cell
    if (!gIsFirstClick) {
        getTimer()
        gIsFirstClick = true
        gGame.isOn = true
    } else if (!gGame.isOn) {
        return
    }
    //
    var cellPosSplit = elCell.id.split('-')
    var pos = { i: +cellPosSplit[1], j: +cellPosSplit[2] }
    var cell = gBoard[pos.i][pos.j]

    if (!cell.isMine && !cell.isMarked && !cell.isShown) {
        cell.isShown = true
        gGame.shownCount++
        checkVictory()
    } else if (cell.isMine && !cell.isShown) {
        cell.isShown = true
        gGame.markedCount++
        if (gGame.markedCount === gLevel.MINES) gameOver(elCell)
        minusLives(elCell)
    }

    if (cell.minesAroundCount === 0 && !cell.isMine) expandShown(pos.i, pos.j)

    if (elCell.classList.contains('flag')) return
    if (elCell.classList.contains('close')) {
        elCell.classList.remove('close')
        elCell.classList.add('open')
    }
}

function expandShown(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            var cell = gBoard[i][j]
            if (cell.minesAroundCount >= 0 && !cell.isShown && !cell.isMine) {
                cell.isShown = true
                gGame.shownCount++
                checkVictory()
                var cellPos = { i, j }
                // expandShown(cellPos.i, cellPos.j)
                renderCell(cellPos)
            }
        }
    }
}

function cellMarked(elCell) {
    var cellPosSplit = elCell.id.split('-')
    var pos = { i: +cellPosSplit[1], j: +cellPosSplit[2] }
    var cell = gBoard[pos.i][pos.j]
    if (!cell.isShown) {
        elCell.classList.toggle('flag')
        if (!cell.isMarked) {
            cell.isMarked = true
            gGame.markedCount++
        } else {
            cell.isMarked = false
            gGame.markedCount--
        }
    }
    checkVictory()
}
function setMinesNegsCount(gBoard) {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j]
            if (!cell.isMine) {
                cell.minesAroundCount = countMinesAround(i, j)
            }
        }
    }
}

function countMinesAround(rowIdx, colIdx) {
    var minesAroundCount = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            var cell = gBoard[i][j]
            if (cell.isMine) {
                minesAroundCount++
            }
        }
    }
    return minesAroundCount
}

function checkVictory() {
    var elResetBtn = document.querySelector('.resetBtn')
    if (gGame.shownCount === (gLevel.SIZE ** 2) - gLevel.MINES
        && gGame.markedCount === gLevel.MINES
        ) {
        elResetBtn.style.backgroundImage = 'url(img/victory.png)'
        clearInterval(gTimerInterval)
    }
}

function minusLives(elCell) {
    gHeartPx -= 32
    gElLivesRemain.style.width = gHeartPx + 'px'
    gGame.livesRemain--
    if (gGame.livesRemain === 0) {
        gameOver(elCell)
    }
}

function gameOver(elCell) {
    gGame.isOn = false
    elCell.classList.add('death')
    renderDeath()
    var elResetBtn = document.querySelector('.resetBtn')
    elResetBtn.style.backgroundImage = 'url(img/dizzy.png)'
    clearInterval(gTimerInterval)
}

function renderDeath() {
    var elCells = document.querySelectorAll('.mine')
    for (var i = 0; i < elCells.length; i++) {
        var cell = elCells[i]
        cell.classList.add('open')
    }
}

function getTimer() {
    var elTimer = document.querySelector('.timer')
    var seconds = 0
    gTimerInterval = setInterval(() => {
        seconds++
        if (seconds < 10) elTimer.innerText = '00' + seconds
        else if (seconds >= 10 && seconds < 100) elTimer.innerText = '0' + seconds
        else if (seconds === 999) clearInterval(gTimerInterval)
        else elTimer.innerText = seconds
    }, 1000)
}

