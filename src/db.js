import firebase from 'firebase-admin';
import config from 'config';

firebase.initializeApp({
  credential: firebase.credential.cert(config.get('firebase').credential),
  databaseURL: `https://${config.get('firebase').databaseUrl}.firebaseio.com`
});

module.exports = firebase.database();
