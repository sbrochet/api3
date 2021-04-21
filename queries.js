const Pool = require('pg').Pool
const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
var async = require("async");
let moment = require('moment');

console.log("Connexion à " + process.env.DB_USER + "@" + process.env.DB_NAME + "/" + process.env.DB_HOST + ":" + process.env.DB_PORT)

const pool = new Pool({
  user: 'seb',
  host: '10.224.3.17',
  database: 'extranet',
  password: 'toto',
  port: '5432',
}) 

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack)
  }
  client.query('SELECT NOW()', (err, result) => {
    release()
    if (err) {
      return console.error('Error executing query', err.stack)
    }
    console.log(result.rows)
  })
})

const patchUtilisateur = (request, response) => {
  console.log("Patch de l'utilisateur " + request.params.id)
  console.log(request.body)
  pool.query('update intranet.utilisateurs set token_fb=$1 where identifiant=$2', [request.body.token_fb,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json(null)
    }

    response.status(200).json(null)

  }) 
}

const postlog = (request, response) => {
  console.log("Réception d'un LOG")
  console.log(request.body)
  pool.query('insert into v1.log(flux,context) values ($1,$2)', [request.body,request.body.context], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json(null)
    }
    response.status(200).json(null)
  })
}

const supprimeFichiersOT = (request, response) => {
  pool.query('select v1.supprime_fichier($1,$2) as flux', [request.params.ot,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      response.status(200).json(null)
    } else response.status(404).json(null)

  }) 
}

const listeFichiersOT = (request, response) => {
	console.log("Chargement de la liste des fichiers de l'OT " + request.params.id)
  pool.query('select v1.get_fichiers_ot($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getInstallationSousTraitant = (request, response) => {
	console.log("Chargement de la liste des fichiers de l'OT " + request.params.id)
  pool.query('select v1.get_installation_soustraitante($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getRemineIssueOt = (request, response) => {
  console.log("Chargement de la liste des issues de l'OT " + request.params.id)
  pool.query('select id from tickets.tickets_ot where ot=$1', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json(null)
    }

    console.log(results.rows)

    response.status(200).json(results.rows)

  }) 
}

const readRemineIssue = (request, response) => {
  console.log("Lecture du ticket " + request.params.id)
  
  var Redmine = require('node-redmine');


  var hostname = 'http://10.224.3.22/redmine/';
  var config = {
    apiKey: 'd9feb1785fed0f44f7db7920a5a47319f3181d2b'
  };

  var redmine = new Redmine(hostname, config);
  var params = {include: 'attachments,journals,watchers'};

  redmine.get_issue_by_id(parseInt(request.params.id), params,function(err, data) {
    if (err){
      console.log(err);
      response.status(500).json(null)
    }
    else {
      response.status(200).json(data)
    }
  });  
}

const addRemineIssue = (request, response) => {
  console.log("Ajout d'un ticket Redmine")
  console.log(request.body)

  var Redmine = require('node-redmine');


  var hostname = 'http://10.224.3.22/redmine/';
  var config = {
    apiKey: 'd9feb1785fed0f44f7db7920a5a47319f3181d2b'
  };

  var redmine = new Redmine(hostname, config);
  var issue = {
    "issue": {
      "project_id": 7,
      "subject": request.body.sujet,
      "notes": request.body.note,
      "priority_id": request.body.priorite
    }
  };
  
  redmine.create_issue(issue, function(err, data) {
    if (err){
      console.log(err);
      response.status(500).json(null)
    }
    else {
      console.log(data);
      console.log("Ticket créé : " + data.issue.id)
 
      try {
        pool.query('insert into tickets.tickets_ot(id,ot) values ($1,$2)', [data.issue.id,request.params.id], (error, results) => {
          if (error) {
            console.log(error)
            response.status(500).json(null)
          }
          response.status(200).json(data)
        }) 

      } catch(e){
        response.status(500)
      }
    }
  });  
}

const sendMailJet = (request, response) => {
  console.log("Envoi d'une notification mailjet")
  const mailjet = require ('node-mailjet')
    .connect('c9da5f0657a05151e19526510d6cfc82', 'b6d6befef64e7b0ad884646456c7da84')
    const req = mailjet
    .post("send", {'version': 'v3.1'})
    .request(request.body)
    req
    .then((result) => {
        console.log(result.body)
    })
    .catch((err) => {
        console.log(err.statusCode)
    })   

}


const getProcedureCouranteOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  try {
  pool.query('select v1.get_procedure_courante_ot($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json(null)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404)

  }) 
  } catch(e){
    response.status(500)
  }

}

