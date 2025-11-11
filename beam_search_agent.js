function occupiedOnBoard(board, type, x, y, dir) {
    let collision = false;
    eachblock(type, x, y, dir, function (bx, by) {
        if (bx < 0 || bx >= nx || by < 0 || by >= ny || board[bx][by]) {
            collision = true;
        }
    });
    return collision;
}

function getDropPositionOnBoard(board, type, dir, x) {
    if (occupiedOnBoard(board, type, x, 0, dir)) {
        return -1;
    }

    let y = 0;
    while (!occupiedOnBoard(board, type, x, y + 1, dir)) {
        y++;
        if (y >= ny) break;
    }

    if (occupiedOnBoard(board, type, x, y, dir)) {
        return -1;
    }

    return y;
}

//clear full lines on a simulated board
function clearLinesOnBoard(board) {
    for (let y = ny - 1; y >= 0; y--) {
        let full = true;
        for (let x = 0; x < nx; x++) {
            if (!board[x][y]) {
                full = false;
                break;
            }
        }
        if (full) {
            //shift everything above down
            for (let yy = y; yy > 0; yy--) {
                for (let x = 0; x < nx; x++) {
                    board[x][yy] = board[x][yy - 1];
                }
            }
            // lear top row
            for (let x = 0; x < nx; x++) {
                board[x][0] = 0;
            }
            //re-check same row after collapsing
            y++;
        }
    }
}

//simulate placing piece
function simulateMove(board, pieceType, dir, x) {
    const y = getDropPositionOnBoard(board, pieceType, dir, x);
    if (y < 0) {
        return null;
    }
    const newBoard = copyBlocks(board);
    let invalid = false;
    eachblock(pieceType, x, y, dir, function (bx, by) {
        if (bx < 0 || bx >= nx || by < 0 || by >= ny || newBoard[bx][by]) {
            invalid = true;
        }
    });
    if (invalid) return null;
    eachblock(pieceType, x, y, dir, function (bx, by) {
        newBoard[bx][by] = pieceType;
    });
    //simulating possible line clears
    clearLinesOnBoard(newBoard);
    return { board: newBoard, x, y, dir };
}

// all legal moves for pieceType on a given board
function getPossibleMovesOnBoard(board, pieceType) {
    const moves = [];
    for (let dir = 0; dir < 4; dir++) {
        for (let x = -3; x < nx; x++) {
            const move = simulateMove(board, pieceType, dir, x);
            if (move) {
                moves.push(move);
            }
        }
    }
    return moves;
}

// helpers for tie-breaking
function getMaxHeight(board) {
    let maxH = 0;
    for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) {
            if (board[x][y]) {
                const h = ny - y;
                if (h > maxH) maxH = h;
                break;
            }
        }
    }
    return maxH;
}

function getMinHeight(board) {
    let minH = ny;
    for (let x = 0; x < nx; x++) {
        let h = 0;
        for (let y = 0; y < ny; y++) {
            if (board[x][y]) {
                h = ny - y;
                break;
            }
        }
        if (h < minH) {
            minH = h;
        }
    }
    return (minH === ny) ? 0 : minH;
}

function beamSearchMove(currentPiece, nextPieceType, width = 5, depth = 2) {
    let states = [{
        board: copyBlocks(blocks),
        score: 0,
        maxH: getMaxHeight(blocks),
        minH: getMinHeight(blocks),
        firstMove: null
    }];
    const pieceTypes = [currentPiece.type];
    if (nextPieceType) pieceTypes.push(nextPieceType);
    const maxDepth = Math.min(depth, pieceTypes.length);
    for (let d = 0; d < maxDepth; d++) {
        const type = pieceTypes[d];
        const newStates = [];
        for (const state of states) {
            const moves = getPossibleMovesOnBoard(state.board, type);

            for (const move of moves) {
                const moveScore = evaluateBoard(move.board);
                const totalScore = state.score + moveScore;
                const maxH = getMaxHeight(move.board);
                const minH = getMinHeight(move.board);
                newStates.push({
                    board: move.board,
                    score: totalScore,
                    maxH,
                    minH,
                    firstMove: d === 0
                        ? { x: move.x, y: move.y, dir: move.dir }
                        : state.firstMove
                });
            }
        }

        if (!newStates.length) break;

        newStates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score; // better score
            if (a.maxH !== b.maxH)   return a.maxH - b.maxH;   // lower max height
            return b.minH - a.minH;                           // higher min height
        });
        states = newStates.slice(0, width);
    }
    if (!states.length) return null;
    let best = states[0];
    for (const s of states) {
        if (
            s.score > best.score ||
            (s.score === best.score && s.maxH < best.maxH) ||
            (s.score === best.score && s.maxH === best.maxH && s.minH > best.minH)
        ) {
            best = s;
        }
    }
    return best.firstMove;
}