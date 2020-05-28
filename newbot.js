const Discord = require("discord.js"); // main purpose
const yt = require("ytdl-core"); // to get information about a video from yt url
const search = require('youtube-search'); // to get video url from keywords using yt api
const botsettings = require("./newbotsettings");
const { get } = require("snekfetch"); // to make simple get requests
const fs = require("fs"); // to check if a file exists

const client = new Discord.Client();
const maxVolume = 100;
let connectedChannels = {};
const defaultVolume = 10;
const picExtensions = ["jpg", "png", "jpeg"];
const sndExtensions = ["mp3", "wav", "ogg"];
const filterUrl = require("./functions/filterUrl")

process.stdin.resume(); //so the program will not close instantly
function exitHandler(options, exitCode) {
    if (exitCode || exitCode === 0) console.log("process stopped with exit code " + exitCode);
    if (options.exit) kill();
}
process.on('exit', exitHandler.bind(null, {})); // when process.exit() is called
process.on('SIGINT', exitHandler.bind(null, {
    exit: true
})); // ctrl + C
process.on('SIGUSR1', exitHandler.bind(null, {
    exit: true
})); // catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR2', exitHandler.bind(null, {
    exit: true
}));
process.on('SIGHUP', exitHandler.bind(null, {
    exit: true
})); // closing terminal that is running the program
// process.on('uncaughtException', exitHandler.bind(null, { exit: true })); // catches uncaught exceptions

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    //https://discordapp.com/oauth2/authorize?client_id=424015462284918785&permissions=8&scope=bot
});

