'use strict'
var gElBestTime = document.querySelector('.best-time')
var gBestTime = localStorage.getItem('bestTime')
if (!gBestTime) {
    gElBestTime.style.opacity = 0 + '%'
} else gElBestTime.innerText = `BEST TIME: ${gBestTime}`

var gGame = {
    isOn: false,
    livesRemain: 3,
    hintsRemain: 3,
    safeClicksRemain: 3,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gLevel = {
    SIZE: 8,
    MINES: 12
};

var gBoard
var gPositions = []
var gElResetBtn = document.querySelector('.reset-btn')
var gTimerInterval
var gElTimer = document.querySelector('.timer')
var gIsFirstClick
var gElLivesRemain = document.querySelector('.lives')
var gHeartPx
var gElHintsRemain = document.querySelector('.hints-remain')
var gHintsPx
var gIsHintOn
var gIsSafeClickOn
var gElSafeClick = document.querySelector('.safe-click-btn')
var gIsSetManualMode
var gIsManulModeOn
var gManualModeMinesRemain
var gUndoCells

function initGame() {
    gPositions = createPositions()
    gGame.isOn = false
    gIsFirstClick = false
    gIsHintOn = false
    gIsSafeClickOn = false
    gIsSetManualMode = false
    gIsManulModeOn = false
    gManualModeMinesRemain = gLevel.MINES
    gGame.livesRemain = 3
    gHeartPx = 96
    gElLivesRemain.style.width = gHeartPx + 'px'
    gGame.hintsRemain = 3
    gHintsPx = 96
    gElHintsRemain.style.width = gHintsPx + 'px'
    gGame.safeClicksRemain = 3
    gElSafeClick.innerText = 'SAFE: 3'
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
    gElResetBtn.style.backgroundImage = 'url(img/reset.png)'
    gBoard = buildBoard()
    renderBoard(gBoard)
    clearInterval(gTimerInterval)
    gElTimer.innerText = '000'
    gUndoCells = []
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
    var cellPosSplit = elCell.id.split('-')
    var pos = { i: +cellPosSplit[1], j: +cellPosSplit[2] }
    var currCell = gBoard[pos.i][pos.j]

    if (gIsSetManualMode) {
        setManualMines(pos)
        return
    }

    if (!gIsFirstClick) {
        setFirstClick(pos)
    } else if (!gGame.isOn
        || gIsSafeClickOn
        || currCell.isShown
        || currCell.isMarked) {
        return
    } else if (gIsHintOn) {
        revealNegs(pos.i, pos.j)
        return
    }

    if (currCell.isMine) {
        gBoard[pos.i][pos.j].isShown = true
        renderCell(pos, 'open')
        gGame.markedCount++
        minusLives(pos)
        checkGameOver(pos)
        checkVictory()
        gUndoCells.push(pos)
    } else if (currCell.minesAroundCount === 0 && !currCell.isMine) {
        expandShown(pos.i, pos.j)
    } else {
        gBoard[pos.i][pos.j].isShown = true
        renderCell(pos, 'open')
        gGame.shownCount++
        checkVictory()
        gUndoCells.push(pos)
    }

}

function setFirstClick(firstPos) {
    getFirstPos(firstPos)
    if (!gIsManulModeOn) setMines(gBoard, firstPos)
    setMinesNegsCount(gBoard)
    setTimer()
    gIsFirstClick = true
    gGame.isOn = true
}

function getFirstPos(firstPos) {
    for (var i = 0; i < gPositions.length; i++) {
        if (gPositions[i].i === firstPos.i && gPositions[i].j === firstPos.j) {
            gPositions.splice(i, 1)
        }
    }
}

function setMines(gBoard, firstPos) {
    var emptyPositions = setEmptyAround(firstPos)
    for (var i = 0; i < emptyPositions.length; i++) {
        var pos = emptyPositions[i]
        for (var j = 0; j < gPositions.length; j++) {
            if (pos.i === gPositions[j].i && pos.j === gPositions[j].j) {
                gPositions.splice(j, 1)
            }
        }
    }

    for (var i = 0; i < gLevel.MINES; i++) {
        var randPos = drawPos(gPositions)
        gBoard[randPos.i][randPos.j].isMine = true
        renderCell(randPos, 'mine')
    }
}

function setEmptyAround(firstPos) {
    var emptyPositions = []
    for (var i = firstPos.i - 1; i <= firstPos.i + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = firstPos.j - 1; j <= firstPos.j + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            if (i === firstPos.i && j === firstPos.j) continue
            var pos = { i, j }
            emptyPositions.push(pos)
        }
    }
    return emptyPositions
}

