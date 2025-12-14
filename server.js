const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const dbFile = path.join(__dirname,'data.sqlite');
const db = new sqlite3.Database(dbFile);

// initialize tables
db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    score INTEGER,
    result TEXT,
    played_on DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.use(express.static(path.join(__dirname)));

app.get('/api/history',(req,res)=>{
  db.all('SELECT * FROM game_history ORDER BY played_on DESC LIMIT 100',[],(err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

app.post('/api/history',(req,res)=>{
  const {username, score, result} = req.body;
  if(!username) return res.status(400).json({error:'username required'});
  db.run('INSERT INTO game_history(username,score,result) VALUES(?,?,?)',[username,score||0,result||'win'],function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({id:this.lastID});
  });
});

const port = process.env.PORT || 3000;
app.listen(port, ()=>{
  console.log(`Server running on http://localhost:${port}`);
});