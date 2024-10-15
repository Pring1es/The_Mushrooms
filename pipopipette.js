//paramètres du jeu
const DELAY_END = 130; //seconds until a new game starts
const FPS = 30; // frames per second
let GRID_SIZE = parseInt(prompt("Changer la taille de la grile")); // nombre de colonnes et de lignes TODO: let it change by the player

const HEIGHT = 550; //pixels-

//dimensions proportionnelle
const WIDTH = HEIGHT * 0.9;
const CELL = WIDTH / (GRID_SIZE + 2); //size of cells (and left and right margin)
const STROKE = CELL / 12; // stroke width
const DOT = STROKE; // dot radius
const MARGIN = HEIGHT - (GRID_SIZE + 1) * CELL; // top margin for score, names, etc

//couleurs
const COLOR_BOARD = "#fbf2c4";
const COLOR_BORDER = "black";
const COLOR_PLAY2 = "#018373";
const COLOR_PLAY2_LIT = "#7ebb9c";
const COLOR_DOT = "black";
const COLOR_PLAY1 = "#bb2c1e";
const COLOR_PLAY1_LIT = "#da724d";
const COLOR_TIE = "black";

//TEXT
const TEXT_PLAY1 = "Player 1";
const TEXT_PLAY1_SML = "Play 1";
const TEXT_PLAY2 = "Player 2";
const TEXT_PLAY2_SML = "Play 2";
const TEXT_SIZE_CELL = CELL / 3; // size of text
const TEXT_SIZE_TOP = MARGIN / 6;
const TEXT_TIE = "DRAW!";
const TEXT_WIN = "WINS!";
const NEW_GAME = "Recommencer"; // TODO: Bouton accueil et bouton Recommencer
const GO_HOME = "Accueil";

//definitions
const Side = {
	BOT: 0,
	LEFT: 1,
	RIGHT: 2,
	TOP: 3,
};

// mise en place du canva pour le jeu
let canv = document.createElement("canvas");
canv.height = HEIGHT;
canv.width = WIDTH;
document.body.appendChild(canv); // definir la boîte de jeu
let canvRect = canv.getBoundingClientRect();

// mis en place du contexte
let ctx = canv.getContext("2d");
ctx.lineWidth = STROKE;
ctx.textAlign = "center"; // replacer le texte quand le square est filled
ctx.textBaseline = "middle";

// game variables
let currentCells, playersTurn, squares;
let scorePlay1, scorePlay2;
let timeEnd;

// start a new game
newGame();

// event handlers
canv.addEventListener("mousemove", highlightGrid);
canv.addEventListener("click", click);

// mis en place de la boucle du jeu
setInterval(loop, 4000 / FPS);

function loop() {
	drawBoard();
	drawSquares();
	drawGrid();
	drawScores();
}

function click(/** @type {MouseEvent} */ ev) {
	if (/*!playersTurn || */ timeEnd > 0) {
		return; //not allowing player to play when the it's other turn.
	}
	selectSide();
}

function drawBoard() {
	ctx.fillStyle = COLOR_BOARD;
	ctx.strokeStyle = COLOR_BORDER;
	ctx.fillRect(0, 0, WIDTH, HEIGHT); //création du rectangle
	ctx.strokeRect(STROKE / 2, STROKE / 2, WIDTH - STROKE, HEIGHT - STROKE);
}

function drawDot(x, y) {
	ctx.fillStyle = COLOR_DOT;
	ctx.beginPath();
	ctx.arc(x, y, DOT, 0, Math.PI * 2);
	ctx.fill();
}

function drawGrid() {
	for (let i = 0; i < GRID_SIZE + 1; i++) {
		for (let j = 0; j < GRID_SIZE + 1; j++) {
			drawDot(getGridX(j), getGridY(i));
		}
	}
}

function drawLine(x0, y0, x1, y1, color) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.stroke();
}

