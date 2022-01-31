// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const cors = require('cors')
const bodyParser = require('body-parser');
const fs = require("fs");
const app = express();


// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

//Init OKTA verifier
const OktaJwtVerifier = require('@okta/jwt-verifier');
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://dev-97422735.okta.com/oauth2/default', // issuer required
  clientId: '0oa3pong2lvTNTI6o5d7'
});


app.use(cors())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// if ./.data/sqlite.db does not exist, create table and insert two rows of data
// Store password for first row in plain text, password for second row hashed with SHA-512
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Todos (id TEXT PRIMARY KEY, owner TEXT,text TEXT, checked BOOLEAN)"
    );
    console.log("New table todos created!");
    /*db.serialize(() => {
      db.run(
        "INSERT INTO Todos (id,owner,text,checked) VALUES ('00000000000001','takehomeokta@mailinator.com','Task 1 from DB', false),('00000000000002','takehomeokta@mailinator.com','Task 2 from DB', false),('00000000000003','takehomeokta@mailinator.com','Task 3 from DB (done)', true)"
      );
   
    });*/
  
  }
});

async function getTodos(user) {
  return new Promise(resolve => {
      var sql = "SELECT * FROM Todos WHERE owner = ?"
      db.all(sql, user, (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        return row
         ? resolve(row)
         : console.log(user + " not found in database")
      })
  });
}


async function addTodo(user,todo) {
  return new Promise(resolve => {
    
      var sql = "INSERT INTO Todos (id,owner,text,checked) VALUES (?,?,?,?)"
      db.run(sql, todo.id,user,todo.text,todo.checked, (err,id) => {
        if (err) {
          return console.log(err.message);
        }
        resolve();
        return;
      })
  });
}

//DB call for todo deletion
async function deleteTodo(user,id) {
  return new Promise(resolve => {
      //console.log(user+' '+id)
      var sql = "DELETE from Todos where owner=? and id=?"
      db.run(sql, user,id, (err,id) => {
        if (err) {
          return console.log(err.message);
        }
        resolve();
        return;
      })
  });
}

//Endpoint to get all todos for a specific user
app.get("/users/:id/todos",cors(),authenticationRequired, async (request, response) => {
  var users = await getTodos(request.params.id);
  //console.log(users);
  response.set({
        "Content-Type": "application/json"
    });
  
  response.send(JSON.stringify(users));
});

//root Endpoint (used for wakeup)
app.get("/",cors(), async (request, response) => {
  //console.log(users);
  response.set({
        "Content-Type": "application/json"
    });
  
  response.send('{"greeting":"Hello!, I am awake"}');
});


//Endpoint to add todos
app.post("/users/:id/todos",cors(),authenticationRequired, async (request, response) => {
  //console.log(request.body);
  await addTodo(request.params.id,request.body);
  
  response.set({
        "Content-Type": "application/json"
    });
  
  response.end();
});


//Endpoint to update a task (checked) , can be improved by updating instead of delete/insert 
app.put("/users/:id/todos",cors(),authenticationRequired, async (request, response) => {
  //console.log(request.body)
  await deleteTodo(request.params.id,request.body.id);
  await addTodo(request.params.id,request.body);
  
  response.set({
        "Content-Type": "application/json"
    });
  
  response.end();
});

//Endpoint for todo deletion
app.delete("/users/:user/todos/:id",cors(),authenticationRequired, async (request, response) => {
  console.log(request.body);
  await deleteTodo(request.params.user,request.params.id);
  
  response.set({
        "Content-Type": "application/json"
    });
  
  response.end();
});



//verify token
function authenticationRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    res.status(401);
    return next('Unauthorized');
  }

  const accessToken = match[1];
  const audience = 'api://default';
  return oktaJwtVerifier.verifyAccessToken(accessToken, audience)
    .then((jwt) => {
      req.jwt = jwt;
      //console.log("Authorized!!")
      next();
    })
    .catch((err) => {
      res.status(401).send(err.message);
    });
}



// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
  
});


