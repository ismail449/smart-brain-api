const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
var cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: '1032004',
    database: 'smart-brain',
  },
});

const app = express();

const saltRounds = 10;
app.use(cors());

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json(database.users);
});

app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json('incorrect form sumbition');
  }
  db.select('email', 'hash')
    .from('login')
    .where('email', '=', email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        db.select('*')
          .from('users')
          .where('email', '=', email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch((err) => {
            res.status(400).json('Error sigining in');
          });
      } else {
        res.status(400).json('Wrong password');
      }
    })
    .catch((err) => {
      res.status(400).json('Wrong password');
    });
});

app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json('incorrect form sumbition');
  }
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into('login')
      .returning('email')
      .then((loginEmail) => {
        trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0].email,
            name: name,
            joined: new Date(),
          })
          .then((response) => {
            res.json(response[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => res.status(400).json('unable to register'));
});

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*')
    .from('users')
    .where({ id: id })
    .then((user) => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json('User not found');
      }
    })
    .catch((err) => {
      res.status(400).json('Error getting user');
    });
});

app.put('/image', (req, res) => {
  const { id } = req.body;
  db('users')
    .where('id', '=', id)
    .increment('entires', 1)
    .returning('entires')
    .then((entires) => {
      res.json(entires[0].entires);
    })
    .catch((err) => {
      res.status(400).json('Error getting entries');
    });
});

const PORT = process.env.PORT;

app.listen(PORT || 3000, () => {
  console.log(`app is running on port ${PORT}`);
});
