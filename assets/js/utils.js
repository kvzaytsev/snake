define(['jquery'], function ($) {

    const
        FIELD_SIZE = 30,
        INITIAL_SNAKE_SIZE = 3;

    return {

        randomInt: function(min=4, max=FIELD_SIZE-5){
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        generateField: function () {
            const cells = Array.apply(null, {length: FIELD_SIZE}).map(Number.call, Number);
            return cells.map((x, j) =>  {
                return {
                    cells:[].concat(cells.map((y)=> {
                        return `${y}-${j}`;
                    }))
                }
            });
        },

        randomCell: function(min, max) {
            return [this.randomInt(min, max), this.randomInt(min, max)];
        },

        randomDirection: function () {
            let direction = this.randomCell(0, 1);
            if (this.cellsEqual(direction,[0,0]) || this.cellsEqual(direction,[1,1])) {
                return this.randomDirection();
            }
            return direction;
        },

        generateApple: function (snake) {
            let cell = this.randomCell();
            if (snake.filter((segment) => this.cellsEqual(cell,segment)).length > 0) {
                return this.generateApple(snake);
            }
            return cell;
        },

        initSnake: function (initDirection) {
            let
                head = this.randomCell(),
                body = [];

            for (let i = 1; i < INITIAL_SNAKE_SIZE; i++ ) {
                body.push([
                    head[0]-initDirection[0]*i,
                    head[1]-initDirection[1]*i
                ]);
            }

            return [head].concat(body);
        },

        cellsEqual: function (c1, c2) {
            return c1[0] === c2[0] && c1[1] === c2[1];
        },

        checkSelfEating: function(snake) {
            let segment, i, l,
                head = snake[0];

            for (i = 1, l = snake.length; i < l; i++) {
                segment = snake[i];
                if (this.cellsEqual(head,segment)) {
                    throw new Bacon.Error("Self-eating");
                }
            }
        },

        checkFieldBorders: function ([hx, hy]) {
            if (hx < 0|| hy < 0 || hx >= FIELD_SIZE || hy >=FIELD_SIZE) {
                throw new Bacon.Error("Out of field borders");
            }
        }
    };
});