client.on("voiceStateUpdate", (oldState, newState) => {
    let newMember = newState.member
    if (newMember.id === botsettings.discordIds.vankus4 && newState.selfMute && !newState.deaf) {
        createChannel(newMember.guild);
        let number = Math.floor((Math.random() * 7))
        let name = "greevil " + number;
        let extension = "mp3";
        follow(newMember).then(() => {
            const activityName = name + "." + extension;
            client.user.setActivity(activityName).then(() => {
                console.log(connectedChannels[newMember.guild.id].volume)
                const dispatcher = newMember.guild.voice.connection.play(__dirname + "/soundBoard/" + name + "." + extension, { volume: connectedChannels[newMember.guild.id].volume / 100 });
                dispatcher.player.streamingData.pausedTime = 0;
                dispatcher.on('end', () => {
                    client.user.setActivity();
                });
                dispatcher.on('error', e => {
                    console.log(e);
                });
            });
        }).catch((err) => {
            console.log(err);
        });
    }
    return;
    createChannel(newMember.guild);
    if (newMember.guild.id === botsettings.discordIds.cringefiesta) { // miso server
        if (newMember.selfMute && !newMember.deaf) {
            let files = fs.readdirSync(__dirname + "/soundBoard");
            let file = files[Math.floor((Math.random() * files.length))];
            let name = file.slice(0, -(file.split(".").pop().length + 1))
            let extension = file.split(".").pop();

            follow(newMember).then(() => {
                const activityName = name + "." + extension;
                client.user.setActivity(activityName).then(() => {
                    const dispatcher = newMember.guild.voice.connection.playFile(__dirname + "/soundBoard/" + name + "." + extension);
                    dispatcher.player.streamingData.pausedTime = 0;
                    dispatcher.setVolume(connectedChannels[newMember.guild.id].volume / 100); // sets volume
                    dispatcher.on('end', () => {
                        client.user.setActivity();
                    });
                    dispatcher.on('error', e => {
                        console.log(e);
                    });
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    }
});

client.on("message", msg => {
    if (!msg.content.startsWith(botsettings.prefix)) {
        return
    }
    let commandName = msg.content.toLowerCase().slice(botsettings.prefix.length).split(' ')[0]; // get the command name
    if (commands.hasOwnProperty(commandName)) // if command exists and if is DJ or request is cat/dog
    {
        let currentdate = new Date()
        console.log(`${currentdate.getHours()}:${currentdate.getMinutes()}:${currentdate.getSeconds()} ${msg.author.tag}: ${msg.content}`); // output the msg to console
        msg.delete().then(() => {
            createChannel(msg.guild);
            commands[commandName](msg); //execute respective command
        });
    } else {
        let fileName = msg.content.toLowerCase().slice(botsettings.prefix.length); // get the command name
        let files = fs.readdirSync(__dirname + "/soundBoard");
        files.forEach(file => {
            let name = file.slice(0, -(file.split(".").pop().length + 1))
            if (fileName == name) {
                let extension = file.split(".").pop();
                console.log(msg.author.tag + ": " + msg.content); // output the msg to console
                msg.delete().then(() => {
                    createChannel(msg.guild);
                    if (sndExtensions.includes(extension)) playSound(msg, __dirname + "/soundBoard/" + name + "." + extension);
                    else if (picExtensions.includes(extension)) sendFile(msg, __dirname + "/soundBoard/" + name + "." + extension);
                });
            }
        });
    }
});

client.login(botsettings.botToken);

const commands = {
    'yt': (msg) => { // searches for the songs url and adds it to the queue
        let url = msg.content.substring(4);
        if (url == '' || url === undefined) return msg.channel.send(`You must add a YouTube video url, or id after ${botsettings.prefix}yt`)

        let timestamp = filterUrl(url)[1]
        url = filterUrl(url)[0]
        //console.log(url)
        if (!url.startsWith("https://www.youtube.com/watch?v=") && !url.startsWith("https://youtu.be/")) {
            console.log("not a link")
            var opts = {
                maxResults: 1,
                key: botsettings.apikey,
                type: "video"
            };
            search(url, opts, function (err, results) {
                if (err != null) return msg.channel.send("yt search " + err);
                //if (err != null) throw(err);
                if (!results.length) return msg.channel.send("no such link exists");
                if (!results[0].hasOwnProperty("link")) return msg.channel.send("the link doesn't have a link property");
                connectedChannels[msg.guild.id].queue.push({
                    url: results[0].link,
                    title: results[0].title,
                    requester: msg.author.username,
                    timestamp: timestamp
                });
                play(msg); // starts the queue
            });
        } else {
            console.log("link provided");
            yt.getInfo(url, (err, info) => {
                if (err) return console.log(err);
                connectedChannels[msg.guild.id].queue.push({
                    url: url,
                    title: info.title,
                    requester: msg.author.username,
                    timestamp: timestamp
                });
                play(msg); // starts the queue
            });
        }
    },
    'queue': (msg) => { // prints out the queue of the guild
        let tosend = [];
        connectedChannels[msg.guild.id].queue.forEach((song, i) => {
            tosend.push(`${i + 1}. ${song.title} - Requested by: ${song.requester}`);
        });
        msg.channel.send(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0, 15).join('\n')}\`\`\``);
    },
    'vol': (msg) => {
        if (!connectedChannels[msg.guild.id].isPlaying) {
            changeVol(msg);
        }
    },
    'mute': (msg) => {

    },
    'unmute': (msg) => {
        if (!connectedChannels[msg.guild.id].isPlaying) {
            changeVol(msg);
        }
    },
    'random': (msg) => {
        let files = fs.readdirSync(__dirname + "/soundBoard");
        let file = files[Math.floor((Math.random() * files.length))];
        let name = file.slice(0, -(file.split(".").pop().length + 1))
        let extension = file.split(".").pop();
        if (sndExtensions.includes(extension)) playSound(msg, __dirname + "/soundBoard/" + name + "." + extension);
        else if (picExtensions.includes(extension)) {
            commands["random"];
        }
    },
    "cat": (msg) => {
        msg.channel.startdng();
        get("http://aws.random.cat/meow") // uses snekfetch to make a get request
            .then(response => {
                msg.channel.send({
                    files: [{
                        attachment: response.body.file,
                        name: `cat.${response.body.file.split('.')[4]}`
                    }]
                });
            }).catch(err => {
                console.log(err.text);
                msg.channel.send("unable to enter the cat dimension");
            }).then(() => {
                msg.channel.stopTyping();
            });
    },
    "dog": (msg) => {
        msg.channel.startTyping();
        get("https://random.dog/woof") // uses snekfetch to make a get request
            .then(response => {
                let url = "https://random.dog/" + response.body.toString('utf8');
                msg.channel.send({
                    files: [{
                        attachment: url,
                        name: `dog.${url.split('.').pop()}`
                    }]
                });
            }).catch(err => {
                console.log(err.text);
                msg.channel.send("unable to find a woofer");
            }).then(() => {
                msg.channel.stopTyping();
            });
    },
    "join": (msg) => {
        follow(msg.member)
    },
    "leave": (msg) => {
        if (!connectedChannels[msg.guild.id].isPlaying) { // if not playing
            if (connectedChannels[msg.guild.id].hasOwnProperty("connection")) {
                connectedChannels[msg.guild.id].connection.channel.leave();
                delete connectedChannels[msg.guild.id].connection;
                printConnectedGuilds();
            } else {
                // msg colector handles it
            }
        }
    },
    "say": (msg) => {
        msg.content = msg.content.split(" ");
        msg.content.shift();
        let result = msg.content.join(" ");
        msg.channel.send(result);
    },
    "ratafak": (msg) => {
        let url = "https://www.youtube.com/watch?v=_GkHtEcslb0";
        yt.getInfo(url, (err, info) => {
            connectedChannels[msg.guild.id].queue.push({
                url: url,
                title: info.title,
                requester: msg.author.username
            });
            play(msg); // starts the queue
        });
    },
    "lego": (msg) => {
        let url = "https://www.youtube.com/watch?v=nhq-TbGJ5B8";
        yt.getInfo(url, (err, info) => {
            connectedChannels[msg.guild.id].queue.push({
                url: url,
                title: info.title,
                requester: msg.author.username
            });
            play(msg); // starts the queue
        });
    },
    "phoon": (msg) => {
        let url = "https://www.youtube.com/watch?v=wIIi38dHjos";
        yt.getInfo(url, (err, info) => {
            connectedChannels[msg.guild.id].queue.push({
                url: url,
                title: info.title,
                requester: msg.author.username
            });
            play(msg); // starts the queue
        });
    },
    "": (msg) => {
        msg.channel.send("ste prijebaní?");
    }
};

function follow(newMember) {
    const voiceChannel = newMember.voice.channel; // changed member to author so it can reply to DM
    return voiceConnect(voiceChannel);
}

function voiceConnect(channel) { // works for both join(msg) and follow(newMember)
    return new Promise(function (resolve, reject) {
        if (!channel || channel.type !== 'voice') return reject('I couldn\'t connect to your voice channel...');
        channel.join().then(connection => {
            connection.on("error", (error) => {
                console.log("voiceConnection emmited an error");
                reject(error);
            });
            connectedChannels[channel.guild.id].connection = connection; // adds this connection under the guild's ID string
            resolve(connection);
            printConnectedGuilds();
        }).catch(err => reject(err));
    });
}

function playSound(msg, pathToFile) {
    if (!fs.existsSync(pathToFile)) {
        console.log("file not found (" + pathToFile + ")");
        return;
    }
    follow(msg.member).then((connection) => {
        const activityName = pathToFile.split("soundBoard/")[1];
        client.user.setActivity(activityName).then(() => {
            const dispatcher = msg.guild.voice.connection.play(pathToFile, { volume: connectedChannels[msg.guild.id].volume / 100 });
            dispatcher.player.streamingData.pausedTime = 0;
            dispatcher.on('end', () => {
                client.user.setActivity();
            });
            dispatcher.on('error', e => {
                console.log(e);
            });
        });
    }).catch((err) => {
        //msg.channel.send(err);
        console.log(err);
    });
}

function sendFile(msg, pathToFile) {
    console.log("sending a file");
    msg.channel.startTyping();
    msg.channel.send({
        files: [pathToFile]
    }).then(() => {
        msg.channel.stopTyping();
    }).catch(err => {
        console.log(err);
        msg.channel.stopTyping();
    });
}

function play(msg) {
    if (!connectedChannels[msg.guild.id].connection) return follow(msg.member).then(connection => play(msg)).catch(err => console.log(err)) // if not connected to a voice channel (any), connect and rerun the play command
    if (connectedChannels[msg.guild.id].isPlaying) return;// console.log("already playing"); //msg.channel.send('Already Playing'); // if playing, end here

    connectedChannels[msg.guild.id].isPlaying = true;

    (function pray(song) {
        if (song === undefined) {
            console.log("Queue is empty");
            connectedChannels[msg.guild.id].isPlaying = false;
            return;
        }
        console.log(song);
        let dispatcher = connectedChannels[msg.guild.id].connection.play(yt(song.url, {
            //audioonly: true
        }), {
            volume: connectedChannels[msg.guild.id].volume / 100,
            bitrate: 48000,
            seek: song.timestamp //start playing from 0th second
            //passes: botsettings.passes
        });
        dispatcher.player.streamingData.pausedTime = 0;
        console.log("paused time: " + dispatcher.player.streamingData.pausedTime);
        let stop = false;
        let leave = false;
        //dispatcher.setVolume(connectedChannels[msg.guild.id].volume / 100); // sets volume

        connectedChannels[msg.guild.id].isPlaying = true;
        let collector = msg.channel.createMessageCollector(m => m); // filter needs a nonempty message
        collector.on('collect', m => {
            let isACommand = true;
            if (m.content.startsWith(botsettings.prefix + 'pause')) {
                client.user.setActivity("paused").then(() => {
                    dispatcher.pause();
                });
            } else if (m.content.startsWith(botsettings.prefix + 'resume')) {
                client.user.setActivity("").then(() => {
                    dispatcher.resume();
                });
            } else if (m.content.startsWith(botsettings.prefix + 'skip')) {
                msg.channel.send('skipped').then((replyMsg) => {
                    setTimeout(() => {
                        replyMsg.delete();
                    }, 5000);
                    dispatcher.end();
                });
            } else if (m.content.startsWith(botsettings.prefix + 'bitbox')) {
                dispatcher.setBitrate(8);
            }
            // else if (m.content.startsWith(botsettings.prefix + 'stop')) {
            //     stop = true;
            //     msg.channel.send('stopping').then(() => { dispatcher.end(); });
            // }
            else if (m.content.startsWith(botsettings.prefix + "url")) {
                msg.channel.send(song.url + " requested by: " + song.requester);
            } else if (m.content.startsWith(botsettings.prefix + "leave")) {
                stop = true;
                leave = true;
                msg.channel.send('stopping').then(() => {
                    dispatcher.end();
                });
            } else if (m.content.startsWith(botsettings.prefix + 'vol')) {
                changeVol(m);
                dispatcher.setVolume(connectedChannels[msg.guild.id].volume / 100);
            } else isACommand = false;
            if (isACommand && !commands.hasOwnProperty(m.content.toLowerCase().slice(botsettings.prefix.length).split(' ')[0])) {
                m.delete();
                console.log(m.author.tag + ": " + m.content); // output the msg to console
            }
        });
        dispatcher.on('end', () => { // when the current song ends
            client.user.setActivity("")
            collector.stop(); // stops listening to extra commands
            connectedChannels[msg.guild.id].isPlaying = false; // enables the command.vol(msg)
            if (!stop)
                pray(connectedChannels[msg.guild.id].queue.shift()); // moves the queue
            else {
                connectedChannels[msg.guild.id].queue = [];
                stop = false;
            }
            if (leave) {
                leave = false;
                msg.member.voiceChannel.leave();
            }
        });
        dispatcher.on('error', (err) => {
            console.log(err);
            return msg.channel.send('error: ' + err).then(() => {
                collector.stop();
                pray(connectedChannels[msg.guild.id].queue.shift());
            });
        });
    })(connectedChannels[msg.guild.id].queue.shift());
}

function printConnectedGuilds() {
    let connections = [];
    Object.keys(connectedChannels).forEach(channel => {
        if (connectedChannels[channel].connection)
            connections.push(connectedChannels[channel].connection.voice.guild.name);
    });
    console.log("connected channels: " + connections.join(" | "));
}

function changeVol(msg) {
    let volume = Number(msg.content.split(' ')[1]);
    if (isNaN(volume)) {
        msg.channel.send("current volume: " + connectedChannels[msg.guild.id].volume).then(replyMsg => {
            setTimeout(() => {
                replyMsg.delete();
            }, 5000);
        })
        //return msg.channel.send("the volume must be a number!");
    } else if (volume >= 0 && volume <= maxVolume) {
        connectedChannels[msg.guild.id].volume = volume;
        msg.channel.send("volume set to " + volume).then(replyMsg => {
            setTimeout(() => {
                replyMsg.delete();
            }, 5000);
        })
    } else {
        msg.channel.send("the volume must be a number between 0 and " + maxVolume).then(replyMsg => {
            setTimeout(() => {
                replyMsg.delete();
            }, 5000);
        })
    }
}

function createChannel(guild) {
    if (guild && !connectedChannels.hasOwnProperty(guild.id)) { // if the bot isn't connected anywhere in this guild, create the object and reset volume
        connectedChannels[guild.id] = {};
        connectedChannels[guild.id].volume = defaultVolume;
        connectedChannels[guild.id].isPlaying = false;
        connectedChannels[guild.id].queue = [];
    }
}

function kill() {
    Object.keys(connectedChannels).forEach(channel => {
        if (connectedChannels[channel].hasOwnProperty("voiceChannel")) {
            connectedChannels[channel].voiceChannel.leave();
            delete connectedChannels[channel].voiceChannel;
        }
    });
    printConnectedGuilds();
    process.exit();
}