//----------------------------------------------VARIABLES/OBJECTS------------------------------------------//
let dungeon = {};
let dungeonStart = {};
let dungeonEnd = {};
let players = {};

//object used to trigger animation of the player. this object is emitted to the server every time a user interacts with keyboard, mouse or swipe gestures
let playersMovement = {
    left: false,
    right: false,
    up: false,
    down: false
};


//----------------------------------------------IMAGES------------------------------------------//

//image are being loaded up in this section of the code
const tilesImage = new Image();
tilesImage.src = "dungeon_tiles.png";

const characterImage = new Image();
characterImage.src = "SpriteSheet.png";

//----------------------------------------------CONNECTION------------------------------------------//
const socket = io.connect("http://localhost:8081");

//----------------------------------------------EVENT HANDLERS------------------------------------------//
socket.on("dungeon data", function (data) {
    dungeon = data.dungeon;
    dungeonStart = data.startingPoint;
    dungeonEnd = data.endingPoint;
});


//this listens for the timer message upon receiving it three new variables are made each contains hour or minutes or seconds which are then
//used to display time using getElementById. three variables are used to display time in the correct format
socket.on("timer", function (data) {
    let hour = Math.floor(data/3600);
    let minutes = Math.floor((data-hour*3600)/60);
    let seconds= data - (hour * 3600 + minutes * 60);
    document.getElementById("timer").innerHTML = "Timer: " + minutes + ":" + seconds;
});

//listens for the message state and upon receiving this message properties of playerState (object that is received) is assigned to players.
socket.on('state', function (playersState) {
     players = playersState;
});

//when this message is received level number are displayed using getElementById
socket.on('level', function (levels) {
    document.getElementById("level").innerHTML = "Level " + levels;
});


//----------------------------------------------FUNCTIONS + COLLISION------------------------------------------//

function identifySpaceType(x, y) {

    let returnObject = {
        spaceType: "",
        tilesetX: 0,
        tilesetY: 0,
        tilesizeX: 16,
        tilesizeY: 16
    };

    let canMoveUp = false;
    let canMoveLeft = false;
    let canMoveRight = false;
    let canMoveDown = false;

    if (x - 1 >= 0 && dungeon.maze[y][x - 1] > 0) {
        canMoveLeft = true;
    }
    if (x + 1 < dungeon.w && dungeon.maze[y][x + 1] > 0) {
        canMoveRight = true;
    }
    if (y - 1 >= 0 && dungeon.maze[y - 1][x] > 0) {
        canMoveUp = true;
    }
    if (y + 1 < dungeon.h && dungeon.maze[y + 1][x] > 0) {
        canMoveDown = true;
    }

    if (canMoveUp && canMoveRight && canMoveDown && canMoveLeft) {
        returnObject.spaceType = "all_exits";
        returnObject.tilesetX = 16;
        returnObject.tilesetY = 16;
    }
    else if (canMoveUp && canMoveRight && canMoveDown) {
        returnObject.spaceType = "left_wall";
        returnObject.tilesetX = 0;
        returnObject.tilesetY = 16;
    }
    else if (canMoveRight && canMoveDown && canMoveLeft) {
        returnObject.spaceType = "up_wall";
        returnObject.tilesetX = 16;
        returnObject.tilesetY = 0;
    }
    else if (canMoveDown && canMoveLeft && canMoveUp) {
        returnObject.spaceType = "right_wall";
        returnObject.tilesetX = 32;
        returnObject.tilesetY = 16;
    }
    else if (canMoveLeft && canMoveUp && canMoveRight) {
        returnObject.spaceType = "down_wall";
        returnObject.tilesetX = 16;
        returnObject.tilesetY = 32;
    }
    else if (canMoveUp && canMoveDown) {
        returnObject.spaceType = "vertical_corridor";
        returnObject.tilesetX = 144;
        returnObject.tilesetY = 16;
    }
    else if (canMoveLeft && canMoveRight) {
        returnObject.spaceType = "horizontal_corridor";
        returnObject.tilesetX = 112;
        returnObject.tilesetY = 32;
    }
    else if (canMoveUp && canMoveLeft) {
        returnObject.spaceType = "bottom_right";
        returnObject.tilesetX = 32;
        returnObject.tilesetY = 32;
    }
    else if (canMoveUp && canMoveRight) {
        returnObject.spaceType = "bottom_left";
        returnObject.tilesetX = 0;
        returnObject.tilesetY = 32;
    }
    else if (canMoveDown && canMoveLeft) {
        returnObject.spaceType = "top_right";
        returnObject.tilesetX = 32;
        returnObject.tilesetY = 0;
    }
    else if (canMoveDown && canMoveRight) {
        returnObject.spaceType = "top_left";
        returnObject.tilesetX = 0;
        returnObject.tilesetY = 0;
    }
    return returnObject;
}

