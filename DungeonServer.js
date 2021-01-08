//connection
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const DungeonGenerator = require("dungeongenerator");

//variables
let players = {};
let playerNumber = 0;
let levelCount = 0;
let timer = 0;
let playerFontColor;

app.use(express.static("public"));

const mysql = require("mysql");

//sql connection
var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: ''
});

//database connection
connection.connect(function(err) {
    if (err)
    {
        console.log(err);
    }
    else
    {
        console.log("Connected!");
    }
});

//create database
connection.query("CREATE DATABASE IF NOT EXISTS playersInfo;", function(error, result, fields) {
    if (error)
    {
        console.log("Error creating database: " + error.code);
    }
    else if (result)
    {
        console.log("Database created successfully.");
    }
});


connection.query("USE playersInfo;", function(error, result, fields)
{
    if (error)
    {
        console.log("Error setting database: " + error.code);
    }
    else if (result) {
        console.log("Database successfully set.");
    }
});

connection.query("DROP TABLE IF EXISTS playersInfo", function(error, result, fields)
{
    if (error)
    {
        console.log("Problem dropping players table: " + error.code);
    }
    else if (result)
    {
        console.log("Players details dropped successfully.");
    }
});

//tables
var createPlayerTableQuery = "CREATE TABLE playersInfo(";
createPlayerTableQuery += "timeTaken 		INT (4)	,";
createPlayerTableQuery += "levels 			INT (2)	,";
createPlayerTableQuery += "id 		VARCHAR(30)";
createPlayerTableQuery += ")";

connection.query(createPlayerTableQuery, function(error, result, fields)
{

    if (error) {
        console.log("Error creating players table: " + error.code);
    }
    else if (result) {
        console.log("Players table created successfully.");
    }

});



let dungeon = {};
let dungeonStart = {};
let dungeonEnd = {};
const dungeonOptions = {
    dungeon_width: 20,
    dungeon_height: 20,
    number_of_rooms: 7,
    average_room_size: 8
};

function getDungeonData() {
    return {
        dungeon,
        startingPoint: dungeonStart,
        endingPoint: dungeonEnd
    };
}

//sends the timer out to the client
setInterval(function() {
    timer++;
    for(let id in players)
    {
        players[id].playersTimer++;
    }
    io.sockets.emit('timer', timer);
}, 1000);

//sends the players object out to the client
setInterval(function() {
    io.sockets.emit('state', players);
}, 1000 / 60);


//connection
io.on("connection", function (socket) {

    io.sockets.emit('level', levelCount);
    playerNumber++;

    playerFontColor = "#"+((1<<24)*Math.random()|0).toString(16);

    //players object
    players[socket.id] = {
        id: [socket.id],
        x: dungeonStart.x,
        y: dungeonStart.y,
        no: playerNumber,
        color: playerFontColor,
        playersTimer: timer,
        animationUp: false,
        animationLeft: false,
        animationRight: false
    };

    //players doscpnnect
    socket.on('disconnect', function() {
        for(let id in players) {
            io.sockets.emit('state', players);
            if(players[id].no !== 1)
            {
                players[id].no--;

            }
        }

        if(playerNumber === 1){
            timer = -1;
            levelCount = 1;
        }

        playerNumber--;
        delete players[socket.id]; //deletes the players id
        console.log("Player with the id of " + socket.id + " has disconnected - deleting dungeon data...");

    });

    console.log("Player with the id of " + socket.id + " has connected - sending dungeon data...");

    socket.emit("dungeon data", getDungeonData());

    socket.on("movement", function (playersMovement) {


        if (playersMovement.down)
        {
            if (players[socket.id].y + 1 < dungeon.h && dungeon.maze[players[socket.id].y + 1][players[socket.id].x] > 0) {
                players[socket.id].y++;
                players[socket.id].animationUp = false;
                players[socket.id].animationLeft = false;
                players[socket.id].animationRight = false;

            }
        }
        else if(playersMovement.left)
        {
            if (players[socket.id].x - 1 >= 0 && dungeon.maze[players[socket.id].y][players[socket.id].x - 1] > 0) {
                players[socket.id].x--;
                players[socket.id].animationUp = false;
                players[socket.id].animationLeft = true;
                players[socket.id].animationRight = false;
            }
        }
        else if(playersMovement.up)
        {
            if (players[socket.id].y - 1 >= 0 && dungeon.maze[players[socket.id].y - 1][players[socket.id].x] > 0) {
                players[socket.id].y--;
                players[socket.id].animationUp = true;
                players[socket.id].animationLeft = false;
                players[socket.id].animationRight = false;
            }
        }
        else if(playersMovement.right)
        {
            if (players[socket.id].x + 1 < dungeon.w && dungeon.maze[players[socket.id].y][players[socket.id].x + 1] > 0) {
                players[socket.id].x++;
                players[socket.id].animationUp = false;
                players[socket.id].animationLeft = false;
                players[socket.id].animationRight = true;
            }
        }

        /*
        if x and y position of the player meeths the x and y axis of dungeon end. Dungeon is generated
        again. Also, levels are added up
        */

        if(players[socket.id].x === dungeonEnd.x && players[socket.id].y === dungeonEnd.y)
        {

            io.emit('level', levelCount);
            dungeonOptions.number_of_rooms++;
            dungeonOptions.average_room_size--;

            if(dungeonOptions.average_room_size === 7){
                dungeonOptions.average_room_size++;
            }
            else  if(dungeonOptions.average_room_size === 15){
                dungeonOptions.average_room_size--;
            }
            else if (dungeonOptions.average_room_size === 20){
                dungeonOptions.average_room_size++;
            }




            generateDungeon();
            for (let id in players)
            {
                players[id].x = dungeonStart.x;
                players[id].y = dungeonStart.y;
            }
            io.emit("dungeon data", getDungeonData());

            levelCount++;
            let playersID  = players[socket.id].id;

            for(let socketID in players)
            {
                let playersTimer =  timer;
                console.log(playersTimer);
                let playerID = players[socketID].id;
                console.log(playerID);
                let query = "INSERT INTO playersInfo (timeTaken, levels, id) values ("+playersTimer+", "+levelCount+", '"+playerID+"');";
                connection.query(query, function (error, result, fields) {

                    if (error)
                    {
                        console.log(error.stack);
                    }

                    if (result)
                    {
                        console.log("Row inserted successfully.");
                    }

                });
            }
        }

    });
});


function getCenterPositionOfSpecificRoom(roomIndex) {
    let position = {
        x: 0,
        y: 0
    };

    for (let i = 0; i < dungeon.rooms.length; i++) {
        let room = dungeon.rooms[i];
        if (room.id === roomIndex) {
            position.x = room.cx;
            position.y = room.cy;
            return position;
        }
    }
    return position;
}


function generateDungeon() {
    dungeon = new DungeonGenerator(
        dungeonOptions.dungeon_height,
        dungeonOptions.dungeon_width,
        dungeonOptions.number_of_rooms,
        dungeonOptions.average_room_size
    );
    console.log(dungeon);
    dungeonStart = getCenterPositionOfSpecificRoom(2);
    dungeonEnd = getCenterPositionOfSpecificRoom(dungeon._lastRoomId - 1);
}

server.listen(8081, function () {
    console.log("Dungeon server has started - connect to http://localhost:8081");
    generateDungeon();
    console.log("Initial dungeon generated!");
});