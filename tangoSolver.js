function toCellKey(r, c) {
    return `${r},${c}`;
}

function parseCell(cell) {
    if (Array.isArray(cell) && cell.length === 2) {
        return [Number(cell[0]), Number(cell[1])];
    }

    if (typeof cell === 'string') {
        const match = cell.match(/-?\d+/g);
        if (match && match.length >= 2) {
            return [Number(match[0]), Number(match[1])];
        }
    }

    if (cell && typeof cell === 'object' && 'r' in cell && 'c' in cell) {
        return [Number(cell.r), Number(cell.c)];
    }

    return null;
}

function normalizeFilledCells(filled_cells) {
    const map = new Map();

    if (Array.isArray(filled_cells)) {
        for (const item of filled_cells) {
            if (Array.isArray(item) && item.length === 2) {
                const cell = parseCell(item[0]);
                const val = Number(item[1]);
                if (cell && (val === 0 || val === 1)) {
                    map.set(toCellKey(cell[0], cell[1]), val);
                }
            } else if (item && typeof item === 'object' && 'cell' in item && 'val' in item) {
                const cell = parseCell(item.cell);
                const val = Number(item.val);
                if (cell && (val === 0 || val === 1)) {
                    map.set(toCellKey(cell[0], cell[1]), val);
                }
            }
        }
        return map;
    }

    if (filled_cells && typeof filled_cells === 'object') {
        for (const [rawKey, rawVal] of Object.entries(filled_cells)) {
            const cell = parseCell(rawKey);
            const val = Number(rawVal);
            if (cell && (val === 0 || val === 1)) {
                map.set(toCellKey(cell[0], cell[1]), val);
            }
        }
    }

    return map;
}

function normalizeConstraints(constraints) {
    if (!Array.isArray(constraints)) {
        return [];
    }

    const result = [];

    for (const pair of constraints) {
        if (!Array.isArray(pair) || pair.length !== 2) {
            continue;
        }

        const a = parseCell(pair[0]);
        const b = parseCell(pair[1]);

        if (a && b) {
            result.push([a, b]);
        }
    }

    return result;
}

function solveTango({
    filled_cells = {},
    equal_constraints = [],
    cross_constraints = [],
    size = 6,
} = {}) {
    const board = Array.from({ length: size }, () => Array(size).fill(null));
    const stack = [];

    const filledMap = normalizeFilledCells(filled_cells);
    const equalConstraints = normalizeConstraints(equal_constraints);
    const crossConstraints = normalizeConstraints(cross_constraints);

    for (const [key, val] of filledMap.entries()) {
        const [r, c] = key.split(',').map(Number);
        if (r >= 0 && r < size && c >= 0 && c < size) {
            board[r][c] = val;
        }
    }

    const emptyCells = [];
    for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
            if (board[r][c] === null) {
                emptyCells.push([r, c]);
            }
        }
    }

    const limitPerValue = Math.floor(size / 2);

    function validateRowsAndColumnsCount(r, c, val) {
        let rowCount = 0;
        let colCount = 0;

        for (let i = 0; i < size; i += 1) {
            if (board[r][i] === val) {
                rowCount += 1;
            }
            if (board[i][c] === val) {
                colCount += 1;
            }
        }

        return rowCount < limitPerValue && colCount < limitPerValue;
    }

    function checkThreeConsecutive(r, c, val) {
        if (c >= 2 && board[r][c - 1] === val && board[r][c - 2] === val) {
            return false;
        }
        if (c <= size - 3 && board[r][c + 1] === val && board[r][c + 2] === val) {
            return false;
        }
        if (c >= 1 && c <= size - 2 && board[r][c - 1] === val && board[r][c + 1] === val) {
            return false;
        }

        if (r >= 2 && board[r - 1][c] === val && board[r - 2][c] === val) {
            return false;
        }
        if (r <= size - 3 && board[r + 1][c] === val && board[r + 2][c] === val) {
            return false;
        }
        if (r >= 1 && r <= size - 2 && board[r - 1][c] === val && board[r + 1][c] === val) {
            return false;
        }

        return true;
    }

    function checkConstraints(r, c, val) {
        for (const [a, b] of equalConstraints) {
            if (r === a[0] && c === a[1]) {
                const neighbor = board[b[0]][b[1]];
                if (neighbor !== null && neighbor !== val) {
                    return false;
                }
            } else if (r === b[0] && c === b[1]) {
                const neighbor = board[a[0]][a[1]];
                if (neighbor !== null && neighbor !== val) {
                    return false;
                }
            }
        }

        for (const [a, b] of crossConstraints) {
            if (r === a[0] && c === a[1]) {
                const neighbor = board[b[0]][b[1]];
                if (neighbor !== null && neighbor === val) {
                    return false;
                }
            } else if (r === b[0] && c === b[1]) {
                const neighbor = board[a[0]][a[1]];
                if (neighbor !== null && neighbor === val) {
                    return false;
                }
            }
        }

        return true;
    }

    function isValid(r, c, val) {
        return (
            validateRowsAndColumnsCount(r, c, val) &&
            checkThreeConsecutive(r, c, val) &&
            checkConstraints(r, c, val)
        );
    }

    function solve(index) {
        if (index === emptyCells.length) {
            return true;
        }

        const [r, c] = emptyCells[index];

        for (const val of [0, 1]) {
            if (isValid(r, c, val)) {
                board[r][c] = val;
                stack.push([r, c, val]);

                if (solve(index + 1)) {
                    return true;
                }

                board[r][c] = null;
                stack.push([r, c, null]);
            }
        }

        return false;
    }

    const solved = solve(0);

    return {
        status: solved ? 'Solved' : 'No solution found',
        stack,
        board: solved ? board : null,
    };
}

module.exports = {
    solveTango,
};