const getAction = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_action($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404)

  }) 
}

const listePlanificationNoeud = (request, response) => {
  console.log("Lecture des planifications du token " + request.params.header)
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.liste_planifications($1) as flux', [request.params.header], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getActionOtReference = (request, response) => {
  console.log("Lecture de l'action " + request.params.reference + " pour l'OT " +  request.params.id)
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_action_reference($1,$2::integer) as flux', [request.params.reference,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json(null)
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      console.log(results.rows)
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const litEtatsDossier = (request, response) => {
  console.log("Lecture de l'action " + request.params.reference + " pour l'OT " +  request.params.id)
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_etats_dossier($1) as flux', [request.params.dossier], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      console.log(results.rows)
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}




const getActionOt = (request, response) => {
  console.log("Lecture de l'action " + request.params.id_action + " pour l'OT " +  request.params.id)
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_action($1::integer,$2::integer) as flux', [request.params.id_action,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      console.log(results.rows)
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getTraitementsOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_traitements_ot($1,$2) as flux', [request.params.id,request.header('Authorization')], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json()
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      response.status(201).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getDroitsSupervision = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_droits_supervision($1) as flux', [request.header('Authorization')], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json()
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      response.status(201).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const traitementsTexteOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_traitements_texte_ot($1,$2) as flux', [request.params.id,request.header('Authorization')], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json()
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      response.status(201).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getMissionsOt = (request, response) => {
  console.log("Recherche des missions de l'OT " + request.params.id)
  pool.query('select v1.get_missions_ot($1,$2) as flux', [request.params.id,request.header('Authorization')], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json('{}')    
    } else {
      if (results===undefined){
        response.status(404).json('{}')    
      } else {
        response.status(200).json(results.rows[0]['flux'])    
      }
    }
  }) 
}

const putTraitementOt = (request, response) => {
  console.log("Ajout d'un traitement à  l'OT " + request.params.id)
  
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  try {
    pool.query('select v1.put_traitement_ot($1,$2,$3) as flux', [request.params.id,request.header('Authorization'),request.body], (error, results) => {
      if (error) {
        response.status(500).json(null)
      }  else {  
        if (results!=null) {
          if (results.rows!==undefined && results.rows !== null){
            response.status(200).json(null)    
          } else {
            response.status(500).json(null)        
          }
        } else {
          response.status(500).json(null)      
        }
      }
    }) 
  } catch (e){
    response.status(500).json(null)      
  }
}

const putActionSchema = (request, response) => {
  connsole.log("Ajout d'un traitement")
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.put_traitement_action($1) as flux', [request.body], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json()
    }
    if (results===undefined) response.status(500).json(null)
    response.status(200).json(results.rows[0]['flux'])

  }) 
}


const getIntervenantsTickets = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_intervenants_ticket($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getEquipementsIntervenantsNoeud = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_equipements_intervenants_noeud($1,$2) as flux', [request.params.dossier,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getEquipementsIntervenantsTickets = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_equipements_intervenants_ticket($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const getTraitementsTicket = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_traitements_ticket($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404).json()
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404).json()

  }) 
}

const uploadFileOt = (request, response) => {
  console.log("Chargement d'une PJ d'un OT")
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log(request.files)

}

const litInstallation = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Lecture de l'installation " + request.params.id + " / " + request.params.dossier + ". Token : " + request.header('Authorization') + " Flux : ")
  console.log(request.body)
  const query=`
    select
      installations.create_date
      ,installations.update_date
      ,installations.bcode
      ,installations.description
      ,installations.actif
      ,installations.address1
      ,installations.address2
      ,installations.zip_code
      ,installations.city
      ,installations.garantie
      ,installations.response_time
      ,installations.onsite_support
      ,installations.coverage_id
      ,installations.code_soustraitance
      ,installations.contract_bcode
      ,installations.site_bcode
      ,installations.customer_bcode
      ,contrats.hotline_support
      ,validites.isperiodevalide(installations.coverage_id,current_timestamp)  as couverture_valide
      ,to_json(periodes.*) as validite
      ,(select to_json(array_agg(liste_contrats.bcode)) from (select c2.bcode from callcenter_donneesclient.contrats c2 where c2.contractid=installations.contractid and c2.racine=contrats.racine order by c2.bcode DESC) as liste_contrats) as contrats
      ,(select 
        to_json(array_agg(equipements)) 
        from (
        select
        equipements.*
        ,(select to_json(array_agg(elements)) from (select * from rhino.elements where elements.id_equipement=equipements.id) as elements) as elements
        from rhino.equipements
        where id=installations.bcode
        ) as equipements) as equipements
    from callcenter_donneesclient.installations
    left join callcenter_donneesclient.contrats on contrats.contractid=installations.contractid and contrats.bcode=installations.contract_bcode
    left join validites.periodes on periodes.id=installations.coverage_id
    where installations.contractid=$1 and installations.bcode=$2
  `;     
  try{
  pool.query(query, [request.params.dossier,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      if (results.rows[0]===null){
        response.status(500).json()
      } else {
        response.status(200).json(results.rows[0])
      }      
    } else response.status(404).json()
  }) 
  } catch (e){
    //
  }
}