function setMinesNegsCount(gBoard) {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j]
            if (!cell.isMine) {
                cell.minesAroundCount = countMinesAround(i, j)
                var cellPos = { i, j }
                renderCell(cellPos, `open${cell.minesAroundCount}`)
            }
        }
    }
}

function countMinesAround(Ipos, Jpos) {
    var minesAroundCount = 0
    for (var i = Ipos - 1; i <= Ipos + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = Jpos - 1; j <= Jpos + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            if (i === Ipos && j === Jpos) continue
            var cell = gBoard[i][j]
            if (cell.isMine) {
                minesAroundCount++
            }
        }
    }
    return minesAroundCount
}

function expandShown(Ipos, Jpos) {
    var recordedMoves = []
    for (var i = Ipos - 1; i <= Ipos + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = Jpos - 1; j <= Jpos + 1; j++) {
            if (j < 0 || j > gBoard.length - 1) continue
            var cell = gBoard[i][j]
            if (cell.minesAroundCount >= 0 && !cell.isShown && !cell.isMine) {
                gBoard[i][j].isShown = true
                gGame.shownCount++
                checkVictory()
                var cellPos = { i, j }
                renderCell(cellPos, 'open')
                recordedMoves.push(cellPos)
                if (cell.minesAroundCount === 0) expandShown(cellPos.i, cellPos.j)
            }
        }
    }
    gUndoCells.push(recordedMoves)
}

function cellMarked(elCell) {
    var cellPosSplit = elCell.id.split('-')
    var pos = { i: +cellPosSplit[1], j: +cellPosSplit[2] }
    var cell = gBoard[pos.i][pos.j]

    if (!gGame.isOn) return
    if (!cell.isShown) {
        elCell.classList.toggle('flag')
        if (!cell.isMarked) {
            gBoard[pos.i][pos.j].isMarked = true
            gGame.markedCount++
        } else {
            gBoard[pos.i][pos.j].isMarked = false
            gGame.markedCount--
        }
    }
    checkVictory()
}

function checkVictory() {
    if (gGame.shownCount === (gLevel.SIZE ** 2) - gLevel.MINES
        && gGame.markedCount === gLevel.MINES) setVictory()
}

function setVictory() {
    gElResetBtn.style.backgroundImage = 'url(img/victory.png)'
    clearInterval(gTimerInterval)
    setBestTime()
    gGame.isOn = false
}

function setBestTime() {
    var newBestTime = gGame.secsPassed
    if (!gBestTime || newBestTime < gBestTime) {
        localStorage.setItem('bestTime', newBestTime)
        gElBestTime.innerText = `BEST TIME: ${newBestTime}`
        gElBestTime.style.opacity = 100 + '%'
    }
}

function minusLives(pos) {
    gHeartPx -= 32
    gElLivesRemain.style.width = gHeartPx + 'px'
    gGame.livesRemain--
    if (gGame.livesRemain === 0) {
        setGameOver(pos)
    }
}

function checkGameOver(pos) {
    var count = 0
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine && gBoard[i][j].isShown) count++
            if (count === gLevel.MINES) setGameOver(pos)
        }
    }
}

function setGameOver(pos) {
    gGame.isOn = false
    renderCell(pos, 'death')
    showAllMines()
    gElResetBtn.style.backgroundImage = 'url(img/dizzy.png)'
    clearInterval(gTimerInterval)
}

function showAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine) {
                var pos = { i, j }
                renderCell(pos, 'open')
            }
        }
    }
}

function setTimer() {
    gGame.secsPassed = 0
    gTimerInterval = setInterval(() => {
        gGame.secsPassed++
        if (gGame.secsPassed < 10) gElTimer.innerText = '00' + gGame.secsPassed
        else if (gGame.secsPassed >= 10 && gGame.secsPassed < 100) gElTimer.innerText = '0' + gGame.secsPassed
        else if (gGame.secsPassed === 999) clearInterval(gTimerInterval)
        else gElTimer.innerText = gGame.secsPassed
    }, 1000)
}