function drawScores() {
	//score who get bold when it's your turn
	let colPlay2 = playersTurn ? COLOR_PLAY2_LIT : COLOR_PLAY2;
	let colPlay1 = playersTurn ? COLOR_PLAY1 : COLOR_PLAY1_LIT;
	drawText(TEXT_PLAY1, WIDTH * 0.25, MARGIN * 0.25, colPlay1, TEXT_SIZE_TOP); // the names
	drawText(scorePlay1, WIDTH * 0.25, MARGIN * 0.6, colPlay1, TEXT_SIZE_TOP * 2); // the score
	drawText(TEXT_PLAY2, WIDTH * 0.75, MARGIN * 0.25, colPlay2, TEXT_SIZE_TOP); // the names
	drawText(scorePlay2, WIDTH * 0.75, MARGIN * 0.6, colPlay2, TEXT_SIZE_TOP * 2); // the score

	// game over text
	if (timeEnd > 0) {
		timeEnd--;

		// handle a tie
		if (scorePlay2 == scorePlay1) {
			drawText(TEXT_TIE, WIDTH * 0.5, MARGIN * 0.6, COLOR_TIE, TEXT_SIZE_TOP); // the score
		} else {
			let playerWins = scorePlay1 > scorePlay2;
			let color = playerWins ? COLOR_PLAY1 : COLOR_PLAY2;
			let text = playerWins ? TEXT_PLAY1 : TEXT_PLAY2;
			drawText(text, WIDTH * 0.5, MARGIN * 0.5, color, TEXT_SIZE_TOP);
			drawText(TEXT_WIN, WIDTH * 0.5, MARGIN * 0.7, color, TEXT_SIZE_TOP);
		}

		// new game
		if (timeEnd == 0) {
			newGame();
		}
	}
}

function drawSquares() {
	for (let row of squares) {
		for (let square of row) {
			square.drawSides();
			square.drawFill();
		}
	}
}

function drawText(text, x, y, color, size) {
	ctx.fillStyle = color;
	ctx.font = size + "px dejavu sans mono";
	ctx.fillText(text, x, y);
}

function getText(player, small) {
	if (player) {
		return small ? TEXT_PLAY1_SML : TEXT_PLAY1;
	} else {
		return small ? TEXT_PLAY2_SML : TEXT_PLAY2;
	}
}

function getColor(player, light) {
	if (player) {
		return light ? COLOR_PLAY1_LIT : COLOR_PLAY1;
	} else {
		return light ? COLOR_PLAY2_LIT : COLOR_PLAY2;
	}
}

function getGridX(col) {
	return CELL * (col + 1);
}
function getGridY(row) {
	return MARGIN + CELL * row;
}

function highlightGrid(/** @type {MouseEvent} */ ev) {
	if (/*!playersTurn || */ timeEnd > 0) {
		return; //detect mouse movement during the end game
	}

	// get mouse position relative to the canvas
	let x = ev.clientX - canvRect.left;
	let y = ev.clientY - canvRect.top;

	// highlight the square's side
	highlightSide(x, y);
}

function highlightSide(x, y) {
	// clear previous highlighting
	for (let row of squares) {
		for (let square of row) {
			square.highlight = null;
		}
	}

	//check each cell

	let rows = squares.length;
	let cols = squares[0].length;
	currentCells = [];
	OUTER: for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			if (squares[i][j].contains(x, y)) {
				//highlight current
				let side = squares[i][j].highlightSide(x, y);
				if (side != null) {
					currentCells.push({ row: i, col: j });
				}
				// determine neighbour. to not highlight twice
				let row = i,
					col = j,
					highlight,
					neighbour = true;
				if (side == Side.LEFT && j > 0) {
					col = j - 1;
					highlight = Side.RIGHT;
				} else if (side == Side.RIGHT && j < cols - 1) {
					col = j + 1;
					highlight = Side.LEFT;
				} else if (side == Side.TOP && i > 0) {
					row = i - 1;
					highlight = Side.BOT;
				} else if (side == Side.BOT && i < rows - 1) {
					row = i + 1;
					highlight = Side.TOP;
				} else {
					neighbour = false;
				}

				// highlight neighbour
				if (neighbour) {
					squares[row][col].highlight = highlight;
					currentCells.push({ row: row, col: col });
				}

				// no need to continue
				break OUTER;
			}
		}
	}
}

function selectSide() {
	if (currentCells == null || currentCells.length == 0) {
		return;
	}
	//select the side(s)
	let filledSquare = false;
	for (let cell of currentCells) {
		if (squares[cell.row][cell.col].selectSide()) {
			filledSquare = true;
		}
	}
	currentCells = [];

	//check for winner
	if (filledSquare) {
		if (scorePlay1 + scorePlay2 == GRID_SIZE * GRID_SIZE) {
			// check winner
			timeEnd = Math.ceil(DELAY_END * FPS); // game over, Start another game
		}
	} else {
		playersTurn = !playersTurn; // ii I win it's still my turn
	}
}

function newGame() {
	currentCells = [];
	playersTurn = Math.random() >= 0.5;
	scorePlay1 = 0;
	scorePlay2 = 0;
	timeEnd = 0;

	// set up the squares
	squares = [];
	for (let i = 0; i < GRID_SIZE; i++) {
		squares[i] = [];
		for (let j = 0; j < GRID_SIZE; j++) {
			squares[i][j] = new Square(getGridX(j), getGridY(i), CELL, CELL);
		}
	}
}

