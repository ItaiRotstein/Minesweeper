'use strict'
var gElBestTime = document.querySelector('.bestTime')
var gBestTime = localStorage.getItem('bestTime')
if (!gBestTime) {
    gElBestTime.innerText = ''
} else gElBestTime.innerText = `BEST TIME: ${gBestTime}`

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
    renderBoard(gBoard)
    clearInterval(gTimerInterval)
}

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
    return board
}

function setMines(gBoard, firstCellPos) {
    for (var i = 0; i < gLevel.MINES; i++) {
        var randPos = { i: getRandomInt(0, gLevel.SIZE), j: getRandomInt(0, gLevel.SIZE) }
        
        while (gBoard[randPos.i][randPos.j].isMine) {
            randPos = { i: getRandomInt(0, gLevel.SIZE), j: getRandomInt(0, gLevel.SIZE) }
        }

        while (randPos.i === firstCellPos.i && randPos.j === firstCellPos.j) {
            randPos = { i: getRandomInt(0, gLevel.SIZE), j: getRandomInt(0, gLevel.SIZE) }
        }
        gBoard[randPos.i][randPos.j].isMine = true
        renderCell(randPos, 'mine')
    }
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
    if (elCell.classList.contains('flag')) return

    var cellPosSplit = elCell.id.split('-')
    var pos = { i: +cellPosSplit[1], j: +cellPosSplit[2] }
    var currCell = gBoard[pos.i][pos.j]

    if (!gIsFirstClick) {
        setFirstClick(pos)
        return
    } else if (!gGame.isOn) return

    if (!currCell.isMine && !currCell.isMarked && !currCell.isShown) {
        gBoard[pos.i][pos.j].isShown = true
        gGame.shownCount++
        checkVictory()
    } else if (currCell.isMine && !currCell.isShown) {
        gBoard[pos.i][pos.j].isShown = true
        gGame.markedCount++
        if (gGame.markedCount === gLevel.MINES) gameOver(elCell)
        minusLives(elCell)
    }

    if (currCell.minesAroundCount === 0 && !currCell.isMine) expandShown(pos.i, pos.j)

    if (elCell.classList.contains('close')) {
        elCell.classList.remove('close')
        elCell.classList.add('open')
    }
}

function setFirstClick(firstCellPos) {
    gBoard[firstCellPos.i][firstCellPos.j].minesAroundCount = 0
    renderCell(firstCellPos, 'open0')
    setMines(gBoard, firstCellPos)
    setMinesNegsCount(gBoard, firstCellPos)
    setTimer()
    expandShown(firstCellPos.i, firstCellPos.j)
    gIsFirstClick = true
    gGame.isOn = true
}

function setMinesNegsCount(gBoard) {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j]
            if (!cell.isMine) {
                cell.minesAroundCount = countMinesAround(i, j)
                var cellPos = { i, j }
                renderCell(cellPos, `open${cell.minesAroundCount}`)
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


function expandShown(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            var cell = gBoard[i][j]
            if (cell.minesAroundCount >= 0 && !cell.isShown && !cell.isMine) {
                gBoard[i][j].isShown = true
                gGame.shownCount++
                checkVictory()
                var cellPos = { i, j }
                renderCell(cellPos, 'open')
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

function checkVictory() {
    var elResetBtn = document.querySelector('.resetBtn')
    if (gGame.shownCount === (gLevel.SIZE ** 2) - gLevel.MINES
        && gGame.markedCount === gLevel.MINES) {
        elResetBtn.style.backgroundImage = 'url(img/victory.png)'
        clearInterval(gTimerInterval)
        setBestTime()
    }
}

function setBestTime() {
    gBestTime = gGame.secsPassed
    localStorage.setItem('bestTime', gBestTime)
    gElBestTime.innerText = `BEST TIME: ${gBestTime}`
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

function setTimer() {
    var elTimer = document.querySelector('.timer')
    gGame.secsPassed = 0
    gTimerInterval = setInterval(() => {
        gGame.secsPassed++
        if (gGame.secsPassed < 10) elTimer.innerText = '00' + gGame.secsPassed
        else if (gGame.secsPassed >= 10 && gGame.secsPassed < 100) elTimer.innerText = '0' + gGame.secsPassed
        else if (gGame.secsPassed === 999) clearInterval(gTimerInterval)
        else elTimer.innerText = gGame.secsPassed
    }, 1000)
}

