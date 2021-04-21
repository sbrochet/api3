const express = require('express')
const bodyParser = require('body-parser')
const app = express()
var cors = require('cors');
const port = 1338
const db = require('./queries')
const dispatchMobile3_db = require('./dispatchmobile3_firebasedb.js')
const dotenv = require('dotenv');
dotenv.config();

app.disable('x-powered-by');

app.use(cors()) 

app.use(bodyParser.json())

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
  cors({origin:'*'})
)

app.options('/', (request, response) => {
  console.log("J'ai recu une requete option")
}) 


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  next();

});

app.get('/', (request, response) => {
  console.log("Requete recue")
  response.json({ info: 'Node.js, Express, and Postgres API' })
}) 

app.get('/v1/ticket/:id/installationSousTraitant', cors(), db.getInstallationSousTraitant)

app.put('/v1/ticket/:id/pj', cors(), db.uploadFileOt)

app.delete('/v1/ticket/contact/:ot/:id', cors(), db.deleteContactOt) 

app.put('/v1/ticket/contact/:id', cors(), db.putContactOt) 

app.get('/v1/ticket/contact/:id', cors(), db.getContactOt)

app.patch('/v1/utilisateur/:id',cors(), db.patchUtilisateur)

app.get('/v1/utilisateur/droitsSupervision',cors(), db.getDroitsSupervision)

app.put('/v1/ticket/:id/issue', cors(), db.addRemineIssue)

app.get('/issue/:id',cors(),db.readRemineIssue)

app.get('/v1/ticket/:id/issues', cors(), db.getRemineIssueOt)

app.post('/tickets/recherche', cors(), db.rechercheOt)

app.get('/v1/action/:id', cors(), db.getAction)

app.get('/v1/ticket/:id', cors(), db.getTicket)

app.get('/v1/ticket/devis/:id', cors(), db.getDevisTicket)

app.get('/v1/ticket/:id/missions', cors(), db.getMissionsOt)

app.get('/v1/ticket/:id/fichiers', cors(), db.listeFichiersOT)

app.delete('/v1/ticket/:ot/fichiers/:id', cors(), db.supprimeFichiersOT)

app.get('/v1/ticket/:id/traitements', cors(), db.getTraitementsOt)

app.get('/v1/ticket/:id/procedure/actionsDisponibles', cors(), db.getProceduresDisponibles)

app.get('/v1/ticket/:id/procedure/action/:id_action', cors(), db.getActionOt)

app.get('/v1/ticket/:id/action/reference/:reference', cors(), db.getActionOtReference)

app.put('/v1/ticket/:id/procedure/action/traitement', cors(), db.putTraitementOt)
 
app.get('/v1/ticket/:id/procedureCourante', cors(), db.getProcedureCouranteOt)

app.put('/v1/ticket/:id/rapportTelephonique', cors(), db.putRapportTelephonique)

app.put('/v1/procedure/schema/action/traitement', cors(), db.putActionSchema)

app.patch('/v1/ticket/:id', cors(), db.patchOt)  

app.patch('/v1/ticket/flux/:id', cors(), db.patchFluxOt)  

app.get('/tickets/etat/dbin', cors(), db.listeOtDbin)

app.get('/tickets/etat/actifs', cors(), db.listeOtActifs)
 
app.get('/tickets/etat/smart', cors(), db.listeOtSmart)

app.get('/tickets/listeContactsOpOt/:id', cors(), db.listeContactsOpOt)

app.get('/tickets/etat/cc', cors(), db.listeOtCC)

app.get('/tickets/etat/support', cors(), db.listeOtSupport)

app.get('/v1/contact/:id',cors(), db.getContact)

app.get('/v1/noeuds/:dossier/:id/:type',cors(), db.determine_vue)

app.get('/v1/contrat/:id/contacts',cors(), db.getContactsContrat)

app.get('/ticket/:id/intervenants',cors(), db.getIntervenantsTickets)

app.get('/ticket/:id/intervenants/equipements',cors(), db.getEquipementsIntervenantsTickets)

app.get('/ticket/:id/traitements',cors(), db.getTraitementsTicket)

app.get('/v1/ticket/:id/traitementsTexteOt',cors(), db.traitementsTexteOt)

app.get('/ticket/:id/sessions',cors(), db.getSessionsTicket)

app.post('/ticket/:id/transfert',cors(), db.transfertOt)

app.post('/v1/firebasedb/syncOt/:id',dispatchMobile3_db.pushOtFirebase)

app.post('/v1/rechercheSite/:id',db.rechercheSite)

app.post('/v1/rechercheInstallation/:id',db.rechercheInstallation)

app.get('/v1/utilisateur/dbin/dossiers',db.listeDossiersUtilisateur) 

app.get('/v1/utilisateur/dbin/dossier/:id/noeuds',db.listeNoeudsDossier)

app.get('/v1/noeud/:dossier/:id',db.litNoeud)

app.get('/v1/noeud/:dossier/:id/intervenants',db.getEquipementsIntervenantsNoeud)

app.get('/:dossier/installation/:id',db.litInstallation)

app.get('/:dossier/site/:id',db.litSite)

app.get('/:dossier/contrat/:id',db.litContrat)

app.get('/:dossier/client/:id',db.litClient)

app.get('/:dossier/etats',db.litEtatsDossier)

app.post('/v1/noeud/:dossier/:id/ot',db.creerOt)

app.get('/v1/planifications/:header', db.listePlanificationNoeud) 

app.get('/v1/libelles/:dossier/:pere', db.getLibellesPereDossier) 

app.post('/v1/mail/transaction', db.sendMailJet)

app.get('/v1/fichiers/ot/:id', db.listeFichiersOT)

app.get('/v1/noeud/:id/installations', db.listeInstallationsReseau)

app.post('/v1/mobile/planification/:id',db.putPlanificationMobile)

app.post('/v1/mobile/rapport/:id',db.putRapportMobile)

app.post('/v1/log',db.postlog)

app.delete('/v1/logtek/planification',db.supprimePlanificationLogtek)

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})


