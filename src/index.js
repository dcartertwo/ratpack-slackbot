import Slackbot from 'slackbots';
import config from 'config';
import moment from 'moment-timezone';

import db from './db';

const botConfig = config.get('bot');

const bot = new Slackbot({
    token: botConfig.token,
    name: botConfig.name
  });

const firstRef = db.ref('/first');
let users = [];

bot.on('start', ()=> {
  //we too poor for caching so we're just gonna fetch all the users on app startup
  bot.getUsers().then((userList)=> {
    if (userList && userList.members) {
      users = users.concat(userList.members);
    }
  });

  bot.postMessageToChannel(botConfig.get('channel'), 'Ratpack overlord now online...', {});
  console.log('Ratpack overlord now online...');

  bot.on('message', (event)=> {
    if (event.type === 'message') {
      firstRef.once('value').then((data)=> {
        //convert time to current day
        //check to see if there is anything for today
        //invoke first message handler if not
        //noop if there is
        const snapshot = data.val();
        const firstMessages = [];
        for (let prop in snapshot) {
          if (snapshot.hasOwnProperty(prop)) {
            firstMessages.push(snapshot[prop]);
          }
        }

        if (!firstMessages.some(doesFirstMessageExist)) {
          handleFirstMessage(event);
        }

      });

    }
  });
});

function doesFirstMessageExist(message) {
  const messageDate = moment(moment.unix(message.date));
  return messageDate.isSame(moment(), 'day');
}

function handleFirstMessage(event) {
  if (event && event.ts && users.some(u => u.id === event.user) && event.user !== botConfig.name) {
    const messageTime = moment(moment.unix(event.ts), 'hmm').tz('America/New_York');

    if (messageTime.isAfter(moment('07:00', 'hh:mm'))) {
      const user = users.filter(u => u.id === event.user)[0];
      firstRef.push({
        user: user.id,
        date: event.ts
      });

      bot.postMessageToChannel(botConfig.get('channel'),
        `Ratpack overlord deems ${user.profile.real_name} FIRST BEST AMERICA`, {});
    }
  }
}