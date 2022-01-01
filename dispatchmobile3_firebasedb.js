var firebase_admin = require('firebase-admin');
const db = require('./queries')

// Fetch the service account key JSON file contents
var serviceAccount = require("./cert_firebase_dispatch3.json");

// Initialize the app with a null auth variable, limiting the server's access
firebase_admin.initializeApp({
  credential: firebase_admin.credential.cert(serviceAccount),
  databaseURL: "https://dispatchmobile3.firebaseio.com/",
  databaseAuthVariableOverride: null
});


// Get a database reference to our posts
var firebasedb = firebase_admin.database();
var ref = firebasedb.ref("dispatchmobile3/liste_ot");

const pushOtFirebase = (request, response) => {
  console.log("Synchronisation de l'OT " + request.params.id);
  db.getOtSerialise(request.params.id).then(function(ot){
    firebase_admin.database().ref('liste_ot/' + ot.ot).set(ot);
    response.status(200).json()
    return true
  })
}

module.exports = {
  pushOtFirebase,
}