//----------------------------------------------TOUCH EVENTS + MOSUE + KEYBOARD CONTROLS------------------------------------------//


//startAnimating function is defined here
$(document).ready(function () {
    startAnimating(60);

//TOUCH CONTROLS
    $(document).on({
// following functions are used for the swipe gestures, when a function is triggered a member of the object playersMovement is made true depending on which function is called
        //after this the object is emitted to server, the member which was made true is made false again as we do not want the character to keep moving
        swipeup: function () {
            playersMovement.up = true;
            socket.emit("movement", playersMovement);
            playersMovement.up = false;
            down = false;
            left = false;
            up = true;
            right = false;
        },

        swipedown: function () {
            playersMovement.down = true;
            socket.emit("movement", playersMovement);
            playersMovement.down = false;
            down = true;
            left = false;
            up = false;
            right = false;
        },
        swiperight: function () {
            playersMovement.right = true;
            socket.emit("movement", playersMovement);
            playersMovement.right = false;
            down = false;
            left = false;
            up = false;
            right = true;
        },
        swipeleft: function () {
            playersMovement.left = true;
            socket.emit("movement", playersMovement);
            playersMovement.left = false;
            down = true;
            left = true;
            up = false;
            right = false;
        }

    });

// MOUSE CONTROLS

    //the following code is used  player movement using on screen buttons and they work exactly the same way as touch event mentioned above
    $('#Up').click(function () {
        playersMovement.up = true;
        socket.emit("movement", playersMovement);
        playersMovement.up = false;
        down = false;
        left = false;
        up = true;
        right = false;
        freeze = false;

    });

    $('#Down').click(function () {
        playersMovement.down = true;
        socket.emit("movement", playersMovement);
        playersMovement.down = false;
        down = true;
        left = false;
        up = false;
        right = false;
        freeze = false;


    });

    $('#Left').click(function () {
        playersMovement.left = true;
        socket.emit("movement", playersMovement);
        playersMovement.left = false;
        down = true;
        left = true;
        up = false;
        right = false;
        freeze = false;

    });

    $('#Right').click(function () {
        playersMovement.right = true;
        socket.emit("movement", playersMovement);
        playersMovement.right = false;
        down = false;
        left = false;
        up = false;
        right = true;
        freeze = false;
    });

//KEYBOARD FUNCTIONALITY

    //this part of the code is used to move the character using buttons and it works exactly the same as swipe gestures mentioned above
    $("body").keydown(function (arrowKeys) {
        let keyPressed = arrowKeys.which;

        if(keyPressed === 40) //down
        {
            playersMovement.down = true;
            socket.emit("movement", playersMovement);
            playersMovement.down = false;
            down = true;
            left = false;
            up = false;
            right = false;
            freeze = false;


        }
        else if(keyPressed === 38) //up
        {
            playersMovement.up = true; //boolean
            socket.emit("movement", playersMovement);// sends the message to the server
            playersMovement.up = false;
            down = false;
            left = false;
            up = true;
            right = false;
            freeze = false;
        }
        else if(keyPressed === 37) //left
        {
            playersMovement.left = true;
            socket.emit("movement", playersMovement);
            playersMovement.left = false;
            down = true;
            left = true;
            up = false;
            right = false;
            freeze = false;
            console.log(freeze +" mmmmm")
        }
        else if(keyPressed === 39) //right
        {
            playersMovement.right = true;
            socket.emit("movement", playersMovement);
            playersMovement.right = false;
            down = false;
            left = false;
            up = false;
            right = true;
            freeze = false;
        }
    });

});

//----------------------------------------------VARIABLES + BOOLEANS ------------------------------------------//

let fpsInterval;
let then;
let framesPerSecond = 0; //used to animate the player
let sx = 0; //sx position of the sprite image
let sy = 0; //sy position of the sprite image
let left = false; //used to trigger left animation
let right = false; //used to trigger right character animation
let up = false; //used to trigger character up animation
let down = false; //used to trigger character down animation
let freeze = true;
/*
 * The startAnimating function kicks off our animation (see Games on the Web I - HTML5 Graphics and Animations).
 */

//----------------------------------------------Animation ------------------------------------------//