function setHintOn() {
    if (!gIsFirstClick || gIsHintOn || gGame.hintsRemain === 0 || !gGame.isOn) return
    gIsHintOn = true
    gHintsPx -= 32
    gElHintsRemain.style.width = gHintsPx + 'px'
    gGame.hintsRemain--
}

function revealNegs(Ipos, Jpos) {
    var negs = []
    for (var i = Ipos - 1; i <= Ipos + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = Jpos - 1; j <= Jpos + 1; j++) {
            if (j < 0 || j > gBoard.length - 1) continue
            if (gBoard[i][j].isShown) continue
            var cell = { i, j }
            negs.push(cell)

            var elCell = document.querySelector(`#cell-${i}-${j}`)
            elCell.style.border = 'yellow solid 2px'
            elCell.classList.add('open')
            setTimeout(() => {
                closeNegs(negs)
            }, 1000)
        }
    }
}

function closeNegs(negs) {
    for (var i = 0; i < negs.length; i++) {
        var cell = negs.pop()
        var elCell = document.querySelector(`#cell-${cell.i}-${cell.j}`)
        elCell.style.border = 'none'
        elCell.classList.remove('open')
    }
    gIsHintOn = false
}

function setSafeClickOn() {
    if (!gIsFirstClick || gIsSafeClickOn || gGame.safeClicksRemain === 0 || !gGame.isOn) return
    gIsSafeClickOn = true
    findRandomCell()
    gGame.safeClicksRemain--
    gElSafeClick.innerText = `SAFE: ${gGame.safeClicksRemain}`
}

function findRandomCell() {
    var safeCells = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (!gBoard[i][j].isShown && !gBoard[i][j].isMine) {
                var cell = { i, j }
                safeCells.push(cell)
            }
        }
    }
    var randPos = drawPos(safeCells)
    showRandomCell(randPos)
}

function showRandomCell(randPos) {
    var elCell = document.querySelector(`#cell-${randPos.i}-${randPos.j}`)
    elCell.style.border = 'yellow solid 2px'
    elCell.classList.add('open')
    setTimeout(() => {
        elCell.style.border = 'none'
        renderCellRemoveClass(randPos, 'open')
        gIsSafeClickOn = false
    }, 2000)
}

function setManualMode() {
    if (gIsFirstClick) return
    var elManualMode = document.querySelector('.manual-mode')
    var elMinesRemain = document.querySelector('.mines-remain')
    elManualMode.style.display = 'block'
    elMinesRemain.innerText = `Mines Remain: ${gManualModeMinesRemain}`
    gIsSetManualMode = true
    openCells()
}

function openCells() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var pos = { i, j }
            renderCell(pos, 'open')
        }
    }
}

function setManualMines(pos) {
    if (gBoard[pos.i][pos.j].isMine) return
    gManualModeMinesRemain--
    var elManualMode = document.querySelector('.manual-mode')
    var elMinesRemain = document.querySelector('.mines-remain')
    elMinesRemain.innerText = `Mines Remain: ${gManualModeMinesRemain}`

    gBoard[pos.i][pos.j].isMine = true
    renderCell(pos, 'mine')

    if (gManualModeMinesRemain === 0) {
        elMinesRemain.innerText = 'LETS GO!'
        setTimeout(() => {
            elManualMode.style.display = 'none'
            closeCells()
        }, 1500)
        gIsSetManualMode = false
        gIsManulModeOn = true
    }
}

function closeCells() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var pos = { i, j }
            var elCell = document.querySelector(`#cell-${pos.i}-${pos.j}`)
            elCell.classList.remove('open')
        }
    }
}

function setUndo() {
    if (gUndoCells.length === 0 || !gGame.isOn) return
    if (gUndoCells[gUndoCells.length - 1].length === undefined) closeUndoCell()
    else closeUndoCells()
}

function closeUndoCell() {
    var pos = gUndoCells.pop()
    gBoard[pos.i][pos.j].isShown = false
    if (!gBoard[pos.i][pos.j].isMine) gGame.shownCount--
    renderCellRemoveClass(pos, 'open')
}


function closeUndoCells() {
    var moves = gUndoCells.pop()
    for (var i = 0; i < moves.length; i++) {
        var pos = moves[i]
        gBoard[pos.i][pos.j].isShown = false
        gGame.shownCount--
        renderCellRemoveClass(pos, 'open')
    }
}