// creation des carré avec les lignes grâce à un objet
function Square(x, y, w, h) {
	this.w = w;
	this.h = h;
	this.bot = y + h;
	this.left = x;
	this.right = x + w;
	this.top = y;
	this.highlight = null;
	this.numSelected = 0;
	this.owner = null; //owner of the square
	this.sideBot = { owner: null, selected: false }; //to know who's turn it is depending of owner of the side
	this.sideLeft = { owner: null, selected: false };
	this.sideRight = { owner: null, selected: false };
	this.sideTop = { owner: null, selected: false };

	this.contains = function (x, y) {
		return x >= this.left && x < this.right && y >= this.top && y < this.bot;
	};

	this.drawFill = function () {
		if (this.owner == null) {
			return;
		} // To fill
		// light background
		ctx.fillStyle = getColor(this.owner, true);
		ctx.fillRect(
			this.left + STROKE,
			this.top + STROKE,
			this.w - STROKE * 2,
			this.h - STROKE * 2, // fill owned square with a bit of margin
		);

		//TODO text player owner
		drawText(
			getText(this.owner, true),
			this.left + this.w / 2,
			this.top + this.h / 2,
			getColor(this.owner, false),
			TEXT_SIZE_CELL,
		);
	};

	this.drawSide = function (side, color) {
		switch (side) {
			case Side.BOT:
				drawLine(this.left, this.bot, this.right, this.bot, color);
				break;
			case Side.LEFT:
				drawLine(this.left, this.top, this.left, this.bot, color);
				break;
			case Side.RIGHT:
				drawLine(this.right, this.top, this.right, this.bot, color);
				break;
			case Side.TOP:
				drawLine(this.left, this.top, this.right, this.top, color);
				break;
		}
	};

	this.drawSides = function () {
		//highlighting
		if (this.highlight != null) {
			this.drawSide(this.highlight, getColor(playersTurn, true));
		}

		//selected sides
		if (this.sideBot.selected) {
			this.drawSide(Side.BOT, getColor(this.sideBot.owner, false));
		}
		if (this.sideLeft.selected) {
			this.drawSide(Side.LEFT, getColor(this.sideLeft.owner, false));
		}
		if (this.sideRight.selected) {
			this.drawSide(Side.RIGHT, getColor(this.sideRight.owner, false));
		}
		if (this.sideTop.selected) {
			this.drawSide(Side.TOP, getColor(this.sideTop.owner, false));
		}
	};

	this.highlightSide = function (x, y) {
		// calculate the distances to each side
		let dBot = this.bot - y;
		let dLeft = x - this.left;
		let dRight = this.right - x;
		let dTop = y - this.top;

		// determine closest value
		let dClosest = Math.min(dBot, dLeft, dRight, dTop);

		//highlight the closest if not already selected
		if (dClosest == dBot && !this.sideBot.select) {
			this.highlight = Side.BOT;
		} else if (dClosest == dLeft && !this.sideLeft.select) {
			this.highlight = Side.LEFT;
		} else if (dClosest == dRight && !this.sideRight.select) {
			this.highlight = Side.RIGHT;
		} else if (dClosest == dTop && !this.sideTop.select) {
			this.highlight = Side.TOP;
		}

		// return the highlighted side
		return this.highlight;
	};

	this.selectSide = function () {
		if (this.highlight == null) {
			return;
		}

		// select the highlighted side
		switch (this.highlight) {
			case Side.BOT:
				this.sideBot.owner = playersTurn;
				this.sideBot.selected = true;
				break;
			case Side.LEFT:
				this.sideLeft.owner = playersTurn;
				this.sideLeft.selected = true;
				break;
			case Side.RIGHT:
				this.sideRight.owner = playersTurn;
				this.sideRight.selected = true;
				break;
			case Side.TOP:
				this.sideTop.owner = playersTurn;
				this.sideTop.selected = true;
				break;
		}

		this.highlight = null; //no longer need it. We already assigned the highlited turn

		// increase the number of selected
		// if the number of selected sides = 4 we'll set the owner of the bow as the last on who selected it.
		this.numSelected++;
		if (this.numSelected == 4) {
			this.owner = playersTurn;

			//increment score
			if (playersTurn) {
				scorePlay1++;
			} else {
				scorePlay2++;
			}

			// filled
			return true;
		}

		// not filled.
		return false;
	};
}