const litSite = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Lecture du site " + request.params.id + " / " + request.params.dossier + ". Token : " + request.header('Authorization') + " Flux : ")
  console.log(request.body)
  const query=`select
    sites.create_date
    ,sites.update_date
    ,sites.bcode
    ,sites.description
    ,sites.actif
    ,sites.address1
    ,sites.address2
    ,sites.zip_code
    ,sites.city
    ,sites.contract_bcode
    from callcenter_donneesclient.sites
    where sites.contractid=$1 and sites.bcode=$2
  `;
    
  try{
  pool.query(query, [request.params.dossier,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      if (results.rows[0]===null){
        response.status(500)
      } else {
        response.status(200).json(results.rows[0])
      }      
    } else response.status(404)
  }) 
  } catch (e){
    //
  }
}

const litContrat = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Lecture du site " + request.params.id + " / " + request.params.dossier + ". Token : " + request.header('Authorization') + " Flux : ")
  
  const query=`select
  contrats.create_date
    ,contrats.update_date
    ,contrats.bcode
    ,contrats.description
    ,contrats.actif
    ,to_char(contrats.valid_from,'YYYY-MM-DD HH24:MI:SS') as valid_from
    ,to_char(contrats.valid_until,'YYYY-MM-DD HH24:MI:SS') as valid_until
    ,contrats.hotline_support
    ,agence_bcode
    ,statut_ct
    ,(select to_json(t) from (select * from callcenter_donneesclient.agences where agences.bcode=contrats.agence_bcode limit 1) t ) as agence
    ,(select to_json(array_agg(i)) from (select * from callcenter_donneesclient.installations where contract_bcode=contrats.bcode order by bcode) i ) as installations    
    from callcenter_donneesclient.contrats
    where contrats.contractid=$1 and contrats.bcode=$2
  `;
    
  try{
  pool.query(query, [request.params.dossier,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      if (results.rows[0]===null){
        response.status(500)
      } else {
        response.status(200).json(results.rows[0])
      }      
    } else response.status(404)
  }) 
  } catch (e){
    //
  }
}

const litClient = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Lecture du site " + request.params.id + " / " + request.params.dossier + ". Token : " + request.header('Authorization') + " Flux : ")
  console.log(request.body)
  const query=`select
  clients.create_date
    ,clients.update_date
    ,clients.bcode
    ,clients.name
    ,clients.address1
    ,clients.address2
    ,clients.zip_code
    ,clients.city
    ,clients.bcode_superclient
    ,(select to_json(t) from (select * from callcenter_donneesclient.clients c2 where c2.contractid=clients.contractid and c2.bcode=clients.bcode_superclient limit 1) t ) as super_client
    from callcenter_donneesclient.clients
    where clients.contractid=$1 and clients.bcode=$2
  `;
    
  try{
  pool.query(query, [request.params.dossier,request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      if (results.rows[0]===null){
        response.status(500)
      } else {
        response.status(200).json(results.rows[0])
      }      
    } else response.status(404)
  }) 
  } catch (e){
    //
  }
}

const patchOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Mise à jour de l'OT " + request.params.id + ". Token : " + request.header('Authorization'))
  console.log("Body "  + JSON.stringify(request.body))
  try {
    pool.query('select v1.patch_ot($1,$2,$3) as flux', [request.params.id,request.header('Authorization'),request.body], (error, results) => {
      if (error) {
        console.log(error)
        response.status(500)
      } else {
        console.log("Patch OT")
        if (results.rows !== undefined && results.rows !== null && results.rows[0] !== null) {
        //console.log("Retour de la base " . results.rows[0]['flux'])
        response.status(200).json(results.rows[0]['flux'])
      } else {
        response.status(404).json(null)
      }
      }
    }) 
  } catch(e){
    console.log("Exception lors de la mise à jour d'un OT")
  }
}

const patchFluxOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Mise à jour du flux de l'OT " + request.params.id + ". Token : " + request.header('Authorization') + " Flux : ")

  try {
    pool.query('select v1.patch_flux_ot($1,$2,$3) as flux', [request.params.id,request.header('Authorization'),JSON.stringify(request.body)], (error, results) => {
      if (error) { 
        console.log("Erreur lors de la requete " . error)
        response.status(500)
      } else {
        response.status(200)
      }
    })
  } catch (e){
    console.log("Error lors de la mise à jour de l'OT : " . error)
  } 
}

const getSessionsTicket = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_sessions_ticket($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== undefined){
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404)

  }) 
}

const getTicket = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Lecture de l'OT " + request.params.id + " (token " +  request.header('Authorization') + ")")
  
  try{
  pool.query('select v1.get_ticket($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results !== undefined){
      console.log("Résultat obtenu de la base")
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404)

  }) 
  } catch(e){
    console.log("Erreur : " + e)
    response.status(500)
  }
  
}

const determine_vue = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  const id_dossier=parseInt(request.params.dossier)
  const id_noeud=request.params.id
  const id_type=parseInt(request.params.type)
  
  console.log("Id type : " + id_type + ", id_dossier : " + id_dossier + ", noeud " + id_noeud) 
  pool.query('select intranet.getparamid($3,rese_id_reseau) as id from intranet.reseau where rese_bcode=$1 and rese_contractid=$2', [id_noeud,id_dossier,id_type], (error, results) => {
    if (error) {
      console.log(error)
      response.status(404)
    }
    try {
      var ret={}; 
      ret.vue=results.rows[0]['id']
      response.status(200).json(ret)
    } catch (error) {
      console.error(error);
      response.status(404)
    }
  }) 
}

const getContact = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  pool.query('select v1.get_contact($1) as flux', [request.params.id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== null){      
      response.status(200).json(results.rows[0]['flux'])
    } else response.status(404)
  })   
}

const getContactsContrat = (request, response) => {
  const id = request.params.id.split('-')[0];
  console.log("Lecture des contacts du contrat " + id)
  pool.query('select v1.liste_contacts_contrat($1) as liste', [id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results == undefined) response.status(404)
    if (results !== null){
    if (results !== undefined && results.rows===undefined) {
        response.status(404)
      } else {
        response.status(200).json(results.rows[0]['liste'])
      }
    } else response.status(404)

  }) 
}

const getProceduresDisponibles = (request, response) => {
  console.log("Recherche des actions disponibles d'un OT ")

  try{
    pool.query('select v1.get_procedures_disponibles($1) as flux', [request.params.id], (error, results) => {
      if (error) {
        console.log(error)
      }
      if (results===undefined) response.status(404)
      if (results !== undefined){
        if (results.rows[0]['flux']===null){
          response.status(500)
        } else {
          response.status(200).json(results.rows[0]['flux'])
        }      
      } else response.status(404)

    }) 
  } catch (error) {
    console.error(error);
  }
  

}
            
const rechercheOt = (request, response) => {
  console.log("Recherche d'un OT " + request.header('Authorization') + " / " + JSON.stringify(request.body))
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  try{
    pool.query('select v1.cherche_ot($1,$2) as flux', [request.header('Authorization'),request.body], (error, results) => {
      if (error) {
        console.log(error)
      }
      if (results===undefined) response.status(404)
      if (results !== undefined){
        if (results.rows[0]['flux']===null){
          response.status(500).json(null)
        } else {
          response.status(200).json(results.rows[0]['flux'])
        }      
      } else response.status(404).json(null)

    }) 
  } catch (error) {
    console.error(error);
  }
}

const litNoeud = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  const id_dossier=parseInt(request.params.dossier)
  const id=request.params.id
  
  console.log("id_dossier : " + id_dossier + ", noeud " + id) 
  pool.query('select v1.serialize_noeud($1,$2) as flux', [id_dossier,id], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== null){
      if (results.rows===undefined) {
        response.status(404)
      } else {
        response.status(200).json(results.rows[0]['flux'])
      }
    } else response.status(404)

  }) 
}

const listeInstallationsReseau = (request, response) => {
  
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  const id_pere=parseInt(request.params.id)
  console.log("Lecture des installationns du reseau " + id_pere)
  
  try {
  pool.query('select rese_id_reseau as id,rese_nom as nom from intranet.reseau where rese_arborescence@>array[:pere] and rese_type=10 order by rese_pere,rese_nom', [id_pere], (error, results) => {
    if (error) {
      console.log(error)
    }
    if (results===undefined) response.status(404)
    if (results !== null){
      if (results.rows===undefined) {
        response.status(404).json()
      } else {
        response.status(200).json(results.rows[0]['flux'])
      }
    } else response.status(404).json()

  }) 
  } catch (e){
    response.status(500).json()
  }
}

