// using this as an enum
var MS_GAME_STATE = {
    PLAYING : 0,
    COMPLETED : 1,
    EXPLODED : 2
};

function Coordinates(row, col) {
    "use strict";
    this.x = function () {
        return row;
    };
    this.y = function () {
        return col;
    };
}

// using this as an enum
var MS_TILE_STATE = {
    SAFE : 0,
    MINE : 1
};

function Tile(row, col, row_px, col_px) {
    "use strict";
    var state = MS_TILE_STATE.SAFE,
        clicked = false,
        coords = new Coordinates(row, col);

    this.minedNeighbors = 0;

    this.coordinates = function () {
        return coords;
    };

    this.isMine = function () {
        return (state === MS_TILE_STATE.MINE);
    };

    this.setMine = function () {
        state = MS_TILE_STATE.MINE;
    };

    this.reveal = function () {
        if (!clicked) {
            clicked = true;
            return true;
        }
        return false;
    };

    this.click = function () {
        if (state === MS_TILE_STATE.MINE) {
            return false;
        }
        return this.reveal();
    };

    this.draw = function (drawingContext) {
        if (!clicked) {
            return;
        }
        if (state === MS_TILE_STATE.SAFE) {
            drawingContext.fillText(this.minedNeighbors.toString(), row_px, col_px);
        } // we wont ever call draw for state == MS_TILE_STATE.MINE in a clicked state
    };
}

function getCursorCoordinates(e, canvas, rows, cols, tile_size) {
    "use strict";
    /*jslint browser:true */
    var x, y;
    if (e.pageX !== undefined && e.pageY !== undefined) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    x = Math.min(x, cols * tile_size);
    y = Math.min(y, rows * tile_size);
    return new Coordinates(Math.floor(y / tile_size), Math.floor(x / tile_size));
}

function MineSweeper(num_rows, num_cols, num_mines, num_lives) {
    "use strict";
    /*jslint browser:true */
    var state = MS_GAME_STATE.PLAYING,
        num_tiles = num_rows * num_cols,
        num_revealed = 0,
        tile_size = 60,
        row_pixels = num_cols * tile_size + 1,
        col_pixels = num_rows * tile_size + 1,
        that = this,
        canvasElement = document.createElement("canvas"),
        drawingContext = canvasElement.getContext("2d"),
        grid = new Array(num_rows),
        num_mines_to_set = num_mines,
        num_available = num_tiles,
        probability = num_mines_to_set / num_available,
        i,
        j,
        validTile = function (row, col) {
            return (row >= 0 && col >= 0 && row < num_rows && col < num_cols);
        },
        neighbors = function (tile) {
            var coords = tile.coordinates(),
                row = coords.x(),
                col = coords.y(),
                neighbor_tiles = [];
            if (validTile(row, col + 1)) { neighbor_tiles.push(grid[row][col + 1]); }
            if (validTile(row + 1, col + 1)) { neighbor_tiles.push(grid[row + 1][col + 1]); }
            if (validTile(row + 1, col)) { neighbor_tiles.push(grid[row + 1][col]); }
            if (validTile(row + 1, col - 1)) { neighbor_tiles.push(grid[row + 1][col - 1]); }
            if (validTile(row, col - 1)) { neighbor_tiles.push(grid[row][col - 1]); }
            if (validTile(row - 1, col - 1)) { neighbor_tiles.push(grid[row - 1][col - 1]); }
            if (validTile(row - 1, col)) { neighbor_tiles.push(grid[row - 1][col]); }
            if (validTile(row - 1, col + 1)) { neighbor_tiles.push(grid[row - 1][col + 1]); }
            return neighbor_tiles;
        },
        allClicked = function () {
            return (num_revealed + num_mines >= num_tiles);
        },
        revealNeighbors = function (tile) {
            var neighboring_tiles = neighbors(tile);
            neighboring_tiles.forEach(function (neighbor) {
                var new_reveal = neighbor.reveal();
                if (new_reveal) {
                    num_revealed += 1;
                }
            });
        },
        drawTiles = function () {
            grid.forEach(function (row) {
                row.forEach(function (col) {
                    col.draw(drawingContext);
                });
            });
        },
        draw = function () {
            var x, y;
            drawingContext.clearRect(0, 0, col_pixels, row_pixels);
            drawingContext.beginPath();
            for (x = 0; x < row_pixels; x += tile_size) {
                drawingContext.moveTo(x + 0.5, 0);
                drawingContext.lineTo(x + 0.5, col_pixels);
            }
            for (y = 0; y < col_pixels; y += tile_size) {
                drawingContext.moveTo(0, y + 0.5);
                drawingContext.lineTo(row_pixels, y + 0.5);
            }

            drawingContext.strokeStyle = "#ccc";
            drawingContext.stroke();
            drawTiles();
        };

    canvasElement.id = "minesweeper";
    canvasElement.width = row_pixels;
    canvasElement.height = col_pixels;
    drawingContext.font = "bold 12px sans-serif";
    drawingContext.textAlign = "center";
    drawingContext.textBaseline = "middle";
    document.body.appendChild(canvasElement);

    for (i = 0; i < num_rows; i += 1) {
        grid[i] = new Array(num_cols);
        for (j = 0; j < num_cols; j += 1) {
            grid[i][j] = new Tile(i, j, j * tile_size + tile_size / 2, i * tile_size + tile_size / 2);
            if ((i > 0 || j > 0) && Math.random() < probability) {
                grid[i][j].setMine();
                num_mines_to_set -= 1;
                num_available -= 1;
            } else {
                num_available -= 1;
            }
            probability = num_mines_to_set / num_available;
        }
    }

    for (i = 0; i < num_rows; i += 1) {
        for (j = 0; j < num_cols; j += 1) {
            neighbors(grid[i][j]).forEach(function (tile) {
                if (tile.isMine()) {
                    grid[i][j].minedNeighbors += 1;
                }
            });
        }
    }

    this.start = function () {
        this.click(0, 0);
        draw();
    };

    this.click = function (row, col) {
        if (!validTile(row, col)) {
            return false;
        }
        var tile = grid[row][col],
            valid = tile.click();
        if (valid === false) {
            return valid;
        }
        num_revealed += 1;
        if (tile.minedNeighbors === 0) {
            revealNeighbors(tile);
        }
        if (allClicked()) {
            state = MS_GAME_STATE.COMPLETED;
        }
    };

    canvasElement.addEventListener("click", function (e) {
        var c = getCursorCoordinates(e, canvasElement, num_rows, num_cols, tile_size);
        that.click(c.x(), c.y());
        draw();
    });

}


