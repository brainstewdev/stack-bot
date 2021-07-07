// main script
const Discord = require("discord.js");
const envy = require("envy");
const request = require("request");
const zlib = require('zlib');
const TurndownService = require('turndown')



const env = envy();
const client = new Discord.Client();
var turndownService = new TurndownService()


// voglio prendere i tag da cercare
// sarà possibile passare tag in questo modo
// circondati da virgolette
// la query quindi sarà -> /stack [parte del titolo] | [tag]

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// triggered each time a message is sent in a server where the bot is present
client.on("message", (msg) => {
  if (msg.content.startsWith("/stack")) {
    // get the "argument" of the message
    let msg_content = msg.content.substring(7);
    // output to the console the error provided and who requested it
    console.log("error provided by " + msg.author.tag + ":" + msg_content);
    // check if there is anything as an argument (a text should be provided)
    if (!(msg_content === "")) {
      // check if any tags are present
      let tags = null;
      const regex = /"([\w ]+)"/gm;
      // devo controllare quindi se vi è un | con del testo dopo
      // per farlo devo cercare se è presente la combinazione di caratteri "| "
      if (msg_content.includes(" | ")) {
        // get the tags part and remove the tags part from the msg_content string
        let msg_parts = msg_content.split(" | ");
        tags = msg_parts[1].match(regex);
        if(tags !== null){
          for (let i = 0; i < tags.length; i++) {
            // devo togliere il primo e l'ultimo carattere della stringa
            tags[i] = tags[i].slice(1, -1);
          }
        }  
        msg_content = msg_parts[0];
        // ora ho sia i tag che il titolo da cercare
      }
      // avviso che sto cercando il suo errore
      msg.reply("searching for answers...");
      let tagString = "";
      if(tags !== null){
        tags.forEach(tag => {
          tagString += tag + ";";
        });
      }
      // faccio la richiesta
      let url =
        "https://api.stackexchange.com/2.3/search?order=desc&sort=activity&intitle="+ 
          msg_content
        +"&accepted=True&tagged="+
        tagString
        +"&site=stackoverflow&filter=!nKzQUR3Egv";

        // search the error on stackoverflow
      request(url, { encoding: null }, function (err, response, body) {
        if (response.headers["content-encoding"] == "gzip") {
          zlib.gunzip(body, function (err, dezipped) {
            reply_with_answer(msg, dezipped.toString());
          });
        } else {
          reply_with_answer(msg, body);
        }
      });

    //   msg.reply("error provided: " + msg_content);
    } else {
      msg.reply("you should provide a error to search for");
    }
  }
});

function reply_with_answer(msg, body){
    // parse the body to get the json object 
    let ob = parse_response(body);
    try{
    // should answer with: question \n answer
    // i have to get the most voted answer by the question id
	console.log(ob.items[0].question_id);
    let url = "https://api.stackexchange.com/2.3/questions/"+ ob.items[0].question_id + "/answers?order=desc&sort=votes&site=stackoverflow&filter=!nKzQURF6Y5";
    // get the first answer
    request(url, { encoding: null }, function (err, response, body) {
      if (response.headers["content-encoding"] == "gzip") {
        zlib.gunzip(body, function (err, dezipped) {
          reply_with_answer_2(msg, dezipped.toString(), ob);
        });
      } else {
        reply_with_answer_2(msg, body, ob);
      }
    });
  }catch (error){
    msg.reply("couldn't find any answer related to your problem.");
    console.error(error);
  }
}

function reply_with_answer_2(msg, body, obQuestion){
  
  let obAnswers = parse_response(body);
	let msg_total_length = 0;
	let body_string = "";
	try{
		body_string =
"# __**question**__:  \n" + turndownService.turndown(obQuestion.items[0].body) + "\n  # __**answer**__:  \n" + turndownService.turndown(obAnswers.items[0].body);
	}catch(error){
		console.log(error);
    		msg.reply("couldn't find any answer related to your problem.");
	}
	msg_total_length = body_string.length; 
	if(msg_total_length < 2000){
  try{
    let repEmbed = new Discord.MessageEmbed()
        .setColor('#f48024')
        .setTitle(turndownService.turndown(obQuestion.items[0].title))
        .setURL(obQuestion.items[0].link)
        .setAuthor(obQuestion.items[0].owner.display_name, obQuestion.items[0].owner.profile_image, obQuestion.items[0].owner.link)
        .setDescription(body_string)
        .attachFiles(['./img/logo.png'])
        .setThumbnail('attachment://logo.png')
        .setTimestamp()
        .setFooter('made by apache_98#9417', "https://github.com/brainstew927");
        msg.reply(repEmbed);
  }catch(error){
    msg.reply("couldn't find any answer related to your problem.");
    console.log(error);
  }
	}else{
		try{
		msg.reply(
			body_string

		, {split: true});
		}catch(error){
			
    msg.reply("couldn't find any answer related to your problem.");
		}
		}
}

function parse_response(body){
    return JSON.parse(body);
}
// login with the env variable
client.login(env.botToken);
