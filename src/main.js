// main script 
const Discord = require('discord.js');
const envy = require('envy');

const env = envy();
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// triggered each time a message is sent in a server where the bot is present
client.on('message', msg => {
    if (msg.content.startsWith("/stack")) {
        // get the "argument" of the message
        let msg_content = msg.content.substring(7);
        // output to the console the error provided and who requested it
        console.log("error provided by " + msg.author.tag + ":"+ msg_content);
        // check if there is anything as an argument (a text should be provided)
        if(!(msg_content === "")){
            msg.reply("error provided: " + msg_content);
        }else{
            msg.reply("you should provide a error to search for");
        }
    }
});
// login with the env variable
client.login(env.botToken);