const rechercheInstallation = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  request.body.id_dossier=parseInt(request.params.id);
  
  console.log(request.body);
  console.log("Recherche d'une installation dans le dossier " + request.body.id_dossier)
  console.log(request.body)
  pool.query('select v1.cherche_installation($1) as liste', [request.body], (error, results) => {
    if (error) {
      //throw error
    }
    if (results !== null && results !== undefined && results.rows !== null ){
      response.status(200).json(results.rows[0]['liste'])
    } else {
      response.status(404)
    }

  }) 
}

const rechercheSite = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  request.body.id_dossier=parseInt(request.params.id);
  
  console.log("Recherche d'un site dans le dossier " + request.body.id_dossier)
  pool.query('select v1.cherche_site($1) as liste', [request.body], (error, results) => {
    if (error) {
      console.log(error)
      response.status(500).json()
    } else {
      if (results !== null){
        response.status(200).json(results.rows[0]['liste'])
      } else {
        response.status(404)
      }
    }
  }) 
}

const creerOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Enregistrement d'un nouvel OT (token " +  request.header('Authorization') + ")")

  const id_dossier=parseInt(request.params.dossier)
  const id_installation=request.params.id
  
  var ot=request.body
  ot.id_dossier=id_dossier
  ot.id_installation=id_installation
  console.log(ot)

  try {
    pool.query('select v1.creer_ot($1) as flux', [ot] , (error, results) => {
      if (error) {
        console.log("Erreur lors de l'execution de la requete")
        response.status(500)
      } else {
        if (results !== null && results!==undefined){
          console.log(results.rows)
          response.status(200).json(results.rows[0]['flux'])
        } else {
          console.log("Pas de reponse de la requete")
          response.status(404)
        }
  
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
}

const listeDossiersUtilisateur = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  try {
    pool.query('select v1.liste_dossiers_dbin($1) as flux', [request.header('Authorization')] , (error, results) => {
      if (error) {
        console.log(error)
        //throw error
      }
      response.status(200).json(results.rows[0]['flux'])
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
}

const listeContactsOpOt = (request, response) => {
  console.log("Lecture des contacts opérationnels de l'OT " + request.params.id)
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  try {
    pool.query('select v1.liste_contacts_op_ot($1) as flux', [request.params.id] , (error, results) => {
      if (error) {
        console.log(error)
      }
      response.status(200).json(results.rows[0]['flux'])
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
}

const listeNoeudsDossier = (request, response) => {
  if (request.params.id===undefined){
    response.status(404)
  }

  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("Recherche des noeuds du dossier " + request.params.id + " du token " + request.header('Authorization'))
  response.status(200)
  try {
    pool.query('select v1.liste_noeuds_dossier($1,$2) as flux', [request.header('Authorization'),request.params.id] , (error, results) => {
      if (error) {
        console.log(error)
        //throw error
      }
      if (results !== undefined && results.rows!==undefined){
        response.status(200).json(results.rows[0]['flux'])
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
}
  

const listeOtActifs = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  const parametres=JSON.parse(request.query.q);
  console.log("Obtention de la liste des ot actifs. Token : " + request.header('Authorization') + ", noeud : " + parametres.noeud )
  const { name, email } = request.body
  try {
    pool.query('select v1.get_tickets_actifs($1) as flux', [parametres.noeud] , (error, results) => {
      if (error) {
        console.log("Erreur lors de la recherche des ot actifs")
        //throw error
      }
      response.status(200).json(results.rows[0].flux)
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
}

const listeOtDbin = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  console.log("Obtention de la liste des ot dbin. Token : " + request.header('Authorization'))
  const { name, email } = request.body
  try {
    pool.query('select * from v1.liste_ticket_dbin where token=$1', [request.header('Authorization')] , (error, results) => {
      if (error) {
        //throw error
      }

      if (results !== null){
        response.status(200).json(results.rows)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
}

const getDevisTicket = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  const { name, email } = request.body
  try {
    pool.query('select to_json(id_devis) as id_devis from tickets.props_ot where id=$1', [request.params.id] , (error, results) => {
      if (error) {
        //throw error
      }

      if (results !== null){
        response.status(200).json(results.rows[0])
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
}

const listeOtSmart = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  const parametres=JSON.parse(request.query.q);
  console.log("Obtention de la liste des ot smart. Token : " + request.header('Authorization') + ", noeud : " + parametres.noeud )
  const { name, email } = request.body
  try {
    
    pool.query('SELECT * FROM v1.smart_view WHERE token=$1', [request.header('Authorization')] , (error, results) => {
      if (error) {
        //throw error
      }

      if (results !== null){
        response.status(200).json(results.rows)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

const listeOtSupport = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  console.log("Obtention de la liste des ot du support Token : " + request.header('Authorization') + ", CN : " + request.header('cn'))
  

  const { name, email } = request.body
  try { 
    
    pool.query('select * from v1.liste_ticket_support_fire360 where cn=$1', [request.header('cn')] , (error, results) => {
      if (error) {
        //throw error
        console.log("Erreur SQL " + error)
      }

      if (results !== null){
        response.status(200).json(results.rows)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

const listeOtCC = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  console.log("Obtention de la liste des ot CC. Token : " + request.header('Authorization'))
  try {
    console.log("CN : " + request.header('cn'))
  } catch(e){
    console.log("Erreur lors de la lecture des cookies")
  }
  const { name, email } = request.body
  try { 
    
    pool.query('select * from v1.liste_ticket_dbin where token=$1  order by id_priorite, ot DESC', [request.header('Authorization')] , (error, results) => {
	if (error) {
	    console.log('Erreur SQL')
	    response.statut(500).json()
        //throw error
      }

      if (results !== null){
        response.status(200).json(results.rows)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

const transfertOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try { 
    
    pool.query('select v1.transfert_ot_ssi($1)', [request.params.id] , (error, results) => {
      if (error) {
        //throw error
      }

      if (results !== null){
        response.status(200).json(results.rows)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

const getLibellesPereDossier = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try {     
    pool.query('select v1.get_libelles_pere_dossier($1,$2) as flux', [request.params.pere,request.params.dossier] , (error, results) => {
      if (error) {
        //throw error
        response.status(500).json()
      }

      if (results !== null && results !== undefined && results.rows !== undefined){
        response.status(200).json(results.rows[0].flux)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

const putContactOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try { 
    pool.query('select v1.put_contact_ot($1,$2) as flux', [request.params.id,request.body] , (error, results) => {
      if (error) {
        console.log(error)
        //throw error
      }

      if (results !== null){
        response.status(200).json(results.rows[0].flux)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

const getContactOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try { 
    pool.query('select v1.get_contact_ot($1) as flux', [request.params.id] , (error, results) => {
      if (error) {
        //throw error
      }

      if (results !== null){
        response.status(200).json(results.rows[0].flux)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

const deleteContactOt = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try { 
    pool.query('select v1.delete_contact_ot($1,$2) as flux', [request.params.ot,request.params.id] , (error, results) => {
      if (error) {
        //throw error
      }

      if (results !== null){
        response.status(200).json(results.rows[0].flux)
      } else {
        response.status(404)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

const supprimePlanificationLogtek  = (request, response) => {
  
  console.log("Suppression de la planification " + request.body.id + ", Ot : " + request.body.ot + ", Token : " + request.header('Authorization'))

  var p_data={}
  p_data.ref_session_erp=request.body.id

  console.log(p_data)

  try{
    axios({
      method: 'DELETE',
      url: 'https://api.logtek.fr/api/planif-one.awp',
      data: p_data,
      headers:{
        'apikey': 'DEF_key-WS-6fcc3171',
        'Content-Type': 'application/json'
      }
    }).then(function (ret) {
      try {         
        pool.query("update maincourante.missions set statut_planif_lt=404 where statut_planif_lt in (201,208) and ref_session_erp=$1", [request.body.id] , (error, results) => {
          if (error) {
            console.log(error) 
            console.log("Erreur lors de la mise à jour de la planification")
            response.status(500).json()          
          }
          else {
            var traitement={}
            traitement.id_commande=207
            traitement.id_action=5
            traitement.id_contact=0
            traitement.params={}
            traitement.params.ref_session_erp=request.body.id
            try {
              pool.query("select v1.put_traitement_ot($1,$2,$3)", [request.body.ot,request.header('Authorization'),JSON.stringify(traitement)] , (error, results) => {
                if (error) {
                  console.log(error) 
                  console.log("Erreur lors de la mise à jour de la planification")
                  response.status(500).json()          
                } else {
                  console.log("Traitement ajouté")
                  console.log("Suppression OK")
                  response.status(200).json(null)
      
                }
              });  
            } catch (e) {
              console.log("Erreur SQL")
              console.log(e);
              response.status(500).json()
            }
          }
        });
      }  catch (e) {
        console.log("Erreur SQL")
        console.log(e);
        response.status(500).json()
      }
    });; 
  } catch (e) {
    console.log("Erreur lors de la requete de suppression Logtek")    
    console.log(e);

    var traitement={}
    traitement.id_commande=208
    traitement.id_action=5
    traitement.id_contact=0
    traitement.params={}
    traitement.params.ref_session_erp=request.body.id
    try {
      pool.query("select v1.put_traitement_ot($1,$2,$3)", [request.body.ot,request.header('Authorization'),JSON.stringify(traitement)] , (error, results) => {
        if (error) {
          console.log("Erreur lors de la mise à jour de la planification")
          response.status(500).json()          
        } else {
          console.log("Traitement ajouté")
          console.log("Suppression OK")
          response.status(500).json()
        }
      });  
    } catch (e) {
      console.log("Erreur SQL")
      console.log(e);
      response.status(500).json()
    }
    
    response.status(500).json()
  }
  
  
}

const putPlanificationMobile = (request, response) => {
  console.log("Réception d'une planification mobile pour l'OT " + request.params.id)
  console.log(request.body)

  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try { 
    pool.query("select perm_tel_id_tel as id from intranet.perm_tel left join intranet.reseau on rese_id_objet=perm_tel_id_tel where upper(regexp_replace(translate( \
    concat(perm_tel_prenom,' ',perm_tel_nom), \
      'áàâãäåāăąèééêëēĕėęěìíîïìĩīĭḩóôõöōŏőùúûüũūŭůäàáâãåæçćĉčöòóôõøüùúûßéèêëýñîìíïş', \
      'aaaaaaaaaeeeeeeeeeeiiiiiiiihooooooouuuuuuuuaaaaaaeccccoooooouuuuseeeeyniiiis' \
    ), '[^a-zA-Z0-9]+', '', 'g'))=upper(regexp_replace(translate( \
      $1, \
      'áàâãäåāăąèééêëēĕėęěìíîïìĩīĭḩóôõöōŏőùúûüũūŭůäàáâãåæçćĉčöòóôõøüùúûßéèêëýñîìíïş', \
      'aaaaaaaaaeeeeeeeeeeiiiiiiiihooooooouuuuuuuuaaaaaaeccccoooooouuuuseeeeyniiiis' \
    ), '[^a-zA-Z0-9]+', '', 'g')) \
    and rese_id_reseau is not null \
	  and id_us_logtek is not null \
  ", [request.body.tech] , (error, results) => {
      if (error) {
        response.status(500).json()
        console.log("Erreur obtenue : " + error)
      }
      else {        

        if (results.rows === undefined) response.status(500).json()   
        else { 
        if (parseInt(results.rows[0]['id'])>0){

          console.log("Technicien identifié : " + parseInt(results.rows[0]['id']))
          const id_technicien=results.rows[0]['id']
          var p_data={}
          p_data.ot=request.body.ot
          p_data.origine=0;  
          p_data.collaborateur=id_technicien
          p_data.date=moment(request.body.date_planification).format('DD/MM/YYYY')
          p_data.time=moment(request.body.date_planification).format('HH:mm')
          p_data.date_fin=moment(request.body.date_planification).add(2,'hours').format('DD/MM/YYYY')
          p_data.time_fin=moment(request.body.date_planification).add(2,'hours').format('HH:mm')
          p_data.commentaire=request.body.commentaire

          try{
            axios({
              method: 'post',
              url: 'https://api-logtek-test.dbcall.fr/planification',
              data: p_data
            }).then(function (ret_logtek) {           
              try { 
                pool.query("update tickets.ot set etat=10, id_technicien=$2 where ot.id=$1", [request.body.ot,id_technicien] , (error, results) => {
                  if (error) {
                    console.log("Erreur obtenue : " + error)
                    response.status(500).json()
                  }
                  else {
                    console.log("Retour de Logtek : " + ret_logtek.status)
                    response.status(ret_logtek.status).json(null)    
                  }
                })
              } catch (e) {
                console.log(e);
                response.status(500).json()            
              }
            });;
          } catch(e){
            console.log(e)
            response.status(500).json()
          }
          } 
        } 
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }



 
} 

const putRapportMobile = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  console.log("Réception d'un rapport mobile pour l'OT " + request.params.id)
  try { 
    pool.query('select v1.traite_commande_mcm3($1,$2,$3,$4) as flux', [request.body.ot,request.body.action,request.body.commentaire,request.body.tech] , (error, results) => {
      if (error) {
        response.status(500).json()
        console.log("Erreur obtenue : " + error)
      }
      else {
        console.log(results.rows[0])
        response.status(200).json(null)
      }
    }) 
  } catch (e) {
    response.status(500).json()
    console.log(e);
  }


  
} 

const putRapportTelephonique = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  console.log("Réception d'un rapport téléphonique pour l'OT " + request.params.id)
  console.log(request.body)

  try { 
    const query = {
      "Messages":[
        {
          "From": {
            "Email": "nepasrepondre.depannage@def-online.com",
            "Name": "DEF"
          },
          "To": [
            {
              "Email": request.body.mail_contact,
              "Name": request.body.nom_contact
            }
          ],
          "Cc": [
            {
              "Email": "suivi-mc9+" + request.params.id + "@infra3.dbcall.fr",
              "Name": "MC9"
            }
          ],
          "TemplateID": 2039184,
          "TemplateLanguage": true,
          "Subject": "Rapport téléphonique",
          "Variables": {
            "site_nom": request.body.site_nom,
            "bcode": request.body.bcode,
            "horodatage": moment().format('DD-MM-YYYY'),
            "installation_nom": request.body.installation_nom,
            "objet": 'Test',//request.body.objet,
            "desc_intervention": request.body.desc_intervention,
            "systeme_fonctionnel": (request.body.systeme_fonctionnel=='true') ? 'Oui' : 'Non',
            "inter_prevoir":  (request.body.reintervention=='true') ? 'Oui' : 'Non',
            "contact_nom": request.body.nom_contact
          }
        }
    ]}
  
    console.log(JSON.stringify(query))

    const mailjet = require ('node-mailjet')
    .connect('c9da5f0657a05151e19526510d6cfc82', 'b6d6befef64e7b0ad884646456c7da84')
    const req = mailjet
    .post("send", {'version': 'v3.1'})
    .request(query)
    req
    .then((result) => {
        console.log(result.body)
    })
    .catch((err) => {
        console.log(err.statusCode)
    })  

    var v_id_commande=0;
     
    if (request.body.reintervention=='true') 
      v_id_commande=159 
    else 
      v_id_commande=158

      
    const rapport={
      "ot":request.params.id
      ,"token":""
      ,"id_commande":v_id_commande
      ,"id_action":85
      ,"id_contact":0
      ,"params":request.body
    }

    pool.query('select v1.put_traitement_ot($1,$2,$3)', [request.params.id,'',JSON.stringify(rapport)] , (error, results) => {
      if (error) {
        //throw error
      }

    }) 

  } catch (e) {
    response.status(500).json()
    console.log(e);
  }
} 

async function checkToken(token,response){
  console.log("Check du token " + token)
  pool.query('select count(*)>0 as checked from maincourante.tokens where token=$1',[token],(error,results)=>{
    if (! results.rows[0]['checked']){
      console.log('Token invalide')
      response.status(401).json()
      return(false);
    } else {
      console.log('Token valide')
      return(true)
    }
  })
}

async function getOtSerialise(ot){
  const results = await pool.query('select * from v1.liste_ot where ot=$1',[ot])
  if (results.rowCount>0) return(results.rows[0])
    else return(false)
}

module.exports = {
    uploadFileOt,
    listeOtActifs,
    checkToken,
    getOtSerialise,
    listeOtSmart,
    listeOtCC,
    rechercheInstallation,
    rechercheSite,
    listeDossiersUtilisateur,
    listeNoeudsDossier,
    determine_vue,
    litNoeud,
    creerOt,
    getContactsContrat,
    getContact,
    getTicket,
    listeOtDbin,
    getTraitementsTicket,
    getSessionsTicket,
    patchOt,
    litInstallation,
    litSite,
    litContrat,
    litClient,
    sendMailJet,
    getIntervenantsTickets,
    getEquipementsIntervenantsTickets,
    getProcedureCouranteOt,
    getAction,
    getActionOt,
    putActionSchema,
    putTraitementOt,
    getTraitementsOt,
    patchFluxOt,
    listeFichiersOT,
    rechercheOt,
    getProceduresDisponibles,
    listePlanificationNoeud,
    getActionOtReference,
    litEtatsDossier,
    getMissionsOt,
    addRemineIssue,
    getRemineIssueOt,
    readRemineIssue,
    patchUtilisateur,
    listeInstallationsReseau,
    getDevisTicket,
    getInstallationSousTraitant,
    traitementsTexteOt,
    transfertOt,
    putRapportTelephonique,
    putPlanificationMobile,
    putRapportMobile,
    getLibellesPereDossier,
    putContactOt,
    getContactOt,
    deleteContactOt,
    listeOtSupport,
    supprimeFichiersOT,
    supprimePlanificationLogtek,
    getDroitsSupervision,
    listeContactsOpOt,
    postlog,
    getEquipementsIntervenantsNoeud
} 