function startAnimating(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    let now = Date.now();
    let elapsed = now - then;

    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        let canvas = $("canvas").get(0);
        let context = canvas.getContext("2d");
        let cellWidth = canvas.width / dungeon.w;
        let cellHeight = canvas.height / dungeon.h;
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let x = 0; x < dungeon.w; x++) {
            for (let y = 0; y < dungeon.h; y++) {
                if (dungeon.maze[y][x] > 0)
                {
                    let tileInformation = identifySpaceType(x, y);
                    context.drawImage(tilesImage, tileInformation.tilesetX, tileInformation.tilesetY, tileInformation.tilesizeX, tileInformation.tilesizeY, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                }
                else
                {
                    context.fillStyle = "black";
                    context.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight
                    );
                }
            }
        }
        context.drawImage(tilesImage, 16, 80, 16, 16, dungeonStart.x * cellWidth, dungeonStart.y * cellHeight, cellWidth, cellHeight);
        context.drawImage(tilesImage, 224, 80, 16, 16, dungeonEnd.x * cellWidth, dungeonEnd.y * cellHeight, cellWidth, cellHeight);
        framesPerSecond = framesPerSecond + 2; //this variable is to run the animation using if statements below


        // this loop is run as many times as the number of the socket ids this is to draw each player
        for (let id in players) {
        // player object is created and each time its given the properties of the players object of a different socket id every time the loop is run
            let player = players[id];

            if (player.animationLeft)
            {
                sy = 1250;
            }

            else if (player.animationRight)
            {
                sy = 600;
            }

            else if (player.animationUp)
            {
                sy = 1850;
            }
            else
            {
                sx = 0;
                sy = 25;
            }

            //this code creates a text player which is used to uniquely identify each player
            context.font = "15px Verdana";
            let gradient = context.createLinearGradient(200, 10, (player.x-0.75) * cellWidth, 0);
            gradient.addColorStop("0","yellow");
            gradient.addColorStop("0.25", "green");
            gradient.addColorStop("0.5", "white");
            gradient.addColorStop("0.75", "orange");
            gradient.addColorStop("1.0", "purple");
            context.fillStyle = gradient;
            context.fillText("Player" + players[id].no,(player.x-0.5) * cellWidth, player.y * (cellHeight -1) );

            // if ( freeze == true)
            // {
            //
            //     if (right == true && left == false && up == false && down == false) {
            //         sx = 460;
            //         sy = 600;
            //         context.drawImage(characterImage, sx, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            //     }
            //     if (up == true && left == false && right == false && down == false)
            //     {
            //         sx = 460;
            //         sy = 1850;
            //         context.drawImage(characterImage, sx, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            //     }
            //     if (down == true && up == false && left == false && up == false)
            //     {
            //         sx = 460;
            //         sy = 30;
            //         context.drawImage(characterImage, sx, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            //     }
            //
            //     context.drawImage(characterImage, sx, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            //
            // }
            //
            // else {
            //     sx = 0;
            // }
            //
            // // if (player.down == true)
            // // {
            // //     sy = 30;
            // // }
            //
            //
            //
            // console.log(left);
            //
            //
            // if (framesPerSecond > 0 && framesPerSecond < 21)
            // {
            //     context.drawImage(characterImage, sx, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            // else if (framesPerSecond > 20 && framesPerSecond < 41)
            // {
            //     context.drawImage(characterImage, sx + 460, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            // else if (framesPerSecond > 40 && framesPerSecond < 61)
            // {
            //     context.drawImage(characterImage, sx + 920, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            // else if (framesPerSecond > 60 && framesPerSecond < 81)
            // {
            //     context.drawImage(characterImage, sx, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            // else if (framesPerSecond > 80 && framesPerSecond < 101)
            // {
            //     context.drawImage(characterImage, sx + 460, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            // else if (framesPerSecond > 100 && framesPerSecond < 121)
            // {
            //     context.drawImage(characterImage, sx + 920, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            // else if (framesPerSecond > 120 && framesPerSecond < 141)
            // {
            //     context.drawImage(characterImage, sx, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            // else if (framesPerSecond > 140 && framesPerSecond < 161)
            // {
            //     context.drawImage(characterImage, sx + 460, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            // else if (framesPerSecond > 160 && framesPerSecond < 181)
            // {
            //     context.drawImage(characterImage, sx + 920, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            // }
            //
            // else
            // {
            //     context.drawImage(characterImage, sx + 1380, sy, 460, 560, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            //     framesPerSecond = 2;
            //     freeze = true;
            // }



            //this is where each character being drawn and animated
            if (framesPerSecond < 30)
            {
                context.drawImage(characterImage, sx, sy + 25, 460, 550, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            }
            else if (framesPerSecond < 40)
            {
                context.drawImage(characterImage, sx + 460, sy + 25, 460, 570, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            }
            else if (framesPerSecond < 60)
            {
                context.drawImage(characterImage, sx + 920, sy + 25, 460, 570, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            }
            else if (framesPerSecond < 80)
            {
                context.drawImage(characterImage, sx + 1380, sy + 25, 460, 570, player.x * cellWidth, player.y * cellHeight, cellWidth, cellHeight);
            }
            else
            {
                framesPerSecond = 2; //this set back to 2 so the animation is endless
            }

        }
    }
}